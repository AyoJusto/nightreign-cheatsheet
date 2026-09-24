import type { Route } from './router'

type MapRoute = Extract<Route, { name: 'find' | 'seed' }>

export function MapScreen({ route: _route, go: _go }: { route: MapRoute; go: (path: string, replace?: boolean) => void }) {
  return <h1>Map</h1>
}
