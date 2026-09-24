// One-time anticorruption layer: source vocabulary stops here.
// Run with `npm run import`. Never part of the build.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const aliases = JSON.parse(readFileSync('data/raw/aliases.json', 'utf8'))

export const hasCjk = (s: string) => /[\u3000-\u9FFF\uFF00-\uFFEF]/.test(s)

export function toStructureKey(raw: string): string | null {
  if (raw === '' || raw === 'empty_spawn') return null
  const value = raw.replace(/_spawn$/, '')
  if (aliases.structureKinds[value]) return aliases.structureKinds[value]
  const cut = value.lastIndexOf('_')
  const kind = aliases.structureKinds[value.slice(0, cut)]
  const element = aliases.elements[value.slice(cut + 1)]
  if (!kind || !element) throw new Error(`unknown structure: ${raw}`)
  return `${kind}:${element}`
}

export function toNightlord(raw: string): string {
  const slug = aliases.nightlordByNumber[raw.split('_')[0]]
  if (!slug) throw new Error(`unknown nightlord: ${raw}`)
  return slug
}

export function toEvent(raw: string, info: Record<string, string[]>) {
  if (!raw) return null
  const match = raw.match(/^(.*?)(?:Day([12]))?$/)!
  const base = match[1]
  const name = aliases.eventNameOverrides[base] ?? info[raw]?.[0]
  if (!name) throw new Error(`unknown event: ${raw}`)
  return { name, day: match[2] ? (Number(match[2]) as 1 | 2) : null }
}

type BossDetail = { key: string; name: string; summary: string }
/**
 * Fight notes keyed by the boss name the app shows. The source spells a boss many ways
 * ("Night's Cavalries", "Crucible Knight & Hippo"), so a shown name joins its note through the
 * source key where the source has one, and by exact name otherwise.
 */
export function toBossNotes(details: BossDetail[], shown: Iterable<[name: string, key: string | null]>) {
  const byKey = new Map(details.map((d) => [d.key, d]))
  const byName = new Map(details.map((d) => [d.name, d]))
  const notes: Record<string, string> = {}
  for (const [name, key] of shown) {
    const summary = (key ? byKey.get(key) : byName.get(name))?.summary
    if (!summary || hasCjk(summary)) continue
    if (notes[name] !== undefined && notes[name] !== summary) throw new Error(`"${name}" means two bosses`)
    notes[name] = summary
  }
  return notes
}

// Castle ids are snake_case ("ancient_hero_of_zamor"); "of" stays lowercase as in the boss roster.
const titleCase = (id: string) =>
  id.split('_').map((w, i) => (i > 0 && w === 'of' ? w : w[0].toUpperCase() + w.slice(1))).join(' ')

