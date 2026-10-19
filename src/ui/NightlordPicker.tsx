import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWide } from './useWide'
import { NIGHTLORDS, earthName, type NightlordPick } from '../domain/names'
import { catalog } from '../data/catalog'
import { WeaknessCard } from './NightlordMedallion'
import { TopBar } from './TopBar'
import { goBack } from './router'

const spring = { type: 'spring', visualDuration: 0.45, bounce: 0.15 } as const

const PICKS: readonly { id: NightlordPick; name: string }[] = [...NIGHTLORDS, { id: 'unknown', name: 'Unknown' }]

function Portrait({ id, name }: { id: NightlordPick; name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <div className="portrait monogram" aria-hidden>{name.split(' ').map((w) => w[0]).join('')}</div>
  }
  return <img className="portrait" src={`nightlords/${id}.webp`} alt="" onError={() => setFailed(true)} />
}

export function NightlordPicker({ go }: { go: (path: string, back?: boolean) => void }) {
  const wide = useWide()
  const [picked, setPicked] = useState<NightlordPick | null>(null)
  return (
    <main className="home">
      <TopBar onBack={() => goBack('/', go)} />
      <h1 className="home-title">Choose your Nightlord</h1>
      <ul className="nightlord-grid">
        {PICKS.map((n) => (
          <li key={n.id}>
            <button className="nightlord" aria-pressed={picked === n.id} data-dim={(picked && picked !== n.id) || undefined} onClick={() => setPicked(n.id)}>
              <span className="medallion"><Portrait id={n.id} name={n.name} /></span>
              <span className="nightlord-name">{n.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {picked && (
          <motion.nav
            key="earths"
            className={wide ? 'earths' : 'earths earth-bar plate'}
            aria-labelledby="earth-heading"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={spring}
          >
            <WeaknessCard nightlord={picked} />
            <h2 id="earth-heading" className="earth-heading">Shifting Earth</h2>
            <div className="earth-grid">
              {catalog.earthsFor(picked).map((earth) => (
                <button key={earth} className="earth" onClick={() => go(`/find/${picked}/${earth}`)}>
                  <img className="earth-thumb" src={`maps/thumb/${earth}.webp`} alt="" width={240} height={240} draggable={false} />
                  <span className="earth-name">{earthName(earth)}</span>
                  <span className="num earth-count">{catalog.seedsFor(picked, earth).length} seeds</span>
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      <footer className="home-footer"><button onClick={() => go('/about')}>About</button></footer>
    </main>
  )
}
