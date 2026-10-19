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
  const noInset = useMotionValue(0) // desktop: the side panel never covers the map
  const topInset = useMotionValue(0) // bottom edge of the overlay's top pill, measured by the overlay
  const restInset = useMotionValue(0) // what the overlay covers at the bottom when no sheet is open
  const corner = useMotionValue<Corner>(NO_CORNER) // the Nightlord medallion and its card, drawn over the map
  const moves = useMotionValue(0) // the user's pans and pinches of the map, which fold the Nightlord's card
  // One map for both modes: the overlays hand it their pins, so finder to result keeps the map in place.
  const [content, setContent] = useState<MapContent>({ pins: [] })
  // parseRoute only yields a seed route for ids that exist.
  const seed = route.name === 'seed' ? catalog.seed(route.id)! : null
  const { nightlord, earth } = seed ?? (route as Extract<MapRoute, { name: 'find' }>)
  const pool = useMemo(() => catalog.seedsFor(nightlord, earth), [nightlord, earth])
  // The overlay comes first in the document, so Tab reaches its controls and side panel before the map's
  // dozens of pins. Every overlay surface has a z-index, so this order does not change what draws on top.
  return (
    <>
      {seed
        ? <ResultOverlay seed={seed} go={go} bottomInset={bottomInset} topInset={topInset} restInset={restInset} setMap={setContent} moves={moves} />
        // Keyed by pool so a pool change on a mounted screen starts a fresh Scouting.
        : <FinderOverlay key={`${nightlord}/${earth}`} pool={pool} nightlord={nightlord} earth={earth} go={go} bottomInset={bottomInset} topInset={topInset} restInset={restInset} setMap={setContent} />}
      {/* After the overlay and before the map in Tab order; it stays mounted from finder to result, like the map. */}
      <NightlordMedallion nightlord={nightlord} result={seed !== null} lift={bottomInset} rest={restInset} corner={corner} moves={moves} />
      <MapView key={earth} earth={earth} {...content} topInset={topInset} restInset={wide ? noInset : restInset} bottomInset={wide ? noInset : bottomInset} corner={corner} moves={moves} />
    </>
  )
}
