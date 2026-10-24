import { useRoute } from './router'
import { HomeScreen, BossesPage } from './HomeScreen'
import { MapScreen } from './MapScreen'
import { AboutScreen } from './AboutScreen'
import { EnemyPage } from './EnemyPage'
import { NightlordPage, NightlordsPage } from './NightlordPages'
import { BuildsPage, EffectsPage } from './LoadoutPages'

export function App() {
  const [route, go] = useRoute()
  switch (route.name) {
    case 'home': return <HomeScreen key="" go={go} />
    case 'pick': return <HomeScreen key={route.nightlord ?? ''} go={go} initial={route.nightlord} />
    case 'about': return <AboutScreen go={go} />
    case 'nightlords': return <NightlordsPage go={go} />
    case 'nightlord': return <NightlordPage key={route.id} id={route.id} go={go} />
    case 'bosses': return <BossesPage go={go} />
    case 'enemy': return <EnemyPage key={route.id} id={route.id} go={go} />
    case 'effects': return <EffectsPage key={route.group} group={route.group} go={go} />
    case 'builds': return <BuildsPage key={route.character ?? ''} character={route.character} go={go} />
    case 'find':
    case 'seed': return <MapScreen route={route} go={go} />
  }
}
