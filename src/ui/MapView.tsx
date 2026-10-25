import { useRef, useEffect, useLayoutEffect, useMemo, useState, type PointerEvent } from 'react'
import { motion, useMotionValue, useTransform, useReducedMotion, animate, type MotionValue } from 'motion/react'
import { useGesture } from '@use-gesture/react'
import type { EarthId } from '../domain/names'
import { StructureIcon } from './StructureIcon'
import type { Corner } from './NightlordMedallion'
import { catalog } from '../data/catalog'
import { crossfade } from './crossfade'
import { FadeImg } from './FadeImg'
import { DIMMED_PIN_OPACITY, mapInertia, SCRIM_OPACITY, SELECTED_PIN_SCALE, useMotion } from './motion'
import { useWide } from './useWide'
import { ICON_BODY, looksLikeTrackpadScroll, labelRequest, markSize, minSpacing, nearestPin, orbSize, placeLabels, rubberband, square, structureFootprint, zoomAbout, type Rect, type TagSpec } from './mapGeometry'
import './map.css'
import { EventGlow, ICON_SIZE, MarkerIcon, Ring, RingName, RING_SIZE, Tag, tagOf } from './mapMarks'
import type { NameBox } from './mapNames'
import type { MapContent, MarkTap, PinState } from './mapTypes'

const MAX_ZOOM = 4
const ART_SIZE = 80
const ORB_SIZE = 50
const ORB_DISC = 0.5
const ORB_BOX = ORB_SIZE / ORB_DISC
const PLAYER_DISC = 0.48
const PLAYER_BOX = Math.round(ICON_SIZE / PLAYER_DISC)
const MIN_TAP_REACH = 32
const HALF_HIT_TARGET = 22
const CORNER_CLEARANCE = 22
const MIN_BOTTOM_CLEARANCE = 56
const WHEEL_ZOOM_RATE = 500
const MAX_REDUCED_MOTION_JUMP = 24
const MS_PER_S = 1000

const LABEL_EDGE = 8
const LABEL_GAP = 9
const CALLOUT_GAP = 4
const ORB_ART: Partial<Record<PinState, string>> & { open: string; spawn: string } = {
  open: 'markers/unknown.webp', candidate: 'markers/unknown.webp', dimmed: 'markers/unknown.webp',
  spawn: 'markers/player.webp',
}

const drawsPlayer = (state: PinState) => state === 'spawn' || state === 'spawn-option'

const isMouseHover = (e: PointerEvent) => e.pointerType === 'mouse' && !e.buttons

