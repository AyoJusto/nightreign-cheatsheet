import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { EXPEDITIONS } from '../data/raw/weaknesses/data/nightlords.ts'
import { NIGHT_BOSSES } from '../data/raw/weaknesses/data/nightbosses.ts'
import type { Form as CheatsheetForm } from '../data/raw/weaknesses/types.ts'
import { DAMAGE_TYPES, STATUSES, type Buildup, type Enemy, type Form, type Negation, type Nightlord } from '../src/bestiary/enemy.ts'

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'))

export const NOT_ENEMIES = new Set([
  'Caravans', 'Pool Reflection', 'Withered Trees', 'Above Door', 'Fleeing Stump', 'Fake Building', 'Fog Door', 'Unlit Candle',
  'Missing Statue', 'Windy Trees', 'Imp Statue', 'Second Floor', 'Right of Door', 'Teleporting Trees', 'Rear Withered Trees',
])

const IMMUNE_THRESHOLD = 999

type SourceForm = {
  label: string | null
  source: 'nightbosses' | 'bosses' | 'npcs' | 'fextralife'
  match: string
  variant: string | null
  negation?: Negation
  buildup?: Record<string, number | 'Immune'>
}
type SourceEntry = { id: string; name: string; forms: SourceForm[] }

export const percentFromMultiplier = (multiplier: number) => Math.round((1 - multiplier) * 100)

export function fromCheatsheet(form: CheatsheetForm): Form {
  return {
    label: form.label,
    negation: { ...form.phys, ...form.elem },
    buildup: Object.fromEntries(STATUSES.map((s) => [s, form.status[s] === 'Immune' ? 'immune' : form.status[s]])) as Buildup,
  }
}

const buildupFrom = (read: (status: string) => number | 'Immune' | undefined, immune: string[] = []): Buildup =>
  Object.fromEntries(STATUSES.map((s) => {
    const value = read(s)
    if (value === undefined) throw new Error(`no ${s} buildup`)
    return [s, immune.includes(s) || value === 'Immune' || value >= IMMUNE_THRESHOLD ? 'immune' : value]
  })) as Buildup

const NPC_DAMAGE: Record<string, string> = { standard: 'phys', strike: 'blow', pierce: 'thrust' }

function resolveForm(form: SourceForm, exports: { bosses: any; npcs: Record<string, any> }): Form[] {
  if (form.source === 'nightbosses') {
    const fight = NIGHT_BOSSES.find((b) => b.name === form.match)
    if (!fight?.data) throw new Error(`no night boss ${form.match}`)
    const forms = fight.data.forms.filter((f) => form.variant === null || f.label === form.variant)
    if (!forms.length) throw new Error(`no form ${form.variant} on ${form.match}`)
    return forms.map((f) => ({ ...fromCheatsheet(f), label: form.label ?? f.label }))
  }
  if (form.source === 'bosses') {
    const boss = exports.bosses.nightBosses.find((b: any) => b.nameEn === form.match)
    const variant = boss?.variants.find((v: any) => v.labelEn === form.variant)
    if (!variant) throw new Error(`no export row ${form.match} / ${form.variant}`)
    return [{
      label: form.label,
      negation: Object.fromEntries(DAMAGE_TYPES.map((t) => [t, percentFromMultiplier(variant.damageRates[t])])) as Negation,
      buildup: buildupFrom((s) => variant.resist[s], variant.immune),
    }]
  }
  if (form.source === 'npcs') {
    const row = exports.npcs[form.match]
    const npc = row && (form.variant === null || String(row.npc_id) === form.variant) ? row : undefined
    if (!npc) throw new Error(`no npc row ${form.match} / ${form.variant}`)
    return [{
      label: form.label,
      negation: Object.fromEntries(DAMAGE_TYPES.map((t) => [t, percentFromMultiplier(npc.damage_multiplier[NPC_DAMAGE[t] ?? t])])) as Negation,
      buildup: buildupFrom((s) => npc.status_resistance[s]),
    }]
  }
  if (!form.negation || !form.buildup) throw new Error(`no numbers for ${form.match}`)
  return [{ label: form.label, negation: form.negation, buildup: buildupFrom((s) => form.buildup![s]) }]
}

