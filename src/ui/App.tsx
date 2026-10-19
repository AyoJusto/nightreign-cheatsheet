import { useRoute } from './router'
import { HomeScreen } from './HomeScreen'
import { MapScreen } from './MapScreen'
import { AboutScreen } from './AboutScreen'

export function App() {
  const [route, go] = useRoute()
  if (route.name === 'home') return <HomeScreen go={go} />
  if (route.name === 'about') return <AboutScreen go={go} />
  // Same component for finder and result, so the map stays mounted across the transition.
  return <MapScreen route={route} go={go} />
}
