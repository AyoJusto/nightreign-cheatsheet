import type { EarthId, NightlordId, SlotId, StructureKey } from './names'

export type MarkerLayer = 'circle' | 'boss' | 'evergaol' | 'chest' | 'merchant' | 'rot-blessing'
/** `great`: a boss the game draws with its red great crest rather than the blue field one. */
export interface Marker { layer: MarkerLayer; x: number; y: number; label: string; night?: 1 | 2; great?: boolean }
export interface MapPoint { x: number; y: number }
/** A map region in image units (0..1000 across the square map image on both axes). */
export interface Box { x0: number; y0: number; x1: number; y1: number }
/** Where the castle's guard label and its rooftop and basement bosses sit, in map units (0-1000). */
export interface CastlePoints { crew: MapPoint; rooftop: MapPoint; basement: MapPoint }

export interface Seed {
  id: string
  nightlord: NightlordId
  earth: EarthId
  event: { name: string; day: 1 | 2 | null } | null
  spawn: SlotId
  /** Every slot on this map. null means nothing stands there in this seed. */
  slots: Record<SlotId, StructureKey | null>
  /**
   * What is inside a site, by slot, as the game's map would name it ("Guardian Golem"); a Ruined Rise puzzle
   * joins several clues with ", ". Only slots with a label: none on Great Hollow. A slot with nothing built
   * carries one only for Caravans, which stand on open ground.
   */
  inside: Record<SlotId, string>
  nights: Record<1 | 2, { boss: string; circle: string | null }>
  castle: { crew: string; basement: string | null; rooftop: string | null } | null
  oldGaol: boolean
  markers: Marker[]
}
