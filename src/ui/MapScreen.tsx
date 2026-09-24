import { useMemo } from 'react'
import { useMotionValue } from 'motion/react'
import type { Route } from './router'
import { catalog } from '../data/catalog'
import { FinderOverlay } from './FinderOverlay'
import { ResultOverlay } from './ResultOverlay'

type MapRoute = Extract<Route, { name: 'find' | 'seed' }>

export function MapScreen({ route, go }: { route: MapRoute; go: (path: string, replace?: boolean) => void }) {
  const bottomInset = useMotionValue(96)
  // Owned here, not by MapView, so zoom and pan carry over when the finder hands off to the result.
  const view = { x: useMotionValue(0), y: useMotionValue(0), scale: useMotionValue(1) }
  // parseRoute only yields a seed route for ids that exist.
  const seed = route.name === 'seed' ? catalog.seed(route.id)! : null
  const { nightlord, earth } = seed ?? (route as Extract<MapRoute, { name: 'find' }>)
  const pool = useMemo(() => catalog.seedsFor(nightlord, earth), [nightlord, earth])
  return seed
    ? <ResultOverlay seed={seed} go={go} bottomInset={bottomInset} view={view} />
    // Keyed by pool so a pool change on a mounted screen starts a fresh Scouting.
    : <FinderOverlay key={`${nightlord}/${earth}`} pool={pool} nightlord={nightlord} earth={earth} go={go} bottomInset={bottomInset} view={view} />
}
