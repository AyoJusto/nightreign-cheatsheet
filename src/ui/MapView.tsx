import { useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { motion, useMotionValue, useTransform, useReducedMotion, animate, type MotionStyle, type MotionValue } from 'motion/react'
import { useGesture } from '@use-gesture/react'
import type { EarthId, SlotId, StructureKey } from '../domain/names'
import type { Marker } from '../domain/seed'
import { StructureIcon } from './StructureIcon'
import { catalog } from '../data/catalog'
import { nearestPin, playableBox, rubberband } from './mapGeometry'

export type PinState = 'open' | 'sighted' | 'certain' | 'candidate' | 'dimmed' | 'spawn-option' | 'spawn'
export interface Pin { slot: SlotId; x: number; y: number; state: PinState; structure: StructureKey | null; label: string }

const MAX_ZOOM = 4
// Pins follow the map's on-screen width a little: structure art is full size when the map is ART_FULL_SIDE px
// wide, shrinks below that (down to ART_MIN, so close neighbours on a phone's zoomed-out map stop covering
// each other) and grows modestly above it (up to ART_MAX, so a large desktop map is not dotted with specks).
// Dots only grow, from DOT_FULL_SIDE up to DOT_MAX.
const ART_FULL_SIDE = 800
const ART_MIN = 0.7
const ART_MAX = 1.3
const ART_SIZE = 32
const DOT_FULL_SIDE = 900
const DOT_MAX = 1.35
const clampTo = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
// How far (CSS px on screen) a tap may land from a slot and still count as that slot.
const TAP_REACH = 32
const snap = { type: 'spring', visualDuration: 0.4, bounce: 0 } as const

/** What the active mode (finder or result) shows on the map. */
export interface MapContent {
  pins: Pin[]
  markers?: Marker[]
  dim?: boolean
  selected?: SlotId | null
  onPin: (slot: SlotId, state: PinState) => void
  onBackground?: () => void
  /** The pins the current step asks for: a tap in reach of one goes to it, even if another pin is nearer. */
  preferred?: (pin: Pin) => boolean
  /** A mouse pointer entered a pin (or left it, with null). Touch never hovers, so it never fires there. */
  onHover?: (pin: Pin | null) => void
}

export function MapView(props: MapContent & {
  earth: EarthId
  /** Screen y of the top overlay's bottom edge. */
  topInset: MotionValue<number>
  /** Height covered at the bottom by the overlay at rest (strip, or sheet at peek): the map frames itself above it. */
  restInset: MotionValue<number>
  /** Height covered at the bottom right now, including an open sheet: pins are kept above it. */
  bottomInset: MotionValue<number>
}) {
  const frame = useRef<HTMLDivElement>(null)
  // Measured by a ResizeObserver; at scale 1 the square image is max(w, h) wide, so it covers the frame.
  const size = useMotionValue({ w: 0, h: 0 })
  const box = useMemo(() => playableBox(Object.values(catalog.slotsOf(props.earth))), [props.earth])
  // Until the user moves the map, it keeps itself framed on the playable area as insets settle.
  const touched = useRef(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const pinScale = useTransform(scale, (s) => 1 / s)
  const mapWidth = useTransform(() => Math.max(size.get().w, size.get().h) * scale.get())
  const artScale = useTransform(mapWidth, (m) => clampTo(m / ART_FULL_SIDE, ART_MIN, ART_MAX))
  const dotScale = useTransform(mapWidth, (m) => clampTo(m / DOT_FULL_SIDE, 1, DOT_MAX))
  // Element badges keep one legible size: they undo the art's scale (a CSS transform, see .pin .element-badge).
  const badgeUp = useTransform(artScale, (f) => 1 / f)
  // MotionConfig only reaches declarative animations; imperative ones jump when motion is reduced.
  const reduce = useReducedMotion()
  const move = reduce ? { duration: 0 } : snap

  const side = (s = scale.get()) => Math.max(size.get().w, size.get().h) * s
  // Per axis, an image larger than the frame keeps covering it and a smaller one (zoomed out to fit
  // the playable area) stays inside it, so the playable area is always reachable. The bottom edge may
  // also rise to whatever covers the bottom of the screen.
  // `s` is passed in because settle clamps against the scale it is springing to, not the rubber-banded one.
  const bounds = (axis: 'x' | 'y', s = scale.get()) => {
    const slack = Math.abs(side(s) - (axis === 'x' ? size.get().w : size.get().h)) / 2
    return { min: axis === 'x' ? -slack : -slack - props.bottomInset.get(), max: slack }
  }
  const clamp = (v: number, axis: 'x' | 'y', s = scale.get()) => {
    const { min, max } = bounds(axis, s)
    return Math.min(max, Math.max(min, v))
  }
  // Under the finger the map may go past its bounds, with resistance; release springs it back.
  const band = (v: number, axis: 'x' | 'y') => {
    const { min, max } = bounds(axis)
    return rubberband(v, min, max, axis === 'x' ? size.get().w : size.get().h)
  }
  // If the selected pin would sit under the sheet, pan it up into the visible area.
  const reveal = (s = scale.get()): number | undefined => {
    const pin = props.pins.find((p) => p.slot === props.selected)
    if (!pin) return undefined
    const { h } = size.get()
    const pinY = h / 2 + y.get() + (pin.y / 1000 - 0.5) * side(s)
    const visibleBottom = h - props.bottomInset.get() - 56
    return pinY > visibleBottom ? y.get() - (pinY - visibleBottom) : undefined
  }
  // The scale that fits the playable area into the space between the top and resting bottom overlays.
  // Resting, so a rising sheet neither reframes the map nor changes how far it zooms out.
  const fitScale = () => {
    const { w, h } = size.get()
    if (!w || !h) return 1
    const free = h - props.topInset.get() - props.restInset.get()
    return Math.min(w / (((box.x1 - box.x0) / 1000) * side(1)), free / (((box.y1 - box.y0) / 1000) * side(1)))
  }
  // Zooming out stops at covering the frame, or further where needed to show the whole playable area.
  const minScale = () => Math.min(1, fitScale())
  const boundScale = (s: number) => Math.min(MAX_ZOOM, Math.max(minScale(), s))
  const fit = () => {
    const { w, h } = size.get()
    if (!w || !h) return
    const top = props.topInset.get()
    const bottom = h - props.restInset.get()
    const s = boundScale(fitScale())
    const centerX = ((box.x0 + box.x1) / 2000 - 0.5) * side(s)
    const centerY = ((box.y0 + box.y1) / 2000 - 0.5) * side(s)
    scale.jump(s)
    x.jump(clamp(-centerX, 'x', s))
    y.jump(clamp((top + bottom) / 2 - h / 2 - centerY, 'y', s))
  }
  // Which gestures own the motion values right now; the sheet-driven settle must not fight them.
  const active = useRef({ drag: false, pinch: false })
  // MotionValue.set does not stop a running animation, so a new gesture must stop the glide or
  // settle spring itself. use-gesture calls `from` at pointer-down, before any handler runs,
  // so stopping here freezes the map exactly where the finger landed.
  const grab = (gesture: 'drag' | 'pinch') => {
    active.current[gesture] = true
    touched.current = true
    x.stop()
    y.stop()
    scale.stop()
  }
  const settle = () => {
    const s = boundScale(scale.get())
    if (s !== scale.get()) animate(scale, s, move)
    animate(x, clamp(x.get(), 'x', s), move)
    animate(y, reveal(s) ?? clamp(y.get(), 'y', s), move)
  }

  useGesture(
    {
      onDrag: ({ offset: [ox, oy], pinching, cancel, tap }) => {
        if (pinching) return cancel()
        if (tap) return
        x.set(band(ox, 'x'))
        y.set(band(oy, 'y'))
      },
      onDragEnd: ({ velocity: [vx, vy], direction: [dx, dy], tap, canceled }) => {
        active.current.drag = false
        if (canceled) return
        // A tap can stop a glide mid-bounce, out of bounds; settle puts it back. Reduced motion skips the glide.
        if (tap || reduce) return settle()
        // use-gesture reports speed in px/ms with a separate sign; Motion wants signed px/s.
        const velocityX = vx * dx * 1000
        const velocityY = vy * dy * 1000
        const inertia = { type: 'inertia', power: 0.3, bounceStiffness: 300, bounceDamping: 30 } as const
        // Inertia computes its own end point, but Motion skips any 'inertia' animation whose target
        // equals the current value, so pass the same projected, clamped end point as the target.
        const glideX = clamp(x.get() + velocityX * inertia.power, 'x')
        const glideY = clamp(y.get() + velocityY * inertia.power, 'y')
        // min/max make a glide that starts past the edge, or reaches it, spring back to it.
        animate(x, glideX, { ...inertia, ...bounds('x'), velocity: velocityX, modifyTarget: (t: number) => clamp(t, 'x') })
        animate(y, glideY, { ...inertia, ...bounds('y'), velocity: velocityY, modifyTarget: (t: number) => clamp(t, 'y') })
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
        scale.set(s)
        x.set(band(x0 - (ratio - 1) * dx, 'x'))
        y.set(band(y0 - (ratio - 1) * dy, 'y'))
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
        touched.current = true
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
        scaleBounds: () => ({ min: minScale(), max: MAX_ZOOM }),
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
    if (props.selected) touched.current = true
    const target = reveal()
    if (target !== undefined) animate(y, target, move)
    const onInset = () => {
      if (!active.current.drag && !active.current.pinch) settle()
    }
    // The frame or the resting overlays changed size: reframe until the user has moved the map.
    const onFrame = () => (touched.current ? onInset() : fit())
    const offs = [
      ...[size, props.topInset, props.restInset].map((v) => v.on('change', onFrame)),
      props.bottomInset.on('change', onInset),
    ]
    return () => offs.forEach((off) => off())
  }, [props.topInset, props.restInset, props.bottomInset, props.selected, props.pins])

  // A tap goes to the nearest slot within reach, preferring the step's own pins, not to whichever hit area is on top.
  const tapAt = (clientX: number, clientY: number) => {
    const r = frame.current!.getBoundingClientRect()
    const s = side()
    const point = {
      x: ((clientX - r.left - r.width / 2 - x.get()) / s + 0.5) * 1000,
      y: ((clientY - r.top - r.height / 2 - y.get()) / s + 0.5) * 1000,
    }
    const pin = nearestPin(props.pins, point, (TAP_REACH / s) * 1000, props.preferred)
    if (pin) props.onPin(pin.slot, pin.state)
    else props.onBackground?.()
  }

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => size.set({ w: entry.contentRect.width, h: entry.contentRect.height }))
    observer.observe(frame.current!)
    return () => observer.disconnect()
  }, [])

  // use-gesture swallows the click that ends a pan, so any click reaching the frame is a real tap.
  return (
    <div ref={frame} className="map-frame" onClick={(e) => tapAt(e.clientX, e.clientY)}>
      <motion.div className="map-layer" style={{ x, y, scale, '--badge-up': badgeUp } as MotionStyle}>
        <img className="map-image" src={`/maps/${props.earth}.webp`} alt="" draggable={false} />
        <motion.div className="map-scrim" animate={{ opacity: props.dim ? 0.55 : 0 }} transition={snap} aria-hidden />
        {props.pins.map((p) => (
          <motion.button
            // Keyed by what the pin shows, so a structure already on the map stays put when the result takes over.
            key={`${p.slot}:${p.structure ?? p.state}`}
            className={`pin pin-${p.state}${props.selected === p.slot ? ' pin-selected' : ''}`}
            aria-label={p.label}
            data-slot={p.slot} // a stable handle for tests; labels speak player vocabulary, not slot numbers
            style={{ left: `${p.x / 10}%`, top: `${p.y / 10}%`, scale: pinScale }}
            initial={{ opacity: 0 }}
            animate={{ opacity: p.state === 'dimmed' ? 0.4 : p.state === 'certain' ? 0.7 : 1 }}
            transition={{ type: 'spring', visualDuration: 0.35, bounce: 0.2 }}
            // buttons === 0: a pan that sweeps across pins is not hovering them.
            onPointerEnter={(e) => { if (e.pointerType === 'mouse' && !e.buttons) props.onHover?.(p) }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') props.onHover?.(null) }}
            onClick={(e) => {
              // Pointer taps bubble to the frame, which snaps them; keyboard activation has no point to snap.
              if (e.detail) return
              e.stopPropagation()
              props.onPin(p.slot, p.state)
            }}
          >
            <motion.span className="pin-body" style={{ scale: p.structure ? artScale : dotScale }}>
              <motion.span animate={{ scale: props.selected === p.slot ? 1.3 : 1 }} transition={{ type: 'spring', visualDuration: 0.3, bounce: 0.25 }}>
                {p.state === 'spawn-option' ? <span className="spawn-option-dot" /> : p.state === 'spawn' ? <span className="spawn-dot" /> : p.structure ? <StructureIcon structure={p.structure} size={ART_SIZE} /> : <span className="open-dot" />}
              </motion.span>
            </motion.span>
          </motion.button>
        ))}
        {/* After the pins, so a circle or boss label is never hidden under a structure. */}
        {props.markers?.map((m, i) => <MapMarker key={i} marker={m} x={x} scale={scale} size={size} pinScale={pinScale} />)}
      </motion.div>
    </div>
  )
}

// Gap kept between a marker label and the frame's side edges.
const LABEL_EDGE = 8

/** A dot on the exact point, with its label below it, slid inward so it never runs off the side of the frame. */
function MapMarker({ marker, x, scale, size, pinScale }: {
  marker: Marker
  x: MotionValue<number>
  scale: MotionValue<number>
  size: MotionValue<{ w: number; h: number }>
  pinScale: MotionValue<number>
}) {
  const label = useRef<HTMLSpanElement>(null)
  const width = useMotionValue(0)
  useLayoutEffect(() => width.set(label.current!.offsetWidth), [marker.label, width])
  // Screen px equal the label's own px here: the marker counter-scales the map's zoom.
  const shift = useTransform(() => {
    const { w, h } = size.get()
    const point = w / 2 + x.get() + (marker.x / 1000 - 0.5) * Math.max(w, h) * scale.get()
    const left = Math.max(LABEL_EDGE, Math.min(w - LABEL_EDGE - width.get(), point - width.get() / 2))
    return left - point
  })
  return (
    <motion.span className={`marker marker-${marker.layer}`} style={{ left: `${marker.x / 10}%`, top: `${marker.y / 10}%`, scale: pinScale }}>
      <span className="marker-dot" />
      <motion.span ref={label} className="marker-label" style={{ x: shift }}>{marker.label}</motion.span>
    </motion.span>
  )
}
