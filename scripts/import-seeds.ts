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
  const out = JSON.stringify({ maps, seeds })
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
  return copyAssets().then(() => reportCoverage(seeds))
}

function reportCoverage(seeds: any[]) {
  const count = (pred: (s: any) => boolean) => seeds.filter(pred).length
  console.log('castle', count((s) => s.castle), 'event', count((s) => s.event))
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
    await image.resize(size, size).webp({ quality }).toFile(`public/maps/${earth}.webp`)
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
