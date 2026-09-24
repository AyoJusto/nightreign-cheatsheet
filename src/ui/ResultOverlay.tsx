import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, type MotionValue } from 'motion/react'
import type { MapContent, Pin } from './MapView'
import { Sheet, type Detent } from './Sheet'
import { collapseRepeats } from './collapseRepeats'
import { Glass } from './Glass'
import { Icon } from './Icon'
import { useWide } from './useWide'
import { useMeasure, pillBottom } from './useMeasure'
import { decodeSightings, encodeSightings } from './useSightings'
import { catalog } from '../data/catalog'
import { earthName, nightlordName, structureName } from '../domain/names'
import type { MarkerLayer, Seed } from '../domain/seed'

// The user's experience: the Night 1 circle is fixed per seed. Flip this if that proves wrong.
const SHOW_NIGHT1_CIRCLE = true

type Layer = 'structures' | 'spawn' | MarkerLayer
const LAYER_NAMES: Record<Layer, string> = {
  structures: 'Structures', spawn: 'Spawn', circle: 'Circles', boss: 'Bosses', evergaol: 'Evergaols',
  chest: 'Chests', merchant: 'Merchant', 'rot-blessing': 'Rot Blessing',
}
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
  useEffect(() => {
    const el = chips.current!
    const observer = new ResizeObserver(fadeChips)
    observer.observe(el)
    return () => observer.disconnect()
  }, [fadeChips])
  useEffect(fadeChips)
  const [detent, setDetent] = useState<Detent>('peek')
  const [on, setOn] = useState<Set<Layer>>(() => new Set(['structures', 'spawn', 'circle']))
  const [toast, setToast] = useState<string | null>(null)
  // Circle names are never shown as places: Great Hollow reports "Divine Tower" for every Night 2 circle.
  const markers = useMemo(
    () => seed.markers.filter((m) => SHOW_NIGHT1_CIRCLE || !(m.layer === 'circle' && m.night === 1)),
    [seed],
  )
  const available: Layer[] = ['structures', 'spawn', ...MARKER_LAYERS.filter((l) => markers.some((m) => m.layer === l))]

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
        if (key && !(slot === seed.spawn && on.has('spawn'))) list.push({ slot, ...coords[slot], state: 'sighted', structure: key, label: structureName(key) })
      }
    }
    return list
  }, [seed, on])
  const shownMarkers = useMemo(() => markers.filter((m) => on.has(m.layer)), [markers, on])
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
    const q = new URLSearchParams(location.search).get('s')
    if (q === null) return go('/', true)
    const rest = encodeSightings(decodeSightings(q).slice(0, -1))
    go(`/find/${seed.nightlord}/${seed.earth}${rest ? `?${new URLSearchParams({ s: rest })}` : ''}`, true)
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
          <h1 className="title result-title">Seed <span className="num seed-number">{seed.id}</span></h1>
          {seed.event && <span className="event-badge">{seed.event.name}</span>}
        </div>
        <p className="result-sub">{nightlordName(seed.nightlord)} · {earthName(seed.earth)}</p>
      </div>
      <button className="share" aria-label="Share" onClick={share}>
        <Icon name="share" />
      </button>
    </div>
  )
  const rows: [string, string | null][] = [
    ['Night 1', seed.nights[1].boss || null],
    ['Night 2', seed.nights[2].boss || null],
    ['Event', seed.event ? `${seed.event.name}${seed.event.day ? ` · Day ${seed.event.day}` : ''}` : null],
    ['Castle', seed.castle?.crew || null],
    // Short labels under the Castle row: the label column fits the longest one, and a wide column wrapped the boss names.
    ['Basement', seed.castle?.basement || null],
    ['Rooftop', seed.castle?.rooftop || null],
    ['Old Gaol', seed.oldGaol ? 'Present' : null],
  ]
  const runCard = (
    <dl className="run-card">
      {rows.filter(([, v]) => v).map(([k, v]) => <RunRow key={`${k}:${v}`} label={k} value={v!} />)}
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
      <Glass className="pill" ref={pillRef}>
        <button className="pill-back" aria-label="Back" onClick={back}><Icon name="back" /></button>
        <div className="chips" ref={chips} onScroll={fadeChips} role="group" aria-label="Map layers">
          {available.map((l) => (
            <button key={l} className="chip" aria-pressed={on.has(l)} onClick={() => toggle(l)}>{LAYER_NAMES[l]}</button>
          ))}
        </div>
      </Glass>
      {wide ? (
        <aside className="side-panel" aria-label="Seed details">{title}{runCard}{lists}</aside>
      ) : (
        <Sheet detent={detent} onDetent={setDetent} height={bottomInset} rest={restInset} top={topInset} label="Seed details" header={title} more={lists}>
          {runCard}
        </Sheet>
      )}
      {toast && <Glass className="toast" role="status">{toast}</Glass>}
    </>
  )
}

// A boss with notes in the data expands in place to show them; anything else is a plain row.
// With a label it is a run card row (dt/dd); without, an item in a list of names.
// `count` is display only (e.g. two identical field bosses -> "Name ×2"); notes still key off the plain name.
function RunRow({ label, value, count }: { label?: string; value: string; count?: number }) {
  const [open, setOpen] = useState(false)
  const notes = catalog.bossNotes(value)
  const shown = count && count > 1 ? `${value} ×${count}` : value
  const Row = label ? 'div' : 'li'
  const Value = label ? 'dd' : 'span'
  const Notes = label ? motion.dd : motion.p
  return (
    <Row className="run-row">
      {label && <dt>{label}</dt>}
      <Value className="run-value">
        {notes ? (
          <button className="run-more" aria-expanded={open} onClick={() => setOpen(!open)}>
            {shown}
            <Icon name="chevron" size={14} className="run-chevron" />
          </button>
        ) : shown}
      </Value>
      {open && <Notes className="run-notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{notes}</Notes>}
    </Row>
  )
}
