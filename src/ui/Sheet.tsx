import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, animate, useDragControls, type MotionValue, type PanInfo } from 'motion/react'

export type Detent = 'peek' | 'half' | 'full'
const PEEK = 96
const heights = (vh: number): Record<Detent, number> => ({ peek: PEEK, half: Math.round(vh * 0.5), full: Math.round(vh * 0.92) })
const sheetSpring = { type: 'spring', visualDuration: 0.5, bounce: 0 } as const

export function Sheet(props: {
  detent: Detent
  onDetent: (d: Detent) => void
  height: MotionValue<number>
  header: ReactNode
  children: ReactNode
  label: string
}) {
  const [vh, setVh] = useState(() => innerHeight)
  useLayoutEffect(() => {
    const onResize = () => setVh(innerHeight)
    addEventListener('resize', onResize)
    return () => removeEventListener('resize', onResize)
  }, [])
  const h = heights(vh)
  const y = useMotionValue(h.full - h[props.detent])
  const controls = useDragControls()

  useEffect(() => {
    animate(y, h.full - h[props.detent], sheetSpring)
  }, [props.detent, vh])
  // Publish the visible height, including the starting value, so the map can inset itself.
  useEffect(() => {
    const publish = (v: number) => props.height.set(h.full - v)
    publish(y.get())
    return y.on('change', publish)
  }, [y, h.full, props.height])

  // Floating capsule at peek, flush when open, like Maps on iOS 26.
  const inset = useTransform(y, [h.full - h.half, h.full - h.peek], [0, 8])
  const radius = useTransform(y, [0, h.full - h.half], [12, 28])

  const release = (_: unknown, info: PanInfo) => {
    const projected = y.get() + info.velocity.y * 0.2
    const visible = h.full - projected
    const nearest = (Object.keys(h) as Detent[]).reduce((a, b) => (Math.abs(h[a] - visible) < Math.abs(h[b] - visible) ? a : b))
    if (nearest === props.detent) animate(y, h.full - h[nearest], sheetSpring)
    else props.onDetent(nearest)
  }

  return (
    <motion.section
      className="sheet"
      role="dialog"
      aria-label={props.label}
      style={{ y, left: inset, right: inset, bottom: inset, height: h.full, borderRadius: radius }}
      drag="y"
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: 0, bottom: h.full - h.peek }}
      dragElastic={0.08}
      // Detent snapping replaces Motion's own momentum, which would otherwise fight the snap spring.
      dragMomentum={false}
      onDragEnd={release}
    >
      <div className="sheet-grab" onPointerDown={(e) => controls.start(e)}>
        <span className="sheet-handle" aria-hidden />
        {props.header}
      </div>
      <div className="sheet-body" style={{ overflowY: props.detent === 'full' ? 'auto' : 'hidden' }}>
        {props.children}
      </div>
    </motion.section>
  )
}
