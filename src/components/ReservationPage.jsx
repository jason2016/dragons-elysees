import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../hooks/useLang'
import { api } from '../utils/api'
import styles from './ReservationPage.module.css'

const TYPES = ['normal', 'private_room', 'tour_group', 'event', 'other']
const TYPE_KEY = {
  normal: 'typeNormal',
  private_room: 'typePrivateRoom',
  tour_group: 'typeTourGroup',
  event: 'typeEvent',
  other: 'typeOther',
}

// Discrete 30-min slots within Google business hours: 11:00–14:00 & 18:00–23:00.
function buildTimeSlots() {
  const slots = []
  for (const [start, end] of [[11, 14], [18, 23]]) {
    for (let h = start; h <= end; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`)
      if (h !== end) slots.push(`${String(h).padStart(2, '0')}:30`)
    }
  }
  return slots
}
const TIME_SLOTS = buildTimeSlots()

function tomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

const emailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export default function ReservationPage() {
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const minDate = tomorrowISO()

  const [form, setForm] = useState({
    date: minDate, time: '', guests: 2,
    name: '', phone: '', email: '', type: 'normal', notes: '',
  })
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    if (!form.date || !form.time || !form.name.trim() || !form.phone.trim() || !form.email.trim()) return 'errRequired'
    if (!emailValid(form.email.trim())) return 'errEmail'
    const g = Number(form.guests)
    if (!Number.isInteger(g) || g < 1 || g > 20) return 'errGuests'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status === 'submitting') return   // guard against re-entry / rapid double-submit
    const v = validate()
    if (v) { setErrorMsg(t(`reservation.${v}`)); setStatus('error'); return }
    setStatus('submitting'); setErrorMsg('')
    try {
      await api.createBooking({
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        customer_email: form.email.trim(),
        booking_date: form.date,
        booking_time: form.time,
        guests: Number(form.guests),
        type: form.type,
        notes: form.notes.trim(),
        lang,   // fr|zh|en|es — backend sends the confirmation email in this language (defaults to fr)
      })
      setStatus('success')
    } catch (err) {
      const map = { missing_fields: 'errRequired', invalid_email: 'errEmail', invalid_guests: 'errGuests' }
      const key = map[err?.message] || (String(err?.message || '').toLowerCase().includes('fetch') ? 'errNetwork' : 'errGeneric')
      setErrorMsg(t(`reservation.${key}`))
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.page}>
        <div className={styles.success}>
          <div className={styles.successIcon}>✅</div>
          <h1 className={styles.successTitle}>{t('reservation.successTitle')}</h1>
          <p className={styles.successMsg}>{t('reservation.successMsg')}</p>
          {/* Booking code intentionally NOT shown to the guest (backend still returns it). */}
          <div className={styles.successActions}>
            <button className="btn-gold" onClick={() => navigate('/')}>{t('reservation.backHome')}</button>
            <button
              className={styles.secondaryBtn}
              onClick={() => { setStatus('idle'); setForm((f) => ({ ...f, time: '', notes: '' })) }}
            >
              {t('reservation.newBooking')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t('reservation.title')}</h1>
        <p className={styles.intro}>{t('reservation.intro')}</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>{t('reservation.date')} *</span>
              <input type="date" min={minDate} value={form.date} onChange={set('date')} className={styles.input} required />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t('reservation.time')} *</span>
              <select value={form.time} onChange={set('time')} className={styles.input} required>
                <option value="">{t('reservation.timePlaceholder')}</option>
                {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>{t('reservation.guests')} *</span>
              <select value={form.guests} onChange={set('guests')} className={styles.input} required>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t('reservation.type')}</span>
              <select value={form.type} onChange={set('type')} className={styles.input}>
                {TYPES.map((ty) => <option key={ty} value={ty}>{t(`reservation.${TYPE_KEY[ty]}`)}</option>)}
              </select>
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>{t('reservation.name')} *</span>
            <input type="text" value={form.name} onChange={set('name')} className={styles.input} required autoComplete="name" />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>{t('reservation.phone')} *</span>
              <input type="tel" value={form.phone} onChange={set('phone')} className={styles.input} required autoComplete="tel" />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t('reservation.email')} *</span>
              <input type="email" value={form.email} onChange={set('email')} className={styles.input} required autoComplete="email" />
              <span className={styles.hint}>{t('reservation.emailHint')}</span>
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>{t('reservation.notes')}</span>
            <textarea value={form.notes} onChange={set('notes')} className={styles.textarea} rows={3} placeholder={t('reservation.notesHint')} />
          </label>

          {status === 'error' && <p className={styles.error}>{errorMsg}</p>}

          <button type="submit" className={`btn-gold ${styles.submit}`} disabled={status === 'submitting'}>
            {status === 'submitting' ? t('reservation.submitting') : t('reservation.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
