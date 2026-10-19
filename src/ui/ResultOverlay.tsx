import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { MotionValue } from 'motion/react'
import type { MapContent, MarkTap } from './mapTypes'
import { enemyOfMark, resultMap, type Layer } from './resultMap'
import { Sheet, type Detent } from './Sheet'
import { collapseRepeats } from './collapseRepeats'
import { Plate } from './Plate'
import { Icon } from './Icon'
import { useWide } from './useWide'
import './weakness.css'
import { useMeasure, pillBottom } from './useMeasure'
import { currentSearch, linkTo, resultBackPath } from './router'
import { DAMAGE_NAMES } from '../domain/names'
import { bestiary, headline, type Headline } from '../bestiary/bestiary'
import type { Affliction, Enemy } from '../bestiary/enemy'
import type { Seed } from '../domain/seed'
import { EnemyCardHeader, EnemyFacts, EnemyPageLink } from './EnemyCard'
import { gearForTheRun } from '../domain/gear'

const LAYER_NAMES: Record<Layer, string> = {
  structures: 'Structures', spawn: 'Spawn', circle: 'Circles', event: 'Event', boss: 'Bosses', evergaol: 'Evergaols',
  chest: 'Chests', merchant: 'Merchant', 'rot-blessing': 'Rot Blessing',
}
const LAYER_SHORT: Record<Layer, string> = {
  structures: 'Sites', spawn: 'Spawn', circle: 'Rings', event: 'Event', boss: 'Bosses', evergaol: 'Gaols', chest: 'Chests', merchant: 'Shop', 'rot-blessing': 'Rot',
}
const LAYER_ICON: Record<Layer, string> = {
  structures: 'structures/great-church.webp', spawn: 'markers/player.webp', circle: '', event: '', boss: 'markers/field-boss.webp',
  evergaol: 'markers/evergaol.webp', chest: 'markers/chest.webp', merchant: 'markers/merchant.webp', 'rot-blessing': 'elements/rot.webp',
}
const CHIP_WIDTH = 49
const CHIP_GAP = 4
const CHIP_STEP = CHIP_WIDTH + CHIP_GAP
const MARKER_LAYERS = ['circle', 'event', 'boss', 'evergaol', 'chest', 'merchant', 'rot-blessing'] as const
const LISTS = [['boss', 'Field bosses'], ['evergaol', 'Evergaols'], ['merchant', 'Merchants']] as const
const POPOVER_WIDTH = 320
const SIDE_PANEL_WIDTH = 360
const EDGE = 8

interface Focus { enemy: Enemy; x: number; y: number; on?: { x: number; y: number } }

