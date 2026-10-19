import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, useReducedMotion, animate, useDragControls, usePresence, type MotionValue, type PanInfo } from 'motion/react'
import { crossfade } from './crossfade'
import { detentHeights, type Detent, type SheetMeasure } from './sheetDetents'

export type { Detent }
const sheetSpring = { type: 'spring', visualDuration: 0.5, bounce: 0 } as const
const FLOAT_GAP = 8
const ORDER: Detent[] = ['peek', 'half', 'full']
const DETENT_NAMES: Record<Detent, string> = { peek: 'collapsed', half: 'half open', full: 'fully open' }
const FLING_PROJECTION = 0.2

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const sameMeasure = (a: SheetMeasure, b: SheetMeasure) =>
  (Object.keys(a) as (keyof SheetMeasure)[]).every((k) => a[k] === b[k])

export function Sheet(props: {
  detent: Detent
  onDetent: (d: Detent) => void
  height: MotionValue<number>
  rest?: MotionValue<number>
  top: MotionValue<number>
  header: ReactNode
  children: ReactNode
  more?: ReactNode
  label: string
}) {
  const section = useRef<HTMLElement>(null)
  const grab = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [m, setM] = useState<SheetMeasure>(() => ({ frame: innerHeight, grab: 0, content: 0, safeTop: 0, safeBottom: 0, safeLeft: 0, safeRight: 0, pillBottom: 0 }))
  const h = detentHeights(m)
  const measured = m.grab > 0
  const [scrolled, setScrolled] = useState(false)

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

  const y = useMotionValue(m.frame)
  const controls = useDragControls()
  const reduce = useReducedMotion()
  const fade = useMotionValue(reduce ? 0 : 1)
  const moveTo = (target: number) => (reduce ? crossfade(fade, () => y.jump(target)) : animate(y, target, sheetSpring))

  const [present, safeToRemove] = usePresence()
  const frozenPeek = useRef<number | null>(null)
  useEffect(() => {
    if (present) {
      if (!measured) return
      const move = moveTo(h.full - h[props.detent])
      if (frozenPeek.current !== null) move?.then(() => { frozenPeek.current = null })
      return
    }
    if (!reduce) frozenPeek.current = towardPeek(y.get())
    let cancelled = false
    const gone = () => {
      if (cancelled) return
      y.jump(m.frame)
      safeToRemove?.()
    }
    if (reduce) animate(fade, 0, { duration: 0.2, ease: 'easeOut' }).then(gone)
    else animate(y, m.frame, sheetSpring).then(gone)
    return () => { cancelled = true }
  }, [present, props.detent, h.peek, h.half, h.full, measured])

  const towardPeek = (v: number) => frozenPeek.current ?? clamp01((v - (h.full - h.half)) / Math.max(1, h.half - h.peek))
  const inset = useTransform(y, (v) => FLOAT_GAP * towardPeek(v))
  const insetLeft = useTransform(y, (v) => FLOAT_GAP * towardPeek(v) + m.safeLeft)
  const insetRight = useTransform(y, (v) => FLOAT_GAP * towardPeek(v) + m.safeRight)
  const solid = useTransform(y, (v) => 1 - towardPeek(v))
  // Opacity on an ancestor would cut the glass's blur off from the map, so each layer fades on its own.
  const solidShown = useTransform(() => solid.get() * fade.get())
  const glassVisibility = useTransform(solid, (s) => (s >= 1 ? 'hidden' : 'visible'))

  useEffect(() => {
    const publish = (v: number) => props.height.set(Math.max(0, h.full - v + FLOAT_GAP * towardPeek(v)))
    publish(y.get())
    return y.on('change', publish)
  }, [y, h.full, h.half, h.peek, props.height])
  useLayoutEffect(() => {
    if (measured) props.rest?.set(h.peek + FLOAT_GAP)
  }, [h.peek, measured, props.rest])

  const release = (_: unknown, info: PanInfo) => {
    const projected = y.get() + info.velocity.y * FLING_PROJECTION
    const visible = h.full - projected
    const nearest = ORDER.reduce((a, b) => (Math.abs(h[a] - visible) < Math.abs(h[b] - visible) ? a : b))
    if (nearest === props.detent) moveTo(h.full - h[nearest])
    else props.onDetent(nearest)
  }
  const step = (by: 1 | -1) => {
    const next = ORDER[Math.min(ORDER.length - 1, Math.max(0, ORDER.indexOf(props.detent) + by))]
    if (next !== props.detent) props.onDetent(next)
  }
  const isKeyboardClick = (detail: number) => detail === 0

  return (
    <motion.section
      ref={section}
      className="sheet"
      role="dialog"
      aria-label={props.label}
      inert={!present}
      style={{ y, left: insetLeft, right: insetRight, bottom: inset, height: h.full, pointerEvents: present ? undefined : 'none' }}
      drag="y"
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: 0, bottom: h.full - h.peek }}
      dragElastic={0.08}
      dragMomentum={false}
      onDragEnd={release}
    >
      <motion.div className="sheet-layer plate" style={{ bottom: 'auto', height: h.peek, opacity: fade, visibility: glassVisibility }} aria-hidden />
      <motion.div className="sheet-layer sheet-solid" style={{ opacity: solidShown }} aria-hidden />
      <motion.div className="sheet-grab" ref={grab} data-scrolled={scrolled && props.detent !== 'peek' ? '' : undefined} style={{ opacity: fade }} onPointerDown={(e) => { frozenPeek.current = null; controls.start(e) }}>
        <button
          className="sheet-handle"
          aria-label={`Resize ${props.label}, ${DETENT_NAMES[props.detent]}`}
          onClick={(e) => { if (isKeyboardClick(e.detail)) props.onDetent(props.detent === 'full' ? 'peek' : ORDER[ORDER.indexOf(props.detent) + 1]) }}
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
      <motion.div className="sheet-body" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)} style={{ opacity: solidShown, overflowY: props.detent === 'peek' ? 'hidden' : 'auto', paddingBottom: h.full - h[props.detent] }}>
        <div className="sheet-half" ref={content}>{props.children}</div>
        {props.more && <div className="sheet-more">{props.more}</div>}
      </motion.div>
    </motion.section>
  )
}
