import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, useMotionValue, type MotionValue } from 'motion/react'
import type { MapContent, Pin } from './mapTypes'
import { Sheet, type Detent } from './Sheet'
import { TopBar } from './TopBar'
import { Count } from './Count'
import { StructureIcon } from './StructureIcon'
import { StructureButtons, StructureStrip } from './StructureStrip'
import { groupByKind } from './structureGroups'
import { buildPins, sightingLabel } from './finderPins'
import { Icon } from './Icon'
import { useSightings } from './useSightings'
import { PICK_PATH, findPath, replacePath, seedPath } from './router'
import { useFinePointer, useWide } from './useWide'
import { useMeasure, pillBottom } from './useMeasure'
import { catalog } from '../data/catalog'
import { splitStructure, structureName, nightlordName, earthName, type EarthId, type NightlordPick, type SlotId, type StructureKey } from '../domain/names'
import type { Seed } from '../domain/seed'
import { Scouting, targetOf } from '../domain/scouting'
import { bestiary } from '../bestiary/bestiary'

const NIGHT_ONE = 'night1'
const LAST_PIN_ANIMATION_MS = 350

const stripCoverHeight = (el: HTMLElement) => (el.offsetHeight ? el.offsetHeight + parseFloat(getComputedStyle(el).bottom) : 0)
const previewable = (p: Pin) => p.state !== 'spawn' && p.state !== 'spawn-option'

