import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWide } from './useWide'
import { NIGHTLORDS, earthName, type NightlordPick } from '../domain/names'
import { catalog } from '../data/catalog'
import { Frame, Flourish } from './Frame'
import { WeaknessCard } from './NightlordMedallion'

const spring = { type: 'spring', visualDuration: 0.45, bounce: 0.15 } as const

// Last, the game's hidden Nightlord of Deep of Night: it scouts every Nightlord's seeds on the earth picked.
const PICKS: readonly { id: NightlordPick; name: string }[] = [...NIGHTLORDS, { id: 'unknown', name: 'Unknown' }]

function Portrait({ id, name }: { id: NightlordPick; name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <div className="portrait monogram title" aria-hidden>{name.split(' ').map((w) => w[0]).join('')}</div>
  }
  return <img className="portrait" src={`/nightlords/${id}.webp`} alt="" onError={() => setFailed(true)} />
}

export function HomeScreen({ go }: { go: (path: string) => void }) {
  const wide = useWide()
  const [picked, setPicked] = useState<NightlordPick | null>(null)
  return (
    <main className="home">
      <h1 className="home-title">Choose your Nightlord</h1>
      <Flourish className="home-flourish" />
      <ul className="nightlord-grid">
        {PICKS.map((n) => (
          <li key={n.id}>
            {/* A pale outline in a blue halo marks the pick; the others' portraits dim, and their names drop to the secondary tone
                (tokens.css), still easy to read. No scale, which would drop a name out of line with its row. */}
            <button className="nightlord" aria-pressed={picked === n.id} data-dim={(picked && picked !== n.id) || undefined} onClick={() => setPicked(n.id)}>
              {/* The portrait sits in a frosted stone ring, the game's medallion. */}
              <span className="medallion"><Portrait id={n.id} name={n.name} /></span>
              <span className="nightlord-name">{n.name}</span>
            </button>
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
            {/* The picked Nightlord's medallion and weakness card, as the map's corner shows them, above the earths. */}
            <WeaknessCard nightlord={picked} />
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
