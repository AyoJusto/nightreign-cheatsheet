import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
// Every stylesheet but the map's and the weakness card's (imported by their components, after these), in cascade
// order: later files may rely on winning ties with earlier ones.
import './styles/tokens.css'
import './styles/base.css'
import './styles/frame.css'
import './styles/home.css'
import './styles/map-screen.css'
import './styles/sheet.css'
import './styles/controls.css'
import './styles/result.css'
import './styles/side-panel.css'
import { App } from './App'

document.addEventListener('gesturestart', (e) => e.preventDefault())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
