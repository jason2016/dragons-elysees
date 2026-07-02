import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import styles from './AdminPanel.module.css'

const PAGE_SIZE = 20
const fmtDate = (d) => { try { const [y, m, day] = d.split('-'); return day + '/' + m + '/' + y } catch { return d || '—' } }

// CRM phase 1 — read-only contact list aggregated from bookings by email.
// Search (email/name/phone) + pagination. No actions (no email, no edit) this phase.
export default function ClientsView() {
  const [contacts, setContacts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const load = async (p, s) => {
    setLoading(true); setErr('')
    try {
      const data = await api.adminGetContacts({ search: s, page: p, page_size: PAGE_SIZE, sort: 'last_visit' })
      setContacts(data.contacts || [])
      setTotal(data.total || 0)
    } catch (e) {
      if (e && e.message !== 'unauthorized') setErr('Erreur de chargement.')
    } finally { setLoading(false) }
  }

  // Debounced search → always reset to page 1. Also does the initial load (mount).
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search) }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const go = (p) => { const np = Math.min(totalPages, Math.max(1, p)); setPage(np); load(np, search) }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border-color, #2a2a2a)', background: 'var(--bg-secondary, #1a1a1a)',
    color: 'var(--text-primary, #fff)', fontSize: 14,
  }
  const pgBtn = (disabled) => ({
    padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-color,#2a2a2a)',
    background: disabled ? 'transparent' : 'var(--bg-card)',
    color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
    cursor: disabled ? 'default' : 'pointer',
  })

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Clients / 客户 {total > 0 ? '· ' + total : ''}</h2>
        <button className={styles.refreshBtn} onClick={() => load(page, search)} title="Actualiser">↻</button>
      </div>

      <div style={{ margin: '4px 0 12px' }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher — nom / email / téléphone" style={inputStyle} />
      </div>

      {err ? <div style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>{err}</div> : null}

      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>Chargement…</div>
      ) : contacts.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', padding: 24, textAlign: 'center' }}>
          {search ? 'Aucun client trouvé.' : 'Aucun client.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
          {contacts.map(c => (
            <div key={c.email} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color, #2a2a2a)',
              borderRadius: 12, padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{c.name || '—'}</strong>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '2px 9px', borderRadius: 999,
                  background: '#3a2f12', color: 'var(--accent-gold, #f5c518)', border: '1px solid #d4a30055',
                }}>
                  {c.visit_count} visite{c.visit_count > 1 ? 's' : ''} · 来访 {c.visit_count} 次
                </span>
                {c.lang ? <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{String(c.lang).toUpperCase()}</span> : null}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>{c.email}</div>
              {c.phone ? (
                <div style={{ marginTop: 2, fontSize: 13 }}>
                  <a href={'tel:' + c.phone} style={{ color: 'var(--accent-gold, #d4a300)' }}>{c.phone}</a>
                </div>
              ) : null}
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                {'Dernière réservation · 最近预订 : ' + fmtDate(c.last_visit)}
                {c.first_visit && c.first_visit !== c.last_visit ? ' · depuis ' + fmtDate(c.first_visit) : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 14 }}>
          <button disabled={page <= 1} onClick={() => go(page - 1)} style={pgBtn(page <= 1)}>Précédent</button>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => go(page + 1)} style={pgBtn(page >= totalPages)}>Suivant</button>
        </div>
      ) : null}
    </div>
  )
}
