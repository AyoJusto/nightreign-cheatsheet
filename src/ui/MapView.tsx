import { useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, type MotionValue } from 'motion/react'
import { useGesture } from '@use-gesture/react'
import type { EarthId, SlotId, StructureKey } from '../domain/names'
import type { Marker } from '../domain/seed'
import { StructureIcon } from './StructureIcon'

export type PinState = 'open' | 'sighted' | 'certain' | 'candidate' | 'dimmed' | 'spawn-option' | 'spawn'
export interface Pin { slot: SlotId; x: number; y: number; state: PinState; structure: StructureKey | null; label: string }

const MAX_ZOOM = 4
const snap = { type: 'spring', visualDuration: 0.4, bounce: 0 } as const
const boundScale = (s: number) => Math.min(MAX_ZOOM, Math.max(1, s))

export function MapView(props: {
  earth: EarthId
  pins: Pin[]
  markers?: Marker[]
  dim?: boolean
  bottomInset: MotionValue<number>
  selected?: SlotId | null
  onPin: (slot: SlotId, state: PinState) => void
  onBackground?: () => void
}) {
  const frame = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const pinScale = useTransform(scale, (s) => 1 / s)

  // `s` is passed in because settle clamps against the scale it is springing to, not the rubber-banded one.
  const clamp = (v: number, axis: 'x' | 'y', s = scale.get()) => {
    if (!frame.current || !layer.current) return v
    const r = frame.current.getBoundingClientRect()
    const size = layer.current.offsetWidth * s
    const view = axis === 'x' ? r.width : r.height - props.bottomInset.get()
    const slack = Math.max(0, (size - view) / 2) + 24
    return Math.min(slack, Math.max(-slack, v))
  }
  // If the selected pin would sit under the sheet, pan it up into the visible area.
  const reveal = (s = scale.get()): number | undefined => {
    const pin = props.pins.find((p) => p.slot === props.selected)
    if (!pin || !frame.current || !layer.current) return undefined
    const r = frame.current.getBoundingClientRect()
    const size = layer.current.offsetWidth * s
    const pinY = r.height / 2 + y.get() + (pin.y / 1000 - 0.5) * size
    const visibleBottom = r.height - props.bottomInset.get() - 56
    return pinY > visibleBottom ? y.get() - (pinY - visibleBottom) : undefined
  }
  // Which gestures own the motion values right now; the sheet-driven settle must not fight them.
  const active = useRef({ drag: false, pinch: false })
  // MotionValue.set does not stop a running animation, so a new gesture must stop the glide or
  // settle spring itself. use-gesture calls `from` at pointer-down, before any handler runs,
  // so stopping here freezes the map exactly where the finger landed.
  const grab = (gesture: 'drag' | 'pinch') => {
    active.current[gesture] = true
    x.stop()
    y.stop()
    scale.stop()
  }
  const settle = () => {
    const s = boundScale(scale.get())
    if (s !== scale.get()) animate(scale, s, snap)
    animate(x, clamp(x.get(), 'x', s), snap)
    animate(y, reveal(s) ?? clamp(y.get(), 'y', s), snap)
  }

  useGesture(
    {
      onDrag: ({ offset: [ox, oy], pinching, cancel, tap }) => {
        if (pinching) return cancel()
        if (tap) return
        x.set(ox)
        y.set(oy)
      },
      onDragEnd: ({ velocity: [vx, vy], direction: [dx, dy], tap, canceled }) => {
        active.current.drag = false
        if (canceled) return
        // A tap can stop a glide mid-bounce, out of bounds; settle puts it back.
        if (tap) return settle()
        // use-gesture reports speed in px/ms with a separate sign; Motion wants signed px/s.
        const velocityX = vx * dx * 1000
        const velocityY = vy * dy * 1000
        const inertia = { type: 'inertia', power: 0.3, bounceStiffness: 300, bounceDamping: 30 } as const
        // Inertia computes its own end point, but Motion skips any 'inertia' animation whose target
        // equals the current value, so pass the same projected, clamped end point as the target.
        const glideX = clamp(x.get() + velocityX * inertia.power, 'x')
        const glideY = clamp(y.get() + velocityY * inertia.power, 'y')
        animate(x, glideX, { ...inertia, velocity: velocityX, modifyTarget: (t: number) => clamp(t, 'x') })
        animate(y, glideY, { ...inertia, velocity: velocityY, modifyTarget: (t: number) => clamp(t, 'y') })
      },
      onPinch: ({ origin: [ox, oy], first, offset: [s], memo }) => {
        if (first) {
          const r = frame.current!.getBoundingClientRect()
          // Start position, start scale, and the pinch origin relative to the layer's centre.
          memo = [x.get(), y.get(), scale.get(), ox - (r.left + r.width / 2) - x.get(), oy - (r.top + r.height / 2) - y.get()]
        }
        const [x0, y0, s0, dx, dy] = memo as number[]
        // Zoom about the pinch origin: the layer point under the fingers stays put.
        const ratio = s / s0
        x.set(x0 - (ratio - 1) * dx)
        y.set(y0 - (ratio - 1) * dy)
        scale.set(s)
        return memo
      },
      onPinchEnd: () => {
        active.current.pinch = false
        settle()
      },
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault()
        // Trackpad pinch arrives as ctrl+wheel and is already handled by onPinch.
        if (event.ctrlKey) return
        scale.set(boundScale(scale.get() * (1 - dy / 500)))
        settle()
      },
    },
    {
      target: frame,
      eventOptions: { passive: false },
      drag: {
        filterTaps: true,
        from: (): [number, number] => {
          grab('drag')
          return [x.get(), y.get()]
        },
      },
      pinch: {
        scaleBounds: { min: 1, max: MAX_ZOOM },
        rubberband: true,
        from: (): [number, number] => {
          grab('pinch')
          return [scale.get(), 0]
        },
      },
    },
  )

  // Keep the selected pin above the sheet as it rises, and reveal a newly selected pin.
  // Re-subscribing on selected/pins changes means the listener never reads stale props.
  useEffect(() => {
    const target = reveal()
    if (target !== undefined) animate(y, target, snap)
    return props.bottomInset.on('change', () => {
      if (!active.current.drag && !active.current.pinch) settle()
    })
  }, [props.bottomInset, props.selected, props.pins])

  // use-gesture swallows the click that ends a pan, so any click reaching the frame is a real tap.
  // Pin clicks stop propagation, so this only sees taps on the map itself.
  return (
    <div ref={frame} className="map-frame" onClick={() => props.onBackground?.()}>
      <motion.div ref={layer} className="map-layer" style={{ x, y, scale, width: 'min(100vw, 100dvh)', height: 'min(100vw, 100dvh)' }}>
        <img className="map-image" src={`/maps/${props.earth}.webp`} alt="" draggable={false} />
        <motion.div className="map-scrim" animate={{ opacity: props.dim ? 0.55 : 0 }} transition={snap} aria-hidden />
        {props.markers?.map((m, i) => (
          <motion.span
            key={i}
            className={`marker marker-${m.layer}`}
            style={{ left: `${m.x / 10}%`, top: `${m.y / 10}%`, x: '-50%', y: '-50%', scale: pinScale }}
          >
            <span className="marker-label">{m.label}</span>
          </motion.span>
        ))}
        {props.pins.map((p) => (
          <motion.button
            key={p.slot + p.state}
            className={`pin pin-${p.state}`}
            aria-label={p.label}
            style={{ left: `${p.x / 10}%`, top: `${p.y / 10}%`, scale: pinScale }}
            initial={{ opacity: 0 }}
            animate={{ opacity: p.state === 'dimmed' ? 0.4 : p.state === 'certain' ? 0.7 : 1 }}
            transition={{ type: 'spring', visualDuration: 0.35, bounce: 0.2 }}
            onClick={(e) => { e.stopPropagation(); props.onPin(p.slot, p.state) }}
          >
            <motion.span animate={{ scale: props.selected === p.slot ? 1.3 : 1 }} transition={{ type: 'spring', visualDuration: 0.3, bounce: 0.25 }}>
              {p.state === 'spawn-option' || p.state === 'spawn' ? <span className="spawn-dot" /> : p.structure ? <StructureIcon structure={p.structure} /> : <span className="open-dot" />}
            </motion.span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
