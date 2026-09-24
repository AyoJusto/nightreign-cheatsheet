import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, useReducedMotion, animate, useDragControls, usePresence, type MotionValue, type PanInfo } from 'motion/react'
import { crossfade } from './crossfade'
import { detentHeights, type Detent, type SheetMeasure } from './sheetDetents'

export type { Detent }
const sheetSpring = { type: 'spring', visualDuration: 0.5, bounce: 0 } as const
const FLOAT = 8 // the collapsed capsule's gap to the screen edges
const RADIUS_FULL = 12 // docked below the pill
const RADIUS_HALF = 28 // docked at the bottom edge
const ORDER: Detent[] = ['peek', 'half', 'full']
const DETENT_NAMES: Record<Detent, string> = { peek: 'collapsed', half: 'half open', full: 'fully open' }

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const sameMeasure = (a: SheetMeasure, b: SheetMeasure) =>
  (Object.keys(a) as (keyof SheetMeasure)[]).every((k) => a[k] === b[k])

export function Sheet(props: {
  detent: Detent
  onDetent: (d: Detent) => void
  /** Receives the height the sheet covers at the bottom of the screen, live. */
  height: MotionValue<number>
  /** Receives what the sheet covers at peek, for framing the map. */
  rest?: MotionValue<number>
  /** Bottom edge of the top pill; 0 when there is none. Full stops below it. */
  top: MotionValue<number>
  header: ReactNode
  /** What half shows; half grows to fit it, up to about half the screen. */
  children: ReactNode
  /** Further content, reached at full or by scrolling. */
  more?: ReactNode
  label: string
}) {
  const section = useRef<HTMLElement>(null)
  const grab = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [m, setM] = useState<SheetMeasure>(() => ({ frame: innerHeight, grab: 0, content: 0, safeTop: 0, safeBottom: 0, safeLeft: 0, safeRight: 0, pillBottom: 0 }))
  const h = detentHeights(m)
  const measured = m.grab > 0

  // Measure, don't guess: detents follow the real header, content, pill, safe areas and viewport.
  useLayoutEffect(() => {
    const update = () => {
      const css = getComputedStyle(section.current!)
      const next: SheetMeasure = {
        frame: visualViewport?.height ?? innerHeight,
        grab: grab.current!.offsetHeight,
        content: content.current!.offsetHeight,
        safeTop: parseFloat(css.scrollMarginTop) || 0,
        safeBottom: parseFloat(css.paddingBottom) || 0,
        safeLeft: parseFloat(css.scrollMarginLeft) || 0,
        safeRight: parseFloat(css.scrollMarginRight) || 0,
        pillBottom: props.top.get(),
      }
      setM((prev) => (sameMeasure(prev, next) ? prev : next))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(grab.current!)
    observer.observe(content.current!)
    const viewport = visualViewport ?? window
    viewport.addEventListener('resize', update)
    const off = props.top.on('change', update)
    return () => {
      observer.disconnect()
      viewport.removeEventListener('resize', update)
      off()
    }
  }, [props.top])

  // Starts below the screen, so the first animation is the sheet rising into place.
  const y = useMotionValue(m.frame)
  const controls = useDragControls()
  // With reduced motion the sheet crossfades into place (rising, and between detents) instead of sliding.
  const reduce = useReducedMotion()
  // Reduced motion starts it unseen, so it does not show where it starts (below or at peek) before fading in.
  const fade = useMotionValue(reduce ? 0 : 1)
  const moveTo = (target: number) => (reduce ? crossfade(fade, () => y.jump(target)) : animate(y, target, sheetSpring))

  // Inside AnimatePresence, closing keeps the sheet mounted until it has left: it slides off the bottom on the
  // same spring it rose on (from wherever it is, so a drag-down close carries on from the finger), or under
  // reduced motion fades out. Re-opened before it has gone, it turns around from where it is.
  const [present, safeToRemove] = usePresence()
  // While leaving, the capsule/solid morph holds its exit-start value, so the sheet slides down whole, like an
  // Apple sheet, instead of dissolving into an empty glass capsule. Re-opened mid-exit, it holds until it is back
  // at its detent, so it does not pop to a capsule where it is; a grab hands the morph back to the finger.
  const frozenPeek = useRef<number | null>(null)
  useEffect(() => {
    if (present) {
      if (!measured) return
      const move = moveTo(h.full - h[props.detent])
      if (frozenPeek.current !== null) move?.then(() => { frozenPeek.current = null })
      return
    }
    // Under reduced motion it fades where it is; there is no slide to hold the look for.
    if (!reduce) frozenPeek.current = towardPeek(y.get())
    let cancelled = false
    const gone = () => {
      if (cancelled) return
      // Below the screen, so the map's inset follows it down (under reduced motion, in one step once faded).
      y.jump(m.frame)
      safeToRemove?.()
    }
    if (reduce) animate(fade, 0, { duration: 0.2, ease: 'easeOut' }).then(gone)
    else animate(y, m.frame, sheetSpring).then(gone)
    return () => { cancelled = true }
  }, [present, props.detent, h.peek, h.half, h.full, measured])

  // 0 at half and above, 1 at peek: drives the float inset, the radius, the glass crossfade and the body fade.
  const towardPeek = (v: number) => frozenPeek.current ?? clamp01((v - (h.full - h.half)) / Math.max(1, h.half - h.peek))
  const inset = useTransform(y, (v) => FLOAT * towardPeek(v))
  // Left and right add the notch's own inset on top of the float, so a landscape sheet never floats under it.
  const insetLeft = useTransform(y, (v) => FLOAT * towardPeek(v) + m.safeLeft)
  const insetRight = useTransform(y, (v) => FLOAT * towardPeek(v) + m.safeRight)
  // Full to half rounds the top corners; half to peek grows them into a capsule (half the peek's height),
  // the same shape as the pill above it.
  const radius = useTransform(y, (v) =>
    RADIUS_FULL + (RADIUS_HALF - RADIUS_FULL) * clamp01(v / Math.max(1, h.full - h.half)) + (h.peek / 2 - RADIUS_HALF) * towardPeek(v))
  const solid = useTransform(y, (v) => 1 - towardPeek(v))
  // The reduced-motion fade goes on each layer, never the section: opacity on an ancestor of the glass would
  // cut its blur off from the map behind for the length of the fade.
  const solidShown = useTransform(() => solid.get() * fade.get())
  // At half and full the solid layer covers the glass completely, so the glass is hidden there: its blur costs GPU
  // and counts toward the three blurred surfaces while nobody sees it. It toggles only while fully covered, so the
  // switch never shows and the blur radius itself never animates.
  const glassVisibility = useTransform(solid, (s) => (s >= 1 ? 'hidden' : 'visible'))

  // Publish what the sheet covers, including the starting value, so the map can inset itself.
  useEffect(() => {
    const publish = (v: number) => props.height.set(Math.max(0, h.full - v + FLOAT * towardPeek(v)))
    publish(y.get())
    return y.on('change', publish)
  }, [y, h.full, h.half, h.peek, props.height])
  useLayoutEffect(() => {
    if (measured) props.rest?.set(h.peek + FLOAT)
  }, [h.peek, measured, props.rest])

  const release = (_: unknown, info: PanInfo) => {
    const projected = y.get() + info.velocity.y * 0.2
    const visible = h.full - projected
    const nearest = ORDER.reduce((a, b) => (Math.abs(h[a] - visible) < Math.abs(h[b] - visible) ? a : b))
    if (nearest === props.detent) moveTo(h.full - h[nearest])
    else props.onDetent(nearest)
  }
  const step = (by: 1 | -1) => {
    const next = ORDER[Math.min(ORDER.length - 1, Math.max(0, ORDER.indexOf(props.detent) + by))]
    if (next !== props.detent) props.onDetent(next)
  }

  return (
    <motion.section
      ref={section}
      className="sheet"
      role="dialog"
      aria-label={props.label}
      // A leaving sheet shows options for a site that is no longer selected; a tap on one would record a stale sighting.
      // Taps pass through it to the map, so the next site can be picked while it slides away.
      inert={!present}
      style={{ y, left: insetLeft, right: insetRight, bottom: inset, height: h.full, borderRadius: radius, pointerEvents: present ? undefined : 'none' }}
      drag="y"
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: 0, bottom: h.full - h.peek }}
      dragElastic={0.08}
      // Detent snapping replaces Motion's own momentum, which would otherwise fight the snap spring.
      dragMomentum={false}
      onDragEnd={release}
    >
      {/* Glass when collapsed, solid when open: the solid layer fades over the glass, so the blur radius never animates.
          The box itself runs past the bottom of the screen, so the glass is only as tall as the peek: collapsed,
          it is a capsule floating FLOAT off every edge. No clip-path: it would cut the glass off from the map behind. */}
      <motion.div className="sheet-layer glass" style={{ bottom: 'auto', height: h.peek, opacity: fade, visibility: glassVisibility }} aria-hidden />
      <motion.div className="sheet-layer sheet-solid" style={{ opacity: solidShown }} aria-hidden />
      <motion.div className="sheet-grab" ref={grab} style={{ opacity: fade }} onPointerDown={(e) => { frozenPeek.current = null; controls.start(e) }}>
        <button
          className="sheet-handle"
          aria-label={`Resize ${props.label}, ${DETENT_NAMES[props.detent]}`}
          // Keyboard and assistive tech only: a pointer on the handle drags, and a drag must not also step.
          onClick={(e) => { if (e.detail === 0) props.onDetent(props.detent === 'full' ? 'peek' : ORDER[ORDER.indexOf(props.detent) + 1]) }}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
            e.preventDefault()
            step(e.key === 'ArrowUp' ? 1 : -1)
          }}
        >
          <span aria-hidden />
        </button>
        {props.header}
      </motion.div>
      {/* Scrolls at half too; the bottom padding lets the end of the content rise above the screen edge. */}
      <motion.div className="sheet-body" style={{ opacity: solidShown, overflowY: props.detent === 'peek' ? 'hidden' : 'auto', paddingBottom: h.full - h[props.detent] }}>
        <div className="sheet-half" ref={content}>{props.children}</div>
        {props.more && <div className="sheet-more">{props.more}</div>}
      </motion.div>
    </motion.section>
  )
}
