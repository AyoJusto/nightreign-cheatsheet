import { useRef, useEffect, useLayoutEffect, type ReactNode } from 'react'
import { motion, useTransform, type MotionValue } from 'motion/react'
import type { MapMarker } from './mapTypes'
import { shortBossName, type TagSpec } from './mapGeometry'
import { shrinkToLongestLineAndMeasure, type NameBox } from './mapNames'

export const ICON_SIZE = 36
export const RING_SIZE = 110

export function tagOf(m: MapMarker): TagSpec {
  const at = { x: m.x, y: m.y }
  if (m.layer === 'circle' || m.layer === 'event') return { ...at, kind: 'night', mark: 'ring' }
  const mark = m.nameWithoutIcon || !MARKER_ART[m.layer] ? 'none' : 'icon'
  if (m.layer === 'castle') return { ...at, kind: 'castle', mark }
  if (m.layer === 'boss' || m.layer === 'evergaol') return { ...at, kind: m.layer, mark }
  if (m.layer === 'chest') return { ...at, kind: 'chest', mark, silent: true }
  return { ...at, kind: 'other', mark }
}
const MARKER_ART: Partial<Record<MapMarker['layer'], string>> = {
  boss: 'markers/field-boss.webp', castle: 'markers/field-boss.webp', evergaol: 'markers/evergaol.webp',
  chest: 'markers/chest.webp', merchant: 'markers/merchant.webp', caravan: 'markers/caravan.webp',
  'rot-blessing': 'elements/rot.webp',
}

export function MarkerIcon({ marker, scale }: { marker: MapMarker; scale: MotionValue<number> }) {
  const src = marker.great ? 'markers/great-boss.webp' : MARKER_ART[marker.layer]
  if (marker.nameWithoutIcon || !src) return null
  const chestHasNoVisibleName = marker.layer === 'chest'
  return (
    <motion.span className="mark" style={{ scale }}>
      <img className="marker-icon" src={src} width={ICON_SIZE} height={ICON_SIZE} alt={chestHasNoVisibleName ? marker.label : ''} draggable={false} />
    </motion.span>
  )
}

export function RingName({ marker }: { marker: MapMarker }) {
  const boss = marker.label.replace(/^Night \d: /, '')
  const words = shortBossName(boss).split(' ')
  return (
    <>
      <span aria-hidden>
        <span className={`night-${marker.night}`}>{marker.night}</span>
        <span className="ring-rest"> · {words.map((word, i) => <span key={i}>{i > 0 && ' '}<span className="ring-word">{word}</span></span>)}</span>
      </span>
      <span className="sr-only">{marker.label}</span>
    </>
  )
}

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

export function Tag({ index, at, className, labels, onMeasure, pinScale, text, textKey, hidden, children }: {
  index: number
  at: { x: number; y: number }
  className: string
  labels: MotionValue<{ x: number; y: number; shown: boolean; wrapped?: boolean; scale?: number; numberOnly?: boolean }[]>
  onMeasure: (index: number, box: NameBox) => void
  pinScale: MotionValue<number>
  text: ReactNode
  textKey: string
  hidden?: boolean
  children?: ReactNode
}) {
  const label = useRef<HTMLSpanElement>(null)
  const spot = useTransform(labels, (all) => all[index] ?? { x: 0, y: 0, shown: false })
  const labelX = useTransform(spot, (o) => o.x)
  const labelY = useTransform(spot, (o) => o.y)
  const labelOpacity = useTransform(spot, (o) => (o.shown ? 1 : 0))
  const labelScale = useTransform(spot, (o) => o.scale ?? 1)
  useEffect(() => spot.on('change', (o) => {
    const el = label.current
    if (!el) return
    if (o.numberOnly) el.dataset.numberOnly = ''
    else delete el.dataset.numberOnly
    const width = o.numberOnly ? '' : o.wrapped ? el.dataset.wrap : el.dataset.w
    if (width !== undefined && el.style.width !== width) el.style.width = width
    el.style.whiteSpace = o.wrapped ? 'normal' : ''
  }), [spot])
  useLayoutEffect(() => {
    const el = label.current
    onMeasure(index, el ? shrinkToLongestLineAndMeasure(el) : { w: 0, h: 0 })
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

