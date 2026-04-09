import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { api } from '../utils/api'
import styles from './AccountLogin.module.css'

export default function AccountLogin() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const { login } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const sendOtp = async (e) => {
    e?.preventDefault()
    if (!email.trim()) return
    setError('')
    setLoading(true)
    try {
      await api.sendOtp(email.trim().toLowerCase())
      setStep('otp')
      startCooldown()
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  const startCooldown = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const verifyOtp = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setError('')
    setLoading(true)
    try {
      const res = await api.verifyOtp(email.trim().toLowerCase(), code.trim())
      login(res.customer, res.token)
      navigate('/account')
    } catch (err) {
      setError(err.message || 'Code invalide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logoMark}>龍</div>
        <h1 className={styles.title}>{t('myAccountTitle')}</h1>
        <p className={styles.sub}>
          {step === 'email' ? t('loginSubEmail') : t('loginSubOtp', email)}
        </p>

        {step === 'email' ? (
          <form className={styles.form} onSubmit={sendOtp}>
            <input
              type="email"
              className={styles.input}
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
              {loading ? t('sending') : t('sendCode')}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={verifyOtp}>
            <div className={styles.otpHint}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {t('otpHint')}
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className={`${styles.input} ${styles.otpInput}`}
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className="btn-gold" style={{ width: '100%' }} disabled={loading}>
              {loading ? t('verifying') : t('verifyCode')}
            </button>
            <div className={styles.resend}>
              {resendCooldown > 0 ? (
                <span className={styles.cooldown}>{t('resendIn', resendCooldown)}</span>
              ) : (
                <button type="button" className={styles.resendBtn} onClick={sendOtp} disabled={loading}>
                  {t('resend')}
                </button>
              )}
              <button type="button" className={styles.changeEmail} onClick={() => { setStep('email'); setCode(''); setError('') }}>
                {t('changeEmail')}
              </button>
            </div>
          </form>
        )}

        <p className={styles.footer}>{t('loginFooter')}</p>
      </div>
    </div>
  )
}
