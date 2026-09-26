import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useTransform, type MotionValue } from 'motion/react'
import { Frame } from './Frame'
import { useWide } from './useWide'
import { catalog } from '../data/catalog'
import './weakness.css'
import { DAMAGE_NAMES, cardRows, nightlordName, weaknessPhrase, type DamageKey, type NightlordPick, type Weakness } from '../domain/names'

/**
 * A screen area drawn over the map, in px: x from the left edge, and `bottom`/`top` measured up from the line
 * that whatever covers the bottom of the screen (the strip or the sheet) reaches, which the medallion rides on.
 */
export interface CornerRect { x0: number; x1: number; bottom: number; top: number }
/**
 * `rects`: the medallion's area, and the card's while it is open (none while tucked), which map names keep off and
 * the map may pan clear of. `reach`: how far the medallion reaches up, the same tucked or not and whether or not
 * its card is open, which the map frames itself above: were it to follow the tuck, the map would jump as a sheet
 * is dragged, and were it to include the card, the island would shrink to leave room for a card that starts folded.
 */
export interface Corner { rects: CornerRect[]; reach: number }
export const NO_CORNER: Corner = { rects: [], reach: 0 }

const NONE: CornerRect[] = []
const cardMotion = { type: 'spring', visualDuration: 0.3, bounce: 0 } as const

/**
 * The Nightlord in the bottom-left corner, as the game shows it: its portrait in a stone medallion with a
 * blue-lit ring and a blue glow, and beside it a card of what it is weak to and resists. The corner belongs to
 * the screen, not the map: on phone it rides on the strip or the collapsed sheet, and tucks away as soon as a
 * sheet rises past that, so it never covers the map left above an open sheet (a night's ring, or the sites
 * around the one being answered). Desktop keeps the card open on a result. On phone, and in the finder, the card
 * starts folded, so the medallion alone sits in the corner and the whole island shows: a tap on the medallion opens
 * it, and another tap, or moving the map, folds it. Its facts are spoken as the medallion's name, so the card itself
 * is hidden from screen readers.
 */