function main() {
  const observer = JSON.parse(readFileSync('data/raw/observer.json', 'utf8'))
  const artimuz: any[] = JSON.parse(readFileSync('data/raw/artimuz.json', 'utf8'))
  const remote = observer.remote
  const problems: string[] = []

  // The source spells a few bosses two ways ("Golden Hippo"); it ships its own canonical mapping.
  const spelling: Record<string, string> = remote.bossIconTypes.nameAliases
  const bossName = (name: string) => aliases.bossNameOverrides[name] ?? spelling[name] ?? name
  // Names the source sheet wrongly lists as field bosses; the source's own renderer skips them.
  const notFieldBosses = new Set<string>(remote.bossIconTypes.notFieldBosses)

  // Cross-check: both sources must agree on every seed's identity and slots.
  if (artimuz.length !== observer.seeds.length) problems.push(`artimuz has ${artimuz.length} seeds, observer ${observer.seeds.length}`)
  const artimuzById = new Map(artimuz.map((s) => [s.seed_id, s]))
  for (const s of observer.seeds) {
    const other = artimuzById.get(s.seed_id)
    if (!other) { problems.push(`seed ${s.seed_id} missing from artimuz`); continue }
    for (const field of ['map_type', 'nightlord', 'Event']) {
      if (other[field] !== s[field]) problems.push(`seed ${s.seed_id} ${field}: ${s[field]} vs ${other[field]}`)
    }
    const slotIds = new Set([...Object.keys(s.slots), ...Object.keys(other.slots)])
    for (const slot of slotIds) {
      if ((other.slots[slot] ?? '') !== (s.slots[slot] ?? '')) problems.push(`seed ${s.seed_id} slot ${slot}: ${s.slots[slot]} vs ${other.slots[slot]}`)
    }
  }

  const slotMap = (list: { id: string; x: number; y: number }[]) =>
    Object.fromEntries(list.map((c) => [c.id, { x: c.x, y: c.y }]))
  const maps = {
    limveld: { slots: slotMap(observer.coordinates.baseSlots) },
    'great-hollow': { slots: slotMap(observer.coordinates.greatHollowSlots) },
  }
  const evergaolAt = Object.fromEntries(observer.coordinates.evergaols.map((e: any) => [e.id, e]))
  const castles = new Map(observer.castleAssignments.map((c: any) => [c.seed_id, c]))
  const nightKeys = new Map(observer.bossAssignments.map((b: any) => [b.seed_id, b]))
  // Every boss name a seed shows, with the source key where the source has one.
  const shownBosses: [string, string | null][] = []

  const seeds = observer.seeds.map((s: any) => {
    const id: string = s.seed_id
    const earth = aliases.earths[s.map_type]
    if (!earth) throw new Error(`unknown earth: ${s.map_type}`)
    const map = earth === 'great-hollow' ? maps['great-hollow'] : maps.limveld
    const spawnEntries = Object.entries(s.slots).filter(([, v]) => String(v).endsWith('_spawn'))
    if (spawnEntries.length !== 1) problems.push(`seed ${id} has ${spawnEntries.length} spawns`)
    const spawnEntry = spawnEntries[0]

    const slots: Record<string, string | null> = {}
    for (const [slot, value] of Object.entries(s.slots)) {
      const key = toStructureKey(value as string)
      if (key !== null && !map.slots[slot]) problems.push(`seed ${id} slot ${slot} has no coordinates`)
      if (key !== null || map.slots[slot]) slots[slot] = key
    }

    const markers: any[] = []
    const nc = remote.nightCircles.seeds[id]
    for (const night of [1, 2] as const) {
      const circle = nc?.[`night${night}`]?.circle
      let pos = circle ? remote.nightCircles.positions[circle] : undefined
      // The Great Hollow sheet says "Divine Tower" for every night 2; the real marker was read off the maps.
      if (earth === 'great-hollow' && night === 2) pos = remote.greatHollowDay2Circle.positions[remote.greatHollowDay2Circle.seeds[id]]
      if (pos) markers.push({ layer: 'circle', night, x: pos.x, y: pos.y, label: `Night ${night}: ${bossName(nc[`night${night}`].boss)}` })
      else problems.push(`seed ${id} night ${night} circle has no position`)
    }
    const fieldBosses = remote.bossAssignments.seeds[id] ?? {}
    for (const p of remote.bossPositions.positions[s.map_type] ?? []) {
      const boss = p.slot && fieldBosses[p.slot]
      if (boss && !p.slot.startsWith('Castle') && !notFieldBosses.has(boss)) markers.push({ layer: 'boss', x: p.x, y: p.y, label: bossName(boss) })
    }
    if (earth === 'great-hollow') {
      for (const [pos, entry] of Object.entries<any>(remote.greatHollow.seeds[id] ?? {})) {
        const at = remote.greatHollowPositions.positions[pos]
        if (at && entry.kind !== 'label') markers.push({ layer: 'boss', x: at.x, y: at.y, label: bossName(entry.label) })
      }
      const spot = remote.greatHollowMerchant.seeds[id]
      if (spot) markers.push({ layer: 'merchant', ...remote.greatHollowMerchant.positions[spot], label: 'Town Merchant' })
    }
    for (const [slot, boss] of Object.entries<string>(remote.evergaols.seeds[id] ?? {})) {
      const at = evergaolAt[slot]
      if (at) markers.push({ layer: 'evergaol', x: at.x, y: at.y, label: bossName(boss) })
    }
    const chestIds = Object.keys(remote.chestAssignments.seeds[id] ?? {})
    const chestPositions = [...remote.chestPositions.positions, ...(remote.chestPositions.greatHollowPositions ?? [])]
    for (const chestId of chestIds) {
      const at = chestPositions.find((c: any) => c.id === chestId)
      if (at) markers.push({ layer: 'chest', x: at.x, y: at.y, label: 'Chest' })
    }
    const rot = remote.rotBlessing.seeds[id]
    if (rot) markers.push({ layer: 'rot-blessing', ...remote.rotBlessing.positions[rot], label: 'Rot Blessing' })

    const castle = castles.get(id) as any
    const crew = remote.castleCrew.seeds[id]
    const keys = nightKeys.get(id) as any
    for (const night of [1, 2] as const) {
      const boss = nc?.[`night${night}`]?.boss
      if (boss) shownBosses.push([bossName(boss), keys?.[`night${night}`] ?? null])
    }
    if (castle) shownBosses.push([titleCase(castle.basement), castle.basement], [titleCase(castle.rooftop), castle.rooftop])
    for (const m of markers) if (m.layer === 'boss' || m.layer === 'evergaol') shownBosses.push([m.label, null])
    return {
      id,
      nightlord: toNightlord(s.nightlord),
      earth,
      event: toEvent(s.Event, observer.eventInfo),
      spawn: spawnEntry?.[0] ?? '',
      slots,
      nights: {
        1: { boss: bossName(nc?.night1?.boss ?? ''), circle: nc?.night1?.circle ?? null },
        2: { boss: bossName(nc?.night2?.boss ?? ''), circle: nc?.night2?.circle ?? null },
      },
      castle: crew || castle
        ? { crew: crew ?? titleCase(castle.guard), basement: castle ? titleCase(castle.basement) : null, rooftop: castle ? titleCase(castle.rooftop) : null }
        : null,
      oldGaol: Boolean(s.hasOldGaol),
      markers,
    }
  })

  // The finder can only tell seeds apart by layout and spawn, so twins would be unidentifiable.
  const layouts = new Map<string, string>()
  for (const s of seeds) {
    const layout = JSON.stringify([s.nightlord, s.earth, s.spawn, s.slots])
    const twin = layouts.get(layout)
    if (twin) problems.push(`seeds ${twin} and ${s.id} are indistinguishable by layout and spawn`)
    layouts.set(layout, s.id)
  }

  if (seeds.length !== 520) problems.push(`expected 520 seeds, got ${seeds.length}`)
  const bossNotes = toBossNotes(observer.bossDetails, shownBosses)
  const out = JSON.stringify({ maps, seeds, bossNotes })
  if (hasCjk(out)) problems.push('non-English text in output')
  for (const name of aliases.internalNightlordNames) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(out)) problems.push(`internal nightlord name in output: ${name}`)
  }
  if (problems.length) {
    console.error(problems.slice(0, 50).join('\n'))
    throw new Error(`${problems.length} problems, nothing written`)
  }
  mkdirSync('src/data', { recursive: true })
  writeFileSync('src/data/seeds.json', out)
  console.log(`wrote ${seeds.length} seeds`)
  return copyAssets().then(() => reportCoverage(seeds, bossNotes))
}

