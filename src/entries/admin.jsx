import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import '../i18n'                        // side-effect: initialise i18next (same as main.jsx)
import { LangProvider } from '../hooks/useLang'
import AdminPanel from '../components/AdminPanel'

// Admin PWA entry (admin.html). AdminPanel only depends on useLang, so LangProvider
// is the only context it needs. Its dragons_admin_token login logic is unchanged.
// No service-worker registration here — admin is an online tool (mirrors neige-rouge).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <AdminPanel />
    </LangProvider>
  </StrictMode>,
)
