import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, type MotionValue } from 'motion/react'
import type { MapContent, Pin } from './MapView'
import { Sheet, type Detent } from './Sheet'
import { Glass } from './Glass'
import { Count } from './Count'
import { StructureIcon } from './StructureIcon'
import { useSightings, encodeSightings } from './useSightings'
import { useWide } from './useWide'
import { useMeasure, pillBottom } from './useMeasure'
import { catalog } from '../data/catalog'
import { structureName, nightlordName, earthName, type EarthId, type NightlordId, type SlotId, type StructureKey } from '../domain/names'
import type { Seed } from '../domain/seed'
import { Scouting, type Sighting } from '../domain/scouting'

export function FinderOverlay(props: {
  pool: readonly Seed[]; nightlord: NightlordId; earth: EarthId
  go: (path: string, replace?: boolean) => void; bottomInset: MotionValue<number>; topInset: MotionValue<number>; restInset: MotionValue<number>
  setMap: (content: MapContent) => void
}) {
  const wide = useWide()
  const pillRef = useMeasure(props.topInset, pillBottom)
  // The strip's height plus its offset from the bottom edge; a hidden (empty) strip covers nothing.
  const stripRef = useMeasure(props.restInset, (el) => (el.offsetHeight ? el.offsetHeight + parseFloat(getComputedStyle(el).bottom) : 0))
  const [scouting, setScouting] = useSightings(props.pool)
  const [selected, setSelected] = useState<SlotId | null>(null)
  const [focus, setFocus] = useState<StructureKey | null>(null)
  const [detent, setDetent] = useState<Detent>('peek')
  const coords = catalog.slotsOf(props.earth)
  const count = scouting.candidates().length

  // The delay lets the last pin's animation play before the result takes over.
  useEffect(() => {
    const seed = scouting.identifiedSeed()
    if (!seed) return
    const t = setTimeout(() => {
      // Leave the finder entry one step back, so browser Back lands on a finder that is not already
      // solved (and so does not bounce straight back here), then push the result.
      const full = location.search
      const back = new URL(location.href)
      const rest = scouting.sightings.slice(0, -1)
      if (rest.length) back.searchParams.set('s', encodeSightings(rest))
      else back.searchParams.delete('s')
      history.replaceState(null, '', back)
      props.go(`/seed/${seed.id}${full}`)
    }, 350)
    return () => clearTimeout(t)
  }, [scouting, props.go])

  const close = useCallback(() => { setFocus(null); setSelected(null); setDetent('peek') }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  // With the sheet closed, only the strip covers the bottom of the map. The map springs to the new inset itself.
  useEffect(() => {
    if (selected) return
    props.bottomInset.set(props.restInset.get())
    return props.restInset.on('change', (v) => props.bottomInset.set(v))
  }, [selected, props.bottomInset, props.restInset])

  const apply = (next: Scouting) => { setScouting(next); close() }
  // Memoized: MapView re-reveals the selected pin whenever the pins array changes identity.
  const pins = useMemo(() => buildPins(scouting, coords, focus), [scouting, coords, focus])

  // Stable between sightings, so publishing it to the map only happens when something changed.
  const onPin = useCallback((slot: SlotId, state: Pin['state']) => {
    if (state === 'spawn-option') return apply(scouting.sight({ type: 'spawn', slot }))
    if (state === 'candidate' && focus) return apply(scouting.sight({ type: 'structure', slot, structure: focus }))
    if (focus) return setFocus(null)
    setSelected(slot)
    setDetent('half')
  }, [scouting, focus])
  // Layout effect, so the map has these pins before the first paint.
  useLayoutEffect(() => {
    // The step's own pins win a tap in reach: candidates in focus mode, spawn options until the spawn is set.
    // Any other pin still answers a tap on its own; in focus mode that cancels, like the background.
    const preferred = focus ? (p: Pin) => p.state === 'candidate' : (p: Pin) => p.state === 'spawn-option'
    props.setMap({ pins, dim: focus !== null, selected, onPin, onBackground: close, preferred })
  }, [pins, focus, selected, onPin, close, props.setMap])

  const spawn = scouting.sightings.find((s) => s.type === 'spawn')
  const atSpawn = selected !== null && spawn?.slot === selected
  const sightedHere = selected ? scouting.sightings.find((s) => s.type !== 'spawn' && s.slot === selected) : undefined
  // The spawn pin holds the spawn sighting, not a structure question.
  const options = selected && !atSpawn ? scouting.possibilitiesAt(selected) : []
  // Sorted by key so kinds group together and icons keep their place between sightings.
  const inPlay = [...scouting.structuresInPlay()].sort((a, b) => a.structure.localeCompare(b.structure))

  const choices = selected && (
    <ul className="options" aria-label={`Slot ${selected}`}>
      {/* First, so the half-height sheet never cuts it off. */}
      {sightedHere && (
        <li><button className="option option-clear" onClick={() => apply(scouting.retract(selected))}>Clear</button></li>
      )}
      {atSpawn && (
        <li><button className="option option-clear" onClick={() => apply(scouting.retract('spawn'))}>Change spawn point</button></li>
      )}
      {options.map(({ option, remaining }) => (
        <li key={option}>
          <button
            className="option"
            aria-label={`${option === 'nothing' ? 'Nothing here' : structureName(option)}, leaves ${remaining}`}
            onClick={() => apply(scouting.sight(option === 'nothing' ? { type: 'nothing', slot: selected } : { type: 'structure', slot: selected, structure: option }))}
          >
            <StructureIcon structure={option === 'nothing' ? null : option} size={40} />
            <span className="option-name">{option === 'nothing' ? 'Nothing here' : structureName(option)}</span>
            <span className="num option-count">→ {remaining}</span>
          </button>
        </li>
      ))}
    </ul>
  )
  const structureButtons = inPlay.map(({ structure }) => (
    <motion.button key={structure} layout className="strip-item" aria-label={`Find ${structureName(structure)}`}
      aria-pressed={focus === structure}
      onClick={() => { setSelected(null); setFocus(focus === structure ? null : structure) }}>
      <StructureIcon structure={structure} size={32} />
    </motion.button>
  ))
  const choicesTitle = atSpawn ? 'Spawn point' : "What's here?"

  return (
    <>
      <Glass className="pill" ref={pillRef}>
        <button className="pill-back" aria-label="Back" onClick={() => props.go('/')}>‹</button>
        <span className="pill-text">
          {spawn ? <><Count value={count} /> possible</> : <>Tap where you spawned · <Count value={count} /></>}
        </span>
        <button aria-label="Undo" disabled={!scouting.sightings.length}
          onClick={() => apply(scouting.retract(targetOf(scouting.sightings[scouting.sightings.length - 1])))}>↶</button>
        <button aria-label="Reset" disabled={!scouting.sightings.length}
          onClick={() => apply(Scouting.start(props.pool))}>⟲</button>
      </Glass>
      {!wide && (
        <Glass className="strip" ref={stripRef} role="toolbar" aria-label="Structures still possible">{structureButtons}</Glass>
      )}
      {wide ? (
        <aside className="side-panel" aria-label="Scouting">
          <h2 className="side-title">{nightlordName(props.nightlord)} · {earthName(props.earth)}</h2>
          <p className="side-count"><Count value={count} /> possible</p>
          {choices ? (
            <section>
              <h3 className="side-heading">{choicesTitle} · Slot {selected}</h3>
              {choices}
            </section>
          ) : <p className="hint">Select a slot or a structure.</p>}
          {inPlay.length > 0 && (
            <section>
              <h3 className="side-heading">Structures still possible</h3>
              <div className="structure-grid" role="toolbar" aria-label="Structures still possible">{structureButtons}</div>
            </section>
          )}
          {scouting.sightings.length > 0 && (
            <section>
              <h3 className="side-heading">Sightings</h3>
              <ul className="sightings">
                {scouting.sightings.map((s) => <li key={targetOf(s)}>{sightingLabel(s)}</li>)}
              </ul>
            </section>
          )}
        </aside>
      ) : (
        <AnimatePresence>
          {selected && (
            <Sheet detent={detent} onDetent={(d) => (d === 'peek' ? setSelected(null) : setDetent(d))}
              height={props.bottomInset} label={`Slot ${selected}`}
              header={<h2 className="sheet-title">{choicesTitle}</h2>}>
              {choices}
            </Sheet>
          )}
        </AnimatePresence>
      )}
    </>
  )
}

const targetOf = (s: Sighting) => (s.type === 'spawn' ? 'spawn' : s.slot)

const sightingLabel = (s: Sighting) =>
  s.type === 'spawn' ? `Spawn, slot ${s.slot}` : `Slot ${s.slot}, ${s.type === 'structure' ? structureName(s.structure) : 'nothing here'}`

function buildPins(scouting: Scouting, coords: Record<SlotId, { x: number; y: number }>, focus: StructureKey | null): Pin[] {
  const pins: Pin[] = []
  const spawn = scouting.sightings.find((s) => s.type === 'spawn')
  const sighted = new Map(scouting.sightings.flatMap((s) => (s.type === 'spawn' ? [] : [[s.slot, s] as const])))
  const certain = scouting.certainSlots()
  const focusSlots = new Set(focus ? scouting.structuresInPlay().find((p) => p.structure === focus)?.slots ?? [] : [])

  if (!spawn) {
    for (const { slot, remaining } of scouting.spawnOptions()) {
      pins.push({ slot, ...coords[slot], state: 'spawn-option', structure: null, label: `Spawn point, slot ${slot}, leaves ${remaining}` })
    }
  } else {
    pins.push({ slot: spawn.slot, ...coords[spawn.slot], state: 'spawn', structure: null, label: `Spawn, slot ${spawn.slot}` })
  }
  const taken = new Set(pins.map((p) => p.slot))
  for (const slot of Object.keys(coords)) {
    if (taken.has(slot)) continue
    const s = sighted.get(slot)
    const known = certain.get(slot) ?? null
    if (s) {
      pins.push({ slot, ...coords[slot], state: 'sighted', structure: s.type === 'structure' ? s.structure : null, label: sightingLabel(s) })
    } else if (focusSlots.has(slot)) {
      // A certain slot can still be confirmed in focus mode, so it joins the candidates.
      pins.push({ slot, ...coords[slot], state: 'candidate', structure: known, label: known ? `Slot ${slot}, ${structureName(known)}` : `Slot ${slot}` })
    } else if (known) {
      pins.push({ slot, ...coords[slot], state: 'certain', structure: known, label: `Slot ${slot}, ${structureName(known)}` })
    } else if (scouting.possibilitiesAt(slot).some((p) => p.option !== 'nothing')) {
      pins.push({ slot, ...coords[slot], state: focus ? 'dimmed' : 'open', structure: null, label: `Slot ${slot}` })
    }
  }
  return pins
}
