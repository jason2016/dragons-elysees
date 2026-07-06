import { useState } from 'react'
import { api } from '../utils/api'

// Post-dining review funnel — landing page opened from the guest's email link on their phone.
// Mobile-first, 龙城 gold/black. 4★–5★ → thank + (optional) Google review; 1★–3★ → private
// comment kept for the owner (admin « Avis » tab). Backend contract in parallel dev — submit is
// graceful (the guest always sees a thank-you). Form/host may move backend-side later.

// Restaurant Google review URL — fill when provided; empty hides the button (no broken link).
const GOOGLE_REVIEW_URL = ''

const T = {
  fr: { title: 'Votre avis', q: 'Comment était votre expérience ?', tapHint: 'Touchez une étoile',
        thanksHi: 'Merci beaucoup !', google: 'Laisser un avis Google', googleHint: 'Votre avis nous aide énormément.',
        low: 'Merci de votre retour.', lowHint: 'Dites-nous ce qui n’a pas été — nous lisons chaque message.',
        placeholder: 'Votre commentaire (optionnel)', send: 'Envoyer', sending: '…', done: 'Bien reçu, merci !', doneHint: 'Nous prenons note pour nous améliorer.' },
  zh: { title: '您的评价', q: '您的用餐体验如何？', tapHint: '点击星星评分',
        thanksHi: '非常感谢！', google: '去 Google 评价', googleHint: '您的好评对我们非常重要。',
        low: '感谢您的反馈。', lowHint: '请告诉我们哪里不足——我们会认真阅读每一条留言。',
        placeholder: '您的留言（可选）', send: '提交', sending: '…', done: '已收到,谢谢!', doneHint: '我们会认真改进。' },
  en: { title: 'Your review', q: 'How was your experience?', tapHint: 'Tap a star',
        thanksHi: 'Thank you!', google: 'Leave a Google review', googleHint: 'Your review helps us a lot.',
        low: 'Thank you for your feedback.', lowHint: 'Tell us what went wrong — we read every message.',
        placeholder: 'Your comment (optional)', send: 'Send', sending: '…', done: 'Received, thank you!', doneHint: 'We’ll take note to improve.' },
  es: { title: 'Su opinión', q: '¿Qué le pareció su experiencia?', tapHint: 'Toque una estrella',
        thanksHi: '¡Muchas gracias!', google: 'Dejar una reseña en Google', googleHint: 'Su reseña nos ayuda mucho.',
        low: 'Gracias por sus comentarios.', lowHint: 'Cuéntenos qué falló — leemos cada mensaje.',
        placeholder: 'Su comentario (opcional)', send: 'Enviar', sending: '…', done: '¡Recibido, gracias!', doneHint: 'Tomamos nota para mejorar.' },
}

// Read params from the hash query (HashRouter → #/avis?lang=fr&b=006&t=…)
function hashParams() {
  try { return new URLSearchParams((window.location.hash.split('?')[1]) || '') } catch { return new URLSearchParams('') }
}

export default function ReviewLanding() {
  const p = hashParams()
  const lang = ['fr', 'zh', 'en', 'es'].includes(p.get('lang')) ? p.get('lang') : (localStorage.getItem('lang') || 'fr')
  const t = T[lang] || T.fr
  const bookingCode = p.get('b') || ''
  const token = p.get('t') || ''

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [phase, setPhase] = useState('rate')   // rate | high | low | done
  const [sending, setSending] = useState(false)

  const pick = (n) => {
    setRating(n)
    setPhase(n >= 4 ? 'high' : 'low')
    if (n >= 4) {
      // positive → keep it too (silent), then invite to Google
      api.submitReview({ rating: n, comment: '', lang, booking_code: bookingCode, token }).catch(() => {})
    }
  }

  const sendLow = async () => {
    setSending(true)
    try { await api.submitReview({ rating, comment: comment.trim(), lang, booking_code: bookingCode, token }) } catch { /* graceful */ }
    setSending(false); setPhase('done')
  }

  const wrap = { minHeight: '100vh', background: 'linear-gradient(160deg, #1a1206 0%, #0a0a0a 60%)', color: '#f5f0e8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', boxSizing: 'border-box', fontFamily: 'var(--font-body, system-ui)' }
  const card = { width: '100%', maxWidth: 440, textAlign: 'center' }
  const gold = '#c9a84c'

  return (
    <div style={wrap}>
      <div style={card}>
        <img src="/icons/logo5.png" alt="Dragons Élysées 龙城酒楼" style={{ width: 120, height: 'auto', margin: '0 auto 8px', display: 'block', filter: 'drop-shadow(0 2px 10px rgba(201,168,76,0.35))' }} />
        <div style={{ fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: gold, marginBottom: 22 }}>{t.title}</div>

        {phase === 'rate' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.35 }}>{t.q}</h1>
            <p style={{ color: '#a09882', fontSize: 14, margin: '0 0 22px' }}>{t.tapHint}</p>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => pick(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                  aria-label={`${n}`} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 44, lineHeight: 1, padding: 4, color: (hover || rating) >= n ? '#f5c518' : '#4a4438', transition: 'color .12s' }}>★</button>
              ))}
            </div>
          </>
        )}

        {phase === 'high' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 6 }}>🐉</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>{t.thanksHi}</h1>
            <p style={{ color: '#a09882', fontSize: 15, margin: '0 0 24px' }}>{t.googleHint}</p>
            {GOOGLE_REVIEW_URL && (
              <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '14px 30px', borderRadius: 12, background: `linear-gradient(135deg, ${gold}, #b8973a)`, color: '#0a0a0a', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
                {t.google}
              </a>
            )}
          </>
        )}

        {phase === 'low' && (
          <>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map(n => <span key={n} style={{ fontSize: 26, color: rating >= n ? '#f5c518' : '#4a4438' }}>★</span>)}
            </div>
            <h1 style={{ fontSize: 21, fontWeight: 700, margin: '0 0 6px' }}>{t.low}</h1>
            <p style={{ color: '#a09882', fontSize: 14, margin: '0 0 16px', lineHeight: 1.5 }}>{t.lowHint}</p>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} placeholder={t.placeholder}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: `1px solid ${gold}55`, background: 'rgba(255,255,255,0.05)', color: '#f5f0e8', fontSize: 15, resize: 'vertical', marginBottom: 14 }} />
            <button onClick={sendLow} disabled={sending}
              style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${gold}, #b8973a)`, color: '#0a0a0a', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              {sending ? t.sending : t.send}
            </button>
          </>
        )}

        {phase === 'done' && (
          <>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🙏</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>{t.done}</h1>
            <p style={{ color: '#a09882', fontSize: 15, margin: 0 }}>{t.doneHint}</p>
          </>
        )}
      </div>
    </div>
  )
}
