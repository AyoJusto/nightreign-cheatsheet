import { useRef, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, useReducedMotion, animate, type MotionValue } from 'motion/react'
import { useGesture } from '@use-gesture/react'
import { splitStructure, type EarthId, type SlotId, type StructureKey } from '../domain/names'
import type { Marker } from '../domain/seed'
import { StructureIcon } from './StructureIcon'
import type { Corner } from './NightlordMedallion'
import { catalog } from '../data/catalog'
import { crossfade } from './crossfade'
import { useWide } from './useWide'
import { ART_ASPECT, artFootprint, isTrackpadScroll, labelRank, markSize, minSpacing, nearestPin, orbSize, placeLabels, rubberband, shortBossName, zoomAbout, type LabelRequest, type NameKind, type Rect } from './mapGeometry'
import './map.css'

export type PinState = 'open' | 'sighted' | 'certain' | 'candidate' | 'dimmed' | 'spawn-option' | 'spawn'
/** `name`: what is inside the site ("Guardian Golem"), written on the map under its art when there is room. */
export interface Pin { slot: SlotId; x: number; y: number; state: PinState; structure: StructureKey | null; label: string; name?: string }
/**
 * A marker as the map draws it. Beyond the seed's own layers: the castle's bosses (a crest each) and its guard
 * (a name alone), and caravans, which stand on open ground where nothing is built (a cart, drawn for the app).
 */
export interface MapMarker extends Omit<Marker, 'layer'> { layer: Marker['layer'] | 'castle' | 'caravan'; plain?: boolean }

const MAX_ZOOM = 4
// Marks are laid out at these sizes (px) and scaled to markSize's on-screen size for the map's current width,
// so they grow and shrink with the map like the game's own. Laid out near their desktop size, they scale down
// on a phone rather than up, and stay crisp.
const ART_SIZE = 80
// The unknown-site glow's bright core; its image is twice as large, with the soft halo round the core.
const ORB_SIZE = 50
const ORB_DISC = 0.5
const ORB_BOX = ORB_SIZE / ORB_DISC
const ICON_SIZE = 36
// The player's marker is drawn crest-sized: its disc is 0.48 of its image (public/markers/player.webp).
const PLAYER_BOX = Math.round(ICON_SIZE / 0.48)
const RING_SIZE = 110
// How far (CSS px on screen) a tap may land from a slot and still count as that slot: at least 32, or the
// art's own half-width once it is drawn larger.
const TAP_REACH = 32
const snap = { type: 'spring', visualDuration: 0.4, bounce: 0 } as const
// With reduced motion, a map move shorter than this (px) just jumps, like the finger it follows; a longer one crossfades.
const NUDGE = 24

/** What the active mode (finder or result) shows on the map. */
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

