import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import './styles/theme.css'
import './styles/base.css'
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