export function FinderOverlay(props: {
  pool: readonly Seed[]; nightlord: NightlordPick; earth: EarthId
  go: (path: string, back?: boolean) => void; bottomInset: MotionValue<number>; topInset: MotionValue<number>; restInset: MotionValue<number>
  setMap: (content: MapContent) => void
}) {
  const wide = useWide()
  const verb = useFinePointer() ? 'Click' : 'Tap'
  const pillRef = useMeasure(props.topInset, pillBottom)
  const stripRef = useMeasure(props.restInset, stripCoverHeight)
  const { scouting, update: setScouting, undo } = useSightings(props.pool)
  const [selected, setSelected] = useState<SlotId | null>(null)
  const [focus, setFocus] = useState<StructureKey | null>(null)
  const [openKind, setOpenKind] = useState<string | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<SlotId | null>(null)
  const [tileName, setTileName] = useState<string | null>(null)
  const [detent, setDetent] = useState<Detent>('peek')
  const coords = catalog.slotsOf(props.earth)
  const count = scouting.candidates().length
  const optionsRef = useRef<HTMLUListElement>(null)
  const lastSelected = useRef<SlotId | null>(null)

  useEffect(() => {
    const seed = scouting.identifiedSeed()
    if (!seed) return
    const t = setTimeout(() => {
      replacePath(findPath(props.nightlord, props.earth, scouting.sightings.slice(0, -1)))
      props.go(seedPath(seed.id, scouting.sightings, props.nightlord === 'unknown'))
    }, LAST_PIN_ANIMATION_MS)
    return () => clearTimeout(t)
  }, [scouting, props.go, props.nightlord, props.earth])

  // Drops the hover too: a sighting can remove the hovered pin, and a removed pin never reports leaving.
  const close = useCallback(() => { setFocus(null); setOpenKind(null); setHoveredSlot(null); setTileName(null); setSelected(null); setDetent('peek') }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  // Desktop: focus moves into a selected site's options, and back to its pin on close rather than to the body.
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

  const onPin = useCallback((slot: SlotId, state: Pin['state']) => {
    if (state === 'candidate' && focus) return apply(scouting.sight({ type: 'structure', slot, structure: focus }))
    const tappedSpawnWhileFocusing = focus && state === 'spawn'
    if (tappedSpawnWhileFocusing) return
    if (focus) return setFocus(null)
    setSelected(slot)
    setDetent('half')
  }, [scouting, focus, wide])
  // Layout effect, so the map has these pins before the first paint.
  useLayoutEffect(() => {
    const preferred = focus ? (p: Pin) => p.state === 'candidate' : (p: Pin) => p.state === 'spawn-option'
    const onHover = wide ? (p: Pin | null) => setHoveredSlot(p && previewable(p) ? p.slot : null) : undefined
    props.setMap({ pins, dim: focus !== null, selected: selected === NIGHT_ONE ? null : selected, onPin, onBackground: close, preferred, onHover })
  }, [pins, focus, selected, onPin, close, props.setMap, wide])

  const spawn = scouting.sightings.find((s) => s.type === 'spawn')
  const atSpawn = selected !== null && spawn?.slot === selected
  const sightedHere = selected ? scouting.sightings.find((s) => targetOf(s) === selected && s.type !== 'spawn') : undefined
  const pickingNightOne = selected === NIGHT_ONE
  const possible = selected && !pickingNightOne ? scouting.possibilitiesAt(selected) : []
  const nightOne = scouting.sightings.find((s) => s.type === 'night1')
  const nightOneOptions = scouting.nightOneOptions()
  const nightOneHelps = nightOne !== undefined || nightOneOptions.length > 1
  const fightName = (id: string) => bestiary.enemy(id)?.name ?? id
  const openNightOne = () => { setFocus(null); setOpenKind(null); setSelected(NIGHT_ONE); setDetent('half') }
  const spawnChoices = selected && !pickingNightOne && !atSpawn ? scouting.spawnChoicesAt(selected) : []
  const onlyEmptyGround = possible.every((p) => p.option === 'nothing')
  const options = (atSpawn || spawnChoices.length > 0) && onlyEmptyGround ? [] : possible
  const spawnLabel = (structure: StructureKey | null) => (structure ? `You spawned here, ${structureName(structure)}` : 'You spawned here')
  const recordedHere = sightedHere && (sightedHere.type === 'structure' ? sightedHere.structure : 'nothing')
  const groups = groupByKind(scouting.structuresInPlay().map((p) => p.structure))
  const nightOneChoices = (
    <ul className="options" ref={optionsRef} data-night="1">
      {nightOne && (
        <li><button className="option option-clear" onClick={() => apply(scouting.retract(NIGHT_ONE))}>Clear</button></li>
      )}
      {nightOneOptions.map(({ boss, remaining }) => (
        <li key={boss}>
          <button className="option option-text" aria-label={`${fightName(boss)}${nightOne?.type === 'night1' && nightOne.boss === boss ? ', current' : ''}, leaves ${remaining}`}
            onClick={() => apply(scouting.sight({ type: 'night1', boss }))}>
            <span className="option-name">{fightName(boss)}</span>
            <span className="num option-count">
              {nightOne?.type === 'night1' && nightOne.boss === boss && <Icon name="check" size={17} className="option-check" />}
              <Icon name="arrow" size={15} />{remaining}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
  const choices = pickingNightOne ? nightOneChoices : selected && (
    <ul className="options" ref={optionsRef} data-slot={selected}>
      {/* First, so the half-height sheet never cuts it off. */}
      {sightedHere && (
        <li><button className="option option-clear" onClick={() => apply(scouting.retract(selected))}>Clear</button></li>
      )}
      {atSpawn && (
        <li><button className="option option-clear" onClick={() => apply(scouting.retract('spawn'))}>Change spawn point</button></li>
      )}
      {spawnChoices.map(({ structure, remaining }) => (
        <li key={`spawn:${structure}`}>
          <button className="option" aria-label={`${spawnLabel(structure)}, leaves ${remaining}`} onClick={() => apply(scouting.spawnedAt(selected, structure))}>
            <SpawnGlyph structure={structure} />
            <span className="option-name">{spawnLabel(structure)}</span>
            <span className="num option-count"><Icon name="arrow" size={15} />{remaining}</span>
          </button>
        </li>
      ))}
      {options.map(({ option, remaining }) => (
        <li key={option}>
          <button
            className="option"
            // "current" in the name only: aria-current as well would have it announced twice.
            aria-label={`${option === 'nothing' ? 'Nothing here' : structureName(option)}${option === recordedHere ? ', current' : ''}, leaves ${remaining}`}
            onClick={() => apply(scouting.sight(option === 'nothing' ? { type: 'nothing', slot: selected } : { type: 'structure', slot: selected, structure: option }))}
          >
            <StructureIcon structure={option === 'nothing' ? null : option} size={40} />
            <span className="option-name">{option === 'nothing' ? 'Nothing here' : structureName(option)}</span>
            <span className="num option-count">
              {option === recordedHere && <Icon name="check" size={17} className="option-check" />}
              <Icon name="arrow" size={15} />{remaining}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
  const structureButtons = (
    <StructureButtons groups={groups} open={openKind} focus={focus}
      onKind={(kind) => { setSelected(null); setFocus(null); setOpenKind(openKind === kind ? null : kind) }}
      onVariant={(v) => {
        setSelected(null)
        setFocus(focus === v ? null : v)
        if (splitStructure(v).kind !== openKind) setOpenKind(null)
      }}
      onName={wide ? setTileName : undefined} variantsBelow={wide} />
  )
  const choicesTitle = pickingNightOne ? 'Night 1 boss' : atSpawn ? 'Spawn point' : "What's here?"
  const nightOneTile = nightOneHelps && (
    <button className="strip-item night-one-tile" aria-label={nightOne?.type === 'night1' ? `Night 1 boss, ${fightName(nightOne.boss)}` : 'Night 1 boss'}
      aria-pressed={nightOne !== undefined} onClick={openNightOne}>
      <span className="option-ring" aria-hidden>1</span>
    </button>
  )
  const preview = wide && hoveredSlot && hoveredSlot !== selected && (
    <section>
      <h3 className="side-heading">Could be here</h3>
      <ul className="options">
        {scouting.possibilitiesAt(hoveredSlot).map(({ option, remaining }) => (
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
      <TopBar className={wide ? 'pill-corner' : 'pill-titled'} ref={pillRef} onBack={() => props.go(PICK_PATH, true)}
        trailing={<>
          <button aria-label="Undo" disabled={!undo} onClick={() => { undo?.(); close() }}><Icon name="undo" /></button>
          <button aria-label="Reset" disabled={!scouting.sightings.length}
            onClick={() => apply(Scouting.start(props.pool))}><Icon name="reset" /></button>
        </>}>
        {!wide && (
          <span className="pill-text">
            {/* Count keeps one slot in both states: remounted, a pre-filled live region may never be announced. */}
            {!spawn && <span aria-hidden>Spawn point? · </span>}
            <Count value={count} phrase={spawn ? `${count} possible` : `${verb} where you spawned, ${count} possible`} />
            {spawn && <span aria-hidden> possible</span>}
          </span>
        )}
      </TopBar>
      {!wide && (
        <StructureStrip plateRef={stripRef} open={openKind} hidden={!groups.length && !nightOneHelps}>{nightOneTile}{structureButtons}</StructureStrip>
      )}
      {wide ? (
        <aside className="side-panel" aria-label="Scouting">
          <div className="side-scroll">
            <h2 className="side-title"><span className="side-nightlord">{nightlordName(props.nightlord)}</span><span className="side-earth">{earthName(props.earth)}</span></h2>
            <p className="side-count"><Count value={count} phrase={`${count} possible`} /><span aria-hidden> possible</span></p>
            {preview || (choices ? (
              <section>
                <h3 className="side-heading">{choicesTitle}</h3>
                {choices}
              </section>
            ) : <p className="hint">{spawn ? 'Select a site on the map or a structure.' : `${verb} where you spawned on the map.`}</p>)}
            {nightOneHelps && !pickingNightOne && (
              <section>
                <h3 className="side-heading">Night 1 boss</h3>
                <ul className="options">
                  <li>
                    <button className="option option-text" onClick={openNightOne}>
                      <span className="option-name">{nightOne?.type === 'night1' ? fightName(nightOne.boss) : 'Choose the boss'}</span>
                      <span className="num option-count"><Icon name="chevron" size={15} /></span>
                    </button>
                  </li>
                </ul>
              </section>
            )}
            {groups.length > 0 && (
              <section>
                <h3 className="side-heading structure-heading">
                  <span className={tileName ? 'sr-only' : undefined}>Structures still possible</span>
                  {tileName && <span className="structure-name" aria-hidden>{tileName}</span>}
                </h3>
                {/* No aria-label: the heading names it, and a matching one would be announced twice. */}
                <div className="structure-grid">{structureButtons}</div>
              </section>
            )}
            {scouting.sightings.length > 0 && (
              <section>
                <h3 className="side-heading">Sightings</h3>
                <ul className="sightings">
                  {scouting.sightings.map((s) => (
                    <li key={targetOf(s)}>
                      <span className="sighting-glyph" aria-hidden>
                        {s.type === 'spawn' ? <img src="markers/player.webp" width={32} height={32} alt="" /> : s.type === 'night1' ? <span className="option-ring">1</span> : <StructureIcon structure={s.type === 'structure' ? s.structure : null} size={28} />}
                      </span>
                      {sightingLabel(s)}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </aside>
      ) : (
        <AnimatePresence>
          {/* One key for every site: re-opened while leaving, the sheet turns around instead of remounting. */}
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

function SpawnGlyph({ structure }: { structure: StructureKey | null }) {
  if (!structure) return <img className="spawn-glyph" src="markers/player.webp" width={40} height={40} alt="" draggable={false} />
  return (
    <span className="spawn-glyph-beside">
      <StructureIcon structure={structure} size={40} />
      <img src="markers/player.webp" width={24} height={24} alt="" draggable={false} />
    </span>
  )
}