export function MapView(props: MapContent & {
  earth: EarthId
  /** Screen y of the top overlay's bottom edge. */
  topInset: MotionValue<number>
  /** Height covered at the bottom by the overlay at rest (strip, or sheet at peek): the map frames itself above it. */
  restInset: MotionValue<number>
  /** Height covered at the bottom right now, including an open sheet: pins are kept above it. */
  bottomInset: MotionValue<number>
  /** What is drawn over the map's bottom-left corner (the Nightlord medallion), measured up from bottomInset. */
  corner?: MotionValue<Corner>
  /** Counts the user's pans and pinches: the Nightlord's card folds away when the map is moved. */
  moves?: MotionValue<number>
}) {
  const frame = useRef<HTMLDivElement>(null)
  // Measured by a ResizeObserver; at scale 1 the square image is max(w, h) wide, so it covers the frame.
  const size = useMotionValue({ w: 0, h: 0 })
  // What the map frames itself on: the whole island as drawn, so no mark starts off screen, the west coast included.
  const box = catalog.islandOf(props.earth)
  // The gap between the two nearest sites, which no glow outgrows (orbSize).
  const spacing = useMemo(() => minSpacing(Object.values(catalog.slotsOf(props.earth))), [props.earth])
  // Until the user moves the map, it keeps itself framed on the playable area as insets settle.
  const touched = useRef(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const pinScale = useTransform(scale, (s) => 1 / s)
  const mapWidth = useTransform(() => Math.max(size.get().w, size.get().h) * scale.get())
  const artScale = useTransform(mapWidth, (m) => markSize('art', m) / ART_SIZE)
  const orbScale = useTransform(mapWidth, (m) => orbSize(m, spacing) / ORB_SIZE)
  const iconScale = useTransform(mapWidth, (m) => markSize('icon', m) / ICON_SIZE)
  const ringScale = useTransform(mapWidth, (m) => markSize('ring', m) / RING_SIZE)
  // MotionConfig only reaches declarative animations; imperative moves crossfade themselves when motion is reduced.
  const reduce = useReducedMotion()
  const fade = useMotionValue(1)

  const side = (s = scale.get()) => Math.max(size.get().w, size.get().h) * s
  // The medallion and its card while they show, measured up from whatever covers the bottom of the screen.
  const cornerRects = () => props.corner?.get().rects ?? []
  const cornerUp = () => Math.max(0, ...cornerRects().map((r) => r.top))
  // Per axis, an image larger than the frame keeps covering it and a smaller one (zoomed out to fit
  // the playable area) stays inside it, so the playable area is always reachable. The bottom edge may
  // also rise to whatever covers the bottom of the screen, and above the corner, so no pin stays under the medallion.
  // `s` is passed in because settle clamps against the scale it is springing to, not the rubber-banded one.
  const bounds = (axis: 'x' | 'y', s = scale.get()) => {
    const slack = Math.abs(side(s) - (axis === 'x' ? size.get().w : size.get().h)) / 2
    return { min: axis === 'x' ? -slack : -slack - props.bottomInset.get() - cornerUp(), max: slack }
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
  // If the selected pin would sit under the sheet (or the medallion above it), pan it up into the visible area.
  const reveal = (s = scale.get()): number | undefined => {
    const pin = props.pins.find((p) => p.slot === props.selected)
    if (!pin) return undefined
    const { w, h } = size.get()
    const pinY = h / 2 + y.get() + (pin.y / 1000 - 0.5) * side(s)
    const pinX = w / 2 + x.get() + (pin.x / 1000 - 0.5) * side(s)
    const over = cornerRects().filter((r) => pinX > r.x0 - 22 && pinX < r.x1 + 22).map((r) => r.top + 22)
    const visibleBottom = h - props.bottomInset.get() - Math.max(56, ...over)
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
    // Centred above the corner's medallion where the playable area has the room (a phone's spare height), so no
    // site starts under it; where it has not, as high as it goes, which is where it was without the corner.
    const boxH = ((box.y1 - box.y0) / 1000) * side(s)
    // The corner's steady reach, not whether it shows right now: a tuck mid-drag must not move the map.
    const mid = Math.max(top + boxH / 2, (top + bottom - (props.corner?.get().reach ?? 0)) / 2)
    scale.jump(s)
    x.jump(clamp(-centerX, 'x', s))
    y.jump(clamp(mid - h / 2 - centerY, 'y', s))
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
  const moved = () => {
    props.moves?.set(props.moves.get() + 1)
    setCallout(null)
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
      onDrag: ({ offset: [ox, oy], pinching, cancel, tap, first }) => {
        if (pinching) return cancel()
        if (first && !tap) moved()
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
          moved()
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
    // Only the corner's reach frames the map; its tuck only changes what names avoid and how far the map pans.
    let reach = props.corner?.get().reach
    const onCorner = (c: Corner) => {
      if (c.reach === reach) return
      reach = c.reach
      onFrame()
    }
    const offs = [
      ...[size, props.topInset, props.restInset].map((v) => v.on('change', onFrame)),
      ...(props.corner ? [props.corner.on('change', onCorner)] : []),
      props.bottomInset.on('change', onInset),
    ]
    return () => offs.forEach((off) => off())
  }, [props.topInset, props.restInset, props.bottomInset, props.corner, props.selected, props.pins])

  // A tap on a named mark shows its name in a callout, and another tap on it, or anywhere else, hides it.
  // Otherwise a tap goes to the nearest slot within reach, preferring the step's own pins, not to whichever hit area is on top.
  const tapAt = (clientX: number, clientY: number) => {
    const r = frame.current!.getBoundingClientRect()
    const s = side()
    const point = {
      x: ((clientX - r.left - r.width / 2 - x.get()) / s + 0.5) * 1000,
      y: ((clientY - r.top - r.height / 2 - y.get()) / s + 0.5) * 1000,
    }
    const tapped = nearestTag(point, s)
    setCallout(tapped === null || tapped === calloutAt ? null : { tags, at: tapped })
    if (tapped !== null) return
    const reach = Math.max(TAP_REACH, markSize('art', s) / 2)
    const pin = nearestPin(props.pins, point, (reach / s) * 1000, props.preferred)
    if (pin) props.onPin?.(pin.slot, pin.state)
    else props.onBackground?.()
  }

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => size.set({ w: entry.contentRect.width, h: entry.contentRect.height }))
    observer.observe(frame.current!)
    return () => observer.disconnect()
  }, [])

  // Every name on the map, placed in one pass so names avoid each other and every mark, in labelRank order.
  // Screen px equal a label's own px: tags counter-scale the map's zoom.
  const tags = useMemo<TagSpec[]>(() => {
    // A site's name already written at another site ranks below the evergaols (labelRank).
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
  // The mark whose name a tap called out, by its index in `tags`; a change of tags (a layer turned off) drops it.
  const [callout, setCallout] = useState<{ tags: TagSpec[]; at: number } | null>(null)
  const calloutAt = callout?.tags === tags ? callout.at : null
  // Its text: a site's name, or a marker's own (a night's ring already writes its name, and a chest's icon says it all).
  const nameOf = (i: number) => (i < markerCount ? props.markers![i].label : namedPins[i - markerCount].name!)
  // The named mark nearest a tap, within reach of what it draws (a site's art, else a 44px target), or null.
  const nearestTag = (point: { x: number; y: number }, s: number): number | null => {
    const art = markSize('art', s) / 2
    let best: number | null = null
    let least = Infinity
    tags.forEach((t, i) => {
      if (t.mark === 'ring' || t.silent) return
      const reach = ((t.mark === 'art' ? art : 22) / s) * 1000
      const distance = Math.hypot(t.x - point.x, t.y - point.y)
      if (distance <= reach && distance < least) { best = i; least = distance }
    })
    return best
  }
  const labelBoxes = useMotionValue<NameBox[]>([])
  const labelSizes = useRef<NameBox[]>([])
  const measured = (i: number, box: NameBox) => { labelSizes.current[i] = box }
  const wide = useWide()
  // Night names are in Cinzel, which may arrive after the first measure (font-display: swap): measure every
  // name again whenever a font finishes loading (fonts.ready alone can resolve before Cinzel is even requested).
  // Read straight from the DOM, so a font arriving mid-gesture costs no re-render of the pins.
  useEffect(() => {
    const set = document.fonts
    if (!set) return
    const remeasure = () => {
      frame.current?.querySelectorAll<HTMLElement>('[data-tag]').forEach((el) => {
        labelSizes.current[Number(el.dataset.tag)] = measureName(el)
      })
      labelBoxes.set(labelBoxes.get().map((_, i) => labelSizes.current[i] ?? { w: 0, h: 0 }))
    }
    set.addEventListener('loadingdone', remeasure)
    set.ready.then(remeasure)
    return () => set.removeEventListener('loadingdone', remeasure)
  }, [labelBoxes])
  const labels = useTransform(() => {
    const { w, h } = size.get()
    const s = side()
    const toScreen = (px: number, py: number) => ({ x: w / 2 + x.get() + (px / 1000 - 0.5) * s, y: h / 2 + y.get() + (py / 1000 - 0.5) * s })
    const art = markSize('art', s)
    const icon = markSize('icon', s)
    const orb = orbSize(s, spacing)
    const ring = markSize('ring', s)
    const square = (c: { x: number; y: number }, r: number) => ({ x0: c.x - r, y0: c.y - r, x1: c.x + r, y1: c.y + r })
    // What a structure's art covers: its sprite and its element badge, not its whole square box.
    const artOf = (c: { x: number; y: number }, structure: StructureKey) => {
      const { kind, element } = splitStructure(structure)
      return artFootprint(c, art, ART_ASPECT[kind] ?? 1, element !== null)
    }
    // Pins with a name are placed as marks with a label (the tags); the rest only block: their art, an orb's glow,
    // or the player's marker (crest-sized).
    const pinRects = props.pins.filter((p) => !(p.name && p.structure)).flatMap((p) => {
      const c = toScreen(p.x, p.y)
      if (p.structure) return artOf(c, p.structure)
      return [square(c, p.state === 'spawn' ? icon / 2 : orb / 2)]
    })
    const boxes = labelBoxes.get()
    const points = tags.map((t) => toScreen(t.x, t.y))
    // The castle, whose guard's name is its own: the box round its crests.
    const castle = tags.flatMap((t, i) => (t.kind === 'castle' && t.mark === 'icon' ? [square(points[i], icon * ICON_BODY)] : []))
      .reduce<Rect | undefined>((u, r) => (u ? { x0: Math.min(u.x0, r.x0), y0: Math.min(u.y0, r.y0), x1: Math.max(u.x1, r.x1), y1: Math.max(u.y1, r.y1) } : r), undefined)
    const requests: LabelRequest[] = tags.map((t, i) => {
      const point = points[i]
      const label = t.silent ? { w: 0, h: 0 } : boxes[i] ?? { w: 0, h: 0 }
      const rank = labelRank(t.kind)
      // A night's name sits centred just above its ring, else below it, across it or beside it, wherever it covers no
      // other mark's art; no other name may enter the ring's disc: inside it, a site's name would read as the night's.
      if (t.mark === 'ring') {
        const disc = square(point, ring * RING_DISC)
        return { point, label, rank, keep: true, ring: true, mark: 0, box: disc, body: [{ ...disc, round: true }], gap: 2, wrap: boxes[i]?.wrap }
      }
      // A name alone sits just beside its point, on whichever side is clear of the marks around it. On a phone the
      // castle guard's point lies right on top of the castle's crests, drawn at their floor size, so every spot round
      // the point runs into them: there its spots go round the crests instead, which read as its own.
      if (t.mark === 'none') return { point, label, rank, keep: false, mark: 0, gap: 2, box: t.kind === 'castle' && !wide ? castle : undefined }
      // A site's name hugs its sprite, over the top or bottom edge of the art, but never over its own element badge.
      if (t.mark === 'art') {
        const body = artOf(point, t.structure!)
        const [sprite, ...badge] = body
        const box = body.reduce((u, r) => ({ x0: Math.min(u.x0, r.x0), y0: Math.min(u.y0, r.y0), x1: Math.max(u.x1, r.x1), y1: Math.max(u.y1, r.y1) }))
        const tuck = art * ART_TUCK
        const heart = { ...sprite, y0: sprite.y0 + tuck, y1: sprite.y1 - tuck }
        const own = [...(heart.y1 > heart.y0 ? [heart] : []), ...badge]
        return { point, label, rank, keep: false, mark: 0, box, body, own, gap: -tuck }
      }
      const r = icon * (t.kind === 'evergaol' ? EVERGAOL_BODY : ICON_BODY)
      // A crest's name on a phone may also go on two narrow lines straight under it.
      const crest = t.kind === 'boss' || t.kind === 'castle'
      const wrap = crest && !wide ? boxes[i]?.wrap : undefined
      return { point, label, rank, keep: false, mark: r, box: square(point, r), gap: 1, wrap }
    })
    // The visible band runs from the pill's bottom edge to whatever covers the bottom right now (the sheet),
    // so no label is sliced by the sheet or drawn under the pill's controls.
    const visible = { w, top: props.topInset.get(), h: h - props.bottomInset.get() }
    // The medallion and its card are drawn over the map: names keep off them.
    const blocked = (props.corner?.get().rects ?? []).map((r) => ({ x0: r.x0, x1: r.x1, y0: visible.h - r.top, y1: visible.h - r.bottom }))
    // One line of a name: the shortest name box, as every map has names on one line.
    const line = Math.min(...requests.filter((r) => !r.ring && r.label.h > 0).map((r) => r.label.h))
    const spots = placeLabels(requests, visible, pinRects, LABEL_GAP, LABEL_EDGE, 0, blocked, Number.isFinite(line) ? line : 0)
      .map((spot, i) => ({ ...spot, x: spot.x - points[i].x, y: spot.y - points[i].y }))
    // A called-out name goes centred just above its mark, over everything, or below it where the pill leaves no room.
    if (calloutAt === null) return spots
    const { point, box, mark = 0 } = requests[calloutAt]
    const called = boxes[tags.length] ?? { w: 0, h: 0 }
    const around = box ?? square(point, mark)
    const calloutX = Math.min(w - LABEL_EDGE - called.w, Math.max(LABEL_EDGE, (around.x0 + around.x1) / 2 - called.w / 2))
    const above = around.y0 - CALLOUT_GAP - called.h
    const calloutY = above >= visible.top + LABEL_EDGE ? above : around.y1 + CALLOUT_GAP
    // The mark's own name steps aside while its callout says it, so the name is never written twice.
    spots[calloutAt] = { ...spots[calloutAt], shown: false }
    return [...spots, { x: calloutX - point.x, y: calloutY - point.y, shown: true }]
  })
  // Tags measure their labels in their own layout effects, which run before this component's: published
  // from here, after the transform above has subscribed (in its own layout effect, declared earlier), so the
  // new sizes are never missed.
  // The callout's size comes last, after every tag's.
  useLayoutEffect(() => labelBoxes.set([...tags, null].map((_, i) => labelSizes.current[i] ?? { w: 0, h: 0 })), [tags, labelBoxes, calloutAt])

  // use-gesture swallows the click that ends a pan, so any click reaching the frame is a real tap.
  return (
    <div ref={frame} className="map-frame" onClick={(e) => tapAt(e.clientX, e.clientY)}>
      <motion.div className="map-layer" style={{ x, y, scale, opacity: fade }}>
        <img className="map-image" src={`/maps/${props.earth}.webp`} alt="" draggable={false} />
        <motion.div className="map-scrim" animate={{ opacity: props.dim ? 0.55 : 0 }} transition={snap} aria-hidden />
        {/* Rings first: the sites on the ground they cover still show on top. Their names come after the pins. */}
        {props.markers?.map((m, i) => m.layer === 'circle' && (
          <motion.span key={`r${i}`} className="marker ring-mark" style={{ left: `${m.x / 10}%`, top: `${m.y / 10}%`, scale: pinScale }}>
            <motion.span className="mark" style={{ scale: ringScale }}><Ring night={m.night ?? 1} /></motion.span>
          </motion.span>
        ))}
        {props.pins.map((p) => (
          <motion.span
            // Keyed by what the pin shows, so a structure already on the map stays put when the result takes over.
            // An orb keeps its element through state changes (spawn option to spawn, open to candidate), so a
            // keyboard user's focus on it survives the change instead of falling to the document body.
            key={`${p.slot}:${p.structure ?? 'dot'}`}
            className={`pin pin-${p.state}${props.selected === p.slot ? ' pin-selected' : ''}`}
            // A pin that does nothing (the result map) is a named image, not a Tab stop or a button to VoiceOver.
            {...(props.onPin ? {} : { role: 'img', 'aria-label': p.label })}
            data-slot={p.slot} // a stable handle for tests; labels speak player vocabulary, not slot numbers
            style={{ left: `${p.x / 10}%`, top: `${p.y / 10}%`, scale: pinScale }}
            initial={{ opacity: 0 }}
            // A certain ghost dims its art alone (map.css), so its dashed ring stays clearly visible.
            animate={{ opacity: p.state === 'dimmed' ? 0.4 : 1 }}
            transition={{ type: 'spring', visualDuration: 0.35, bounce: 0.2 }}
          >
            <motion.span className="pin-body" style={{ scale: p.structure ? artScale : p.state === 'spawn' ? iconScale : orbScale }}>
              <motion.span className={p.structure ? 'pin-mark' : 'pin-mark pin-orb'} animate={{ scale: props.selected === p.slot ? 1.2 : 1 }} transition={{ type: 'spring', visualDuration: 0.3, bounce: 0.25 }}>
                {p.structure
                  ? <StructureIcon structure={p.structure} size={ART_SIZE} />
                  : p.state === 'spawn'
                    ? <img className="orb" src={ORB_ART.spawn} width={PLAYER_BOX} height={PLAYER_BOX} data-disc={0.48} alt="" draggable={false} />
                    : <img className="orb" src={ORB_ART[p.state] ?? ORB_ART.open} width={ORB_BOX} height={ORB_BOX} data-disc={ORB_DISC} alt="" draggable={false} />}
                {/* A Church at the spawn point: the art stays whole and the player marker rides on its corner, so both show. */}
                {p.state === 'spawn' && p.structure && <img className="spawn-badge" src={ORB_ART.spawn} alt="" draggable={false} />}
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
        {/* After the pins, so a name is never under a structure; placeLabels also keeps it off every mark. */}
        {props.markers?.map((m, i) => (
          <Tag key={`m${i}`} index={i} at={m} className={`marker-${m.layer}${m.plain ? ' marker-plain' : ''}`} labels={labels} onMeasure={measured} pinScale={pinScale}
            text={m.layer === 'circle' ? <RingName marker={m} /> : tags[i].silent ? null : m.label} textKey={m.label}>
            {m.layer !== 'circle' && <MarkerIcon marker={m} scale={iconScale} />}
          </Tag>
        ))}
        {/* A site's name: the pin above draws its art, the name goes under it where there is room. It is part of
            the pin's own accessible name (ResultOverlay), so the text itself is hidden from screen readers. */}
        {namedPins.map((p, j) => (
          <Tag key={`p${p.slot}`} index={markerCount + j} at={p} className="marker-site" labels={labels} onMeasure={measured}
            pinScale={pinScale} text={p.name!} textKey={p.name!} hidden />
        ))}
        {/* The called-out name, over every other mark; the mark's own accessible name already says it. */}
        {calloutAt !== null && (
          <Tag key={`c${calloutAt}`} index={tags.length} at={tags[calloutAt]} className="marker-callout" labels={labels} onMeasure={measured}
            pinScale={pinScale} text={nameOf(calloutAt)} textKey={nameOf(calloutAt)} hidden />
        )}
      </motion.div>
    </div>
  )
}

// Gap kept between a label and the frame's edges; distance from a small glyph's point to its label.
const LABEL_EDGE = 8
const LABEL_GAP = 9
// Distance from a mark to its called-out name.
const CALLOUT_GAP = 4
// A night's ring's disc (its bright rim, not the soft glow beyond it), as a share of the ring's size: no other
// name enters it.
const RING_DISC = 0.4
// How far a site's name tucks over the edge of its own sprite, as a share of the art: close enough to read as
// its name, clear of the neighbours' art.
const ART_TUCK = 0.17
// Half a crest's drawn size, as a share of its icon box; an evergaol is drawn smaller (map.css).
const ICON_BODY = 0.45
const EVERGAOL_BODY = 0.39
// The orb art per pin state: gold "?" for an unknown site, teal for a possible spawn, the player for the spawn.
const ORB_ART: Partial<Record<PinState, string>> & { open: string; spawn: string } = {
  open: '/markers/unknown.webp', candidate: '/markers/unknown.webp', dimmed: '/markers/unknown.webp',
  'spawn-option': '/markers/spawn-option.webp', spawn: '/markers/player.webp',
}

/** How a tag is drawn and ranked: its mark on the point and what its name belongs to. */
interface TagSpec { x: number; y: number; kind: NameKind; mark: 'art' | 'icon' | 'ring' | 'none'; silent?: boolean; structure?: StructureKey }
function tagOf(m: MapMarker): TagSpec {
  const at = { x: m.x, y: m.y }
  if (m.layer === 'circle') return { ...at, kind: 'night', mark: 'ring' }
  const mark = m.plain || !MARKER_ART[m.layer] ? 'none' : 'icon'
  if (m.layer === 'castle') return { ...at, kind: 'castle', mark }
  if (m.layer === 'boss' || m.layer === 'evergaol') return { ...at, kind: m.layer, mark }
  // A chest's icon says all its name would: the name is left to screen readers.
  if (m.layer === 'chest') return { ...at, kind: 'chest', mark, silent: true }
  return { ...at, kind: 'other', mark }
}
const MARKER_ART: Partial<Record<MapMarker['layer'], string>> = {
  boss: '/markers/field-boss.webp', castle: '/markers/field-boss.webp', evergaol: '/markers/evergaol.webp',
  chest: '/markers/chest.webp', merchant: '/markers/merchant.webp', caravan: '/markers/caravan.webp',
}

/** A marker's game icon, sized with the map; a plain name (the castle's guard) has none. */
function MarkerIcon({ marker, scale }: { marker: MapMarker; scale: MotionValue<number> }) {
  const src = marker.great ? '/markers/great-boss.webp' : MARKER_ART[marker.layer]
  if (marker.plain || !src) return null
  return (
    <motion.span className="mark" style={{ scale }}>
      {/* A chest has no visible name: the icon carries it. */}
      <img className="marker-icon" src={src} width={ICON_SIZE} height={ICON_SIZE} alt={marker.layer === 'chest' ? marker.label : ''} draggable={false} />
    </motion.span>
  )
}

/** "1 · Tree Sentinel": the night in its ring's colour, then its boss as the game's map writes it. */
function RingName({ marker }: { marker: MapMarker }) {
  const boss = marker.label.replace(/^Night \d: /, '')
  return (
    <>
      <span aria-hidden><span className={`ring-${marker.night}`}>{marker.night}</span> · {shortBossName(boss)}</span>
      <span className="sr-only">{marker.label}</span>
    </>
  )
}

/**
 * A night's closing ring: a soft glow either side of a bright rim, in the night's colour (map.css). Gradients,
 * not a blur filter, so a ring costs nothing extra to repaint as the map zooms.
 */
function Ring({ night }: { night: 1 | 2 }) {
  const glow = `ring-glow-${night}`
  const c = RING_SIZE / 2
  return (
    <svg className={`ring ring-${night}`} width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden>
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

/** A mark on the exact point, with its name beside it (or across it) where MapView's placement pass put it. */
function Tag({ index, at, className, labels, onMeasure, pinScale, text, textKey, hidden, children }: {
  index: number
  at: { x: number; y: number }
  className: string
  labels: MotionValue<{ x: number; y: number; shown: boolean; wrapped?: boolean }[]>
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
  // A name placed on its two-line wrap takes that narrower width and may break, a night's name included (measureName
  // keeps both widths).
  useEffect(() => spot.on('change', (o) => {
    const el = label.current
    if (!el) return
    const width = o.wrapped ? el.dataset.wrap : el.dataset.w
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
        <motion.span ref={label} className="map-name" data-tag={index} aria-hidden={hidden || undefined} style={{ x: labelX, y: labelY, opacity: labelOpacity }}>{text}</motion.span>
      )}
    </motion.span>
  )
}

/** A name's box as placed, and `wrap`, its box on two lines as narrow as its words allow, when that is narrower. */
interface NameBox { w: number; h: number; wrap?: { w: number; h: number } }

/**
 * A name's size as placed. A name that wraps is as wide as its longest line, not its max-width: the box is shrunk
 * to that line (the same breaks still fit), so its neighbours may come as close as the words themselves. Both
 * widths are kept on the element for Tag, which shows whichever the placement chose.
 */
function measureName(el: HTMLElement): NameBox {
  el.style.width = ''
  el.style.whiteSpace = ''
  // On screen the name may be scaled with the map mid-gesture: back to its own px.
  const scale = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1
  const w = textWidth(el, scale)
  if (w > 0 && w < el.offsetWidth) el.style.width = `${w}px`
  const box = { w: el.offsetWidth, h: el.offsetHeight }
  const base = el.style.width
  const two = twoLines(el, scale)
  el.style.width = base
  el.style.whiteSpace = ''
  const wrap = two && two.w < box.w ? two : undefined
  el.dataset.w = base
  el.dataset.wrap = wrap ? `${wrap.w}px` : base
  return wrap ? { ...box, wrap } : box
}

/** The width of the words themselves, in the name's own px. */
function textWidth(el: HTMLElement, scale: number): number {
  const range = document.createRange()
  range.selectNodeContents(el)
  return Math.ceil(range.getBoundingClientRect().width / scale)
}

/**
 * The name laid out by the browser on two lines as narrow as its words allow, as its box: the narrowest width that
 * still takes no more than two of its lines. Undefined for a single word.
 */
function twoLines(el: HTMLElement, scale: number): { w: number; h: number } | undefined {
  el.style.whiteSpace = 'nowrap'
  el.style.width = ''
  const one = { w: el.offsetWidth, h: el.offsetHeight }
  el.style.whiteSpace = 'normal'
  const fits = (width: number) => {
    el.style.width = `${width}px`
    return el.offsetHeight <= 2 * one.h + 1
  }
  let lo = Math.ceil(one.w / 2)
  let hi = one.w
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (fits(mid)) hi = mid
    else lo = mid + 1
  }
  fits(hi)
  if (el.offsetHeight <= one.h + 1) return undefined
  return { w: Math.min(hi, textWidth(el, scale)), h: el.offsetHeight }
}
