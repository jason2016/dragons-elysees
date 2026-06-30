import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import styles from './AdminPanel.module.css'

const ADMIN_KEY_LS = 'dragons_admin_key'
const STATUS = {
  pending:   { label: 'En attente', bg: '#3a2f12', color: '#f5c518', border: '#d4a30055' },
  confirmed: { label: 'Confirmée', bg: '#10331f', color: '#4ade80', border: '#16a34055' },
  declined:  { label: 'Refusée',  bg: '#3a1414', color: '#f87171', border: '#dc262655' },
}
const today = () => new Date().toISOString().split('T')[0]
const fmtDate = (d) => { try { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}` } catch { return d } }

export default function BookingsView() {
  const [hasKey, setHasKey] = useState(!!localStorage.getItem(ADMIN_KEY_LS))
  const [keyInput, setKeyInput] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // { id, decision, name, date, time }
  const [toast, setToast] = useState('')

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const data = await api.listBookings()
      setBookings(data.bookings || [])
    } catch (e) {
      if (e?.message === 'unauthorized') {
        localStorage.removeItem(ADMIN_KEY_LS); setHasKey(false)
        setErr('Clé invalide — veuillez la saisir à nouveau.')
      } else { setErr('Erreur de chargement.') }
    } finally { setLoading(false) }
  }

  useEffect(() => { if (hasKey) load() }, [hasKey])

  const saveKey = () => {
    const k = keyInput.trim()
    if (!k) return
    localStorage.setItem(ADMIN_KEY_LS, k); setKeyInput(''); setHasKey(true)
  }
  const clearKey = () => { localStorage.removeItem(ADMIN_KEY_LS); setBookings([]); setHasKey(false) }

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const doDecision = async () => {
    const { id, decision } = confirmAction
    setBusyId(id); setConfirmAction(null)
    try {
      const res = await api.bookingDecision(id, decision)
      if (res?.ok === false && res.reason === 'already_processed') {
        showToast('Cette réservation a déjà été traitée.')
      } else {
        showToast(decision === 'confirm' ? 'Confirmée — le client a été notifié.' : 'Refusée — le client a été notifié.')
      }
      await load()
    } catch (e) {
      if (e?.message === 'unauthorized') { localStorage.removeItem(ADMIN_KEY_LS); setHasKey(false) }
      else showToast('Erreur — réessayez.')
    } finally { setBusyId(null) }
  }

  // ── Key entry ──
  if (!hasKey) {
    return (
      <div className={styles.card} style={{ maxWidth: 460, margin: '20px auto' }}>
        <div className={styles.cardHeader}><h2 className={styles.cardTitle}>🔑 Accès réservations</h2></div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 12px' }}>
          Saisissez la clé d'accès (fournie par l'administrateur).
        </p>
        {err && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="password" className={styles.dateInput} style={{ flex: 1 }}
            placeholder="Clé d'accès" value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveKey()}
            autoFocus
          />
          <button className="btn-gold" onClick={saveKey}>Valider</button>
        </div>
      </div>
    )
  }

  const td = today()
  const pendingCount = bookings.filter(b => b.status === 'pending').length

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>🍽️ Réservations {pendingCount > 0 && `· ${pendingCount} en attente`}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className={styles.refreshBtn} onClick={load} title="Actualiser">↻</button>
          <button onClick={clearKey} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Changer la clé
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>Chargement…</div>
      ) : bookings.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', padding: 24, textAlign: 'center' }}>Aucune réservation.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
          {bookings.map(b => {
            const isToday = b.booking_date === td
            const st = STATUS[b.status] || { label: b.status, bg: '#2a2a2a', color: '#aaa', border: '#444' }
            const open = expandedId === b.booking_id
            return (
              <div key={b.booking_id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color, #2a2a2a)',
                borderLeft: isToday ? '4px solid var(--accent-gold, #d4a300)' : '1px solid var(--border-color, #2a2a2a)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', cursor: 'pointer' }}
                     onClick={() => setExpandedId(open ? null : b.booking_id)}>
                  {isToday && <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'var(--accent-gold, #d4a300)', color: '#1a1208' }}>Aujourd'hui</span>}
                  <strong style={{ color: 'var(--text-primary)' }}>{b.customer_name}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>· {b.guests} pers.</span>
                  <span style={{ color: 'var(--text-secondary)' }}>· {fmtDate(b.booking_date)} {b.booking_time}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                    {st.label}
                  </span>
                </div>

                {open && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-color, #2a2a2a)', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span>📞 <a href={`tel:${b.customer_phone}`} style={{ color: 'var(--accent-gold, #d4a300)' }}>{b.customer_phone}</a></span>
                    <span>✉️ {b.customer_email}</span>
                    {b.notes && <span>📝 {b.notes}</span>}
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Reçue le {fmtDate((b.created_at || '').slice(0, 10))}</span>
                  </div>
                )}

                {b.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button disabled={busyId === b.booking_id}
                      onClick={() => setConfirmAction({ id: b.booking_id, decision: 'confirm', name: b.customer_name, date: b.booking_date, time: b.booking_time })}
                      style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                      {busyId === b.booking_id ? '…' : '✓ Confirmer'}
                    </button>
                    <button disabled={busyId === b.booking_id}
                      onClick={() => setConfirmAction({ id: b.booking_id, decision: 'decline', name: b.customer_name, date: b.booking_date, time: b.booking_time })}
                      style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                      {busyId === b.booking_id ? '…' : '✕ Refuser'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Decision confirmation modal */}
      {confirmAction && (
        <div onClick={() => setConfirmAction(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', color: '#2a2520', borderRadius: 14, padding: 20, width: 'min(400px,100%)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 17 }}>
              {confirmAction.decision === 'confirm' ? '✓ Confirmer la réservation ?' : '✕ Refuser la réservation ?'}
            </h3>
            <p style={{ fontSize: 15, margin: '0 0 4px' }}><strong>{confirmAction.name}</strong></p>
            <p style={{ fontSize: 14, color: '#6b6355', margin: 0 }}>{fmtDate(confirmAction.date)} · {confirmAction.time}</p>
            <p style={{ fontSize: 13, color: '#6b6355', margin: '8px 0 0' }}>Le client sera notifié par email.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmAction(null)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d8cdb8', background: '#f0ece3', color: '#3a3328', cursor: 'pointer' }}>Annuler</button>
              <button onClick={doDecision} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 700, color: '#fff', cursor: 'pointer', background: confirmAction.decision === 'confirm' ? '#16a34a' : '#dc2626' }}>
                {confirmAction.decision === 'confirm' ? 'Confirmer' : 'Refuser'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, zIndex: 1100, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
