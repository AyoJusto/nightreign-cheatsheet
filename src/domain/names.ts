import { isStatus, type Affliction } from '../bestiary/enemy'
import type { Headline } from '../bestiary/bestiary'

export type NightlordId =
  | 'tricephalos' | 'gaping-jaw' | 'sentient-pest' | 'augur' | 'equilibrious-beast'
  | 'darkdrift-knight' | 'fissure-in-the-fog' | 'night-aspect' | 'balancers' | 'dreglord'
/** `unknown`: a Deep of Night run that hides the Nightlord, so every Nightlord's seeds on the earth stay in play. */
export type NightlordPick = NightlordId | 'unknown'
export type EarthId = 'default' | 'crater' | 'mountaintop' | 'rotted-woods' | 'noklateo' | 'great-hollow'
export type ElementId =
  | 'fire' | 'holy' | 'magic' | 'lightning' | 'frostbite' | 'poison' | 'bleed' | 'blight' | 'madness' | 'sleep' | 'rot'
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

export const DAMAGE_NAMES: Record<Affliction, string> = {
  standard: 'Standard', slash: 'Slash', strike: 'Strike', pierce: 'Pierce',
  magic: 'Magic', fire: 'Fire', lightning: 'Lightning', holy: 'Holy',
  bleed: 'Blood Loss', frost: 'Frostbite', rot: 'Scarlet Rot', poison: 'Poison', sleep: 'Sleep', madness: 'Madness',
}

/** Statuses always get their own row, so a status icon never stands unnamed among the damage types. */
export function cardRows(h: Headline): Headline {
  return { weak: h.weak.filter((k) => !isStatus(k)), resist: h.resist, status: [...new Set([...h.weak.filter(isStatus), ...h.status])] }
}

export function weaknessPhrase(h: Headline): string {
  const words = (keys: Affliction[]) => keys.map((k) => DAMAGE_NAMES[k]).join(', ')
  const { weak, resist, status } = cardRows(h)
  return [
    weak.length ? `weak to ${words(weak)}` : '',
    resist.length ? `resists ${words(resist)}` : '',
    status.length ? `weak status ${words(status)}` : '',
  ].filter(Boolean).join('; ')
}

/** Shown when an emblem image fails to load; first letters alone collide (Fire and Frostbite, Bleed and Blight). */
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
