import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, useMotionValue, type MotionValue } from 'motion/react'
import type { MapContent, Pin } from './MapView'
import { Sheet, type Detent } from './Sheet'
import { Glass } from './Glass'
import { Count } from './Count'
import { StructureIcon } from './StructureIcon'
import { StructureButtons, StructureStrip } from './StructureStrip'
import { groupByKind } from './structureGroups'
import { Icon } from './Icon'
import { useSightings, encodeSightings } from './useSightings'
import { useFinePointer, useWide } from './useWide'
import { useMeasure, pillBottom } from './useMeasure'
import { catalog } from '../data/catalog'
import { splitStructure, structureName, nightlordName, earthName, type EarthId, type NightlordId, type SlotId, type StructureKey } from '../domain/names'
import type { Seed } from '../domain/seed'
import { Scouting, type Sighting } from '../domain/scouting'

export function FinderOverlay(props: {
  pool: readonly Seed[]; nightlord: NightlordId; earth: EarthId
  go: (path: string, replace?: boolean) => void; bottomInset: MotionValue<number>; topInset: MotionValue<number>; restInset: MotionValue<number>
  setMap: (content: MapContent) => void
}) {
  const wide = useWide()
  const verb = useFinePointer() ? 'Click' : 'Tap'
  const pillRef = useMeasure(props.topInset, pillBottom)
  // The strip's height plus its offset from the bottom edge; a hidden (empty) strip covers nothing.
  const stripRef = useMeasure(props.restInset, (el) => (el.offsetHeight ? el.offsetHeight + parseFloat(getComputedStyle(el).bottom) : 0))
  const { scouting, update: setScouting, undo } = useSightings(props.pool)
  const [selected, setSelected] = useState<SlotId | null>(null)
  const [focus, setFocus] = useState<StructureKey | null>(null)
  // The strip kind whose element variants are expanded.
  const [open, setOpen] = useState<string | null>(null)
  // Desktop: the site under the mouse, previewed in the side panel until the pointer leaves it.
  const [hover, setHover] = useState<SlotId | null>(null)
  // Desktop: the structure tile under the mouse or focus, named beside the grid's heading.
  const [tileName, setTileName] = useState<string | null>(null)
  const [detent, setDetent] = useState<Detent>('peek')
  const coords = catalog.slotsOf(props.earth)
  const count = scouting.candidates().length
  // Desktop: the side panel's option list, so a new selection can move focus into its first option.
  const optionsRef = useRef<HTMLUListElement>(null)
  const lastSelected = useRef<SlotId | null>(null)

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

  // Also drops the hover preview: a sighting can remove the hovered pin, and a removed pin never reports leaving.
  const close = useCallback(() => { setFocus(null); setOpen(null); setHover(null); setTileName(null); setSelected(null); setDetent('peek') }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  // Desktop: selecting a site moves focus to its first option, so a keyboard user need not tab past
  // every other pin to reach it; closing (Escape, background tap, or picking an option) returns focus
  // to that pin, wherever it landed in the tab order, rather than dropping it to the document body.
  useEffect(() => {
    if (!wide) return
    if (selected) {
      lastSelected.current = selected
      optionsRef.current?.querySelector<HTMLElement>('button')?.focus()
    } else if (lastSelected.current) {
      const slot = lastSelected.current
      lastSelected.current = null
      document.querySelector<HTMLElement>(`.pin-hit[data-slot="${slot}"]`)?.focus()
    }
  }, [selected, wide])

  // The map's bottom inset is whichever covers more: the strip, or the slot sheet as it rises and, once
  // closed, slides away (it keeps publishing until it has left). The map springs to the new inset itself.
  const sheetCover = useMotionValue(0)
  useEffect(() => {
    const sync = () => props.bottomInset.set(Math.max(sheetCover.get(), props.restInset.get()))
    sync()
    const offs = [sheetCover.on('change', sync), props.restInset.on('change', sync)]
    return () => offs.forEach((off) => off())
  }, [sheetCover, props.bottomInset, props.restInset])

  const apply = (next: Scouting) => { setScouting(next); close() }
  // Memoized: MapView re-reveals the selected pin whenever the pins array changes identity.
  const pins = useMemo(() => buildPins(scouting, coords, focus), [scouting, coords, focus])

  // Stable between sightings, so publishing it to the map only happens when something changed.
  const onPin = useCallback((slot: SlotId, state: Pin['state']) => {
    if (state === 'spawn-option') {
      // Desktop: focus goes to the new spawn pin (the same element: MapView keys dots by place), whether the pick
      // came from the keyboard or a click that snapped to it, and not back to a site selected earlier.
      if (wide) {
        lastSelected.current = null
        document.querySelector<HTMLElement>(`.pin-hit[data-slot="${slot}"]`)?.focus()
      }
      return apply(scouting.sight({ type: 'spawn', slot }))
    }
    if (state === 'candidate' && focus) return apply(scouting.sight({ type: 'structure', slot, structure: focus }))
    // The spawn pin stays lit in focus mode to orient by; landing on it is not a request to cancel.
    if (focus && state === 'spawn') return
    if (focus) return setFocus(null)
    setSelected(slot)
    setDetent('half')
  }, [scouting, focus, wide])
  // Layout effect, so the map has these pins before the first paint.
  useLayoutEffect(() => {
    // The step's own pins win a tap in reach: candidates in focus mode, spawn options until the spawn is set.
    // Any other pin still answers a tap on its own; in focus mode that cancels, like the background.
    const preferred = focus ? (p: Pin) => p.state === 'candidate' : (p: Pin) => p.state === 'spawn-option'
    // Spawn pins set the spawn when clicked, so there is nothing about the site to preview.
    const onHover = wide ? (p: Pin | null) => setHover(p && p.state !== 'spawn' && p.state !== 'spawn-option' ? p.slot : null) : undefined
    props.setMap({ pins, dim: focus !== null, selected, onPin, onBackground: close, preferred, onHover })
  }, [pins, focus, selected, onPin, close, props.setMap, wide])

  const spawn = scouting.sightings.find((s) => s.type === 'spawn')
  const atSpawn = selected !== null && spawn?.slot === selected
  const sightedHere = selected ? scouting.sightings.find((s) => s.type !== 'spawn' && s.slot === selected) : undefined
  // The spawn pin holds the spawn sighting, not a structure question.
  const options = selected && !atSpawn ? scouting.possibilitiesAt(selected) : []
  // What was recorded at a sighted site, marked in its list like an iOS selected row.
  const current = sightedHere && (sightedHere.type === 'structure' ? sightedHere.structure : 'nothing')
  const groups = groupByKind(scouting.structuresInPlay().map((p) => p.structure))
  const choices = selected && (
    // Named by the heading or sheet title around it; data-slot is for tests, players never see slot numbers.
    <ul className="options" ref={optionsRef} data-slot={selected}>
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
            // "current" in the name only: aria-current as well would have it announced twice.
            aria-label={`${option === 'nothing' ? 'Nothing here' : structureName(option)}${option === current ? ', current' : ''}, leaves ${remaining}`}
            onClick={() => apply(scouting.sight(option === 'nothing' ? { type: 'nothing', slot: selected } : { type: 'structure', slot: selected, structure: option }))}
          >
            <StructureIcon structure={option === 'nothing' ? null : option} size={40} />
            <span className="option-name">{option === 'nothing' ? 'Nothing here' : structureName(option)}</span>
            <span className="num option-count">
              {option === current && <Icon name="check" size={17} className="option-check" />}
              <Icon name="arrow" size={15} />{remaining}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
  const structureButtons = (
    <StructureButtons groups={groups} open={open} focus={focus}
      onKind={(kind) => { setSelected(null); setFocus(null); setOpen(open === kind ? null : kind) }}
      onVariant={(v) => {
        setSelected(null)
        setFocus(focus === v ? null : v)
        if (splitStructure(v).kind !== open) setOpen(null)
      }}
      onName={wide ? setTileName : undefined} variantsBelow={wide} />
  )
  const choicesTitle = atSpawn ? 'Spawn point' : "What's here?"
  // Read-only: the same rows as the choices, but nothing to click until the site itself is clicked.
  const preview = wide && hover && hover !== selected && (
    <section>
      <h3 className="side-heading">Could be here</h3>
      <ul className="options">
        {scouting.possibilitiesAt(hover).map(({ option, remaining }) => (
          <li key={option} className="option option-preview">
            <StructureIcon structure={option === 'nothing' ? null : option} size={40} />
            <span className="option-name">{option === 'nothing' ? 'Nothing here' : structureName(option)}</span>
            <span className="num option-count"><Icon name="arrow" size={15} />{remaining}</span>
          </li>
        ))}
      </ul>
      <p className="hint">Click the site to record what you see.</p>
    </section>
  )

  return (
    <>
      {/* The three-column centring grid (pill-titled) only makes sense when a title actually renders:
          desktop carries the count in the side panel, so its pill is a plain flex row, a tight control group. */}
      <Glass className={`pill${wide ? '' : ' pill-titled'}`} ref={pillRef}>
        <div className="pill-leading">
          <button className="pill-back" aria-label="Back" onClick={() => props.go('/')}><Icon name="back" /></button>
        </div>
        {/* Desktop shows the count and the guidance in the side panel, so its pill carries only the controls. */}
        {!wide && (
          <span className="pill-text">
            {/* The live region carries the whole phrase, so the words around the digits are hidden from screen readers.
                Count keeps one slot in both states: remounted, the digits would not roll and a pre-filled live region
                may never be announced. */}
            {!spawn && <span aria-hidden>{verb} where you spawned · </span>}
            <Count value={count} phrase={spawn ? `${count} possible` : `${verb} where you spawned, ${count} possible`} />
            {spawn && <span aria-hidden> possible</span>}
          </span>
        )}
        <div className="pill-trailing">
          <button aria-label="Undo" disabled={!undo} onClick={() => { undo?.(); close() }}><Icon name="undo" /></button>
          <button aria-label="Reset" disabled={!scouting.sightings.length}
            onClick={() => apply(Scouting.start(props.pool))}><Icon name="reset" /></button>
        </div>
      </Glass>
      {!wide && (
        <StructureStrip glassRef={stripRef} open={open} hidden={!groups.length}>{structureButtons}</StructureStrip>
      )}
      {wide ? (
        <aside className="side-panel" aria-label="Scouting">
          <h2 className="side-title"><span className="title side-nightlord">{nightlordName(props.nightlord)}</span><span className="side-earth">{earthName(props.earth)}</span></h2>
          <p className="side-count"><Count value={count} phrase={`${count} possible`} /><span aria-hidden> possible</span></p>
          {preview || (choices ? (
            <section>
              <h3 className="side-heading">{choicesTitle}</h3>
              {choices}
            </section>
          ) : <p className="hint">{spawn ? 'Select a site on the map or a structure.' : `${verb} where you spawned on the map.`}</p>)}
          {groups.length > 0 && (
            <section>
              {/* The tile's name goes here, not in a tooltip that would cover the tiles around it. */}
              <h3 className="side-heading structure-heading">
                {/* A hovered tile's name takes the heading's whole line (a kind's name lists its elements, too long to
                    share it); the heading text stays for screen readers, which read the tile's own label. */}
                <span className={tileName ? 'sr-only' : undefined}>Structures still possible</span>
                {tileName && <span className="structure-name" aria-hidden>{tileName}</span>}
              </h3>
              {/* The heading above names it; a matching aria-label would be announced twice. */}
              <div className="structure-grid">{structureButtons}</div>
            </section>
          )}
          {scouting.sightings.length > 0 && (
            <section>
              <h3 className="side-heading">Sightings</h3>
              <ul className="sightings">
                {/* Each row leads with what the map shows there: the spawn puck, the structure, or an empty ring. */}
                {scouting.sightings.map((s) => (
                  <li key={targetOf(s)}>
                    <span className="sighting-glyph" aria-hidden>
                      {s.type === 'spawn' ? <span className="spawn-dot" /> : <StructureIcon structure={s.type === 'structure' ? s.structure : null} size={28} />}
                    </span>
                    {sightingLabel(s)}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      ) : (
        <AnimatePresence>
          {/* One sheet for every site: re-opened while it is still leaving, it turns around and takes the new site's options. */}
          {selected && (
            <Sheet key="slot-sheet" detent={detent} onDetent={(d) => (d === 'peek' ? setSelected(null) : setDetent(d))}
              height={sheetCover} top={props.topInset} label={choicesTitle}
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

// Player vocabulary: what is (or could be) at a place, never its internal slot number.
const sightingLabel = (s: Sighting) =>
  s.type === 'spawn' ? 'Spawn point' : s.type === 'structure' ? structureName(s.structure) : 'Nothing here'

function buildPins(scouting: Scouting, coords: Record<SlotId, { x: number; y: number }>, focus: StructureKey | null): Pin[] {
  const pins: Pin[] = []
  const spawn = scouting.sightings.find((s) => s.type === 'spawn')
  const sighted = new Map(scouting.sightings.flatMap((s) => (s.type === 'spawn' ? [] : [[s.slot, s] as const])))
  const certain = scouting.certainSlots()
  const focusSlots = new Set(focus ? scouting.structuresInPlay().find((p) => p.structure === focus)?.slots ?? [] : [])

  // Focus mode asks one question, so only its candidates stay gold: the spawn options dim with the rest of the
  // map (a spawn option that could hold the structure is a candidate), and a tap on one cancels, recording nothing.
  const spawnOptions = new Map(spawn ? [] : scouting.spawnOptions().map(({ slot, remaining }) => [slot, remaining]))
  if (spawn) {
    pins.push({ slot: spawn.slot, ...coords[spawn.slot], state: 'spawn', structure: null, label: 'Your spawn point' })
  } else if (!focus) {
    for (const [slot, remaining] of spawnOptions) {
      pins.push({ slot, ...coords[slot], state: 'spawn-option', structure: null, label: `Possible spawn point, leaves ${remaining}` })
    }
  }
  const taken = new Set(pins.map((p) => p.slot))
  for (const slot of Object.keys(coords)) {
    if (taken.has(slot)) continue
    const s = sighted.get(slot)
    const known = certain.get(slot) ?? null
    if (s) {
      pins.push({ slot, ...coords[slot], state: 'sighted', structure: s.type === 'structure' ? s.structure : null, label: `${sightingLabel(s)}, sighted` })
    } else if (focusSlots.has(slot)) {
      // A certain slot can still be confirmed in focus mode, so it joins the candidates.
      pins.push({ slot, ...coords[slot], state: 'candidate', structure: known, label: `${structureName(focus!)} here?` })
    } else if (spawnOptions.has(slot)) {
      pins.push({ slot, ...coords[slot], state: 'dimmed', structure: null, label: `Possible spawn point, leaves ${spawnOptions.get(slot)}` })
    } else if (known) {
      pins.push({ slot, ...coords[slot], state: 'certain', structure: known, label: `${structureName(known)}, certain` })
    } else if (scouting.possibilitiesAt(slot).some((p) => p.option !== 'nothing')) {
      pins.push({ slot, ...coords[slot], state: focus ? 'dimmed' : 'open', structure: null, label: 'Unknown site' })
    }
  }
  return pins
}
