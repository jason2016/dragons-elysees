import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker + update governance (HF3). The SW self-activates (skipWaiting/claim), so a
// new deploy takes over without "close every tab". We only need to tell the user the page in
// front of them is now the old build, and offer one tap to reload — never auto-reload, which
// would risk a loop and could drop work in a form.
const announceUpdate = () => window.dispatchEvent(new Event('dragons-sw-updated'))

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        // A newer worker finished installing while this page was already controlled.
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing
          if (!sw) return
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) announceUpdate()
          })
        })
        reg.update?.()
      })
      .catch(err => console.error('SW registration failed:', err))

    // Fires when a worker takes control. On a FIRST visit the page starts uncontrolled and
    // clients.claim() also fires this — that is an install, not an update, so don't nag.
    const hadController = !!navigator.serviceWorker.controller
    let announced = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || announced) return
      announced = true
      announceUpdate()
    })
  })
}