export function ResultOverlay({ seed, go, bottomInset, topInset, restInset, setMap, moves }: {
  seed: Seed; go: (path: string, back?: boolean) => void
  bottomInset: MotionValue<number>; topInset: MotionValue<number>; restInset: MotionValue<number>
  setMap: (content: MapContent) => void
  moves: MotionValue<number>
}) {
  const wide = useWide()
  const pillRef = useMeasure(topInset, pillBottom)
  const chips = useRef<HTMLDivElement>(null)
  const fadeChips = useCallback(() => {
    const el = chips.current
    if (!el) return
    el.toggleAttribute('data-more-left', el.scrollLeft > 1)
    el.toggleAttribute('data-more-right', el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])
  const fitWholeChips = useCallback(() => {
    const el = chips.current
    const pill = el?.parentElement
    if (!el || !pill) return
    el.style.flex = ''
    if (wide) return fadeChips()
    const room = el.getBoundingClientRect().width
    const whole = Math.max(1, Math.floor((room + CHIP_GAP) / CHIP_STEP))
    if (whole * CHIP_STEP - CHIP_GAP < el.scrollWidth - 1) el.style.flex = `0 0 ${whole * CHIP_STEP - CHIP_GAP}px`
    fadeChips()
  }, [wide, fadeChips])
  useEffect(() => {
    const pill = chips.current!.parentElement!
    const observer = new ResizeObserver(fitWholeChips)
    observer.observe(pill)
    return () => observer.disconnect()
  }, [fitWholeChips])
  useEffect(fitWholeChips)

  const [detent, setDetent] = useState<Detent>('peek')
  const [toast, setToast] = useState<string | null>(null)
  const [focus, setFocus] = useState<Focus | null>(null)
  const [dismissals, setDismissals] = useState(0)
  const markers = seed.markers
  const available: Layer[] = ['structures', 'spawn', ...MARKER_LAYERS.filter((l) => markers.some((m) => m.layer === l))]
  const [on, setOn] = useState<Set<Layer>>(() => new Set(available))

  const opener = useRef<HTMLElement | null>(null)
  const open = useCallback((enemy: Enemy, x: number, y: number, on?: Focus['on']) => {
    opener.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
    setFocus({ enemy, x, y, on })
    setDetent('half')
  }, [])
  const close = useCallback(() => {
    setFocus(null)
    setDetent('peek')
    setDismissals((n) => n + 1)
    opener.current?.focus()
    opener.current = null
  }, [])
  const onMark = useCallback((tap: MarkTap | null) => {
    const enemy = tap && enemyOfMark(tap)
    if (enemy && tap) open(enemy, tap.clientX, tap.clientY, { x: tap.x, y: tap.y })
    else if (wide) setFocus(null)
  }, [open, close, wide])
  useEffect(() => (wide ? moves.on('change', () => setFocus(null)) : undefined), [wide, moves])
  useEffect(() => {
    if (!focus) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [focus, close])

  const focusPoint = wide ? null : focus?.on ?? null
  const layers = useMemo(() => resultMap(seed, on), [seed, on])
  const content = useMemo(() => ({ ...layers, onMark, focusPoint, dismissals }), [layers, onMark, focusPoint, dismissals])
  useLayoutEffect(() => setMap(content), [content, setMap])

  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(toastTimer.current), [])
  const flash = (text: string) => {
    clearTimeout(toastTimer.current)
    setToast(text)
    toastTimer.current = setTimeout(() => setToast(null), 1500)
  }
  const share = async () => {
    const url = linkTo(`/seed/${seed.id}`)
    if (!wide && navigator.share) {
      try {
        return await navigator.share({ title: `Seed ${seed.id}`, url })
      } catch (e) {
        const userClosedTheShareSheet = (e as Error | null)?.name === 'AbortError'
        if (userClosedTheShareSheet) return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      flash('Link copied')
    } catch {
      flash('Could not copy the link')
    }
  }
  const back = () => go(resultBackPath(currentSearch(), seed), true)
  const toggle = (l: Layer) =>
    setOn((s) => {
      const next = new Set(s)
      if (next.has(l)) next.delete(l)
      else next.add(l)
      return next
    })

  const title = (
    <div className="result-head">
      <div className="result-text">
        <div className="result-line">
          <h1 className="result-title">Seed <span className="num">{seed.id}</span></h1>
          {seed.event && <span className="event-badge">{seed.event.name}{seed.event.day ? ` · Day ${seed.event.day}` : ''}</span>}
        </div>
      </div>
      <button className="share" aria-label="Share" onClick={share}>
        <Icon name="share" />
      </button>
    </div>
  )
  const select = (enemy: Enemy | undefined) => enemy && ((e: React.MouseEvent<HTMLElement>) => {
    const row = e.currentTarget.getBoundingClientRect()
    open(enemy, row.left, row.top)
  })
  const nightRow = (night: 1 | 2): RowSpec => {
    const fight = bestiary.nightBoss(seed.nights[night].boss)
    return { label: `Night ${night}`, value: seed.nights[night].boss, enemy: fight, more: <WeakLine weakness={fight?.forms.length ? headline(fight) : undefined} /> }
  }
  const rows: RowSpec[] = [
    nightRow(1),
    nightRow(2),
    { label: 'Castle', value: seed.castle?.crew, enemy: seed.castle ? bestiary.named(seed.castle.crew) : undefined },
    { label: 'Basement', value: seed.castle?.basement, enemy: seed.castle?.basement ? bestiary.named(seed.castle.basement) : undefined },
    { label: 'Rooftop', value: seed.castle?.rooftop, enemy: seed.castle?.rooftop ? bestiary.named(seed.castle.rooftop) : undefined },
    { label: 'Old Gaol', value: seed.oldGaol ? 'Present' : null },
  ]
  const loot = gearForTheRun(seed).afflictions
  const runCard = (
    <dl className="run-card">
      {rows.filter((r) => r.value).map((r) => (
        <RunRow key={r.label} label={r.label} value={r.value!} more={r.more} onSelect={select(r.enemy)} pressed={!!r.enemy && focus?.enemy === r.enemy} />
      ))}
      {loot.length > 0 && (
        <div className="run-row">
          <dt>Loot</dt>
          <dd className="run-value"><span className="weak-line mt-0">{loot.map((k) => <span key={k} className="weak-item"><img src={`damage/${k}.webp`} alt="" draggable={false} />{DAMAGE_NAMES[k]}</span>)}</span></dd>
        </div>
      )}
    </dl>
  )
  const lists = (
    <>
      {LISTS.map(([layer, heading]) => {
        const groups = collapseRepeats(markers.filter((m) => m.layer === layer), (m) => m.label)
        return groups.length ? (
          <section key={layer} className="result-list">
            <h3>{heading}</h3>
            <ul className="run-card">
              {groups.map((g, i) => {
                const enemy = layer === 'merchant' ? undefined : bestiary.named(g.item.label)
                return <RunRow key={`${i}:${g.item.label}`} value={g.item.label} count={g.count} onSelect={select(enemy)} pressed={!!enemy && focus?.enemy === enemy} />
              })}
            </ul>
          </section>
        ) : null
      })}
    </>
  )

  const card = focus && (
    <>
      <EnemyFacts enemy={focus.enemy} />
      <EnemyPageLink enemy={focus.enemy} />
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
              {LAYER_ICON[l] ? <img className={l === 'spawn' ? 'chip-player' : undefined} src={LAYER_ICON[l]} alt="" draggable={false} /> : <span className={l === 'event' ? 'chip-ring chip-event' : 'chip-ring'} />}
              <span aria-hidden>{LAYER_SHORT[l]}</span>
            </button>
          ))}
        </div>
      </Plate>
      {wide ? (
        <>
          <aside className="side-panel" aria-label="Seed details"><div className="side-scroll">{title}{runCard}{lists}</div></aside>
          {focus && <Popover focus={focus} onClose={close}>{card}</Popover>}
        </>
      ) : (
        <Sheet detent={detent} onDetent={(d) => { if (d === 'peek' && focus) close(); else setDetent(d) }} height={bottomInset} rest={restInset} top={topInset}
          label={focus ? focus.enemy.name : 'Seed details'}
          header={focus ? <EnemyCardHeader enemy={focus.enemy} onClose={close} /> : title}
          more={focus ? undefined : lists}>
          {focus ? card : runCard}
        </Sheet>
      )}
      {toast && <Plate className="toast" role="status">{toast}</Plate>}
    </>
  )
}

