import type { EarthId, NightlordId, SlotId, StructureKey } from './names'

export type MarkerLayer = 'circle' | 'event' | 'boss' | 'evergaol' | 'chest' | 'merchant' | 'rot-blessing'
export interface Marker { layer: MarkerLayer; x: number; y: number; label: string; night?: 1 | 2; great?: boolean }
export interface MapPoint { x: number; y: number }
type ThousandthsOfMapSide = number
export interface Box { x0: ThousandthsOfMapSide; y0: ThousandthsOfMapSide; x1: ThousandthsOfMapSide; y1: ThousandthsOfMapSide }
export interface CastlePoints { crew: MapPoint; rooftop: MapPoint; basement: MapPoint }

type CommaJoinedLabels = string

export interface Seed {
  id: string
  nightlord: NightlordId
  earth: EarthId
  event: { name: string; day: 1 | 2 | null } | null
  spawn: SlotId
  slots: Record<SlotId, StructureKey | null>
  inside: Record<SlotId, CommaJoinedLabels>
  nights: Record<1 | 2, { boss: string; circle: string | null }>
  castle: { crew: string; basement: string | null; rooftop: string | null } | null
  oldGaol: boolean
  markers: Marker[]
}