export function seedEnemyNames(seeds: any[]) {
  const night = new Set<string>()
  const elsewhere = new Set<string>()
  const add = (label: string | null | undefined) => {
    for (const name of (label ?? '').split(', ')) if (name && !NOT_ENEMIES.has(name)) elsewhere.add(name)
  }
  for (const seed of seeds) {
    night.add(seed.nights[1].boss)
    night.add(seed.nights[2].boss)
    if (seed.castle) [seed.castle.crew, seed.castle.basement, seed.castle.rooftop].forEach(add)
    Object.values<string>(seed.inside).forEach(add)
    for (const marker of seed.markers) if (marker.layer === 'boss' || marker.layer === 'evergaol') add(marker.label)
  }
  return { night, elsewhere }
}

const playerFacingLabel = (label: string | null) => label?.replace(/^.*\((.+)\)$/, '$1') ?? null

const sameForms = (a: Form[], b: Form[]) => JSON.stringify(a) === JSON.stringify(b)

export function buildBestiary(seeds: any[], sources: Record<string, SourceEntry>, nightAliases: Record<string, string>, exports: { bosses: any; npcs: Record<string, any> }) {
  const enemies = new Map<string, Enemy>()
  const add = (enemy: Enemy) => {
    const known = enemies.get(enemy.id)
    if (known && !sameForms(known.forms, enemy.forms)) throw new Error(`${enemy.id} has two different sets of numbers`)
    if (!known) enemies.set(enemy.id, enemy)
  }

  const fights = new Map<string, string>()
  for (const boss of NIGHT_BOSSES) {
    if (!boss.data) throw new Error(`${boss.name} has no numbers`)
    add({ id: boss.slug, name: boss.name, forms: boss.data.forms.map(fromCheatsheet) })
    fights.set(boss.name, boss.slug)
  }

  const nightlords: Nightlord[] = EXPEDITIONS.map((e) => ({
    id: e.id,
    name: e.expedition,
    forms: e.forms.map((f) => ({ ...fromCheatsheet(f), label: playerFacingLabel(f.label) })),
    named: e.listed.key,
  }))

  const { night, elsewhere } = seedEnemyNames(seeds)
  const nightNames: Record<string, string> = {}
  for (const name of [...night].sort()) {
    const id = fights.get(nightAliases[name] ?? name)
    if (!id) throw new Error(`night boss ${name} matches no fight`)
    nightNames[name] = id
  }

  const names: Record<string, string> = {}
  for (const name of [...elsewhere].sort()) {
    const entry = sources[name]
    if (!entry) throw new Error(`no enemy source for ${name}`)
    const onlyFight = entry.forms.length > 0 && entry.forms.every((f) => f.source === 'nightbosses' && f.variant === null && f.match === entry.forms[0].match)
    const id = onlyFight ? fights.get(entry.forms[0].match)! : entry.id
    if (!onlyFight) add({ id, name: entry.name, forms: entry.forms.flatMap((f) => resolveForm(f, exports)) })
    names[name] = id
  }

  return { enemies: [...enemies.values()].sort((a, b) => a.name.localeCompare(b.name)), nightlords, nightNames, names }
}

function main() {
  const seeds = readJson('src/data/seeds.json').seeds
  const aliases = readJson('data/raw/aliases.json')
  const bestiary = buildBestiary(
    seeds,
    readJson('data/raw/enemy-sources.json'),
    aliases.weaknessBossNames,
    { bosses: readJson('data/raw/enemies/bosses.json'), npcs: readJson('data/raw/enemies/npcs.json') },
  )
  const out = JSON.stringify(bestiary)
  for (const internal of aliases.internalNightlordNames) {
    if (new RegExp(`\\b${internal}\\b`, 'i').test(out)) throw new Error(`internal nightlord name in output: ${internal}`)
  }
  writeFileSync('src/data/enemies.json', out)
  const blank = bestiary.enemies.filter((e) => !e.forms.length).map((e) => e.name)
  console.log(`wrote ${bestiary.enemies.length} enemies and ${bestiary.nightlords.length} nightlords; no data for ${blank.join(', ') || 'none'}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
