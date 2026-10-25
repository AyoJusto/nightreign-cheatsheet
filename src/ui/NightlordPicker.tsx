import { useState } from 'react'
import { motion, type PanInfo } from 'motion/react'
import { NIGHTLORDS, earthName, type NightlordPick } from '../domain/names'
import { catalog } from '../data/catalog'
import { WeaknessCard } from './NightlordMedallion'
import { useMotion } from './motion'
import { FadeImg } from './FadeImg'
import type { Go } from './Page'

const SWIPE_AWAY_DISTANCE = 60
const SWIPE_AWAY_SPEED = 500

export const PICKS: readonly { id: NightlordPick; name: string }[] = [...NIGHTLORDS, { id: 'unknown', name: 'Unknown' }]

export function Portrait({ id, name }: { id: NightlordPick; name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <div className="portrait monogram" aria-hidden>{name.split(' ').map((w) => w[0]).join('')}</div>
  }
  return <FadeImg className="portrait" src={`nightlords/${id}.webp`} alt="" onError={() => setFailed(true)} />
}

export function EarthPanel({ picked, go, wide, onDismiss }: { picked: NightlordPick; go: Go; wide: boolean; onDismiss: () => void }) {
  const m = useMotion()
  return (
    <motion.nav
      key="earths"
      className={wide ? 'earths' : 'earths earth-bar plate'}
      aria-labelledby="earth-heading"
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{ ...m.layout, opacity: m.fade }}
      {...(wide ? {} : {
        drag: 'y' as const,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.7 },
        onDragEnd: (_: unknown, info: PanInfo) => {
          if (info.offset.y > SWIPE_AWAY_DISTANCE || info.velocity.y > SWIPE_AWAY_SPEED) onDismiss()
        },
      })}
    >
      {!wide && <span className="earth-bar-handle" aria-hidden />}
      <WeaknessCard nightlord={picked} />
      <h2 id="earth-heading" className="earth-heading">Shifting Earth</h2>
      <div className="earth-grid">
        {catalog.earthsFor(picked).map((earth) => (
          <button key={earth} className="earth" onClick={() => go(`/find/${picked}/${earth}`)}>
            <img data-hero-from="map" className="earth-thumb" src={`maps/thumb/${earth}.webp`} alt="" width={240} height={240} draggable={false} />
            <span className="earth-name">{earthName(earth)}</span>
            <span className="num earth-count">{catalog.seedsFor(picked, earth).length} seeds</span>
          </button>
        ))}
      </div>
    </motion.nav>
  )
}