export function NightlordMedallion({ nightlord, result, lift, rest, corner, moves }: {
  /** `unknown` (a Deep of Night run that hides it) shows the game's hidden-Nightlord portrait, with no card to open. */
  nightlord: NightlordPick
  result: boolean
  /** Height covered at the bottom right now (strip or sheet); 0 on desktop. */
  lift: MotionValue<number>
  /** Height covered at the bottom with no sheet open (the strip, or the result sheet at peek). */
  rest: MotionValue<number>
  /** Receives the medallion's and card's areas, so map names keep off them and the map can pan clear of them. */
  corner: MotionValue<Corner>
  /** Counts the user's moves of the map, each of which folds the card. */
  moves: MotionValue<number>
}) {
  const wide = useWide()
  const unknown = nightlord === 'unknown'
  const collapsible = !(wide && result) && !unknown
  const [open, setOpen] = useState(false)
  // Finder to result keeps this mounted (the map stays): the result starts with the card folded, whatever the finder had.
  const [wasResult, setWasResult] = useState(result)
  if (wasResult !== result) {
    setWasResult(result)
    setOpen(false)
  }
  useEffect(() => moves.on('change', () => setOpen(false)), [moves])
  const shown = !unknown && (open || !collapsible)
  const weakness = unknown ? undefined : catalog.nightlordWeakness(nightlord)
  const label = [nightlordName(nightlord), weakness ? weaknessPhrase(weakness) : 'named once the seed is found'].filter(Boolean).join(': ')

  // With reduced motion the card only fades; otherwise it also slides out from the medallion.
  const slide = useReducedMotion() ? 0 : -12
  const root = useRef<HTMLDivElement>(null)
  const y = useTransform(lift, (v) => -v)
  // Fades out over the first 48px a sheet rises above its resting height (the strip, or the result sheet at
  // peek) and back in as it lowers, tied to the sheet's own position so it follows a drag. Desktop has no sheet,
  // so it never tucks there.
  const opacity = useTransform(() => Math.min(1, Math.max(0, 1 - (lift.get() - rest.get()) / 48)))
  const visibility = useTransform(opacity, (o) => (o > 0 ? 'visible' : 'hidden'))

  // Offsets ignore transforms, so the areas hold still while the corner rides on the sheet and the card slides in.
  useLayoutEffect(() => {
    const el = root.current!
    let rects = NONE
    let reach = 0
    const publish = () => {
      const shown = opacity.get() > 0.5 ? rects : NONE
      const last = corner.get()
      if (last.rects !== shown || last.reach !== reach) corner.set({ rects: shown, reach })
    }
    const measure = () => {
      const up = parseFloat(getComputedStyle(el).bottom) + el.offsetHeight
      rects = [...el.querySelectorAll<HTMLElement>(':scope > [data-corner]')].map((part) => ({
        x0: el.offsetLeft + part.offsetLeft,
        x1: el.offsetLeft + part.offsetLeft + part.offsetWidth,
        bottom: up - part.offsetTop - part.offsetHeight,
        top: up - part.offsetTop,
      }))
      // The medallion's alone: the card opens over the map on request, so the map is not framed around it.
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

  const art = <MedallionArt nightlord={nightlord} />
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
            // A tap on the card closes it too, rather than falling through to a site it covers.
            onClick={collapsible ? () => setOpen(false) : undefined}
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slide }}
            transition={cardMotion}
          >
            <Frame />
            <CardRows weakness={weakness} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * A Nightlord's medallion and weakness card on their own (Home, once a Nightlord is picked), as the map's corner
 * shows them. Its facts are its accessible name.
 */
export function WeaknessCard({ nightlord }: { nightlord: NightlordPick }) {
  const weakness = nightlord === 'unknown' ? undefined : catalog.nightlordWeakness(nightlord)
  const facts = weakness ? weaknessPhrase(weakness) : UNKNOWN_NOTE
  return (
    <div className="nl-pick" role="img" aria-label={`${nightlordName(nightlord)}: ${facts}`}>
      {/* Named under its medallion: on a phone the panel rises over the grid's own picked medallion and its name. */}
      <span className="nl-pick-who">
        <span className="nl-medal"><MedallionArt nightlord={nightlord} /></span>
        <span className="nl-pick-name">{nightlordName(nightlord)}</span>
      </span>
      <div className="nl-card">
        <Frame />
        {weakness ? <CardRows weakness={weakness} /> : <p className="nl-note">{UNKNOWN_NOTE}</p>}
      </div>
    </div>
  )
}

const UNKNOWN_NOTE = 'Deep of Night can hide the Nightlord. Scout the map as usual: the seed you find names it.'

function CardRows({ weakness }: { weakness: Weakness }) {
  const { weak, resist, status } = cardRows(weakness)
  return (
    <>
      {weak.length > 0 && <CardRow label="Weak" keys={weak} />}
      {resist.length > 0 && <CardRow label="Resist" keys={resist} />}
      {/* Every status it is weak to, whether its listed weakness (Balancers' Sleep) or the fastest to build up
          (the cheatsheet's "Also", Tricephalos' Sleep): named in words too, since "status" alone could read as what
          it inflicts, and a status icon is hard to tell at card size. */}
      {status.length > 0 && <CardRow label="Weak status" keys={status} named />}
    </>
  )
}

function CardRow({ label, keys, named }: { label: string; keys: DamageKey[]; named?: boolean }) {
  return (
    <div className="nl-row">
      <span className="nl-row-label">{label}</span>
      {/* Named: one status's name beside its icon; several (Darkdrift Knight has five tied) in a line under them. */}
      <span className={named ? 'nl-icons nl-named' : 'nl-icons'} data-many={(named && keys.length > 1) || undefined}>
        {keys.map((k) => <img key={k} src={`/damage/${k}.webp`} alt="" title={DAMAGE_NAMES[k]} draggable={false} />)}
        {named && <span className="nl-names">{keys.map((k) => DAMAGE_NAMES[k]).join(', ')}</span>}
      </span>
    </div>
  )
}

/**
 * The portrait in the game's medallion, drawn: a pale frosted stone disc with an engraved rim, a blue-lit ring
 * round the portrait and a dark groove inside it. The glow is the button's shadow (tokens.css). Only one
 * medallion is ever on screen, so the gradient and clip ids are fixed.
 */
function MedallionArt({ nightlord }: { nightlord: NightlordPick }) {
  return (
    <svg className="nl-art" viewBox="0 0 120 120" aria-hidden>
      <defs>
        <radialGradient id="nl-stone" cx="50%" cy="36%" r="64%">
          <stop offset="0" style={{ stopColor: 'var(--stone-1)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--stone-2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--stone-3)' }} />
        </radialGradient>
        <linearGradient id="nl-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--halo)' }} />
          <stop offset="0.5" style={{ stopColor: 'var(--stone-2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--halo-deep)' }} />
        </linearGradient>
        {/* Frost: the portrait's edge pales into the stone, as the game's medallion does. */}
        <radialGradient id="nl-frost" cx="50%" cy="50%" r="50%">
          <stop offset="0.62" style={{ stopColor: 'var(--stone-1)' }} stopOpacity="0" />
          <stop offset="1" style={{ stopColor: 'var(--stone-1)' }} stopOpacity="0.42" />
        </radialGradient>
        <clipPath id="nl-clip"><circle cx="60" cy="60" r="48" /></clipPath>
      </defs>
      <circle cx="60" cy="60" r="59" fill="url(#nl-stone)" style={{ stroke: 'var(--panel-2)' }} strokeWidth="1" />
      {/* The engraved rim: a band of fine carved ticks between two scored lines. */}
      <circle cx="60" cy="60" r="57" fill="none" style={{ stroke: 'var(--stone-1)' }} strokeOpacity="0.45" strokeWidth="0.7" />
      <circle cx="60" cy="60" r="54.4" fill="none" style={{ stroke: 'var(--stone-3)' }} strokeOpacity="0.5" strokeWidth="3.6" strokeDasharray="0.8 2.2" />
      <circle cx="60" cy="60" r="51.8" fill="none" style={{ stroke: 'var(--stone-1)' }} strokeOpacity="0.35" strokeWidth="0.7" />
      <circle cx="60" cy="60" r="49.4" style={{ fill: 'var(--panel)' }} stroke="url(#nl-ring)" strokeWidth="2.2" />
      <image href={`/nightlords/${nightlord}.webp`} x="10" y="10" width="100" height="100" clipPath="url(#nl-clip)" preserveAspectRatio="xMidYMid slice" />
      <circle cx="60" cy="60" r="48" fill="url(#nl-frost)" />
      <circle cx="60" cy="60" r="48.2" fill="none" style={{ stroke: 'var(--bg)' }} strokeOpacity="0.8" strokeWidth="1" />
    </svg>
  )
}
