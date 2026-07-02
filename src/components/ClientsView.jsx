import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import styles from './AdminPanel.module.css'

const PAGE_SIZE = 20
const fmtDate = (d) => { try { const [y, m, day] = d.split('-'); return day + '/' + m + '/' + y } catch { return d || '—' } }

// One metric tile in the client-asset overview bar. `primary` = the hero number (library size).
function StatBlock({ value, prefix, fr, zh, primary }) {
  return (
    <div style={{
      flex: '1 1 130px', minWidth: 118,
      background: primary ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
      border: '1px solid ' + (primary ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.18)'),
      borderRadius: 12, padding: '12px 14px',
    }}>
      <div style={{ fontSize: primary ? 36 : 28, fontWeight: 800, lineHeight: 1, color: 'var(--accent-gold, #f5c518)' }}>
        {value == null ? '—' : (prefix || '') + value}
      </div>
      <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)' }}>{fr}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{zh}</div>
    </div>
  )
}

// CRM phase 1 — read-only contact list aggregated from bookings by email.
// Search (email/name/phone) + pagination. No actions (no email, no edit) this phase.
export default function ClientsView() {
  const [contacts, setContacts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('visit_count')  // default: most visits first
  const [sortDir, setSortDir] = useState('desc')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [stats, setStats] = useState(null)   // { total_clients, regulars, new_this_month } — private client-base overview

  const load = async (p, s, field = sortField, dir = sortDir) => {
    setLoading(true); setErr('')
    try {
      const data = await api.adminGetContacts({ search: s, page: p, page_size: PAGE_SIZE, sort: field, direction: dir })
      setContacts(data.contacts || [])
      setTotal(data.total || 0)
      if (data.stats) setStats(data.stats)   // keep last known stats if a response omits it
    } catch (e) {
      if (e && e.message !== 'unauthorized') setErr('Erreur de chargement.')
    } finally { setLoading(false) }
  }

  // Debounced search → always reset to page 1. Also does the initial load (mount).
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search, sortField, sortDir) }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Click a sort field: same field → toggle direction; new field → sensible default
  // (name A→Z, others most/recent-first). Not persisted — refresh returns to visit_count desc.
  const applySort = (field) => {
    const dir = field === sortField ? (sortDir === 'desc' ? 'asc' : 'desc') : (field === 'name' ? 'asc' : 'desc')
    setSortField(field); setSortDir(dir); setPage(1); load(1, search, field, dir)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const go = (p) => { const np = Math.min(totalPages, Math.max(1, p)); setPage(np); load(np, search, sortField, sortDir) }

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

      {/* Client-asset overview — 龙城's OWN private client base, growing on its own.
          Most prominent element, above search. Numbers come straight from backend stats. */}
      {stats && (
        <div style={{
          background: 'linear-gradient(135deg, #3a2f12 0%, #241a08 100%)',
          border: '1px solid rgba(201,168,76,0.45)', borderRadius: 14,
          padding: '15px 18px', margin: '4px 0 14px', boxShadow: '0 2px 18px rgba(201,168,76,0.10)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
            fontSize: 13, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--accent-gold, #f5c518)' }}>
            👑 Vos clients · 龙城专属客户库
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StatBlock primary value={stats.total_clients} fr="Clients" zh="客户库 · 位" />
            <StatBlock value={stats.regulars} fr="⭐ Fidèles" zh="常客 · 位" />
            <StatBlock value={stats.new_this_month} prefix="+" fr="Nouveaux ce mois" zh="本月新增 · 位" />
          </div>
        </div>
      )}

      <div style={{ margin: '4px 0 10px' }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher — nom / email / téléphone" style={inputStyle} />
      </div>

      {/* Sort control — click a field to sort; click again to reverse. Default: visit_count desc. */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Trier / 排序 :</span>
        {[['visit_count', 'Visites / 来访'], ['last_visit', 'Récent / 最近'], ['name', 'Nom / 姓名']].map(([f, lbl]) => {
          const active = sortField === f
          return (
            <button key={f} onClick={() => applySort(f)}
              style={{
                padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                border: '1px solid ' + (active ? 'var(--accent-gold, #d4a300)' : 'var(--border-color, #2a2a2a)'),
                background: active ? 'var(--accent-gold-dim, #3a2f12)' : 'transparent',
                color: active ? 'var(--accent-gold, #f5c518)' : 'var(--text-muted)',
              }}>
              {lbl}{active ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}
            </button>
          )
        })}
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
          {contacts.map(c => {
            const isRegular = c.visit_count >= 2   // returning guest = a "Fidèle · 常客"
            return (
            <div key={c.email} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color, #2a2a2a)',
              borderLeft: isRegular ? '4px solid var(--accent-gold, #d4a300)' : '1px solid var(--border-color, #2a2a2a)',
              borderRadius: 12, padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{c.name || '—'}</strong>
                {isRegular && (
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 999,
                    background: 'var(--accent-gold, #d4a300)', color: '#1a1208',
                  }}>⭐ Fidèle · 常客</span>
                )}
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
            )
          })}
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
