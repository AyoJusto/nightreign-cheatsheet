import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWide } from './useWide'
import { NIGHTLORDS, earthName, type NightlordId } from '../domain/names'
import { catalog } from '../data/catalog'
import { Frame, Flourish } from './Frame'

const spring = { type: 'spring', visualDuration: 0.45, bounce: 0.15 } as const

function Portrait({ id, name }: { id: NightlordId; name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <div className="portrait monogram title" aria-hidden>{name.split(' ').map((w) => w[0]).join('')}</div>
  }
  return <img className="portrait" src={`/nightlords/${id}.webp`} alt="" onError={() => setFailed(true)} />
}

export function HomeScreen({ go }: { go: (path: string) => void }) {
  const wide = useWide()
  const [picked, setPicked] = useState<NightlordId | null>(null)
  return (
    <main className="home">
      <h1 className="home-title">Choose your Nightlord</h1>
      <Flourish className="home-flourish" />
      <ul className="nightlord-grid">
        {NIGHTLORDS.map((n) => (
          <li key={n.id}>
            <motion.button
              className="nightlord"
              aria-pressed={picked === n.id}
              // The gold ring marks the pick; no scale, which would drop its name out of line with its row.
              animate={{ opacity: picked && picked !== n.id ? 0.5 : 1 }}
              transition={spring}
              onClick={() => setPicked(n.id)}
            >
              {/* The portrait sits in a bronze ring plate, the game's medallion. */}
              <span className="medallion"><Portrait id={n.id} name={n.name} /></span>
              <span className="nightlord-name">{n.name}</span>
            </motion.button>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {picked && (
          // One bar for every pick, so switching Nightlord updates the counts instead of replaying the entrance.
          // It sits in the page flow under the grid. On phone it is a sticky framed plate: it floats over the grid while
          // there is more to scroll, and its own space in the flow means it never covers the last row at the end.
          <motion.nav
            key="earths"
            className={wide ? 'earths' : 'earths earth-bar plate'}
            aria-labelledby="earth-heading"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={spring}
          >
            {!wide && <Frame />}
            <h2 id="earth-heading" className="earth-heading">Shifting Earth</h2>
            <div className="earth-grid">
              {catalog.earthsFor(picked).map((earth) => (
                <button key={earth} className="earth" onClick={() => go(`/find/${picked}/${earth}`)}>
                  <img className="earth-thumb" src={`/maps/thumb/${earth}.webp`} alt="" width={240} height={240} draggable={false} />
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
