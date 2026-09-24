import { useLayoutEffect, useMemo, useState } from 'react'
import { motion, type MotionValue } from 'motion/react'
import type { MapContent, Pin } from './MapView'
import { Sheet, type Detent } from './Sheet'
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
  seed: Seed; go: (path: string, replace?: boolean) => void
  bottomInset: MotionValue<number>; topInset: MotionValue<number>; restInset: MotionValue<number>
  setMap: (content: MapContent) => void
}) {
  const wide = useWide()
  const pillRef = useMeasure(topInset, pillBottom)
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
    if (on.has('spawn')) list.push({ slot: seed.spawn, ...coords[seed.spawn], state: 'spawn', structure: null, label: 'Spawn point' })
    if (on.has('structures')) {
      for (const [slot, key] of Object.entries(seed.slots)) {
        if (key && slot !== seed.spawn) list.push({ slot, ...coords[slot], state: 'sighted', structure: key, label: structureName(key) })
      }
    }
    return list
  }, [seed, on])
  const shownMarkers = useMemo(() => markers.filter((m) => on.has(m.layer)), [markers, on])
  useLayoutEffect(() => setMap({ pins, markers: shownMarkers }), [pins, shownMarkers, setMap])

  const flash = (text: string) => {
    setToast(text)
    setTimeout(() => setToast(null), 1500)
  }
  // Native share sheet on phone; on desktop the OS share dialog is a detour, so copy the link.
  const share = async () => {
    const url = `${location.origin}/seed/${seed.id}`
    if (!wide && navigator.share) return navigator.share({ title: `Seed ${seed.id}`, url }).catch(() => {})
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
    if (q === null) return go('/')
    const rest = encodeSightings(decodeSightings(q).slice(0, -1))
    go(`/find/${seed.nightlord}/${seed.earth}${rest ? `?${new URLSearchParams({ s: rest })}` : ''}`)
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
        const items = markers.filter((m) => m.layer === layer)
        return items.length ? (
          <section key={layer} className="result-list">
            <h3>{heading}</h3>
            <ul className="run-card">{items.map((m, i) => <RunRow key={`${i}:${m.label}`} value={m.label} />)}</ul>
          </section>
        ) : null
      })}
    </>
  )

  return (
    <>
      <Glass className="pill" ref={pillRef}>
        <button className="pill-back" aria-label="Back" onClick={back}><Icon name="back" /></button>
        <div className="chips" role="group" aria-label="Map layers">
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
function RunRow({ label, value }: { label?: string; value: string }) {
  const [open, setOpen] = useState(false)
  const notes = catalog.bossNotes(value)
  const Row = label ? 'div' : 'li'
  const Value = label ? 'dd' : 'span'
  const Notes = label ? motion.dd : motion.p
  return (
    <Row className="run-row">
      {label && <dt>{label}</dt>}
      <Value className="run-value">
        {notes ? (
          <button className="run-more" aria-expanded={open} onClick={() => setOpen(!open)}>
            {value}
            <Icon name="chevron" size={14} className="run-chevron" />
          </button>
        ) : value}
      </Value>
      {open && <Notes className="run-notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{notes}</Notes>}
    </Row>
  )
}
