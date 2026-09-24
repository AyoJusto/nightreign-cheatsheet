import type { EarthId, NightlordId, SlotId, StructureKey } from './names'

export type MarkerLayer = 'circle' | 'boss' | 'evergaol' | 'chest' | 'merchant' | 'rot-blessing'
export interface Marker { layer: MarkerLayer; x: number; y: number; label: string; night?: 1 | 2 }

export interface Seed {
  id: string
  nightlord: NightlordId
  earth: EarthId
  event: { name: string; day: 1 | 2 | null } | null
  spawn: SlotId
  /** Every slot on this map. null means nothing stands there in this seed. */
  slots: Record<SlotId, StructureKey | null>
  nights: Record<1 | 2, { boss: string; circle: string | null }>
  castle: { crew: string; basement: string | null; rooftop: string | null } | null
  oldGaol: boolean
  markers: Marker[]
}
