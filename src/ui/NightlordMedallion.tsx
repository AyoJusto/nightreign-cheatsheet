import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useTransform, type MotionValue } from 'motion/react'
import { Frame } from './Frame'
import { useWide } from './useWide'
import { catalog } from '../data/catalog'
import './weakness.css'
import { DAMAGE_NAMES, nightlordName, weaknessPhrase, type DamageKey, type NightlordId } from '../domain/names'

/**
 * A screen area drawn over the map, in px: x from the left edge, and `bottom`/`top` measured up from the line
 * that whatever covers the bottom of the screen (the strip or the sheet) reaches, which the medallion rides on.
 */
export interface CornerRect { x0: number; x1: number; bottom: number; top: number }

const NONE: CornerRect[] = []
const cardMotion = { type: 'spring', visualDuration: 0.3, bounce: 0 } as const

/**
 * The Nightlord in the bottom-left corner, as the game shows it: its portrait in a stone medallion with a
 * bronze ring and a blue glow, and beside it a card of what it is weak to and resists. The corner belongs to
 * the screen, not the map: on phone it rides on the strip or the collapsed sheet, and tucks away as soon as a
 * sheet rises past that, so it never covers the map left above an open sheet (a night's ring, or the sites
 * around the one being answered). The card starts open on a result; on phone, and in the finder, the medallion
 * toggles it. Its facts are spoken as the medallion's name, so the card itself is hidden from screen readers.
 */
export function NightlordMedallion({ nightlord, result, lift, rest, corner }: {
  nightlord: NightlordId
  result: boolean
  /** Height covered at the bottom right now (strip or sheet); 0 on desktop. */
  lift: MotionValue<number>
  /** Height covered at the bottom with no sheet open (the strip, or the result sheet at peek). */
  rest: MotionValue<number>
  /** Receives the medallion's and card's areas, so map names keep off them and the map can pan clear of them. */
  corner: MotionValue<CornerRect[]>
}) {
  const wide = useWide()
  const collapsible = !(wide && result)
  const [open, setOpen] = useState(result)
  // Finder to result keeps this mounted (the map stays): the result opens the card, whatever the finder had.
  const [wasResult, setWasResult] = useState(result)
  if (wasResult !== result) {
    setWasResult(result)
    if (result) setOpen(true)
  }
  const shown = open || !collapsible
  const weakness = catalog.nightlordWeakness(nightlord)
  const label = [nightlordName(nightlord), weaknessPhrase(weakness)].filter(Boolean).join(': ')

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
    const publish = () => corner.set(opacity.get() > 0.5 ? rects : NONE)
    const measure = () => {
      const up = parseFloat(getComputedStyle(el).bottom) + el.offsetHeight
      rects = [...el.querySelectorAll<HTMLElement>(':scope > [data-corner]')].map((part) => ({
        x0: el.offsetLeft + part.offsetLeft,
        x1: el.offsetLeft + part.offsetLeft + part.offsetWidth,
        bottom: up - part.offsetTop - part.offsetHeight,
        top: up - part.offsetTop,
      }))
      publish()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    const off = opacity.on('change', publish)
    return () => {
      observer.disconnect()
      off()
      corner.set(NONE)
    }
  }, [corner, opacity])

  const art = <MedallionArt nightlord={nightlord} />
  return (
    <motion.div ref={root} className="nl-corner" style={{ y, opacity, visibility }}>
      {collapsible
        ? <button className="nl-medal" data-corner aria-label={label} aria-expanded={shown} onClick={() => setOpen((o) => !o)}>{art}</button>
        : <div className="nl-medal" data-corner role="img" aria-label={label}>{art}</div>}
      <AnimatePresence initial={false}>
        {shown && (
          <motion.div
            key="card"
            className="nl-card"
            data-corner
            aria-hidden
            // A tap on the card closes it too, rather than falling through to a site it covers.
            onClick={collapsible ? () => setOpen(false) : undefined}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={cardMotion}
          >
            <Frame />
            {weakness.weak.length > 0 && <CardRow label="Weak" keys={weakness.weak} />}
            {weakness.resist.length > 0 && <CardRow label="Resist" keys={weakness.resist} />}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CardRow({ label, keys }: { label: string; keys: DamageKey[] }) {
  return (
    <div className="nl-row">
      <span className="nl-row-label">{label}</span>
      <span className="nl-icons">
        {keys.map((k) => <img key={k} src={`/damage/${k}.webp`} alt="" title={DAMAGE_NAMES[k]} draggable={false} />)}
      </span>
    </div>
  )
}

/**
 * The portrait in the game's medallion, drawn: a pale frosted stone disc with an engraved rim, a bronze ring
 * round the portrait and a dark groove inside it. The glow is the button's shadow (tokens.css). Only one
 * medallion is ever on screen, so the gradient and clip ids are fixed.
 */
function MedallionArt({ nightlord }: { nightlord: NightlordId }) {
  return (
    <svg className="nl-art" viewBox="0 0 120 120" aria-hidden>
      <defs>
        <radialGradient id="nl-stone" cx="50%" cy="36%" r="64%">
          <stop offset="0" stopColor="#dce6f6" />
          <stop offset="0.55" stopColor="#8ca1c6" />
          <stop offset="1" stopColor="#374b73" />
        </radialGradient>
        <linearGradient id="nl-bronze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0d99c" />
          <stop offset="0.5" stopColor="#c9a55c" />
          <stop offset="1" stopColor="#7a5a2e" />
        </linearGradient>
        {/* Frost: the portrait's edge pales into the stone, as the game's medallion does. */}
        <radialGradient id="nl-frost" cx="50%" cy="50%" r="50%">
          <stop offset="0.62" stopColor="#b4c8ea" stopOpacity="0" />
          <stop offset="1" stopColor="#b4c8ea" stopOpacity="0.42" />
        </radialGradient>
        <clipPath id="nl-clip"><circle cx="60" cy="60" r="48" /></clipPath>
      </defs>
      <circle cx="60" cy="60" r="59" fill="url(#nl-stone)" stroke="#1b2640" strokeWidth="1" />
      {/* The engraved rim: a band of fine carved ticks between two scored lines. */}
      <circle cx="60" cy="60" r="57" fill="none" stroke="#f4f7fc" strokeOpacity="0.45" strokeWidth="0.7" />
      <circle cx="60" cy="60" r="54.4" fill="none" stroke="#1f2c47" strokeOpacity="0.5" strokeWidth="3.6" strokeDasharray="0.8 2.2" />
      <circle cx="60" cy="60" r="51.8" fill="none" stroke="#f4f7fc" strokeOpacity="0.35" strokeWidth="0.7" />
      <circle cx="60" cy="60" r="49.4" fill="#0e1628" stroke="url(#nl-bronze)" strokeWidth="2.2" />
      <image href={`/nightlords/${nightlord}.webp`} x="10" y="10" width="100" height="100" clipPath="url(#nl-clip)" preserveAspectRatio="xMidYMid slice" />
      <circle cx="60" cy="60" r="48" fill="url(#nl-frost)" />
      <circle cx="60" cy="60" r="48.2" fill="none" stroke="#070b14" strokeOpacity="0.8" strokeWidth="1" />
    </svg>
  )
}
