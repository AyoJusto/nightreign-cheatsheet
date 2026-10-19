export type NightlordId =
  | 'tricephalos' | 'gaping-jaw' | 'sentient-pest' | 'augur' | 'equilibrious-beast'
  | 'darkdrift-knight' | 'fissure-in-the-fog' | 'night-aspect' | 'balancers' | 'dreglord'
/**
 * What the user picked on Home: a Nightlord, or `unknown` for a Deep of Night run that hides it until the final
 * battle. Every Nightlord has its own map seeds, so an unknown one scouts all of an earth's seeds, and the seed
 * found names the Nightlord.
 */
export type NightlordPick = NightlordId | 'unknown'
export type EarthId = 'default' | 'crater' | 'mountaintop' | 'rotted-woods' | 'noklateo' | 'great-hollow'
export type ElementId =
  | 'fire' | 'holy' | 'magic' | 'lightning' | 'frostbite' | 'poison' | 'bleed' | 'blight' | 'madness' | 'sleep' | 'rot'
/** The game's 14 damage and status icons (public/damage/<key>.webp), as the weakness data names them. */
export type DamageKey =
  | 'standard' | 'slash' | 'strike' | 'pierce' | 'magic' | 'fire' | 'lightning' | 'holy'
  | 'bleed' | 'frost' | 'rot' | 'poison' | 'sleep' | 'madness'
/**
 * What to hit a boss with (`weak`, best first) and what it shrugs off (`resist`). A Nightlord listed for a damage
 * type also has `status`: the statuses that build up fastest on it, the cheatsheet's "Also" line.
 */
export interface Weakness { weak: DamageKey[]; resist: DamageKey[]; status?: DamageKey[] }
export type SlotId = string
/** `kind` or `kind:element`, e.g. `great-church:fire`. */
export type StructureKey = string

export const NIGHTLORDS: readonly { id: NightlordId; name: string; dlc: boolean }[] = [
  { id: 'tricephalos', name: 'Tricephalos', dlc: false },
  { id: 'gaping-jaw', name: 'Gaping Jaw', dlc: false },
  { id: 'sentient-pest', name: 'Sentient Pest', dlc: false },
  { id: 'augur', name: 'Augur', dlc: false },
  { id: 'equilibrious-beast', name: 'Equilibrious Beast', dlc: false },
  { id: 'darkdrift-knight', name: 'Darkdrift Knight', dlc: false },
  { id: 'fissure-in-the-fog', name: 'Fissure in the Fog', dlc: false },
  { id: 'night-aspect', name: 'Night Aspect', dlc: false },
  { id: 'balancers', name: 'Balancers', dlc: true },
  { id: 'dreglord', name: 'Dreglord', dlc: true },
]

export const EARTHS: readonly { id: EarthId; name: string }[] = [
  { id: 'default', name: 'Default' },
  { id: 'crater', name: 'Crater' },
  { id: 'mountaintop', name: 'Mountaintop' },
  { id: 'rotted-woods', name: 'Rotted Woods' },
  { id: 'noklateo', name: 'Noklateo' },
  { id: 'great-hollow', name: 'Great Hollow' },
]

// Names confirmed against Fextralife on 2026-09-23.
const KIND_NAMES: Record<string, string> = {
  church: 'Church',
  'great-church': 'Great Church',
  fort: 'Fort',
  'main-encampment': 'Main Encampment',
  ruins: 'Ruins',
  'sorcerers-rise': "Sorcerer's Rise",
  'ruined-rise': 'Ruined Rise',
  township: 'Township',
  'blacksmith-village': 'Blacksmith Village',
  marsh: 'Marsh',
  'western-underground-fort': 'Western Underground Fort',
  'eastern-underground-fort': 'Eastern Underground Fort',
  'scale-bearing-merchant': 'Scale-Bearing Merchant',
}

export const ELEMENT_NAMES: Record<ElementId, string> = {
  fire: 'Fire', holy: 'Holy', magic: 'Magic', lightning: 'Lightning', frostbite: 'Frostbite', poison: 'Poison',
  bleed: 'Bleed', blight: 'Blight', madness: 'Madness', sleep: 'Sleep', rot: 'Rot',
}

/** The game's own word for each damage type and status, for accessible labels beside the icons. */
export const DAMAGE_NAMES: Record<DamageKey, string> = {
  standard: 'Standard', slash: 'Slash', strike: 'Strike', pierce: 'Pierce',
  magic: 'Magic', fire: 'Fire', lightning: 'Lightning', holy: 'Holy',
  bleed: 'Blood Loss', frost: 'Frostbite', rot: 'Scarlet Rot', poison: 'Poison', sleep: 'Sleep', madness: 'Madness',
}

/**
 * What a Nightlord's weakness card shows, row by row (cardRows), as words for a screen reader:
 * "weak to Holy, Pierce; resists Fire; weak status Sleep".
 */
export function weaknessPhrase(w: Weakness): string {
  const words = (keys: DamageKey[]) => keys.map((k) => DAMAGE_NAMES[k]).join(', ')
  const { weak, resist, status } = cardRows(w)
  return [
    weak.length ? `weak to ${words(weak)}` : '',
    resist.length ? `resists ${words(resist)}` : '',
    status.length ? `weak status ${words(status)}` : '',
  ].filter(Boolean).join('; ')
}

const STATUSES: ReadonlySet<DamageKey> = new Set(['bleed', 'frost', 'rot', 'poison', 'sleep', 'madness'])
/**
 * A Nightlord card's rows: damage types under Weak, and every status under Weak status, whether the data lists it
 * as the Nightlord's weakness (Sleep for Balancers) or as the fastest to build up (Sleep for Tricephalos), so a
 * status is always named in words, never left as an unnamed icon.
 */
export function cardRows(w: Weakness): { weak: DamageKey[]; resist: DamageKey[]; status: DamageKey[] } {
  const listed = w.weak.filter((k) => STATUSES.has(k))
  return { weak: w.weak.filter((k) => !STATUSES.has(k)), resist: w.resist, status: [...new Set([...listed, ...(w.status ?? [])])] }
}

/** Two letters, unique per element, shown if an emblem image fails to load: first letters alone collide (Fire/Frostbite, Bleed/Blight). */
export const ELEMENT_CODES: Record<ElementId, string> = {
  fire: 'Fi', holy: 'Ho', magic: 'Mg', lightning: 'Li', frostbite: 'Fr', poison: 'Po',
  bleed: 'Bl', blight: 'Bt', madness: 'Md', sleep: 'Sl', rot: 'Ro',
}

export function splitStructure(key: StructureKey): { kind: string; element: ElementId | null } {
  const [kind, element] = key.split(':')
  return { kind, element: (element as ElementId) ?? null }
}

export function kindName(kind: string): string {
  const name = KIND_NAMES[kind]
  if (!name) throw new Error(`no display name for structure kind ${kind}`)
  return name
}

export function structureName(key: StructureKey): string {
  const { kind, element } = splitStructure(key)
  return element ? `${kindName(kind)}, ${ELEMENT_NAMES[element]}` : kindName(kind)
}

export const mapFamily = (earth: EarthId) => (earth === 'great-hollow' ? 'great-hollow' : 'limveld') as 'limveld' | 'great-hollow'
export const nightlordName = (id: NightlordPick) => (id === 'unknown' ? 'Unknown Nightlord' : NIGHTLORDS.find((n) => n.id === id)!.name)
export const earthName = (id: EarthId) => EARTHS.find((e) => e.id === id)!.name
