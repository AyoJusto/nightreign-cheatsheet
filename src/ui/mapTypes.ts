import type { SlotId, StructureKey } from '../domain/names'
import type { Marker } from '../domain/seed'

export type PinState = 'open' | 'sighted' | 'certain' | 'candidate' | 'dimmed' | 'spawn-option' | 'spawn'
export interface Pin { slot: SlotId; x: number; y: number; state: PinState; structure: StructureKey | null; label: string; name?: string; weaponHitsRunWeakness?: boolean }
export interface MapMarker extends Omit<Marker, 'layer'> { layer: Marker['layer'] | 'castle' | 'caravan'; nameWithoutIcon?: boolean }

type MapUnits = number
type ScreenPx = number
export interface MarkTap { marker?: MapMarker; site?: string; x: MapUnits; y: MapUnits; clientX: ScreenPx; clientY: ScreenPx }

export interface MapContent {
  pins: Pin[]
  markers?: MapMarker[]
  dim?: boolean
  selected?: SlotId | null
  focusPoint?: { x: number; y: number } | null
  onPin?: (slot: SlotId, state: PinState) => void
  onBackground?: () => void
  preferred?: (pin: Pin) => boolean
  onHover?: (pin: Pin | null) => void
  onMark?: (mark: MarkTap | null) => void
  dismissals?: number
}
