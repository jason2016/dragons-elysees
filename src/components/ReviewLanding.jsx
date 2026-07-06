import { useEffect } from 'react'

// Single source of truth: the review funnel lives entirely on the backend
// (https://mcp.clawshow.ai/avis) — 4-lang UI, token prefill, server-side Google
// redirect (managed by de_config). This route is a thin forwarder: it hands off to
// the backend page, passing through all query params (?lang, ?token, ?b …).
// No local star/form/submit logic — removed to avoid a duplicate implementation.
const BACKEND_AVIS = 'https://mcp.clawshow.ai/avis'

export default function ReviewLanding() {
  useEffect(() => {
    // HashRouter carries the query after the hash (#/avis?lang=zh); also honour a
    // plain ?search in case this ever renders from a bare path.
    const hashQs = (window.location.hash.split('?')[1]) || ''
    const searchQs = window.location.search.replace(/^\?/, '')
    const qs = hashQs || searchQs
    window.location.replace(BACKEND_AVIS + (qs ? `?${qs}` : ''))
  }, [])

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a84c', background: '#0a0a0a', fontFamily: 'system-ui' }}>
      Redirection… · 正在跳转…
    </div>
  )
}
