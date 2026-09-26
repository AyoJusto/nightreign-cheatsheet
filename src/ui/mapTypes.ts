import type { SlotId, StructureKey } from '../domain/names'
import type { Marker } from '../domain/seed'

// What the map draws, as the overlays hand it over: plain types, so pure builders (finderPins, resultMap) and their
// tests need no React.

export type PinState = 'open' | 'sighted' | 'certain' | 'candidate' | 'dimmed' | 'spawn-option' | 'spawn'
/** `name`: what is inside the site ("Guardian Golem"), written on the map under its art when there is room. */
export interface Pin { slot: SlotId; x: number; y: number; state: PinState; structure: StructureKey | null; label: string; name?: string }
/**
 * A marker as the map draws it. Beyond the seed's own layers: the castle's bosses (a crest each) and its guard
 * (a name alone), and caravans, which stand on open ground where nothing is built (a cart, drawn for the app).
 */
export interface MapMarker extends Omit<Marker, 'layer'> { layer: Marker['layer'] | 'castle' | 'caravan'; plain?: boolean }

export interface MapContent {
  pins: Pin[]
  markers?: MapMarker[]
  dim?: boolean
  selected?: SlotId | null
  /** Omitted when pins do nothing (the result map): they are then images with a name, not buttons. */
  onPin?: (slot: SlotId, state: PinState) => void
  onBackground?: () => void
  /** The pins the current step asks for: a tap in reach of one goes to it, even if another pin is nearer. */
  preferred?: (pin: Pin) => boolean
  /** A mouse pointer entered a pin (or left it, with null). Touch never hovers, so it never fires there. */
  onHover?: (pin: Pin | null) => void
}
