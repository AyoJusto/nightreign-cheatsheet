import { useRef, useEffect, useLayoutEffect, type ReactNode } from 'react'
import { motion, useTransform, type MotionValue } from 'motion/react'
import type { MapMarker } from './mapTypes'
import { shortBossName, type TagSpec } from './mapGeometry'
import { measureName, type NameBox } from './mapNames'

// The marks MapView draws on the map, each laid out at its own size and scaled with the map.
export const ICON_SIZE = 36
export const RING_SIZE = 110

export function tagOf(m: MapMarker): TagSpec {
  const at = { x: m.x, y: m.y }
  // An event's name is placed as a night's is: kept in sight, just above its circle, else inside it.
  if (m.layer === 'circle' || m.layer === 'event') return { ...at, kind: 'night', mark: 'ring' }
  const mark = m.plain || !MARKER_ART[m.layer] ? 'none' : 'icon'
  if (m.layer === 'castle') return { ...at, kind: 'castle', mark }
  if (m.layer === 'boss' || m.layer === 'evergaol') return { ...at, kind: m.layer, mark }
  // A chest's icon says all its name would: the name is left to screen readers.
  if (m.layer === 'chest') return { ...at, kind: 'chest', mark, silent: true }
  return { ...at, kind: 'other', mark }
}
const MARKER_ART: Partial<Record<MapMarker['layer'], string>> = {
  boss: 'markers/field-boss.webp', castle: 'markers/field-boss.webp', evergaol: 'markers/evergaol.webp',
  chest: 'markers/chest.webp', merchant: 'markers/merchant.webp', caravan: 'markers/caravan.webp',
  'rot-blessing': 'elements/rot.webp', // the layer chip's own icon (ResultOverlay), already precached
}

/** A marker's game icon, sized with the map; a plain name (the castle's guard) has none. */
export function MarkerIcon({ marker, scale }: { marker: MapMarker; scale: MotionValue<number> }) {
  const src = marker.great ? 'markers/great-boss.webp' : MARKER_ART[marker.layer]
  if (marker.plain || !src) return null
  return (
    <motion.span className="mark" style={{ scale }}>
      {/* A chest has no visible name: the icon carries it. */}
      <img className="marker-icon" src={src} width={ICON_SIZE} height={ICON_SIZE} alt={marker.layer === 'chest' ? marker.label : ''} draggable={false} />
    </motion.span>
  )
}

/** "1 · Tree Sentinel": the night in its ring's colour, then its boss as the game's map writes it. */
export function RingName({ marker }: { marker: MapMarker }) {
  const boss = marker.label.replace(/^Night \d: /, '')
  return (
    <>
      {/* Each word kept whole: a caption wraps only between words, never after a hyphen ("Demi-Human"). The rest
          after the number hides when only the number fits inside the ring. */}
      <span aria-hidden>
        <span className={`night-${marker.night}`}>{marker.night}</span>
        <span className="ring-rest"> · {shortBossName(boss).split(' ').map((word, i) => <span key={i}>{i > 0 && ' '}<span className="ring-word">{word}</span></span>)}</span>
      </span>
      <span className="sr-only">{marker.label}</span>
    </>
  )
}

/**
 * A night's closing ring: a soft glow either side of a bright rim, in the night's colour (map.css). Gradients,
 * not a blur filter, so a ring costs nothing extra to repaint as the map zooms.
 */
export function Ring({ night }: { night: 1 | 2 }) {
  const glow = `ring-glow-${night}`
  const c = RING_SIZE / 2
  return (
    <svg className={`night-ring night-${night}`} width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden>
      <defs>
        <radialGradient id={glow}>
          <stop offset="0.45" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.62" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="0.76" stopColor="currentColor" stopOpacity="1" />
          <stop offset="0.9" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={c} fill={`url(#${glow})`} />
      <circle cx={c} cy={c} r={c * 0.76} fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="16" />
      <circle cx={c} cy={c} r={c * 0.76} fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="6" />
      <circle cx={c} cy={c} r={c * 0.76} fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" />
    </svg>
  )
}

/**
 * Where an event stands, as the game's map marks it: a soft, translucent red disc with no rim, darkest at its heart
 * (map.css), the size of a night's ring so their names are placed alike.
 */
export function EventGlow() {
  const c = RING_SIZE / 2
  return (
    <svg className="event-glow" width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden>
      <defs>
        <radialGradient id="event-glow">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="0.8" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={c} fill="url(#event-glow)" />
    </svg>
  )
}

/** A mark on the exact point, with its name beside it (or across it) where MapView's placement pass put it. */
export function Tag({ index, at, className, labels, onMeasure, pinScale, text, textKey, hidden, children }: {
  index: number
  at: { x: number; y: number }
  className: string
  labels: MotionValue<{ x: number; y: number; shown: boolean; wrapped?: boolean; scale?: number; numberOnly?: boolean }[]>
  onMeasure: (index: number, box: NameBox) => void
  pinScale: MotionValue<number>
  text: ReactNode
  textKey: string
  /** The name is already spoken by something else (a site's pin). */
  hidden?: boolean
  children?: ReactNode
}) {
  const label = useRef<HTMLSpanElement>(null)
  const spot = useTransform(labels, (all) => all[index] ?? { x: 0, y: 0, shown: false })
  const labelX = useTransform(spot, (o) => o.x)
  const labelY = useTransform(spot, (o) => o.y)
  // A name with no free spot steps aside, leaving its mark; it comes back as zooming in makes room.
  // A night's name always shows while its ring is in sight (placeLabels).
  const labelOpacity = useTransform(spot, (o) => (o.shown ? 1 : 0))
  // A night's name shrunk to fit inside its ring, from its top-left corner, where placement puts it.
  const labelScale = useTransform(spot, (o) => o.scale ?? 1)
  // A name placed on its two-line wrap takes that narrower width and may break, a night's name included (measureName
  // keeps both widths).
  useEffect(() => spot.on('change', (o) => {
    const el = label.current
    if (!el) return
    // Only its number: the rest hides and the box is the number's own.
    if (o.numberOnly) el.dataset.numberOnly = ''
    else delete el.dataset.numberOnly
    const width = o.numberOnly ? '' : o.wrapped ? el.dataset.wrap : el.dataset.w
    if (width !== undefined && el.style.width !== width) el.style.width = width
    el.style.whiteSpace = o.wrapped ? 'normal' : ''
  }), [spot])
  // Reported to MapView, which publishes every size at once after its placement pass has subscribed.
  useLayoutEffect(() => {
    const el = label.current
    onMeasure(index, el ? measureName(el) : { w: 0, h: 0 })
  }, [textKey, index])
  return (
    <motion.span className={`marker ${className}`} style={{ left: `${at.x / 10}%`, top: `${at.y / 10}%`, scale: pinScale }}>
      {children}
      {text !== null && (
        <motion.span ref={label} className="map-name" data-tag={index} aria-hidden={hidden || undefined} style={{ x: labelX, y: labelY, opacity: labelOpacity, scale: labelScale, originX: 0, originY: 0 }}>{text}</motion.span>
      )}
    </motion.span>
  )
}