function reportCoverage(seeds: any[], bossNotes: Record<string, string>) {
  const count = (pred: (s: any) => boolean) => seeds.filter(pred).length
  console.log('castle', count((s) => s.castle), 'event', count((s) => s.event), 'boss notes', Object.keys(bossNotes).length)
  for (const layer of ['circle', 'boss', 'evergaol', 'chest', 'merchant', 'rot-blessing']) {
    console.log(layer, count((s) => s.markers.some((m: any) => m.layer === layer)))
  }
  // Missing icons do not fail the import; the UI falls back to a glyph. List them so it is a choice.
  const keys = new Set<string>(seeds.flatMap((s) => Object.values(s.slots).filter((k): k is string => k !== null)))
  const noIcon = [...keys].filter((key) => {
    const kind = key.split(':')[0]
    return !existsSync(`public/structures/${key.replace(':', '--')}.webp`) && !existsSync(`public/structures/${kind}.webp`)
  })
  console.log('structure keys without any icon:', noIcon.length ? noIcon.sort().join(', ') : 'none')
}

/** How much of a pixel is map (1) rather than background (0). */
export type Coverage = (r: number, g: number, b: number, a: number) => number

// A flat baked ocean: within HARD of its colour is ocean, beyond SOFT is land, between is the anti-aliased coast.
export const oceanCoverage = ([or, og, ob]: readonly number[], hard = 24, soft = 72): Coverage => (r, g, b) => {
  const d = Math.hypot(r - or, g - og, b - ob)
  return Math.min(1, Math.max(0, (d - hard) / (soft - hard)))
}
// A translucent haze around the map (Great Hollow): faint is background, near opaque is map.
export const hazeCoverage = (clear = 180, solid = 250): Coverage => (_r, _g, _b, a) =>
  Math.min(1, Math.max(0, (a - clear) / (solid - clear)))

/**
 * Makes the background that touches the image edges transparent, so the map sits on the app's black.
 * A flood fill from the edges, not a colour key: water enclosed by land keeps its colour. The fill
 * only climbs toward the map (or stays level), so it follows a coast's soft edge without leaking
 * through it into inland water. `feather` px of the coastline are then softened inward, never
 * outward, so no background colour shows as a fringe. Specks of map no taller than `streak` px,
 * with cleared background above and below, are cleared too (see below).
 */
