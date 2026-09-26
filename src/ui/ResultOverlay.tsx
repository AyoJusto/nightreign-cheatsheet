import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { MotionValue } from 'motion/react'
import type { MapContent, MapMarker, Pin } from './MapView'
import { Sheet, type Detent } from './Sheet'
import { collapseRepeats } from './collapseRepeats'
import { Plate } from './Plate'
import { Frame } from './Frame'
import { Icon } from './Icon'
import { useWide } from './useWide'
import './weakness.css'
import { useMeasure, pillBottom } from './useMeasure'
import { decodeSightings, encodeSightings } from './useSightings'
import { catalog } from '../data/catalog'
import { DAMAGE_NAMES, earthName, nightlordName, splitStructure, structureName, type DamageKey, type Weakness } from '../domain/names'
import type { MarkerLayer, Seed } from '../domain/seed'

type Layer = 'structures' | 'spawn' | MarkerLayer
const LAYER_NAMES: Record<Layer, string> = {
  structures: 'Structures', spawn: 'Spawn', circle: 'Circles', boss: 'Bosses', evergaol: 'Evergaols',
  chest: 'Chests', merchant: 'Merchant', 'rot-blessing': 'Rot Blessing',
}
// A phone's chips: the layer's own map mark over a short name, each the same width, so six fit an iPhone's pill
// and a longer row scrolls a whole chip at a time. The full name is the chip's accessible name.
const LAYER_SHORT: Record<Layer, string> = {
  structures: 'Sites', spawn: 'Spawn', circle: 'Rings', boss: 'Bosses', evergaol: 'Gaols', chest: 'Chests', merchant: 'Shop', 'rot-blessing': 'Rot',
}
const LAYER_ICON: Record<Layer, string> = {
  structures: '/structures/great-church.webp', spawn: '/markers/player.webp', circle: '', boss: '/markers/field-boss.webp',
  evergaol: '/markers/evergaol.webp', chest: '/markers/chest.webp', merchant: '/markers/merchant.webp', 'rot-blessing': '/elements/rot.webp',
}
const CHIP_STEP = 49 + 4 // a phone chip's width and the gap after it
const MARKER_LAYERS = ['circle', 'boss', 'evergaol', 'chest', 'merchant', 'rot-blessing'] as const
const LISTS = [['boss', 'Field bosses'], ['evergaol', 'Evergaols'], ['merchant', 'Merchants']] as const

