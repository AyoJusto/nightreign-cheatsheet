import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const aliases = JSON.parse(readFileSync('data/raw/aliases.json', 'utf8'))

export const hasCjk = (s: string) => /[\u3000-\u9FFF\uFF00-\uFFEF]/.test(s)

export const normalizeBossName = (name: string) =>
  name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]/g, '')

export const applyPerName = (label: string, resolve: (name: string) => string) =>
  label.split(', ').map(resolve).join(', ')

const EVENT_PLACEHOLDER_LABEL = '@event'

export function toInside(
  labels: Record<string, string> | undefined,
  slots: Record<string, string | null>,
  resolve: (name: string) => string,
) {
  const inside: Record<string, string> = {}
  const skipped: string[] = []
  for (const [slot, label] of Object.entries(labels ?? {})) {
    if (label === EVENT_PLACEHOLDER_LABEL) continue
    if (hasCjk(label)) throw new Error(`non-English inside label: ${label}`)
    const built = Boolean(slots[slot])
    const caravansOnOpenGround = slot in slots && label === 'Caravans'
    if (!built && !caravansOnOpenGround) { skipped.push(`${slot}: ${label}`); continue }
    inside[slot] = applyPerName(label, resolve)
  }
  return { inside, skipped }
}

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

type Crop = { left: number; top: number; width: number; height: number }
const VARIANT_EMBLEM: Crop = { left: 186, top: 155, width: 56, height: 56 }
const STATUS_EMBLEM: Crop = { left: 5, top: 5, width: 90, height: 90 }

export function emblemSources(icons: string[], statuses: string[]): Record<string, { file: string; box: Crop }> {
  const sources: Record<string, { file: string; box: Crop }> = {}
  for (const file of [...icons].sort()) {
    const raw = file.replace(/\.webp$/, '')
    if (raw.endsWith('_spawn')) continue
    const element = aliases.elements[raw.slice(raw.lastIndexOf('_') + 1)]
    if (element && !sources[element]) sources[element] = { file: `data/raw/assets/icons/${file}`, box: VARIANT_EMBLEM }
  }
  for (const [rawElement, element] of Object.entries<string>(aliases.elements)) {
    if (sources[element]) continue
    if (statuses.includes(`${rawElement}.png`)) sources[element] = { file: `data/raw/assets/elements/${rawElement}.png`, box: STATUS_EMBLEM }
    else throw new Error(`no emblem for element ${element}: neither variant art nor data/raw/assets/elements/${rawElement}.png`)
  }
  return sources
}

export function toNightlord(raw: string): string {
  const slug = aliases.nightlordByNumber[raw.split('_')[0]]
  if (!slug) throw new Error(`unknown nightlord: ${raw}`)
  return slug
}

const EVENTS_WITH_A_MAP_SPOT = new Set(['Meteor Strike', 'Mausoleum', "Sorcerer's Rise"])

export function toEvent(raw: string, info: Record<string, string[]>) {
  if (!raw) return null
  const match = raw.match(/^(.*?)(?:Day([12]))?$/)!
  const base = match[1]
  const name = aliases.eventNameOverrides[base] ?? info[raw]?.[0]
  if (!name) throw new Error(`unknown event: ${raw}`)
  return { name, day: match[2] ? (Number(match[2]) as 1 | 2) : null }
}

const MAX_CASTLE_BOSS_DRIFT = 3

const titleCase = (id: string) =>
  id.split('_').map((w, i) => (i > 0 && w === 'of' ? w : w[0].toUpperCase() + w.slice(1))).join(' ')

