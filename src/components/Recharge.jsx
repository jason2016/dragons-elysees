import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { api, formatPrice } from '../utils/api'

// Mirrors backend default DRAGONS_RECHARGE_MAX (backend is authoritative; this is a UX guard).
const RECHARGE_MAX = 1000
const PRESETS = [20, 50, 100, 200]

export default function Recharge() {
  const { isLoggedIn } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isLoggedIn) { navigate('/account/login'); return null }

  const submit = async () => {
    const amt = Math.round(parseFloat(amount) * 100) / 100
    if (!amt || amt <= 0) { setError(t('bal.rechargeInvalid')); return }
    if (amt > RECHARGE_MAX) { setError(t('bal.rechargeMax', { max: formatPrice(RECHARGE_MAX) })); return }
    setError(''); setLoading(true)
    try {
      const returnUrl = `${window.location.origin}${import.meta.env.BASE_URL}#/account`
      const res = await api.recharge(amt, 'stancer', returnUrl)
      if (res?.payment_url) {
        window.location.href = res.payment_url    // redirect to Stancer checkout
      } else {
        setError(res?.error || t('bal.rechargeFailed')); setLoading(false)
      }
    } catch (e) {
      setError(e.message || t('bal.rechargeFailed')); setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/account')} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', marginBottom: 8 }}>←</button>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>💳 {t('bal.recharge')}</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 18 }}>{t('bal.rechargeHint')}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {PRESETS.map(p => (
          <button key={p} onClick={() => setAmount(String(p))}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #d4af37',
              background: String(p) === amount ? '#d4af37' : 'transparent',
              color: String(p) === amount ? '#1a1a2e' : '#d4af37', fontWeight: 700, cursor: 'pointer' }}>
            {formatPrice(p)}
          </button>
        ))}
      </div>

      <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 6 }}>{t('bal.rechargeAmount')}</label>
      <input type="number" min="1" max={RECHARGE_MAX} step="1" value={amount}
        onChange={e => setAmount(e.target.value)} placeholder="0.00"
        style={{ width: '100%', padding: '12px 14px', fontSize: 18, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: 6 }} />
      <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>
        {t('bal.rechargeMaxNote', { max: formatPrice(RECHARGE_MAX) })}
      </div>

      {error && <div style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>{error}</div>}

      <button className="btn-gold" onClick={submit} disabled={loading}
        style={{ width: '100%', padding: '14px', fontSize: 16, opacity: loading ? 0.6 : 1 }}>
        {loading ? t('common.loading') : `${t('bal.rechargeSubmit')}${amount ? ' · ' + formatPrice(parseFloat(amount) || 0) : ''}`}
      </button>
      <p style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 12 }}>{t('bal.rechargeSecure')}</p>
    </div>
  )
}
