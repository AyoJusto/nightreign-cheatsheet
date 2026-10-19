import type { EarthId, NightlordId, SlotId, StructureKey } from './names'

export type MarkerLayer = 'circle' | 'event' | 'boss' | 'evergaol' | 'chest' | 'merchant' | 'rot-blessing'
/** `great`: drawn with the red great-boss crest rather than the blue field one. */
export interface Marker { layer: MarkerLayer; x: number; y: number; label: string; night?: 1 | 2; great?: boolean }
export interface MapPoint { x: number; y: number }
/** In map units: 0..1000 across the square map image on both axes. */
export interface Box { x0: number; y0: number; x1: number; y1: number }
export interface CastlePoints { crew: MapPoint; rooftop: MapPoint; basement: MapPoint }

export interface Seed {
  id: string
  nightlord: NightlordId
  earth: EarthId
  event: { name: string; day: 1 | 2 | null } | null
  spawn: SlotId
  slots: Record<SlotId, StructureKey | null>
  /** A Ruined Rise puzzle joins several clues with ", ". */
  inside: Record<SlotId, string>
  nights: Record<1 | 2, { boss: string; circle: string | null }>
  castle: { crew: string; basement: string | null; rooftop: string | null } | null
  oldGaol: boolean
  markers: Marker[]
}