function Popover({ focus, onClose, children }: { focus: Focus; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => setHeight(ref.current!.offsetHeight), [focus])
  const mapRight = innerWidth - SIDE_PANEL_WIDTH
  const beside = focus.x + 24 + POPOVER_WIDTH <= mapRight - EDGE ? focus.x + 24 : focus.x - 24 - POPOVER_WIDTH
  const left = Math.min(mapRight - POPOVER_WIDTH - EDGE, Math.max(EDGE, beside))
  const top = Math.min(innerHeight - height - EDGE, Math.max(EDGE, focus.y - 40))
  return (
    <section ref={ref} role="dialog" aria-label={focus.enemy.name} className="glass fixed z-30 box-border rounded-card px-4 pt-2 pb-4" style={{ left, top, width: POPOVER_WIDTH }}>
      <EnemyCardHeader enemy={focus.enemy} onClose={onClose} takeFocus />
      {children}
    </section>
  )
}

interface RowSpec { label: string; value: string | null | undefined; enemy?: Enemy; more?: ReactNode }

function RowLabel({ label }: { label: string }) {
  const [, words, digits] = label.match(/^(.*?)(\d+)$/) ?? [label, label, '']
  return <>{words}{digits && <span className="num">{digits}</span>}</>
}

function RunRow({ label, value, count, more, onSelect, pressed }: {
  label?: string; value: string; count?: number; more?: ReactNode
  onSelect?: (e: React.MouseEvent<HTMLElement>) => void; pressed?: boolean
}) {
  const shown = count && count > 1 ? `${value} ×${count}` : value
  const Row = label ? 'div' : 'li'
  const Value = label ? 'dd' : 'span'
  const name = onSelect
    ? <button type="button" className="run-select" aria-pressed={pressed} onClick={onSelect}>{shown}</button>
    : shown
  return (
    <Row className="run-row" data-pressed={pressed || undefined}>
      {label && <dt><RowLabel label={label} /></dt>}
      <Value className="run-value">{name}{more}</Value>
    </Row>
  )
}

function WeakLine({ weakness }: { weakness: Headline | undefined }) {
  if (!weakness) return <span className="weak-line weak-none"><span className="sr-only">, </span>No data</span>
  if (weakness.weak.length) return <DamageLine tag="Weak" spoken="weak to" keys={weakness.weak} />
  if (weakness.resist.length) return <DamageLine tag="Resist" spoken="resists" keys={weakness.resist} />
  return <span className="weak-line weak-none"><span className="sr-only">, </span>No damage weakness</span>
}

function DamageLine({ tag, spoken, keys }: { tag: string; spoken: string; keys: Affliction[] }) {
  return (
    <span className="weak-line">
      <span className="weak-tag" aria-hidden>{tag}</span>
      <span className="sr-only">, {spoken} </span>
      {keys.map((k, i) => (
        <span key={k} className="weak-item">{i > 0 && <span className="sr-only">, </span>}<img src={`damage/${k}.webp`} alt="" draggable={false} />{DAMAGE_NAMES[k]}</span>
      ))}
    </span>
  )
}
