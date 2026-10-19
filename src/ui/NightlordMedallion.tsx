import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useTransform, type MotionValue } from 'motion/react'
import { useWide } from './useWide'
import { catalog } from '../data/catalog'
import './weakness.css'
import { DAMAGE_NAMES, cardRows, nightlordName, weaknessPhrase, type DamageKey, type NightlordPick, type Weakness } from '../domain/names'

/** Screen px: x from the left edge, `bottom` and `top` measured up from whatever covers the bottom of the screen. */
export interface CornerRect { x0: number; x1: number; bottom: number; top: number }
/** `reach` ignores the card and the tuck, so the map never reframes as a sheet is dragged or the card opens. */
export interface Corner { rects: CornerRect[]; reach: number }
export const NO_CORNER: Corner = { rects: [], reach: 0 }

const NONE: CornerRect[] = []
const cardMotion = { type: 'spring', visualDuration: 0.3, bounce: 0 } as const
const TUCK_DISTANCE = 48

export function NightlordMedallion({ nightlord, result, lift, rest, corner, moves }: {
  nightlord: NightlordPick
  result: boolean
  lift: MotionValue<number>
  rest: MotionValue<number>
  corner: MotionValue<Corner>
  moves: MotionValue<number>
}) {
  const wide = useWide()
  const unknown = nightlord === 'unknown'
  const collapsible = !(wide && result) && !unknown
  const [open, setOpen] = useState(false)
  const [wasResult, setWasResult] = useState(result)
  if (wasResult !== result) {
    setWasResult(result)
    setOpen(false)
  }
  useEffect(() => moves.on('change', () => setOpen(false)), [moves])
  const shown = !unknown && (open || !collapsible)
  const weakness = unknown ? undefined : catalog.nightlordWeakness(nightlord)
  const label = [nightlordName(nightlord), weakness ? weaknessPhrase(weakness) : 'named once the seed is found'].filter(Boolean).join(': ')

  const slide = useReducedMotion() ? 0 : -12
  const root = useRef<HTMLDivElement>(null)
  const y = useTransform(lift, (v) => -v)
  const opacity = useTransform(() => Math.min(1, Math.max(0, 1 - (lift.get() - rest.get()) / TUCK_DISTANCE)))
  const visibility = useTransform(opacity, (o) => (o > 0 ? 'visible' : 'hidden'))

  // Offsets, not client rects: they ignore the transforms that ride the corner on the sheet and slide the card in.
  useLayoutEffect(() => {
    const el = root.current!
    let rects = NONE
    let reach = 0
    const publish = () => {
      const visible = opacity.get() > 0.5 ? rects : NONE
      const last = corner.get()
      if (last.rects !== visible || last.reach !== reach) corner.set({ rects: visible, reach })
    }
    const measure = () => {
      const up = parseFloat(getComputedStyle(el).bottom) + el.offsetHeight
      rects = [...el.querySelectorAll<HTMLElement>(':scope > [data-corner]')].map((part) => ({
        x0: el.offsetLeft + part.offsetLeft,
        x1: el.offsetLeft + part.offsetLeft + part.offsetWidth,
        bottom: up - part.offsetTop - part.offsetHeight,
        top: up - part.offsetTop,
      }))
      reach = rects[0]?.top ?? 0
      publish()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    const off = opacity.on('change', publish)
    return () => {
      observer.disconnect()
      off()
      corner.set(NO_CORNER)
    }
  }, [corner, opacity])

  const art = <Portrait nightlord={nightlord} />
  return (
    <motion.div ref={root} className="nl-corner" style={{ y, opacity, visibility }}>
      {collapsible
        ? <button className="nl-medal" data-corner aria-label={label} aria-expanded={shown} onClick={() => setOpen((o) => !o)}>{art}</button>
        : <div className="nl-medal" data-corner role="img" aria-label={label}>{art}</div>}
      <AnimatePresence initial={false}>
        {shown && weakness && (
          <motion.div
            key="card"
            className="nl-card"
            data-corner
            aria-hidden
            onClick={collapsible ? () => setOpen(false) : undefined}
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slide }}
            transition={cardMotion}
          >
            <CardRows weakness={weakness} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function WeaknessCard({ nightlord }: { nightlord: NightlordPick }) {
  const weakness = nightlord === 'unknown' ? undefined : catalog.nightlordWeakness(nightlord)
  const facts = weakness ? weaknessPhrase(weakness) : HIDDEN_NIGHTLORD
  return (
    <div className="nl-pick" role="img" aria-label={`${nightlordName(nightlord)}: ${facts}`}>
      <span className="nl-pick-who">
        <span className="nl-medal"><Portrait nightlord={nightlord} /></span>
      </span>
      <div className="nl-card">
        {weakness ? <CardRows weakness={weakness} /> : <p className="nl-note">{HIDDEN_NIGHTLORD}</p>}
      </div>
    </div>
  )
}

const HIDDEN_NIGHTLORD = 'Deep of Night can hide the Nightlord. Scout the map as usual: the seed you find names it.'

function CardRows({ weakness }: { weakness: Weakness }) {
  const { weak, resist, status } = cardRows(weakness)
  return (
    <>
      {weak.length > 0 && <CardRow label="Weak" keys={weak} />}
      {resist.length > 0 && <CardRow label="Resist" keys={resist} />}
      {status.length > 0 && <CardRow label="Weak status" keys={status} named />}
    </>
  )
}

function CardRow({ label, keys, named }: { label: string; keys: DamageKey[]; named?: boolean }) {
  return (
    <div className="nl-row">
      <span className="nl-row-label">{label}</span>
      <span className={named ? 'nl-icons nl-named' : 'nl-icons'} data-many={(named && keys.length > 1) || undefined}>
        {keys.map((k) => <img key={k} src={`damage/${k}.webp`} alt="" title={DAMAGE_NAMES[k]} draggable={false} />)}
        {named && <span className="nl-names">{keys.map((k) => DAMAGE_NAMES[k]).join(', ')}</span>}
      </span>
    </div>
  )
}

function Portrait({ nightlord }: { nightlord: NightlordPick }) {
  return <img className="nl-art" src={`nightlords/${nightlord}.webp`} alt="" draggable={false} />
}
