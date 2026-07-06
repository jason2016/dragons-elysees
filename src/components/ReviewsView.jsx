import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import styles from './AdminPanel.module.css'

const fmtDate = (d) => { try { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}` } catch { return d || '—' } }

// Rating stars — filled gold up to `n`, dim for the rest (out of 5).
function Stars({ n }) {
  const r = Math.max(0, Math.min(5, Number(n) || 0))
  return (
    <span style={{ letterSpacing: 2, fontSize: 15 }}>
      <span style={{ color: '#f5c518' }}>{'★'.repeat(r)}</span>
      <span style={{ color: '#4a4438' }}>{'★'.repeat(5 - r)}</span>
    </span>
  )
}

function OverviewTile({ value, fr, zh, accent }) {
  return (
    <div style={{
      flex: '1 1 150px', minWidth: 140,
      background: accent ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.03)',
      border: '1px solid ' + (accent ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.18)'),
      borderRadius: 12, padding: '12px 14px',
    }}>
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: 'var(--accent-gold, #f5c518)' }}>{value ?? '—'}</div>
      <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)' }}>{fr}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{zh}</div>
    </div>
  )
}

// Reviews funnel phase 1 — private (1–3★) feedback list for follow-up. Read-only + mark-read.
// Backend is in parallel dev; until the endpoint lands, adminGetReviews returns _pending and we
// show a friendly notice instead of an error.
export default function ReviewsView() {
  const [reviews, setReviews] = useState([])
  const [unread, setUnread] = useState(0)
  const [monthCount, setMonthCount] = useState(0)
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const d = await api.adminGetReviews()
      setReviews((d.reviews || []).filter(r => (Number(r.rating) || 0) <= 3))   // private domain = 1–3★
      setUnread(d.unread || 0)
      setMonthCount(d.month_count || 0)
      setPending(!!d._pending)
    } catch (e) {
      if (e?.message !== 'unauthorized') setErr('Erreur de chargement.')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    setBusyId(id)
    try {
      await api.markReviewRead(id)
      setReviews(rs => rs.map(r => (r.id === id ? { ...r, read: true } : r)))
      setUnread(u => Math.max(0, u - 1))
    } catch { /* stay quiet; refresh will reconcile */ } finally { setBusyId(null) }
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>⭐ Avis · 评价 {unread > 0 && `· ${unread} non lus`}</h2>
        <button className={styles.refreshBtn} onClick={load} title="Actualiser">↻</button>
      </div>

      {/* Overview: unread + this-month feedback count */}
      <div style={{ display: 'flex', gap: 12, margin: '4px 0 14px', flexWrap: 'wrap' }}>
        <OverviewTile accent value={unread} fr="Non lus" zh="未读" />
        <OverviewTile value={monthCount} fr="Ce mois" zh="本月反馈" />
      </div>

      {pending && (
        <div style={{ padding: '10px 12px', marginBottom: 10, borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
          ⏳ En attente de l'API backend — la liste s'affichera dès qu'elle est prête. · 后端接入中
        </div>
      )}
      {err && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>{err}</div>}

      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>Chargement…</div>
      ) : reviews.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', padding: 24, textAlign: 'center' }}>
          {pending ? 'Aucun avis pour le moment. · 暂无反馈' : 'Aucun avis privé (1–3★). · 暂无私域反馈'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
          {reviews.map(r => {
            const isUnread = !r.read
            return (
              <div key={r.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color, #2a2a2a)',
                borderLeft: isUnread ? '4px solid var(--accent-gold, #d4a300)' : '1px solid var(--border-color, #2a2a2a)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Stars n={r.rating} />
                  {isUnread && <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'var(--accent-gold, #d4a300)', color: '#1a1208' }}>Nouveau · 新</span>}
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 'auto' }}>{fmtDate(r.date)}{r.lang ? ` · 🌐 ${String(r.lang).toUpperCase()}` : ''}</span>
                </div>

                {r.comment && (
                  <div style={{ marginTop: 8, padding: '8px 11px', background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #4a4438', borderRadius: 6, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    💬 {r.comment}
                  </div>
                )}

                {r.booking && (r.booking.name || r.booking.date) && (
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    🍽️ Réservation liée · 关联预定 : {r.booking.name || '—'}{r.booking.date ? ` · ${fmtDate(r.booking.date)}` : ''}
                  </div>
                )}

                {isUnread && (
                  <div style={{ marginTop: 10 }}>
                    <button disabled={busyId === r.id} onClick={() => markRead(r.id)}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-gold, rgba(201,168,76,0.4))', background: 'transparent', color: 'var(--accent-gold, #f5c518)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                      {busyId === r.id ? '…' : '✓ Marquer lu · 标记已读'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
