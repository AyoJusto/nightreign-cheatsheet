import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useTransform, type MotionValue } from 'motion/react'
import { useMotion } from './motion'
import { useWide } from './useWide'
import './weakness.css'
import { DAMAGE_NAMES, cardRows, nightlordName, weaknessPhrase, type NightlordPick } from '../domain/names'
import { bestiary, nightlordHeadline, type Headline } from '../bestiary/bestiary'
import type { Affliction } from '../bestiary/enemy'

export interface CornerRect { x0: number; x1: number; bottom: number; top: number }
export interface Corner { rects: CornerRect[]; reach: number }
export const NO_CORNER: Corner = { rects: [], reach: 0 }

const NONE: CornerRect[] = []
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
  const weakness = unknown ? undefined : nightlordHeadline(bestiary.nightlord(nightlord)!)
  const label = [nightlordName(nightlord), weakness ? weaknessPhrase(weakness) : 'named once the seed is found'].filter(Boolean).join(': ')

  const m = useMotion()
  const slide = -m.cardSlide
  const root = useRef<HTMLDivElement>(null)
  const y = useTransform(lift, (v) => -v)
  const opacity = useTransform(() => Math.min(1, Math.max(0, 1 - (lift.get() - rest.get()) / TUCK_DISTANCE)))
  const visibility = useTransform(opacity, (o) => (o > 0 ? 'visible' : 'hidden'))

  useLayoutEffect(() => {
    const el = root.current!
    let rects = NONE
    let medalReach = 0
    const publish = () => {
      const visible = opacity.get() > 0.5 ? rects : NONE
      const last = corner.get()
      if (last.rects !== visible || last.reach !== medalReach) corner.set({ rects: visible, reach: medalReach })
    }
    const measureUntransformed = () => {
      const topAboveCover = parseFloat(getComputedStyle(el).bottom) + el.offsetHeight
      rects = [...el.querySelectorAll<HTMLElement>(':scope > [data-corner]')].map((part) => ({
        x0: el.offsetLeft + part.offsetLeft,
        x1: el.offsetLeft + part.offsetLeft + part.offsetWidth,
        bottom: topAboveCover - part.offsetTop - part.offsetHeight,
        top: topAboveCover - part.offsetTop,
      }))
      medalReach = rects[0]?.top ?? 0
      publish()
    }
    measureUntransformed()
    const observer = new ResizeObserver(measureUntransformed)
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
            transition={{ ...m.layout, opacity: m.fade }}
          >
            <CardRows weakness={weakness} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function WeaknessCard({ nightlord }: { nightlord: NightlordPick }) {
  const weakness = nightlord === 'unknown' ? undefined : nightlordHeadline(bestiary.nightlord(nightlord)!)
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

const HIDDEN_NIGHTLORD = "It's probably the Dreglord."

function CardRows({ weakness }: { weakness: Headline }) {
  const { weak, resist, status } = cardRows(weakness)
  return (
    <>
      {weak.length > 0 && <CardRow label="Weak" keys={weak} />}
      {resist.length > 0 && <CardRow label="Resist" keys={resist} />}
      {status.length > 0 && <CardRow label="Weak status" keys={status} named />}
    </>
  )
}

function CardRow({ label, keys, named }: { label: string; keys: Affliction[]; named?: boolean }) {
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
