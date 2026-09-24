import { useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { motion, useMotionValue, useTransform, useReducedMotion, animate, type MotionStyle, type MotionValue } from 'motion/react'
import { useGesture } from '@use-gesture/react'
import { type EarthId, type SlotId, type StructureKey } from '../domain/names'
import type { Marker } from '../domain/seed'
import { StructureIcon, emblemSize } from './StructureIcon'
import { catalog } from '../data/catalog'
import { crossfade } from './crossfade'
import { isTrackpadScroll, nearestPin, placeLabels, playableBox, rubberband, zoomAbout } from './mapGeometry'

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
// Every kind is drawn at one size, elemental or not. Its emblem badge scales with the art but never drops under
// EMBLEM_MIN px on screen: at 12px (36 device px on a 3x phone) holy's ring and lightning's bolts still read,
// where at 11px they start to merge, and a larger badge would outweigh the phone's smallest art.
const EMBLEM_MIN = 12
const DOT_FULL_SIDE = 900
const DOT_MAX = 1.35
const clampTo = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
// How far (CSS px on screen) a tap may land from a slot and still count as that slot.
const TAP_REACH = 32
const snap = { type: 'spring', visualDuration: 0.4, bounce: 0 } as const
// With reduced motion, a map move shorter than this (px) just jumps, like the finger it follows; a longer one crossfades.
const NUDGE = 24

/** What the active mode (finder or result) shows on the map. */
export interface MapContent {
  pins: Pin[]
  markers?: Marker[]
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
  // The badge's own counter-scale (a CSS transform, see .pin .element-badge) holds it at EMBLEM_MIN, and no larger.
  const badgeHold = useTransform(artScale, (f) => Math.max(1, EMBLEM_MIN / (emblemSize(ART_SIZE) * f)))
  const dotScale = useTransform(mapWidth, (m) => clampTo(m / DOT_FULL_SIDE, 1, DOT_MAX))
  // MotionConfig only reaches declarative animations; imperative moves crossfade themselves when motion is reduced.
  const reduce = useReducedMotion()
  const fade = useMotionValue(1)

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
  // Reduced motion: the moves waiting for the running crossfade's jump, or null when none is running.
  const queued = useRef<(() => [MotionValue<number>, number][])[] | null>(null)
  // MotionValue.set does not stop a running animation, so a new gesture must stop the glide or
  // settle spring itself. use-gesture calls `from` at pointer-down, before any handler runs,
  // so stopping here freezes the map exactly where the finger landed.
  const grab = (gesture: 'drag' | 'pinch') => {
    active.current[gesture] = true
    touched.current = true
    x.stop()
    y.stop()
    scale.stop()
    // A reduced-motion crossfade in flight is dropped: the finger owns the map now, so its jump must not land.
    queued.current = null
    fade.jump(1)
  }
  // Springs each value to its target. With reduced motion a far move crossfades instead; `targets` is read
  // again when the map is faded out, so the jump lands where things are by then, not where they were.
  // Moves that arrive during a crossfade wait for its jump, and each is read again there, in order.
  type Targets = () => [MotionValue<number>, number][]
  const moveTo = (targets: Targets) => {
    if (reduce && queued.current) return void queued.current.push(targets)
    const now = targets()
    if (!reduce) return now.forEach(([v, t]) => { if (v !== scale || t !== v.get()) animate(v, t, snap) })
    const far = now.some(([v, t]) => Math.abs(v === scale ? side(t) - side() : t - v.get()) > NUDGE)
    if (!far) return now.forEach(([v, t]) => v.jump(t))
    const batch = [targets]
    queued.current = batch
    crossfade(fade, () => {
      if (queued.current !== batch) return // a gesture took over the map meanwhile (grab)
      queued.current = null
      batch.forEach((read) => read().forEach(([v, t]) => v.jump(t)))
    })
  }
  const settle = () => moveTo(() => {
    const s = boundScale(scale.get())
    return [[scale, s], [x, clamp(x.get(), 'x', s)], [y, reveal(s) ?? clamp(y.get(), 'y', s)]]
  })

  useGesture(
    {
      onDrag: ({ offset: [ox, oy], pinching, cancel, tap }) => {
        if (pinching) return cancel()
        // A tap never becomes an intentional drag, so onDragEnd does not run for it: the tap's pointer-up
        // (the only call with `tap` set) ends the grab here. Left set, it would block the settle that keeps
        // a selected pin above the rising sheet. A tap can also stop a glide mid-bounce; settle puts it back.
        if (tap) {
          active.current.drag = false
          return settle()
        }
        x.set(band(ox, 'x'))
        y.set(band(oy, 'y'))
      },
      onDragEnd: ({ velocity: [vx, vy], direction: [dx, dy], tap, canceled }) => {
        active.current.drag = false
        if (canceled) return
        // Reduced motion skips the glide.
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
      onWheel: ({ event, delta: [dx, dy] }) => {
        event.preventDefault()
        // Trackpad pinch arrives as ctrl+wheel and is already handled by onPinch, about the pointer.
        if (event.ctrlKey) return
        touched.current = true
        // A wheel step takes over from any glide or settle spring, which .set alone would not stop.
        x.stop()
        y.stop()
        scale.stop()
        // A two-finger trackpad scroll pans, as in Apple Maps; it stays inside the bounds, as there is no release to spring back from.
        if (isTrackpadScroll(event)) {
          x.set(clamp(x.get() - dx, 'x'))
          y.set(clamp(y.get() - dy, 'y'))
          return
        }
        // A mouse wheel zooms about the pointer: the image point under it stays under it.
        const r = frame.current!.getBoundingClientRect()
        const pointer = { x: event.clientX - (r.left + r.width / 2), y: event.clientY - (r.top + r.height / 2) }
        const s0 = scale.get()
        // Exponential, so a step in and the same step out cancel, and no step can flip the scale's sign.
        const s1 = boundScale(s0 * Math.exp(-dy / 500))
        const t = zoomAbout({ x: x.get(), y: y.get() }, s0, s1, pointer)
        scale.set(s1)
        x.set(band(t.x, 'x'))
        y.set(band(t.y, 'y'))
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
    if (reveal() !== undefined) moveTo(() => { const target = reveal(); return target === undefined ? [] : [[y, target]] })
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
    if (pin) props.onPin?.(pin.slot, pin.state)
    else props.onBackground?.()
  }

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => size.set({ w: entry.contentRect.width, h: entry.contentRect.height }))
    observer.observe(frame.current!)
    return () => observer.disconnect()
  }, [])

  // Every marker's label, placed in one pass so labels avoid each other and every glyph, not only the pins.
  // Screen px equal a label's own px: markers counter-scale the map's zoom.
  const labelBoxes = useMotionValue<{ w: number; h: number }[]>([])
  const labelSizes = useRef<{ w: number; h: number }[]>([])
  const measured = (i: number, box: { w: number; h: number }) => { labelSizes.current[i] = box }
  const labels = useTransform(() => {
    const { w, h } = size.get()
    const s = side()
    const toScreen = (px: number, py: number) => ({ x: w / 2 + x.get() + (px / 1000 - 0.5) * s, y: h / 2 + y.get() + (py / 1000 - 0.5) * s })
    const pinRects = props.pins.map((p) => {
      const c = toScreen(p.x, p.y)
      // Art plus its badge's overhang, or a dot with its halo.
      const r = p.structure ? (ART_SIZE / 2 + 4) * artScale.get() : 10 * dotScale.get()
      return { x0: c.x - r, y0: c.y - r, x1: c.x + r, y1: c.y + r }
    })
    const boxes = labelBoxes.get()
    const requests = (props.markers ?? []).map((m, i) => ({
      point: toScreen(m.x, m.y), label: boxes[i] ?? { w: 0, h: 0 }, rank: LABEL_RANK[m.layer] ?? 2, keep: m.layer === 'circle',
    }))
    // The visible band runs from the pill's bottom edge to whatever covers the bottom right now (the sheet),
    // so no label is sliced by the sheet or drawn under the pill's controls.
    const visible = { w, top: props.topInset.get(), h: h - props.bottomInset.get() }
    return placeLabels(requests, visible, pinRects, LABEL_GAP, LABEL_EDGE, MARK_RADIUS)
      .map((spot, i) => ({ ...spot, x: spot.x - requests[i].point.x, y: spot.y - requests[i].point.y }))
  })
  // Markers measure their labels in their own layout effects, which run before this component's: published
  // from here, after the transform above has subscribed (in its own layout effect, declared earlier), so the
  // new sizes are never missed.
  useLayoutEffect(() => labelBoxes.set([...labelSizes.current]), [props.markers, labelBoxes])

  // use-gesture swallows the click that ends a pan, so any click reaching the frame is a real tap.
  return (
    <div ref={frame} className="map-frame" onClick={(e) => tapAt(e.clientX, e.clientY)}>
      <motion.div className="map-layer" style={{ x, y, scale, opacity: fade, '--badge-hold': badgeHold } as MotionStyle}>
        <img className="map-image" src={`/maps/${props.earth}.webp`} alt="" draggable={false} />
        <motion.div className="map-scrim" animate={{ opacity: props.dim ? 0.55 : 0 }} transition={snap} aria-hidden />
        {props.pins.map((p) => (
          <motion.span
            // Keyed by what the pin shows, so a structure already on the map stays put when the result takes over.
            // A dot keeps its element through state changes (spawn option to spawn, open to candidate), so a
            // keyboard user's focus on it survives the change instead of falling to the document body.
            key={`${p.slot}:${p.structure ?? 'dot'}`}
            className={`pin pin-${p.state}${props.selected === p.slot ? ' pin-selected' : ''}`}
            // A pin that does nothing (the result map) is a named image, not a Tab stop or a button to VoiceOver.
            {...(props.onPin ? {} : { role: 'img', 'aria-label': p.label })}
            data-slot={p.slot} // a stable handle for tests; labels speak player vocabulary, not slot numbers
            style={{ left: `${p.x / 10}%`, top: `${p.y / 10}%`, scale: pinScale }}
            initial={{ opacity: 0 }}
            // A certain ghost dims its art alone (tokens.css), so its dashed ring stays clearly visible.
            animate={{ opacity: p.state === 'dimmed' ? 0.4 : 1 }}
            transition={{ type: 'spring', visualDuration: 0.35, bounce: 0.2 }}
          >
            <motion.span className="pin-body" style={{ scale: p.structure ? artScale : dotScale }}>
              <motion.span animate={{ scale: props.selected === p.slot ? 1.3 : 1 }} transition={{ type: 'spring', visualDuration: 0.3, bounce: 0.25 }}>
                {p.state === 'spawn-option' ? <span className="spawn-option-dot" /> : p.state === 'spawn' && !p.structure ? <span className="spawn-dot" /> : p.structure ? <StructureIcon structure={p.structure} size={ART_SIZE} /> : <span className="open-dot" />}
                {/* A Church at the spawn point: the art stays whole and the puck rides on its corner, so both show. */}
                {p.state === 'spawn' && p.structure && <span className="spawn-dot spawn-badge" />}
              </motion.span>
            </motion.span>
            {/* The 44px target lies over the art as a sibling, so art and pin stay mounted when the result drops it. */}
            {props.onPin && (
              <button
                className="pin-hit"
                aria-label={p.label}
                data-slot={p.slot}
                // buttons === 0: a pan that sweeps across pins is not hovering them.
                onPointerEnter={(e) => { if (e.pointerType === 'mouse' && !e.buttons) props.onHover?.(p) }}
                onPointerLeave={(e) => { if (e.pointerType === 'mouse') props.onHover?.(null) }}
                onClick={(e) => {
                  // Pointer taps bubble to the frame, which snaps them; keyboard activation has no point to snap.
                  if (e.detail) return
                  e.stopPropagation()
                  props.onPin?.(p.slot, p.state)
                }}
              />
            )}
          </motion.span>
        ))}
        {/* After the pins, so a label is never under a structure; placeLabels also keeps it off every pin and marker. */}
        {props.markers?.map((m, i) => <MapMarker key={i} index={i} marker={m} labels={labels} onMeasure={measured} pinScale={pinScale} />)}
      </motion.div>
    </div>
  )
}

// Gap kept between a marker label and the frame's edges; distance from the point to the label;
// the glyph on the point (the 10px circle target and its 1px rim), which a label never covers.
const LABEL_EDGE = 8
const LABEL_GAP = 9
const MARK_RADIUS = 6
// Which labels get first pick of the free spots: the night circles, then field bosses, then everything else.
const LABEL_RANK: Partial<Record<Marker['layer'], number>> = { circle: 0, boss: 1 }

/** A glyph on the exact point, with its label beside it where MapView's placement pass put it. */
function MapMarker({ index, marker, labels, onMeasure, pinScale }: {
  index: number
  marker: Marker
  labels: MotionValue<{ x: number; y: number; shown: boolean }[]>
  onMeasure: (index: number, box: { w: number; h: number }) => void
  pinScale: MotionValue<number>
}) {
  const label = useRef<HTMLSpanElement>(null)
  // A circle is a short chip: a two-line "Night 1: boss" label had nowhere to go on a busy phone map without
  // covering a structure. The run card names each night's boss.
  const text = marker.layer === 'circle' && marker.night ? `Night ${marker.night}` : marker.label
  const spot = useTransform(labels, (all) => all[index] ?? { x: 0, y: 0, shown: false })
  const labelX = useTransform(spot, (o) => o.x)
  const labelY = useTransform(spot, (o) => o.y)
  // A label with no free spot steps aside, leaving the glyph: its name is listed in the sheet, and a structure
  // matters more. A night's circle keeps its short chip while its glyph is in sight (placeLabels).
  const labelOpacity = useTransform(spot, (o) => (o.shown ? 1 : 0))
  // Reported to MapView, which publishes every size at once after its placement pass has subscribed.
  useLayoutEffect(() => onMeasure(index, { w: label.current!.offsetWidth, h: label.current!.offsetHeight }), [text, index])
  return (
    <motion.span className={`marker marker-${marker.layer}`} style={{ left: `${marker.x / 10}%`, top: `${marker.y / 10}%`, scale: pinScale }}>
      <span className="marker-dot" />
      <motion.span ref={label} className="marker-label" style={{ x: labelX, y: labelY, opacity: labelOpacity }}>{text}</motion.span>
    </motion.span>
  )
}
