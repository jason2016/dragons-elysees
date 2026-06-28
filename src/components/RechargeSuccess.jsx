import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { api, formatPrice } from '../utils/api'

export default function RechargeSuccess() {
  const { isLoggedIn } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking') // checking | paid | pending
  const [bal, setBal] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) { navigate('/account/login'); return }
    const pid = sessionStorage.getItem('dragons_recharge_pid')
    if (!pid) { setStatus('pending'); return }
    let tries = 0
    let stopped = false
    const poll = async () => {
      tries++
      try {
        const r = await api.rechargeVerify(pid)
        if (stopped) return
        setBal(r)
        if (r.status === 'paid') {
          setStatus('paid')
          sessionStorage.removeItem('dragons_recharge_pid')
          return
        }
      } catch (e) { /* keep retrying */ }
      if (!stopped && tries < 6) setTimeout(poll, 2000) // up to ~12s for the webhook/settle
      else if (!stopped) setStatus('pending')
    }
    poll()
    return () => { stopped = true }
  }, [isLoggedIn, navigate])

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
      {status === 'checking' && (
        <>
          <div style={{ fontSize: 44 }}>⏳</div>
          <h1 style={{ fontSize: 20, margin: '8px 0' }}>{t('bal.verifyChecking')}</h1>
        </>
      )}
      {status === 'paid' && (
        <>
          <div style={{ fontSize: 48 }}>✅</div>
          <h1 style={{ fontSize: 22, margin: '8px 0' }}>{t('bal.verifyPaid')}</h1>
          {bal && (
            <p style={{ fontSize: 16 }}>
              💳 {t('bal.paid')}: <strong>{formatPrice(bal.paid_balance ?? 0)}</strong>
            </p>
          )}
        </>
      )}
      {status === 'pending' && (
        <>
          <div style={{ fontSize: 44 }}>⏳</div>
          <h1 style={{ fontSize: 20, margin: '8px 0' }}>{t('bal.verifyPending')}</h1>
          <p style={{ color: '#666', fontSize: 14 }}>{t('bal.verifyPendingHint')}</p>
        </>
      )}
      <button className="btn-gold" style={{ marginTop: 18, padding: '12px 24px' }} onClick={() => navigate('/account')}>
        {t('bal.backToAccount')}
      </button>
    </div>
  )
}
