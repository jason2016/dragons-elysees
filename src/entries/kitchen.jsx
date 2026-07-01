import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import '../i18n'                        // side-effect: initialise i18next (same as main.jsx)
import { LangProvider } from '../hooks/useLang'
import KitchenDisplay from '../components/KitchenDisplay'

// Kitchen PWA entry (kitchen.html). KitchenDisplay only depends on useLang, so
// LangProvider is the only context it needs. Its front-end password gate (dragons2026)
// is unchanged. No service-worker registration here — kitchen is an online tool.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <KitchenDisplay />
    </LangProvider>
  </StrictMode>,
)
