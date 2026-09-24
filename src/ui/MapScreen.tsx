import { useMemo, useState } from 'react'
import { useMotionValue } from 'motion/react'
import type { Route } from './router'
import { catalog } from '../data/catalog'
import { MapView, type MapContent } from './MapView'
import { FinderOverlay } from './FinderOverlay'
import { ResultOverlay } from './ResultOverlay'
import { useWide } from './useWide'

type MapRoute = Extract<Route, { name: 'find' | 'seed' }>

export function MapScreen({ route, go }: { route: MapRoute; go: (path: string, replace?: boolean) => void }) {
  const wide = useWide()
  const bottomInset = useMotionValue(96)
  const noInset = useMotionValue(0) // desktop: the side panel never covers the map
  const topInset = useMotionValue(0) // bottom edge of the overlay's top pill, measured by the overlay
  // One map for both modes: the overlays hand it their pins, so finder to result keeps the map in place.
  const [content, setContent] = useState<MapContent>({ pins: [], onPin: () => {} })
  // parseRoute only yields a seed route for ids that exist.
  const seed = route.name === 'seed' ? catalog.seed(route.id)! : null
  const { nightlord, earth } = seed ?? (route as Extract<MapRoute, { name: 'find' }>)
  const pool = useMemo(() => catalog.seedsFor(nightlord, earth), [nightlord, earth])
  return (
    <>
      <MapView key={earth} earth={earth} {...content} topInset={topInset} bottomInset={wide ? noInset : bottomInset} />
      {seed
        ? <ResultOverlay seed={seed} go={go} bottomInset={bottomInset} topInset={topInset} setMap={setContent} />
        // Keyed by pool so a pool change on a mounted screen starts a fresh Scouting.
        : <FinderOverlay key={`${nightlord}/${earth}`} pool={pool} nightlord={nightlord} earth={earth} go={go} bottomInset={bottomInset} topInset={topInset} setMap={setContent} />}
    </>
  )
}
