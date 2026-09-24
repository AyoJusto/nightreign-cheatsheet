import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { NIGHTLORDS, earthName, type NightlordId } from '../domain/names'
import { catalog } from '../data/catalog'

const spring = { type: 'spring', visualDuration: 0.45, bounce: 0.15 } as const

function Portrait({ id, name }: { id: NightlordId; name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <div className="portrait monogram title" aria-hidden>{name.split(' ').map((w) => w[0]).join('')}</div>
  }
  return <img className="portrait" src={`/nightlords/${id}.webp`} alt="" onError={() => setFailed(true)} />
}

export function HomeScreen({ go }: { go: (path: string) => void }) {
  const [picked, setPicked] = useState<NightlordId | null>(null)
  return (
    <main className="home">
      <h1 className="title home-title">Choose your Nightlord</h1>
      <ul className="nightlord-grid">
        {NIGHTLORDS.map((n) => (
          <li key={n.id}>
            <motion.button
              className="nightlord"
              aria-pressed={picked === n.id}
              animate={{ scale: picked === n.id ? 1.04 : 1, opacity: picked && picked !== n.id ? 0.5 : 1 }}
              transition={spring}
              onClick={() => setPicked(n.id)}
            >
              <Portrait id={n.id} name={n.name} />
              <span className="nightlord-name">{n.name}</span>
            </motion.button>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {picked && (
          <motion.nav
            key={picked}
            className="earth-row glass"
            aria-label="Shifting Earth"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={spring}
          >
            {catalog.earthsFor(picked).map((earth) => (
              <button key={earth} className="earth" onClick={() => go(`/find/${picked}/${earth}`)}>
                <span>{earthName(earth)}</span>
                <span className="num earth-count">{catalog.seedsFor(picked, earth).length}</span>
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
      <footer className="home-footer"><button onClick={() => go('/about')}>About</button></footer>
    </main>
  )
}