function main() {
  const observer = JSON.parse(readFileSync('data/raw/observer.json', 'utf8'))
  const artimuz: any[] = JSON.parse(readFileSync('data/raw/artimuz.json', 'utf8'))
  const remote = observer.remote
  const problems: string[] = []

  const sourceCanonicalSpelling: Record<string, string> = remote.bossIconTypes.nameAliases
  const bossName = (name: string) => aliases.bossNameOverrides[name] ?? sourceCanonicalSpelling[name] ?? name
  const notFieldBosses = new Set<string>(remote.bossIconTypes.notFieldBosses)
  const greatBosses = new Set(Object.entries<string>(remote.bossIconTypes.bosses).filter(([, type]) => type === 'great').map(([name]) => name))

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
  const castleBossOnEveryLimveldEarth = (slot: string) => {
    const points = Object.entries<any[]>(remote.bossPositions.positions)
      .flatMap(([mapType, list]) => list.filter((p) => p.slot === slot).map((p) => ({ mapType, x: p.x, y: p.y })))
    const normal = points.find((p) => p.mapType === 'Normal')
    if (!normal) throw new Error(`no ${slot} position on the Normal map`)
    for (const p of points) {
      if (Math.hypot(p.x - normal.x, p.y - normal.y) > MAX_CASTLE_BOSS_DRIFT) problems.push(`${slot} on ${p.mapType} is far from Normal's`)
    }
    return { x: normal.x, y: normal.y }
  }
  const castleAt = {
    crew: remote.castleCrew.position,
    rooftop: castleBossOnEveryLimveldEarth('Castle Rooftop'),
    basement: castleBossOnEveryLimveldEarth('Castle Basement'),
  }
  const maps = {
    limveld: { slots: slotMap(observer.coordinates.baseSlots), castle: castleAt },
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

    const labelled = toInside(remote.poiLabels.seeds[id], slots, bossName)
    for (const slip of labelled.skipped) console.warn(`seed ${id} inside label skipped, ${slip}`)

    const markers: any[] = []
    const event = toEvent(s.Event, observer.eventInfo)
    for (const [slot, label] of Object.entries(remote.poiLabels.seeds[id] ?? {})) {
      if (label !== EVENT_PLACEHOLDER_LABEL) continue
      if (!event || !EVENTS_WITH_A_MAP_SPOT.has(event.name)) { console.warn(`seed ${id} slot ${slot} is marked '@event', but its event (${event?.name ?? 'none'}) stands nowhere`); continue }
      if (!map.slots[slot]) { problems.push(`seed ${id} event slot ${slot} has no coordinates`); continue }
      markers.push({ layer: 'event', ...map.slots[slot], label: event.day ? `${event.name} · Day ${event.day}` : event.name })
    }
    const nc = remote.nightCircles.seeds[id]
    for (const night of [1, 2] as const) {
      const circle = nc?.[`night${night}`]?.circle
      let pos = circle ? remote.nightCircles.positions[circle] : undefined
      const isGreatHollowNight2 = earth === 'great-hollow' && night === 2
      if (isGreatHollowNight2) pos = remote.greatHollowDay2Circle.positions[remote.greatHollowDay2Circle.seeds[id]]
      if (pos) markers.push({ layer: 'circle', night, x: pos.x, y: pos.y, label: `Night ${night}: ${bossName(nc[`night${night}`].boss)}` })
      else problems.push(`seed ${id} night ${night} circle has no position`)
    }
    const fieldBossesBySlot = Object.fromEntries(Object.entries<string>(remote.bossAssignments.seeds[id] ?? {})
      .map(([slot, boss]) => [aliases.bossSlots[slot] ?? slot, boss]))
    for (const p of remote.bossPositions.positions[s.map_type] ?? []) {
      const boss = p.slot && fieldBossesBySlot[p.slot]
      if (boss && !p.slot.startsWith('Castle') && !notFieldBosses.has(boss)) {
        markers.push({ layer: 'boss', x: p.x, y: p.y, label: bossName(boss), ...(greatBosses.has(bossName(boss)) && { great: true }) })
      }
    }
    if (earth === 'great-hollow') {
      for (const [pos, entry] of Object.entries<any>(remote.greatHollow.seeds[id] ?? {})) {
        const at = remote.greatHollowPositions.positions[pos]
        if (at && entry.kind !== 'label') markers.push({ layer: 'boss', x: at.x, y: at.y, label: applyPerName(entry.label, bossName) })
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
      event,
      spawn: spawnEntry?.[0] ?? '',
      slots,
      inside: labelled.inside,
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
  console.log('inside labels', seeds.reduce((n, s) => n + Object.keys(s.inside).length, 0), 'on', count((s) => Object.keys(s.inside).length > 0), 'seeds')
  for (const layer of ['circle', 'boss', 'evergaol', 'chest', 'merchant', 'rot-blessing']) {
    console.log(layer, count((s) => s.markers.some((m: any) => m.layer === layer)))
  }
  const keys = new Set<string>(seeds.flatMap((s) => Object.values(s.slots).filter((k): k is string => k !== null)))
  const noIcon = [...keys].filter((key) => {
    const kind = key.split(':')[0]
    return !existsSync(`public/structures/${kind}.webp`)
  })
  console.log('structure keys without any icon:', noIcon.length ? noIcon.sort().join(', ') : 'none')
}

// Baked, not a CSS drop-shadow: the map moves these marks every frame and a filter would be redrawn with them.
export async function withShadow(img: sharp.Sharp): Promise<sharp.Sharp> {
  const pad = { top: 2, bottom: 4, left: 3, right: 3 }
  const art = await img.ensureAlpha().extend({ ...pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  const { data, info } = await sharp(art).raw().toBuffer({ resolveWithObject: true })
  const shadowOpacity = 0.85
  const dark = Buffer.alloc(data.length)
  for (let i = 0; i < data.length; i += 4) dark[i + 3] = Math.round(data[i + 3] * shadowOpacity)
  const shadow = await sharp(dark, { raw: info }).blur(1.2).png().toBuffer()
  const canvas = { width: info.width, height: info.height, channels: 4 as const, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  return sharp(await sharp({ create: canvas }).composite([{ input: shadow, top: 2, left: 0 }, { input: art, top: 0, left: 0 }]).png().toBuffer())
}

async function evergaolWithGlow(): Promise<sharp.Sharp> {
  const art = await (await withShadow(sharp('data/raw/assets/markers/evergaol.png', { density: 144 }).trim())).png().toBuffer()
  const { width, height } = await sharp(art).metadata()
  const pad = 8
  const w = width! + pad * 2
  const h = height! + pad * 2
  const r = Math.min(width!, height!) / 2 - 2
  const ring = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><filter id="b"><feGaussianBlur stdDeviation="3"/></filter>`
    + `<circle cx="${w / 2}" cy="${h / 2 - 1}" r="${r}" fill="none" stroke="#b38cff" stroke-opacity="0.85" stroke-width="5" filter="url(#b)"/></svg>`
  return sharp(Buffer.from(ring)).composite([{ input: art, top: pad, left: pad }])
}

export function islandBox(rgba: Uint8Array, width: number, height: number) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] < 128) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  const unit = (v: number, size: number) => Math.round((v / size) * 1000)
  return { x0: unit(x0, width), y0: unit(y0, height), x1: unit(x1 + 1, width), y1: unit(y1 + 1, height) }
}

export type Coverage = (r: number, g: number, b: number, a: number) => number

const clampToUnit = (v: number) => Math.min(1, Math.max(0, v))

export const oceanCoverage = ([or, og, ob]: readonly number[], oceanWithin = 24, landBeyond = 72): Coverage => (r, g, b) => {
  const distanceFromOcean = Math.hypot(r - or, g - og, b - ob)
  return clampToUnit((distanceFromOcean - oceanWithin) / (landBeyond - oceanWithin))
}
export const hazeCoverage = (clearBelow = 180, solidAbove = 250): Coverage => (_r, _g, _b, a) =>
  clampToUnit((a - clearBelow) / (solidAbove - clearBelow))

const FLOOD_FILL_DOWNHILL_SLACK = 0.15

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
    if (c >= 1 || c + FLOOD_FILL_DOWNHILL_SLACK < from) return
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

export const DAMAGE_ICONS = [
  'standard', 'slash', 'strike', 'pierce', 'magic', 'fire', 'lightning', 'holy',
  'bleed', 'frost', 'rot', 'poison', 'sleep', 'madness',
] as const

const LIMVELD_OCEAN_RGB = [73, 119, 153]

async function copyAssets() {
  mkdirSync('public/maps', { recursive: true })
  const maps: Record<string, string> = {
    default: 'Default.png', crater: 'Crater.png', mountaintop: 'Mountaintop.png',
    'rotted-woods': 'RottedWoods.png', noklateo: 'Noklateo.png', 'great-hollow': 'GreatHollow.webp',
  }
  const islands: Record<string, ReturnType<typeof islandBox>> = {}
  for (const [earth, file] of Object.entries(maps)) {
    const image = sharp(`data/raw/assets/maps/${file}`)
    const { width, height } = await image.metadata()
    if (width !== height) throw new Error(`${file} is ${width}x${height}; the 1000-unit coordinate space assumes a square map`)
    const [size, quality] = earth === 'great-hollow' ? [1400, 70] : [2000, 78]
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const coverage = earth === 'great-hollow' ? hazeCoverage() : oceanCoverage(LIMVELD_OCEAN_RGB)
    const keyed = keyBackground(data, info.width, info.height, coverage)
    islands[earth] = islandBox(keyed, info.width, info.height)
    await sharp(keyed, { raw: { width: info.width, height: info.height, channels: 4 } })
      .resize(size, size).webp({ quality }).toFile(`public/maps/${earth}.webp`)
    mkdirSync('public/maps/thumb', { recursive: true })
    await sharp(keyed, { raw: { width: info.width, height: info.height, channels: 4 } })
      .resize(240, 240).webp({ quality: 70 }).toFile(`public/maps/thumb/${earth}.webp`)
  }
  writeFileSync('src/data/islands.json', `${JSON.stringify(islands, null, 2)}
`)
  rmSync('public/structures', { recursive: true, force: true })
  mkdirSync('public/structures', { recursive: true })
  const icons = readdirSync('data/raw/assets/icons')
  for (const file of icons) {
    const raw = file.replace(/\.webp$/, '')
    if (raw.endsWith('_spawn')) continue
    const key = toStructureKey(raw)!
    const isElementalVariant = key.includes(':')
    if (isElementalVariant) continue
    await withShadow(sharp(`data/raw/assets/icons/${file}`).trim()).then((img) => img.webp({ quality: 90 }).toFile(`public/structures/${key}.webp`))
  }
  // Not trimmed: a trim keyed on the corner colour would eat into dark emblems (bleed, blight).
  rmSync('public/elements', { recursive: true, force: true })
  mkdirSync('public/elements', { recursive: true })
  for (const [element, { file, box }] of Object.entries(emblemSources(icons, readdirSync('data/raw/assets/elements')))) {
    await sharp(file).extract(box).resize(64, 64).webp({ quality: 90 }).toFile(`public/elements/${element}.webp`)
  }
  mkdirSync('public/nightlords', { recursive: true })
  for (const file of readdirSync('data/raw/assets/nightlords')) {
    const slug = file === 'unknown.webp' ? 'unknown' : toNightlord(file.replace('.webp', '') + '_')
    copyFileSync(`data/raw/assets/nightlords/${file}`, `public/nightlords/${slug}.webp`)
  }
  rmSync('public/damage', { recursive: true, force: true })
  mkdirSync('public/damage', { recursive: true })
  for (const key of DAMAGE_ICONS) {
    await sharp(`data/raw/assets/damage/${key}.png`).resize(64, 64).webp({ quality: 85 }).toFile(`public/damage/${key}.webp`)
  }
  rmSync('public/markers', { recursive: true, force: true })
  mkdirSync('public/markers', { recursive: true })
  const trimmedMarker = (file: string) => sharp(`data/raw/assets/markers/${file}`, { density: 144 }).trim()
  for (const name of ['field-boss', 'chest', 'merchant']) {
    await withShadow(trimmedMarker(`${name}.png`)).then((img) => img.webp({ quality: 90 }).toFile(`public/markers/${name}.webp`))
  }
  await withShadow(trimmedMarker('caravan.svg').resize(96, 96, { fit: 'inside' })).then((img) => img.webp({ quality: 90 }).toFile('public/markers/caravan.webp'))
  await evergaolWithGlow().then((img) => img.webp({ quality: 90 }).toFile('public/markers/evergaol.webp'))
  const fieldBossCrestTurnedRed = await trimmedMarker('field-boss.png').modulate({ hue: 100, saturation: 1.4 }).png().toBuffer()
  await withShadow(sharp(fieldBossCrestTurnedRed))
    .then((img) => img.webp({ quality: 90 }).toFile('public/markers/great-boss.webp'))
  const untrimmedGlow = (name: string) => sharp(`data/raw/assets/markers/${name}.svg`, { density: 144 }).resize(128, 128)
  for (const name of ['unknown', 'player']) await untrimmedGlow(name).webp({ quality: 90 }).toFile(`public/markers/${name}.webp`)
  console.log('assets copied')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
