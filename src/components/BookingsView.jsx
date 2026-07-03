import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import styles from './AdminPanel.module.css'

const today = () => new Date().toISOString().split('T')[0]
const fmtDate = (d) => { try { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}` } catch { return d } }

// State badge per booking — simplified to two visual states, green (normal) / red (cancelled).
//   cancelled            → red   « Annulée · 已取消 » (terminal, no actions)
//   confirm_source=auto  → green « Confirmée · 已确认 » + a small ⚡ marker (à vérifier / 待过目)
//   else (manual/…)      → green « ✓ Traitée · 已处理 » (约翰 personally handled it)
function sourceBadge(b) {
  if (b.status === 'cancelled') return { label: 'Annulée · 已取消', bg: '#3a1414', color: '#f87171', border: '#dc262655' }
  if (b.confirm_source === 'auto') return { label: 'Confirmée · 已确认', bg: '#10331f', color: '#4ade80', border: '#16a34055' }
  return { label: '✓ Traitée · 已处理', bg: '#10331f', color: '#4ade80', border: '#16a34055' }
}

// Preset cancel reasons (sent to the guest in their language email). "" = Autre → free text only.
const CANCEL_PRESETS = [
  'Salle privatisée / 包场',
  'Fermeture exceptionnelle / 特殊停业',
  '',  // Autre / 其他 — free text
]

export default function BookingsView() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // { id, type:'handle'|'cancel', name, date, time }
  const [cancelPreset, setCancelPreset] = useState('')     // preset cancel reason (sent to the guest)
  const [cancelFreeText, setCancelFreeText] = useState('') // optional free-text detail
  const [toast, setToast] = useState('')
  const [scope, setScope] = useState('upcoming')   // 'upcoming' (default: today+future) | 'past'

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const data = await api.listBookings({ scope })   // backend scopes + sorts (upcoming asc / past desc)
      setBookings(data.bookings || [])
    } catch (e) {
      // 401 → adminFetch already fired the logout event (AdminPanel returns to login); stay quiet.
      if (e?.message !== 'unauthorized') setErr('Erreur de chargement.')
    } finally { setLoading(false) }
  }

  // (Re)load on mount and whenever the view (upcoming/past) changes.
  useEffect(() => { load() }, [scope])   // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const doAction = async () => {
    const { id, type } = confirmAction
    // Combine preset + free text into the reason sent to the guest (empty = no reason line).
    const reason = [cancelPreset, cancelFreeText.trim()].filter(Boolean).join(' — ')
    setBusyId(id); setConfirmAction(null)
    try {
      if (type === 'handle') {
        await api.markBookingHandled(id)
        showToast('Réservation marquée comme traitée.')
      } else {
        const res = await api.cancelBooking(id, reason)
        if (res?.ok === false) showToast('Réservation déjà traitée ou annulée.')
        else showToast('Réservation annulée — le client a été notifié.')
      }
      await load()
    } catch (e) {
      if (e?.message !== 'unauthorized') showToast('Erreur — réessayez.')
    } finally { setBusyId(null); setCancelPreset(''); setCancelFreeText('') }
  }

  const td = today()
  const autoCount = bookings.filter(b => b.confirm_source === 'auto' && b.status !== 'cancelled').length

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>🍽️ Réservations {scope === 'upcoming' && autoCount > 0 && `· ${autoCount} ⚡ à vérifier`}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className={styles.refreshBtn} onClick={load} title="Actualiser">↻</button>
        </div>
      </div>

      {/* View toggle: À venir (default, today+future) vs Passées (history). Backend scopes + sorts each. */}
      <div style={{ display: 'flex', gap: 8, margin: '4px 0 12px' }}>
        {[['upcoming', 'À venir · 即将到来'], ['past', 'Passées · 历史']].map(([s, lbl]) => {
          const active = scope === s
          return (
            <button key={s} onClick={() => { if (s !== scope) { setScope(s); setExpandedId(null) } }}
              style={{
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                border: '1px solid ' + (active ? 'var(--accent-gold, #d4a300)' : 'var(--border-color, #2a2a2a)'),
                background: active ? 'var(--accent-gold-dim, #3a2f12)' : 'transparent',
                color: active ? 'var(--accent-gold, #f5c518)' : 'var(--text-muted)',
              }}>
              {lbl}
            </button>
          )
        })}
      </div>

      {err && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>{err}</div>}

      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>Chargement…</div>
      ) : bookings.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', padding: 24, textAlign: 'center' }}>Aucune réservation.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
          {bookings.map(b => {
            const isToday = b.booking_date === td
            const cancelled = b.status === 'cancelled'
            const badge = sourceBadge(b)
            const open = expandedId === b.booking_id
            return (
              <div key={b.booking_id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color, #2a2a2a)',
                borderLeft: cancelled ? '4px solid #dc262655' : '4px solid #16a34a',  // red cancelled / green normal
                borderRadius: 12, padding: '12px 14px', opacity: cancelled ? 0.7 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', cursor: 'pointer' }}
                     onClick={() => setExpandedId(open ? null : b.booking_id)}>
                  {isToday && !cancelled && <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'var(--accent-gold, #d4a300)', color: '#1a1208' }}>Aujourd'hui</span>}
                  <strong style={{ color: 'var(--text-primary)', textDecoration: cancelled ? 'line-through' : 'none' }}>{b.customer_name}</strong>
                  {b.booking_code && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-gold, #d4a300)', letterSpacing: '0.5px' }}>#{b.booking_code}</span>}
                  {!cancelled && b.confirm_source === 'auto' && <span title="À vérifier · 待过目" style={{ fontSize: 13, color: 'var(--accent-gold, #f5c518)' }}>⚡</span>}
                  <span style={{ color: 'var(--text-secondary)' }}>· {b.guests} pers.</span>
                  <span style={{ color: 'var(--text-secondary)' }}>· {fmtDate(b.booking_date)} {b.booking_time}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                    {badge.label}
                  </span>
                </div>

                {open && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-color, #2a2a2a)', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span>📞 <a href={`tel:${b.customer_phone}`} style={{ color: 'var(--accent-gold, #d4a300)' }}>{b.customer_phone}</a></span>
                    <span>✉️ {b.customer_email}</span>
                    {b.notes && <span>📝 {b.notes}</span>}
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      Reçue le {fmtDate((b.created_at || '').slice(0, 10))}{b.lang ? ` · 🌐 ${String(b.lang).toUpperCase()}` : ''}
                    </span>
                    {/* Actions live INSIDE the expanded detail only — list stays clean (browse-only). */}
                    {!cancelled && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        {b.confirm_source === 'auto' && (
                          <button disabled={busyId === b.booking_id}
                            onClick={() => setConfirmAction({ id: b.booking_id, type: 'handle', name: b.customer_name, date: b.booking_date, time: b.booking_time })}
                            style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                            {busyId === b.booking_id ? '…' : '✓ Marquer traité · 标记已处理'}
                          </button>
                        )}
                        <button disabled={busyId === b.booking_id}
                          onClick={() => { setCancelPreset(''); setCancelFreeText(''); setConfirmAction({ id: b.booking_id, type: 'cancel', name: b.customer_name, date: b.booking_date, time: b.booking_time }) }}
                          style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid #dc2626', background: 'transparent', color: '#f87171', fontWeight: 700, cursor: 'pointer' }}>
                          {busyId === b.booking_id ? '…' : '✕ Annuler · 取消'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Action confirmation modal */}
      {confirmAction && (
        <div onClick={() => setConfirmAction(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', color: '#2a2520', borderRadius: 14, padding: 20, width: 'min(400px,100%)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 17 }}>
              {confirmAction.type === 'handle' ? '✓ Marquer comme traité ?' : '✕ Annuler la réservation ?'}
            </h3>
            <p style={{ fontSize: 15, margin: '0 0 4px' }}><strong>{confirmAction.name}</strong></p>
            <p style={{ fontSize: 14, color: '#6b6355', margin: 0 }}>{fmtDate(confirmAction.date)} · {confirmAction.time}</p>
            <p style={{ fontSize: 13, color: '#6b6355', margin: '8px 0 0' }}>
              {confirmAction.type === 'handle'
                ? 'Le statut ne change pas, aucun email envoyé.'
                : 'Le client sera notifié de l\'annulation par email (avec le motif).'}
            </p>

            {/* Cancel reason: preset chips + optional free text — sent to the guest. */}
            {confirmAction.type === 'cancel' && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b6355', marginBottom: 6 }}>Motif / 取消原因</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {CANCEL_PRESETS.map((p, i) => {
                    const label = p || 'Autre / 其他'
                    const active = cancelPreset === p
                    return (
                      <button key={i} onClick={() => setCancelPreset(p)}
                        style={{
                          padding: '6px 10px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer',
                          border: '1px solid ' + (active ? '#dc2626' : '#d8cdb8'),
                          background: active ? '#fef2f2' : '#f7f4ee',
                          color: active ? '#b91c1c' : '#3a3328', fontWeight: active ? 700 : 500,
                        }}>{label}</button>
                    )
                  })}
                </div>
                <input type="text" value={cancelFreeText} onChange={e => setCancelFreeText(e.target.value)}
                  placeholder={cancelPreset ? 'Précision (optionnel) / 补充说明(可选)' : 'Motif / 原因(optionnel)'}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: '1px solid #d8cdb8', fontSize: 13, color: '#2a2520' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmAction(null)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d8cdb8', background: '#f0ece3', color: '#3a3328', cursor: 'pointer' }}>Retour</button>
              <button onClick={doAction} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 700, color: '#fff', cursor: 'pointer', background: confirmAction.type === 'handle' ? '#16a34a' : '#dc2626' }}>
                {confirmAction.type === 'handle' ? 'Marquer traité' : 'Annuler la réservation'}
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