export function keyBackground(
  rgba: Uint8Array, width: number, height: number, coverage: Coverage,
  { feather = 2, streak = 12 }: { feather?: number; streak?: number } = {},
): Uint8Array {
  const n = width * height
  const at = (p: number) => coverage(rgba[p * 4], rgba[p * 4 + 1], rgba[p * 4 + 2], rgba[p * 4 + 3])
  const cover = new Float32Array(n).fill(1)
  const seen = new Uint8Array(n)
  const queue = new Int32Array(n)
  let head = 0
  let tail = 0
  const visit = (p: number, from: number) => {
    if (seen[p]) return
    const c = at(p)
    if (c >= 1 || c + 0.15 < from) return
    seen[p] = 1
    cover[p] = c
    queue[tail++] = p
  }
  for (let x = 0; x < width; x++) { visit(x, 0); visit((height - 1) * width + x, 0) }
  for (let y = 0; y < height; y++) { visit(y * width, 0); visit(y * width + width - 1, 0) }
  while (head < tail) {
    const p = queue[head++]
    const x = p % width
    const c = cover[p]
    if (x > 0) visit(p - 1, c)
    if (x < width - 1) visit(p + 1, c)
    if (p >= width) visit(p - width, c)
    if (p < n - width) visit(p + width, c)
  }
  // The Limveld sources carry 1-3 px tall grey streaks in the ocean along the coast (a broken
  // shadow band). A run that short, with cleared ocean above and below, is a streak, not land.
  const cleared = (p: number) => seen[p] === 1 && cover[p] === 0
  for (let x = 0; x < width; x++) {
    let start = -1
    for (let y = 0; y <= height; y++) {
      const p = y * width + x
      const keep = y < height && cover[p] > 0
      if (keep && start < 0) start = y
      if (keep || start < 0) continue
      const above = start === 0 || cleared((start - 1) * width + x)
      const below = y === height || cleared(p)
      if (y - start <= streak && above && below) for (let k = start; k < y; k++) cover[k * width + x] = 0
      start = -1
    }
  }
  const soft = feather > 0 ? boxBlur(cover, width, height, feather) : cover
  const out = new Uint8Array(rgba)
  for (let p = 0; p < n; p++) {
    const c = Math.min(cover[p], soft[p])
    if (c < 1) out[p * 4 + 3] = Math.round(rgba[p * 4 + 3] * c)
  }
  return out
}

function boxBlur(src: Float32Array, width: number, height: number, r: number): Float32Array {
  const pass = (from: Float32Array, horizontal: boolean) => {
    const to = new Float32Array(from.length)
    const [lines, len] = horizontal ? [height, width] : [width, height]
    for (let l = 0; l < lines; l++) {
      const idx = (i: number) => (horizontal ? l * width + i : i * width + l)
      for (let i = 0; i < len; i++) {
        let sum = 0
        let count = 0
        for (let k = Math.max(0, i - r); k <= Math.min(len - 1, i + r); k++) { sum += from[idx(k)]; count++ }
        to[idx(i)] = sum / count
      }
    }
    return to
  }
  return pass(pass(src, true), false)
}

// The Limveld maps' baked ocean colour.
const OCEAN = [73, 119, 153]

async function copyAssets() {
  mkdirSync('public/maps', { recursive: true })
  const maps: Record<string, string> = {
    default: 'Default.png', crater: 'Crater.png', mountaintop: 'Mountaintop.png',
    'rotted-woods': 'RottedWoods.png', noklateo: 'Noklateo.png', 'great-hollow': 'GreatHollow.webp',
  }
  for (const [earth, file] of Object.entries(maps)) {
    const image = sharp(`data/raw/assets/maps/${file}`)
    const { width, height } = await image.metadata()
    if (width !== height) throw new Error(`${file} is ${width}x${height}; the 1000-unit coordinate space assumes a square map`)
    // Great Hollow's source encodes far less cleanly than the others (878 KB at 2000px/q78, over the
    // 500 KB budget); the slot grid is percentage-based, so a smaller image is a safe way to shrink it.
    const [size, quality] = earth === 'great-hollow' ? [1400, 70] : [2000, 78]
    // The baked ocean (or Great Hollow's haze) becomes transparent, so the map sits on the app's black.
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const coverage = earth === 'great-hollow' ? hazeCoverage() : oceanCoverage(OCEAN)
    const keyed = keyBackground(data, info.width, info.height, coverage)
    await sharp(keyed, { raw: { width: info.width, height: info.height, channels: 4 } })
      .resize(size, size).webp({ quality }).toFile(`public/maps/${earth}.webp`)
  }
  mkdirSync('public/structures', { recursive: true })
  for (const file of readdirSync('data/raw/assets/icons')) {
    const raw = file.replace(/\.webp$/, '')
    if (raw.endsWith('_spawn')) continue
    const key = toStructureKey(raw)!
    copyFileSync(`data/raw/assets/icons/${file}`, `public/structures/${key.replace(':', '--')}.webp`)
  }
  mkdirSync('public/nightlords', { recursive: true })
  for (const file of readdirSync('data/raw/assets/nightlords')) {
    copyFileSync(`data/raw/assets/nightlords/${file}`, `public/nightlords/${toNightlord(file.replace('.webp', '') + '_')}.webp`)
  }
  mkdirSync('public/fonts', { recursive: true })
  copyFileSync('data/raw/assets/fonts/Mantinia.otf', 'public/fonts/Mantinia.otf')
  console.log('assets copied')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