export function MapView(props: MapContent & {
  earth: EarthId
  topInset: MotionValue<number>
  restInset: MotionValue<number>
  bottomInset: MotionValue<number>
  cornerAboveBottomInset?: MotionValue<Corner>
  moves?: MotionValue<number>
}) {
  const frame = useRef<HTMLDivElement>(null)
  const size = useMotionValue({ w: 0, h: 0 })
  const island = catalog.islandOf(props.earth)
  const spacing = useMemo(() => minSpacing(Object.values(catalog.slotsOf(props.earth))), [props.earth])
  const userMovedMap = useRef(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const pinScale = useTransform(scale, (s) => 1 / s)
  const mapWidth = useTransform(() => Math.max(size.get().w, size.get().h) * scale.get())
  const artScale = useTransform(mapWidth, (m) => markSize('art', m) / ART_SIZE)
  const orbScale = useTransform(mapWidth, (m) => orbSize(m, spacing) / ORB_SIZE)
  const iconScale = useTransform(mapWidth, (m) => markSize('icon', m) / ICON_SIZE)
  const ringScale = useTransform(mapWidth, (m) => markSize('ring', m) / RING_SIZE)
  // MotionConfig only reaches declarative animations; imperative moves crossfade themselves.
  const reduce = useReducedMotion()
  const m = useMotion()
  const fade = useMotionValue(1)

  const side = (s = scale.get()) => Math.max(size.get().w, size.get().h) * s
  const cornerRects = () => props.cornerAboveBottomInset?.get().rects ?? []
  const cornerUp = () => Math.max(0, ...cornerRects().map((r) => r.top))
  const bounds = (axis: 'x' | 'y', targetScale = scale.get()) => {
    const slack = Math.abs(side(targetScale) - (axis === 'x' ? size.get().w : size.get().h)) / 2
    const coveredBelow = props.bottomInset.get() + cornerUp()
    return { min: axis === 'x' ? -slack : -slack - coveredBelow, max: slack }
  }
  const clamp = (v: number, axis: 'x' | 'y', s = scale.get()) => {
    const { min, max } = bounds(axis, s)
    return Math.min(max, Math.max(min, v))
  }
  const band = (v: number, axis: 'x' | 'y') => {
    const { min, max } = bounds(axis)
    return rubberband(v, min, max, axis === 'x' ? size.get().w : size.get().h)
  }
  const reveal = (s = scale.get()): number | undefined => {
    const pin = props.pins.find((p) => p.slot === props.selected) ?? props.focusPoint
    if (!pin) return undefined
    const { w, h } = size.get()
    const pinY = h / 2 + y.get() + (pin.y / 1000 - 0.5) * side(s)
    const pinX = w / 2 + x.get() + (pin.x / 1000 - 0.5) * side(s)
    const over = cornerRects()
      .filter((r) => pinX > r.x0 - CORNER_CLEARANCE && pinX < r.x1 + CORNER_CLEARANCE)
      .map((r) => r.top + CORNER_CLEARANCE)
    const visibleBottom = h - props.bottomInset.get() - Math.max(MIN_BOTTOM_CLEARANCE, ...over)
    return pinY > visibleBottom ? y.get() - (pinY - visibleBottom) : undefined
  }
  const fitScale = () => {
    const { w, h } = size.get()
    if (!w || !h) return 1
    const freeHeight = h - props.topInset.get() - props.restInset.get()
    return Math.min(w / (((island.x1 - island.x0) / 1000) * side(1)), freeHeight / (((island.y1 - island.y0) / 1000) * side(1)))
  }
  const minScale = () => Math.min(1, fitScale())
  const boundScale = (s: number) => Math.min(MAX_ZOOM, Math.max(minScale(), s))
  const fit = () => {
    const { w, h } = size.get()
    if (!w || !h) return
    const top = props.topInset.get()
    const bottom = h - props.restInset.get()
    const s = boundScale(fitScale())
    const centerX = ((island.x0 + island.x1) / 2000 - 0.5) * side(s)
    const centerY = ((island.y0 + island.y1) / 2000 - 0.5) * side(s)
    const islandH = ((island.y1 - island.y0) / 1000) * side(s)
    const highestFit = top + islandH / 2
    const cornerReach = props.cornerAboveBottomInset?.get().reach ?? 0
    const centredAboveCorner = (top + bottom - cornerReach) / 2
    const mid = Math.max(highestFit, centredAboveCorner)
    scale.jump(s)
    x.jump(clamp(-centerX, 'x', s))
    y.jump(clamp(mid - h / 2 - centerY, 'y', s))
  }
  const active = useRef({ drag: false, pinch: false })
  const movesAwaitingFade = useRef<(() => [MotionValue<number>, number][])[] | null>(null)
  // MotionValue.set does not stop a running animation, so every new gesture must.
  const stopMotion = () => {
    x.stop()
    y.stop()
    scale.stop()
  }
  const grab = (gesture: 'drag' | 'pinch') => {
    active.current[gesture] = true
    stopMotion()
    movesAwaitingFade.current = null
    fade.jump(1)
  }
  const moved = () => {
    userMovedMap.current = true
    props.moves?.set(props.moves.get() + 1)
    setCallout(null)
  }
  const moveTo = (targets: () => [MotionValue<number>, number][]) => {
    if (reduce && movesAwaitingFade.current) return void movesAwaitingFade.current.push(targets)
    const now = targets()
    if (!reduce) return now.forEach(([v, t]) => { if (v !== scale || t !== v.get()) animate(v, t, m.mapSnap) })
    const far = now.some(([v, t]) => Math.abs(v === scale ? side(t) - side() : t - v.get()) > MAX_REDUCED_MOTION_JUMP)
    if (!far) return now.forEach(([v, t]) => v.jump(t))
    const batch = [targets]
    movesAwaitingFade.current = batch
    crossfade(fade, () => {
      const gestureTookOver = movesAwaitingFade.current !== batch
      if (gestureTookOver) return
      movesAwaitingFade.current = null
      batch.forEach((read) => read().forEach(([v, t]) => v.jump(t)))
    })
  }
  const settle = () => moveTo(() => {
    const s = boundScale(scale.get())
    return [[scale, s], [x, clamp(x.get(), 'x', s)], [y, reveal(s) ?? clamp(y.get(), 'y', s)]]
  })

  useGesture(
    {
      onDrag: ({ offset: [ox, oy], pinching, cancel, tap, first }) => {
        if (pinching) return cancel()
        if (first && !tap) moved()
        if (tap) {
          active.current.drag = false
          return settle()
        }
        x.set(band(ox, 'x'))
        y.set(band(oy, 'y'))
      },
      onDragEnd: ({ velocity: [speedXPxPerMs, speedYPxPerMs], direction: [signX, signY], tap, canceled }) => {
        active.current.drag = false
        if (canceled) return
        if (tap || reduce) return settle()
        const velocityXPxPerS = speedXPxPerMs * signX * MS_PER_S
        const velocityYPxPerS = speedYPxPerMs * signY * MS_PER_S
        const inertia = mapInertia
        // Motion skips an inertia animation whose target equals the current value, so pass the projected end.
        const glideX = clamp(x.get() + velocityXPxPerS * inertia.power, 'x')
        const glideY = clamp(y.get() + velocityYPxPerS * inertia.power, 'y')
        animate(x, glideX, { ...inertia, ...bounds('x'), velocity: velocityXPxPerS, modifyTarget: (t: number) => clamp(t, 'x') })
        animate(y, glideY, { ...inertia, ...bounds('y'), velocity: velocityYPxPerS, modifyTarget: (t: number) => clamp(t, 'y') })
      },
      onPinch: ({ origin: [ox, oy], first, offset: [s], memo }) => {
        if (first) {
          moved()
          const r = frame.current!.getBoundingClientRect()
          memo = [x.get(), y.get(), scale.get(), ox - (r.left + r.width / 2) - x.get(), oy - (r.top + r.height / 2) - y.get()]
        }
        const [x0, y0, s0, dx, dy] = memo as number[]
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
        const isTrackpadPinch = event.ctrlKey
        if (isTrackpadPinch) return
        userMovedMap.current = true
        stopMotion()
        if (looksLikeTrackpadScroll(event)) {
          x.set(clamp(x.get() - dx, 'x'))
          y.set(clamp(y.get() - dy, 'y'))
          return
        }
        const r = frame.current!.getBoundingClientRect()
        const pointer = { x: event.clientX - (r.left + r.width / 2), y: event.clientY - (r.top + r.height / 2) }
        const s0 = scale.get()
        const zoomFactor = Math.exp(-dy / WHEEL_ZOOM_RATE)
        const s1 = boundScale(s0 * zoomFactor)
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
        // iOS Safari can drop a pointer mid-pinch, leaving a stale finger that turns the next one-finger drag into a zoom.
        pointer: { touch: true },
        scaleBounds: () => ({ min: minScale(), max: MAX_ZOOM }),
        rubberband: true,
        from: (): [number, number] => {
          grab('pinch')
          return [scale.get(), 0]
        },
      },
    },
  )

  useEffect(() => {
    const revealing = Boolean(props.selected || props.focusPoint)
    if (reveal() !== undefined) moveTo(() => { const target = reveal(); return target === undefined ? [] : [[y, target]] })
    else if (!revealing && !userMovedMap.current) fit()
    const onInset = () => {
      if (!active.current.drag && !active.current.pinch) settle()
    }
    const onFrame = () => (userMovedMap.current || revealing ? onInset() : fit())
    let reach = props.cornerAboveBottomInset?.get().reach
    const onCorner = (c: Corner) => {
      if (c.reach === reach) return
      reach = c.reach
      onFrame()
    }
    const offs = [
      ...[size, props.topInset, props.restInset].map((v) => v.on('change', onFrame)),
      ...(props.cornerAboveBottomInset ? [props.cornerAboveBottomInset.on('change', onCorner)] : []),
      props.bottomInset.on('change', onInset),
    ]
    return () => offs.forEach((off) => off())
  }, [props.topInset, props.restInset, props.bottomInset, props.cornerAboveBottomInset, props.selected, props.focusPoint, props.pins])

  const tapNearestMarkInReach = (clientX: number, clientY: number) => {
    const r = frame.current!.getBoundingClientRect()
    const s = side()
    const point = {
      x: ((clientX - r.left - r.width / 2 - x.get()) / s + 0.5) * 1000,
      y: ((clientY - r.top - r.height / 2 - y.get()) / s + 0.5) * 1000,
    }
    const tapped = nearestTag(point, s)
    const calling = tapped !== null && tapped !== calloutAt
    setCallout(calling ? { tags, at: tapped } : null)
    props.onMark?.(calling ? { ...markAt(tapped), clientX, clientY } : null)
    if (tapped !== null) return
    const reach = Math.max(MIN_TAP_REACH, markSize('art', s) / 2)
    const pin = nearestPin(props.pins, point, (reach / s) * 1000, props.preferred)
    if (pin) props.onPin?.(pin.slot, pin.state)
    else props.onBackground?.()
  }

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => size.set({ w: entry.contentRect.width, h: entry.contentRect.height }))
    observer.observe(frame.current!)
    return () => observer.disconnect()
  }, [])

  const tags = useMemo<TagSpec[]>(() => {
    const seen = new Set<string>()
    const sites = props.pins.flatMap((p): TagSpec[] => {
      if (!p.name || !p.structure) return []
      const kind = seen.has(p.name) ? 'repeat' : 'site'
      seen.add(p.name)
      return [{ x: p.x, y: p.y, kind, mark: 'art', structure: p.structure }]
    })
    return [...(props.markers ?? []).map(tagOf), ...sites]
  }, [props.markers, props.pins])
  const namedPins = props.pins.filter((p) => p.name && p.structure)
  const markerCount = props.markers?.length ?? 0
  const [callout, setCallout] = useState<{ tags: TagSpec[]; at: number } | null>(null)
  const calloutAt = callout?.tags === tags ? callout.at : null
  useEffect(() => setCallout(null), [props.dismissals])
  const nameOf = (i: number) => (i < markerCount ? props.markers![i].label : namedPins[i - markerCount].name!)
  const markAt = (i: number): Omit<MarkTap, 'clientX' | 'clientY'> =>
    i < markerCount
      ? { marker: props.markers![i], x: props.markers![i].x, y: props.markers![i].y }
      : { site: namedPins[i - markerCount].name!, x: namedPins[i - markerCount].x, y: namedPins[i - markerCount].y }
  const nearestTag = (point: { x: number; y: number }, s: number): number | null => {
    const art = markSize('art', s) / 2
    let best: number | null = null
    let least = Infinity
    tags.forEach((t, i) => {
      if (t.silent) return
      const reach = ((t.mark === 'art' ? art : HALF_HIT_TARGET) / s) * 1000
      const distance = Math.hypot(t.x - point.x, t.y - point.y)
      if (distance <= reach && distance < least) { best = i; least = distance }
    })
    return best
  }
  const labelBoxes = useMotionValue<NameBox[]>([])
  const labelSizes = useRef<NameBox[]>([])
  const measured = (i: number, box: NameBox) => { labelSizes.current[i] = box }
  const wide = useWide()
  const labels = useTransform(() => {
    const { w, h } = size.get()
    const s = side()
    const toScreen = (px: number, py: number) => ({ x: w / 2 + x.get() + (px / 1000 - 0.5) * s, y: h / 2 + y.get() + (py / 1000 - 0.5) * s })
    const art = markSize('art', s)
    const icon = markSize('icon', s)
    const orb = orbSize(s, spacing)
    const ring = markSize('ring', s)
    const pinRects = props.pins.filter((p) => !(p.name && p.structure)).flatMap((p) => {
      const c = toScreen(p.x, p.y)
      if (p.structure) return structureFootprint(c, art, p.structure)
      return [square(c, drawsPlayer(p.state) ? icon / 2 : orb / 2)]
    })
    const boxes = labelBoxes.get()
    const points = tags.map((t) => toScreen(t.x, t.y))
    const castle = tags.flatMap((t, i) => (t.kind === 'castle' && t.mark === 'icon' ? [square(points[i], icon * ICON_BODY)] : []))
      .reduce<Rect | undefined>((u, r) => (u ? { x0: Math.min(u.x0, r.x0), y0: Math.min(u.y0, r.y0), x1: Math.max(u.x1, r.x1), y1: Math.max(u.y1, r.y1) } : r), undefined)
    const requests = tags.map((t, i) => labelRequest(t, points[i], boxes[i], { art, icon, ring }, wide, castle))
    const visible = { w, top: props.topInset.get(), h: h - props.bottomInset.get() }
    const blocked = (props.cornerAboveBottomInset?.get().rects ?? []).map((r) => ({ x0: r.x0, x1: r.x1, y0: visible.h - r.top, y1: visible.h - r.bottom }))
    const oneLineHeight = Math.min(...requests.filter((r) => !r.ring && r.label.h > 0).map((r) => r.label.h))
    const spots = placeLabels(requests, visible, pinRects, LABEL_GAP, LABEL_EDGE, 0, blocked, Number.isFinite(oneLineHeight) ? oneLineHeight : 0)
      .map((spot, i) => ({ ...spot, x: spot.x - points[i].x, y: spot.y - points[i].y }))
    if (calloutAt === null) return spots
    const { point, box, mark = 0 } = requests[calloutAt]
    const called = boxes[tags.length] ?? { w: 0, h: 0 }
    const around = box ?? square(point, mark)
    const calloutX = Math.min(w - LABEL_EDGE - called.w, Math.max(LABEL_EDGE, (around.x0 + around.x1) / 2 - called.w / 2))
    const above = around.y0 - CALLOUT_GAP - called.h
    const calloutY = above >= visible.top + LABEL_EDGE ? above : around.y1 + CALLOUT_GAP
    spots[calloutAt] = { ...spots[calloutAt], shown: false }
    return [...spots, { x: calloutX - point.x, y: calloutY - point.y, shown: true }]
  })
  // Published from a layout effect, after the transform above has subscribed, so no measured size is missed.
  useLayoutEffect(() => labelBoxes.set([...tags, null].map((_, i) => labelSizes.current[i] ?? { w: 0, h: 0 })), [tags, labelBoxes, calloutAt])

  // use-gesture swallows the click that ends a pan, so any click reaching the frame is a real tap.
  return (
    <div ref={frame} className="map-frame" onClick={(e) => tapNearestMarkInReach(e.clientX, e.clientY)}>
      <motion.div className="map-layer" style={{ x, y, scale, opacity: fade }}>
        <FadeImg data-hero="map" className="map-image" src={`maps/${props.earth}.webp`} alt="" draggable={false} />
        <motion.div className="map-scrim" animate={{ opacity: props.dim ? SCRIM_OPACITY : 0 }} transition={m.mapSnap} aria-hidden />
        {props.markers?.map((m, i) => (m.layer === 'circle' || m.layer === 'event') && (
          <motion.span key={`r${i}`} className="marker ring-mark" style={{ left: `${m.x / 10}%`, top: `${m.y / 10}%`, scale: pinScale }}>
            <motion.span className="mark" style={{ scale: ringScale }}>{m.layer === 'event' ? <EventGlow /> : <Ring night={m.night ?? 1} />}</motion.span>
          </motion.span>
        ))}
        {props.pins.map((p) => {
          const drawsArt = p.structure || p.state === 'sighted'
          return (
            <motion.span
              key={`${p.slot}:${p.structure ?? 'dot'}`}
              className={`pin pin-${p.state}${props.selected === p.slot ? ' pin-selected' : ''}${p.weaponHitsRunWeakness ? ' pin-match' : ''}`}
              {...(props.onPin ? {} : { role: 'img', 'aria-label': p.label })}
              data-slot={p.slot}
              style={{ left: `${p.x / 10}%`, top: `${p.y / 10}%`, scale: pinScale }}
              initial={{ opacity: 0 }}
              animate={{ opacity: p.state === 'dimmed' ? DIMMED_PIN_OPACITY : 1 }}
              transition={m.pinAppear}
            >
              <motion.span className="pin-body" style={{ scale: drawsArt ? artScale : drawsPlayer(p.state) ? iconScale : orbScale }}>
                <motion.span className={drawsArt ? 'pin-mark' : 'pin-mark pin-orb'} animate={{ scale: props.selected === p.slot ? SELECTED_PIN_SCALE : 1 }} transition={m.pinSelect}>
                  {drawsArt
                    ? <StructureIcon structure={p.structure} size={ART_SIZE} />
                    : drawsPlayer(p.state)
                      ? <img className="orb" src={ORB_ART.spawn} width={PLAYER_BOX} height={PLAYER_BOX} data-disc={PLAYER_DISC} alt="" draggable={false} />
                      : <img className="orb" src={ORB_ART[p.state] ?? ORB_ART.open} width={ORB_BOX} height={ORB_BOX} data-disc={ORB_DISC} alt="" draggable={false} />}
                  {p.state === 'spawn' && p.structure && <img className="spawn-badge" src={ORB_ART.spawn} alt="" draggable={false} />}
                </motion.span>
              </motion.span>
              {props.onPin && (
                <button
                  className="pin-hit"
                  aria-label={p.label}
                  data-slot={p.slot}
                  onPointerEnter={(e) => { if (isMouseHover(e)) props.onHover?.(p) }}
                  onPointerLeave={(e) => { if (e.pointerType === 'mouse') props.onHover?.(null) }}
                  onClick={(e) => {
                    const isPointerTap = e.detail !== 0
                    if (isPointerTap) return
                    e.stopPropagation()
                    props.onPin?.(p.slot, p.state)
                  }}
                />
              )}
            </motion.span>
          )
        })}
        {props.markers?.map((m, i) => (
          <Tag key={`m${i}`} index={i} at={m} className={`marker-${m.layer}${m.nameWithoutIcon ? ' marker-plain' : ''}`} labels={labels} onMeasure={measured} pinScale={pinScale}
            text={m.layer === 'circle' ? <RingName marker={m} /> : tags[i].silent ? null : m.label} textKey={m.label}>
            {m.layer !== 'circle' && <MarkerIcon marker={m} scale={iconScale} />}
          </Tag>
        ))}
        {namedPins.map((p, j) => (
          <Tag key={`p${p.slot}`} index={markerCount + j} at={p} className="marker-site" labels={labels} onMeasure={measured}
            pinScale={pinScale} text={p.name!} textKey={p.name!} hidden />
        ))}
        {calloutAt !== null && (
          <Tag key={`c${calloutAt}`} index={tags.length} at={tags[calloutAt]} className="marker-callout" labels={labels} onMeasure={measured}
            pinScale={pinScale} text={nameOf(calloutAt)} textKey={nameOf(calloutAt)} hidden />
        )}
      </motion.div>
    </div>
  )
}
