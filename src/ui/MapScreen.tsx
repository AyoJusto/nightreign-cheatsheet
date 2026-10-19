import { useMemo, useState } from 'react'
import { useMotionValue } from 'motion/react'
import type { Route } from './router'
import { catalog } from '../data/catalog'
import { MapView } from './MapView'
import type { MapContent } from './mapTypes'
import { FinderOverlay } from './FinderOverlay'
import { ResultOverlay } from './ResultOverlay'
import { NightlordMedallion, NO_CORNER, type Corner } from './NightlordMedallion'
import { useWide } from './useWide'

type MapRoute = Extract<Route, { name: 'find' | 'seed' }>

export function MapScreen({ route, go }: { route: MapRoute; go: (path: string, back?: boolean) => void }) {
  const wide = useWide()
  const bottomInset = useMotionValue(0)
  const noInset = useMotionValue(0)
  const topInset = useMotionValue(0)
  const restInset = useMotionValue(0)
  const corner = useMotionValue<Corner>(NO_CORNER)
  const moves = useMotionValue(0)
  const [content, setContent] = useState<MapContent>({ pins: [] })
  // parseRoute only yields a seed route for ids that exist.
  const seed = route.name === 'seed' ? catalog.seed(route.id)! : null
  const { nightlord, earth } = seed ?? (route as Extract<MapRoute, { name: 'find' }>)
  const pool = useMemo(() => catalog.seedsFor(nightlord, earth), [nightlord, earth])
  // Overlay before the map in the DOM so Tab reaches its controls before the pins; z-index decides what draws on top.
  return (
    <>
      {seed
        ? <ResultOverlay seed={seed} go={go} bottomInset={bottomInset} topInset={topInset} restInset={restInset} setMap={setContent} moves={moves} />
        // Keyed by pool so a pool change starts a fresh Scouting.
        : <FinderOverlay key={`${nightlord}/${earth}`} pool={pool} nightlord={nightlord} earth={earth} go={go} bottomInset={bottomInset} topInset={topInset} restInset={restInset} setMap={setContent} />}
      <NightlordMedallion nightlord={nightlord} result={seed !== null} lift={bottomInset} rest={restInset} corner={corner} moves={moves} />
      <MapView key={earth} earth={earth} {...content} topInset={topInset} restInset={wide ? noInset : restInset} bottomInset={wide ? noInset : bottomInset} corner={corner} moves={moves} />
    </>
  )
}