export function ResultOverlay({ seed, go, bottomInset, topInset, restInset, setMap }: {
  seed: Seed; go: (path: string, back?: boolean) => void
  bottomInset: MotionValue<number>; topInset: MotionValue<number>; restInset: MotionValue<number>
  setMap: (content: MapContent) => void
}) {
  const wide = useWide()
  const pillRef = useMeasure(topInset, pillBottom)
  const chips = useRef<HTMLDivElement>(null)
  // Fades an edge only when there is more to scroll that way, same approach as the strip (StructureStrip.tsx).
  const fadeChips = useCallback(() => {
    const el = chips.current
    if (!el) return
    el.toggleAttribute('data-more-left', el.scrollLeft > 1)
    el.toggleAttribute('data-more-right', el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])
  // Phone: the row is cut to the chips that fit whole, so a scrolled row never shows half a chip (or half a word).
  const fitChips = useCallback(() => {
    const el = chips.current
    const pill = el?.parentElement
    if (!el || !pill) return
    el.style.flex = ''
    if (wide) return fadeChips()
    const room = el.getBoundingClientRect().width
    const whole = Math.max(1, Math.floor((room + 4) / CHIP_STEP))
    if (whole * CHIP_STEP - 4 < el.scrollWidth - 1) el.style.flex = `0 0 ${whole * CHIP_STEP - 4}px`
    fadeChips()
  }, [wide, fadeChips])
  useEffect(() => {
    const pill = chips.current!.parentElement!
    const observer = new ResizeObserver(fitChips)
    observer.observe(pill)
    return () => observer.disconnect()
  }, [fitChips])
  useEffect(fitChips)
  const [detent, setDetent] = useState<Detent>('peek')
  const [toast, setToast] = useState<string | null>(null)
  const markers = seed.markers
  const available: Layer[] = ['structures', 'spawn', ...MARKER_LAYERS.filter((l) => markers.some((m) => m.layer === l))]
  // Everything shows at first, as on the game's map; names give way to each other by priority (MapView).
  const [on, setOn] = useState<Set<Layer>>(() => new Set(available))
  // The castle's guard written over the castle, with its rooftop (great crest) and basement (field crest)
  // bosses where the game draws them; the Bosses layer shows them with the field bosses.
  const castle = useMemo<MapMarker[]>(() => {
    const at = catalog.castleOf(seed.earth)
    if (!at || !seed.castle) return []
    const { crew, rooftop, basement } = seed.castle
    return [
      { layer: 'castle', ...at.crew, label: crew, plain: true },
      ...(rooftop ? [{ layer: 'castle' as const, ...at.rooftop, label: rooftop, great: true }] : []),
      ...(basement ? [{ layer: 'castle' as const, ...at.basement, label: basement }] : []),
    ]
  }, [seed])
  // Caravans stand on open ground where nothing is built: a small cart, drawn in the game icons' style, and a name.
  const caravans = useMemo<MapMarker[]>(() => {
    const coords = catalog.slotsOf(seed.earth)
    return Object.entries(seed.inside)
      .filter(([slot]) => !seed.slots[slot] && coords[slot])
      .map(([slot, label]) => ({ layer: 'caravan', ...coords[slot], label }))
  }, [seed])

  const pins = useMemo<Pin[]>(() => {
    const coords = catalog.slotsOf(seed.earth)
    const list: Pin[] = []
    // A Church stands at the spawn point in 65 seeds: with both layers on, the spawn pin carries its art.
    const atSpawn = on.has('structures') ? seed.slots[seed.spawn] : null
    if (on.has('spawn')) {
      list.push({ slot: seed.spawn, ...coords[seed.spawn], state: 'spawn', structure: atSpawn, label: atSpawn ? `Spawn point, ${structureName(atSpawn)}` : 'Spawn point' })
    }
    if (on.has('structures')) {
      for (const [slot, key] of Object.entries(seed.slots)) {
        if (!key || (slot === seed.spawn && on.has('spawn'))) continue
        // What is inside is written on the map under the art, and spoken as part of the pin's name.
        const name = seed.inside[slot]
        list.push({ slot, ...coords[slot], state: 'sighted', structure: key, label: name ? `${structureName(key)}, ${name}` : structureName(key), name: name && mapName(key, name) })
      }
    }
    return list
  }, [seed, on])
  const shownMarkers = useMemo<MapMarker[]>(() => [
    ...markers.filter((m) => on.has(m.layer)),
    ...(on.has('boss') ? castle : []),
    ...(on.has('structures') ? caravans : []),
  ], [markers, castle, caravans, on])
  useLayoutEffect(() => setMap({ pins, markers: shownMarkers }), [pins, shownMarkers, setMap])

  // One timer for the one toast: a new toast restarts it, so the old timer cannot cut the new one short.
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(toastTimer.current), [])
  const flash = (text: string) => {
    clearTimeout(toastTimer.current)
    setToast(text)
    toastTimer.current = setTimeout(() => setToast(null), 1500)
  }
  // Native share sheet on phone; on desktop the OS share dialog is a detour, so copy the link.
  const share = async () => {
    const url = `${location.origin}/seed/${seed.id}`
    if (!wide && navigator.share) {
      try {
        return await navigator.share({ title: `Seed ${seed.id}`, url })
      } catch (e) {
        // The user closing the sheet is an answer; any other failure (e.g. NotAllowedError) falls back to copying.
        if ((e as Error | null)?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      flash('Link copied')
    } catch {
      flash('Could not copy the link')
    }
  }
  // One sighting back, so the finder does not re-identify this seed and bounce straight here again.
  // A shared link has no sightings and goes home.
  const back = () => {
    const params = new URLSearchParams(location.search)
    const q = params.get('s')
    if (q === null) return go('/', true)
    const rest = encodeSightings(decodeSightings(q).slice(0, -1))
    const nightlord = params.get('n') === 'unknown' ? 'unknown' : seed.nightlord
    go(`/find/${nightlord}/${seed.earth}${rest ? `?${new URLSearchParams({ s: rest })}` : ''}`, true)
  }
  const toggle = (l: Layer) =>
    setOn((s) => {
      const next = new Set(s)
      if (next.has(l)) next.delete(l)
      else next.add(l)
      return next
    })

  const title = (
    // Two single lines keep the peek short; long names truncate here and show in full in the run card.
    <div className="result-head">
      <div className="result-text">
        <div className="result-line">
          {/* "Seed" in the game's face; the number in the system face, where 0 never reads as O. */}
          <h1 className="result-title">Seed <span className="num">{seed.id}</span></h1>
          {/* The event and its day: the run card no longer repeats it. */}
          {seed.event && <span className="event-badge">{seed.event.name}{seed.event.day ? ` · Day ${seed.event.day}` : ''}</span>}
        </div>
        <p className="result-sub">{nightlordName(seed.nightlord)} · {earthName(seed.earth)}</p>
      </div>
      <button className="share" aria-label="Share" onClick={share}>
        <Icon name="share" />
      </button>
    </div>
  )
  // Each night's boss with what the weakness data says about it (never guessed; WeakLine says when it has none).
  const weakOf = (boss: string) => catalog.nightBossWeakness(boss)
  const rows: [string, string | null, ReactNode?][] = [
    ['Night 1', seed.nights[1].boss || null, <WeakLine weakness={weakOf(seed.nights[1].boss)} />],
    ['Night 2', seed.nights[2].boss || null, <WeakLine weakness={weakOf(seed.nights[2].boss)} />],
    ['Castle', seed.castle?.crew || null],
    // Short labels under the Castle row: the label column fits the longest one, and a wide column wrapped the boss names.
    ['Basement', seed.castle?.basement || null],
    ['Rooftop', seed.castle?.rooftop || null],
    ['Old Gaol', seed.oldGaol ? 'Present' : null],
  ]
  const runCard = (
    <dl className="run-card">
      {rows.filter(([, v]) => v).map(([k, v, more]) => <RunRow key={`${k}:${v}`} label={k} value={v!} more={more} />)}
    </dl>
  )
  const lists = (
    <>
      {LISTS.map(([layer, heading]) => {
        // Two of the same field boss read as a rendering bug side by side; a count tells them apart.
        const groups = collapseRepeats(markers.filter((m) => m.layer === layer), (m) => m.label)
        return groups.length ? (
          <section key={layer} className="result-list">
            <h3>{heading}</h3>
            <ul className="run-card">{groups.map((g, i) => <RunRow key={`${i}:${g.item.label}`} value={g.item.label} count={g.count} />)}</ul>
          </section>
        ) : null
      })}
    </>
  )

  return (
    <>
      <Plate className="pill" ref={pillRef}>
        <button className="pill-back" aria-label="Back" onClick={back}><Icon name="back" /></button>
        <div className="chips" ref={chips} onScroll={fadeChips} role="group" aria-label="Map layers">
          {available.map((l) => wide ? (
            <button key={l} className="chip" aria-pressed={on.has(l)} onClick={() => toggle(l)}>{LAYER_NAMES[l]}</button>
          ) : (
            <button key={l} className="chip chip-tile" aria-label={LAYER_NAMES[l]} aria-pressed={on.has(l)} onClick={() => toggle(l)}>
              {LAYER_ICON[l] ? <img className={l === 'spawn' ? 'chip-player' : undefined} src={LAYER_ICON[l]} alt="" draggable={false} /> : <span className="chip-ring" />}
              <span aria-hidden>{LAYER_SHORT[l]}</span>
            </button>
          ))}
        </div>
      </Plate>
      {wide ? (
        <aside className="side-panel" aria-label="Seed details"><Frame /><div className="side-scroll">{title}{runCard}{lists}</div></aside>
      ) : (
        <Sheet detent={detent} onDetent={setDetent} height={bottomInset} rest={restInset} top={topInset} label="Seed details" header={title} more={lists}>
          {runCard}
        </Sheet>
      )}
      {toast && <Plate className="toast" role="status">{toast}</Plate>}
    </>
  )
}

// A row label's number ("Night 1") in lining, tabular figures, as the seed number is.
function RowLabel({ label }: { label: string }) {
  const [, words, digits] = label.match(/^(.*?)(\d+)$/) ?? [label, label, '']
  return <>{words}{digits && <span className="num">{digits}</span>}</>
}

// A rise's puzzle clue ("Above Door") means nothing alone on the map: it carries the site it belongs to.
const HINT_SITES = new Set(['sorcerers-rise', 'ruined-rise'])
const mapName = (key: string, name: string) => (HINT_SITES.has(splitStructure(key).kind) ? `Rise · ${name}` : name)

// With a label it is a run card row (dt/dd); without, an item in a list of names.
// `count` is display only (e.g. two identical field bosses -> "Name ×2").
// `more` goes under the value (a night boss's weaknesses).
function RunRow({ label, value, count, more }: { label?: string; value: string; count?: number; more?: ReactNode }) {
  const shown = count && count > 1 ? `${value} ×${count}` : value
  const Row = label ? 'div' : 'li'
  const Value = label ? 'dd' : 'span'
  return (
    <Row className="run-row">
      {label && <dt><RowLabel label={label} /></dt>}
      <Value className="run-value">{shown}{more}</Value>
    </Row>
  )
}

// What to know about a night boss, as the cheatsheet's weakness line does: never blank, since a blank reads as
// missing data. What it is weak to; failing that, what it resists; failing that, that it has no damage weakness;
// and for a fight the data does not cover, that there is no data.
function WeakLine({ weakness }: { weakness: Weakness | undefined }) {
  if (!weakness) return <span className="weak-line weak-none"><span className="sr-only">, </span>No data</span>
  if (weakness.weak.length) return <DamageLine tag="Weak" spoken="weak to" keys={weakness.weak} />
  if (weakness.resist.length) return <DamageLine tag="Resist" spoken="resists" keys={weakness.resist} />
  return <span className="weak-line weak-none"><span className="sr-only">, </span>No damage weakness</span>
}

function DamageLine({ tag, spoken, keys }: { tag: string; spoken: string; keys: DamageKey[] }) {
  return (
    <span className="weak-line">
      <span className="weak-tag" aria-hidden>{tag}</span>
      <span className="sr-only">, {spoken} </span>
      {keys.map((k, i) => (
        <span key={k} className="weak-item">{i > 0 && <span className="sr-only">, </span>}<img src={`/damage/${k}.webp`} alt="" draggable={false} />{DAMAGE_NAMES[k]}</span>
      ))}
    </span>
  )
}
