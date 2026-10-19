import type { SlotId, StructureKey } from '../domain/names'
import type { Marker } from '../domain/seed'

export type PinState = 'open' | 'sighted' | 'certain' | 'candidate' | 'dimmed' | 'spawn-option' | 'spawn'
/** `name` is what is inside the site; `match` marks a camp whose weapon hits what the run's hardest fights are weak to. */
export interface Pin { slot: SlotId; x: number; y: number; state: PinState; structure: StructureKey | null; label: string; name?: string; match?: boolean }
/** `plain`: a name with no icon, such as the castle's guard. */
export interface MapMarker extends Omit<Marker, 'layer'> { layer: Marker['layer'] | 'castle' | 'caravan'; plain?: boolean }

/** `x`, `y` are the mark in map units; `clientX`, `clientY` the tap on screen. */
export interface MarkTap { marker?: MapMarker; site?: string; x: number; y: number; clientX: number; clientY: number }

export interface MapContent {
  pins: Pin[]
  markers?: MapMarker[]
  dim?: boolean
  selected?: SlotId | null
  /** Kept clear of the sheet, as a selected pin is. */
  focusPoint?: { x: number; y: number } | null
  /** Omitted, pins render as images rather than buttons. */
  onPin?: (slot: SlotId, state: PinState) => void
  onBackground?: () => void
  /** A tap in reach of a preferred pin goes to it, even if another pin is nearer. */
  preferred?: (pin: Pin) => boolean
  /** Mouse only: touch never hovers. */
  onHover?: (pin: Pin | null) => void
  /** Null when the callout was put away. */
  onMark?: (mark: MarkTap | null) => void
  /** Bumped when the overlay closes what a tapped mark opened, so its callout closes too. */
  dismissals?: number
}
