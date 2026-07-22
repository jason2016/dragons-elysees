import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useLang } from '../hooks/useLang'
import AccountTypeBadge, { typeOf } from './AccountTypeBadge'
import GroupesAccountDetail from './GroupesAccountDetail'
import styles from './AdminPanel.module.css'

// Admin « Groupes · 团体 » tab — four blocks:
//   a. pending guide applications + one-click approve / reject
//   b. group bookings list (organizer + company; « à la carte » flagged)
//   c. monthly reward statement (grand_total prominent)
//   d. config parameters (read-only by default; edit + save the scalar values)
// Bilingual fr·zh like the rest of the admin. Reuses AdminPanel.module.css.

const eur = (n) => (n == null ? '—' : `${Number(n).toFixed(2).replace('.', ',')} €`)
const fmtDate = (d) => { try { const [y, m, day] = String(d).slice(0, 10).split('-'); return `${day}/${m}/${y}` } catch { return d || '—' } }
const thisMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
const tierLabel = (tr) => (tr === 'carte' ? 'Carte · 单点' : `Menu ${tr}`)

const STATUS_CHIP = {
  pending: { fr: 'En attente · 待审', bg: 'rgba(212,163,0,0.15)', bd: 'rgba(212,163,0,0.5)', fg: '#e0b64a' },
  approved: { fr: 'Validé · 已通过', bg: 'rgba(76,175,125,0.14)', bd: 'rgba(76,175,125,0.5)', fg: '#7bd3a0' },
  rejected: { fr: 'Refusé · 已拒绝', bg: 'rgba(193,59,59,0.14)', bd: 'rgba(193,59,59,0.5)', fg: '#e08a8a' },
}

export default function GroupesView() {
  const { lang } = useLang()
  const [openId, setOpenId] = useState(null)          // P4: drill into an account
  const [typeFilter, setTypeFilter] = useState('ALL') // CEO: split the two families
  const [accounts, setAccounts] = useState([])
  const [bookings, setBookings] = useState([])
  const [period, setPeriod] = useState(thisMonth)
  const [rewards, setRewards] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const [a, b, cfg] = await Promise.all([api.adminGroupesAccounts(), api.adminGroupesBookings(), api.adminGroupesConfig()])
      setAccounts(a.accounts || [])
      setBookings(b.bookings || [])
      setConfig(cfg.config || {})
    } catch (e) { if (e?.message !== 'unauthorized') setErr('Erreur de chargement.') } finally { setLoading(false) }
  }
  const loadRewards = async (p) => {
    try { setRewards(await api.adminGroupesRewards(p)) } catch { setRewards(null) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => { loadRewards(period) }, [period])

  const act = async (id, action) => {
    setBusyId(id)
    try {
      await api.adminGroupesAccountAction(id, action)
      setAccounts(as => as.map(a => (a.id === id ? { ...a, status: action === 'approve' ? 'approved' : 'rejected' } : a)))
    } catch { /* refresh reconciles */ } finally { setBusyId(null) }
  }

  // P4 — drill-down replaces the list entirely (keeps the mobile viewport uncluttered).
  if (openId) return <GroupesAccountDetail accountId={openId} onBack={() => { setOpenId(null); load() }} />

  const pending = accounts.filter(a => a.status === 'pending')
  const others = accounts.filter(a => a.status !== 'pending')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {err && <div style={{ color: '#f87171', fontSize: 13 }}>{err}</div>}

      {/* a. pending applications */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>📨 Demandes · 待审申请 {pending.length > 0 && `· ${pending.length}`}</h2>
          <button className={styles.refreshBtn} onClick={load} title="Actualiser">↻</button>
        </div>
        {loading ? <Muted>Chargement…</Muted> : pending.length === 0 ? (
          <Muted>Aucune demande en attente. · 暂无待审申请</Muted>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(a => (
              <div key={a.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color, #2a2a2a)', borderLeft: '4px solid var(--accent-gold, #d4a300)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 15 }}>{a.name}</strong>
                  {a.company && <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>· {a.company}</span>}
                  <AccountTypeBadge account={a} lang={lang} size="sm" />
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 'auto' }}>{fmtDate(a.created_at)}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                  ✉️ {a.email}{a.phone ? ` · 📞 ${a.phone}` : ''}{a.discount_pct != null ? ` · −${a.discount_pct}%` : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button disabled={busyId === a.id} onClick={() => act(a.id, 'approve')}
                    style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#1d8a4e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                    {busyId === a.id ? '…' : '✓ Approuver · 通过'}
                  </button>
                  <button disabled={busyId === a.id} onClick={() => act(a.id, 'reject')}
                    style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(193,59,59,0.5)', background: 'transparent', color: '#e08a8a', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                    ✕ Refuser · 拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* validated / refused accounts, compact */}
        {others.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {/* CEO — the two families are run differently, so they never share a list. */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {[['ALL', 'Tous · 全部'], ['ENTREPRISE', '🏢 Entreprises · 公司'], ['GUIDE', '🧭 Guides · 导游']].map(([k, lbl]) => (
                <button key={k} onClick={() => setTypeFilter(k)}
                  style={{
                    padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    border: '1px solid ' + (typeFilter === k ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.16)'),
                    background: typeFilter === k ? 'rgba(201,168,76,0.18)' : 'transparent',
                    color: typeFilter === k ? 'var(--accent-gold,#f5c518)' : 'var(--text-muted)',
                  }}>{lbl}</button>
              ))}
            </div>
            {['ENTREPRISE', 'GUIDE'].filter(g => typeFilter === 'ALL' || typeFilter === g).map(group => {
              const rows = others.filter(a => typeOf(a) === group)
              if (rows.length === 0) return null
              return (
                <div key={group} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 6px' }}>
                    {group === 'ENTREPRISE' ? '🏢 Entreprises · 公司' : '🧭 Guides · 导游'} · {rows.length}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {rows.map(a => (
                      <div key={a.id} onClick={() => a.status === 'approved' && setOpenId(a.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13,
                          color: 'var(--text-secondary)', padding: '9px 11px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color,#2a2a2a)',
                          cursor: a.status === 'approved' ? 'pointer' : 'default',
                        }}>
                        <Chip status={a.status} />
                        <AccountTypeBadge account={a} lang={lang} size="sm" />
                        <strong style={{ overflowWrap: 'anywhere' }}>{a.name}</strong>
                        {a.company && <span style={{ color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>· {a.company}</span>}
                        {a.status === 'approved' && <span style={{ marginLeft: 'auto', color: 'var(--accent-gold,#f5c518)', fontSize: 12, fontWeight: 700 }}>›</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* b. group bookings */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>🧑‍🤝‍🧑 Réservations groupe · 团体预定 {bookings.length > 0 && `· ${bookings.length}`}</h2>
        </div>
        {bookings.length === 0 ? <Muted>Aucune réservation de groupe. · 暂无团体预定</Muted> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bookings.map(b => {
              const isCarte = b.menu_tier === 'carte'
              const org = b.name || b.customer_name || b.organizer || b.account_name || b.contact_name || '—'
              const company = b.company || b.account_company
              return (
                <div key={b.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color, #2a2a2a)', borderLeft: `4px solid ${isCarte ? '#4285F4' : 'var(--accent-gold, #d4a300)'}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 15 }}>{org}</strong>
                    {company && <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>· {company}</span>}
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 999, background: isCarte ? 'rgba(66,133,244,0.16)' : 'rgba(212,163,0,0.16)', color: isCarte ? '#7fb0ff' : '#e0b64a' }}>{tierLabel(b.menu_tier)}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 'auto' }}>{fmtDate(b.booking_date)}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 5, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>👥 {b.party_size} pers.</span>
                    <span>{isCarte ? '💶 −10% sur place · 到店结算' : `💰 ${eur(b.total_estimate)}`}</span>
                    {b.reward_amount != null && <span>🎁 +{eur(b.reward_amount)}</span>}
                    {b.period && <span>🗓️ {b.period}</span>}
                  </div>
                  {b.special_requests && <Requests value={b.special_requests} />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* c. monthly rewards */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>🎁 Récompenses · 奖励对账</h2>
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)} className={styles.dateInput} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '4px 2px 14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total à verser · 应付奖励总额</span>
          <strong style={{ fontSize: 30, fontWeight: 800, color: 'var(--accent-gold, #f5c518)', marginLeft: 'auto' }}>{eur(rewards?.grand_total)}</strong>
        </div>
        {(!rewards || (rewards.by_account || []).length === 0) ? <Muted>Aucune récompense sur cette période. · 该账期暂无奖励</Muted> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rewards.by_account.filter(r => {
              // CEO — a commission-OFF account (typically a company) can never owe a reward;
              // showing a permanent 0,00 € row is noise on the payout sheet.
              const acc = accounts.find(a => a.id === (r.account_id ?? r.id))
              const off = acc && String(acc.commission_mode || '').toUpperCase() === 'OFF'
              const amount = Number(r.total_reward ?? r.reward_total ?? r.reward ?? r.total ?? 0)
              return !(off && !amount)
            }).map((r, i) => (
              <div key={r.account_id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <strong>{r.account_name || r.name || r.company || r.account_company || `#${r.account_id}`}</strong>
                {(r.bookings ?? r.bookings_count ?? r.count) != null && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>· {r.bookings ?? r.bookings_count ?? r.count} groupe(s){r.total_guests != null ? ` · ${r.total_guests} pers.` : ''}</span>}
                <strong style={{ marginLeft: 'auto', color: '#7bd3a0' }}>+{eur(r.total_reward ?? r.reward_total ?? r.reward ?? r.total)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* d. config */}
      {config && <ConfigBlock config={config} onSaved={c => setConfig(c)} />}
    </div>
  )
}

function Muted({ children }) {
  return <div style={{ color: 'var(--text-muted)', padding: 18, textAlign: 'center', fontSize: 13.5 }}>{children}</div>
}
// Special requests: leading [token] presets → highlighted chips, then the free text.
function Requests({ value }) {
  const tokens = []
  let rest = value || ''
  const re = /^\s*\[([^\]]+)\]/
  let m
  while ((m = re.exec(rest))) { tokens.push(m[1]); rest = rest.slice(m[0].length) }
  rest = rest.trim()
  return (
    <div style={{ marginTop: 7, padding: '7px 10px', background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #4a4438', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      <span>💬</span>
      {tokens.map((tk, i) => (
        <span key={i} style={{ fontSize: 11.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'rgba(212,163,0,0.2)', border: '1px solid rgba(212,163,0,0.55)', color: '#e0b64a' }}>{tk}</span>
      ))}
      {rest && <span>{rest}</span>}
    </div>
  )
}
function Chip({ status }) {
  const s = STATUS_CHIP[status] || STATUS_CHIP.pending
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: s.bg, border: `1px solid ${s.bd}`, color: s.fg }}>{s.fr}</span>
}

// Parameters: read-only by default; « Modifier » reveals scalar inputs. Saving POSTs the config.
const FIELDS = [
  ['groupes_discount_pct', 'Remise formules % · 套餐折扣'],
  ['groupes_min_party', 'Min. pers. formule · 套餐门槛'],
  ['groupes_min_party_carte', 'Min. pers. carte · 单点门槛'],
  ['groupes_lead_hours', 'Délai mini (h) · 提前小时'],
  ['groupes_reward_per_head', 'Récompense/pers. formule · 套餐每人奖励'],
  ['groupes_reward_per_head_carte', 'Récompense/pers. carte · 单点每人奖励'],
]
function ConfigBlock({ config, onSaved }) {
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const start = () => { setDraft(FIELDS.reduce((o, [k]) => ({ ...o, [k]: config[k] ?? '' }), {})); setEdit(true); setMsg('') }
  const save = async () => {
    setBusy(true); setMsg('')
    try {
      const r = await api.adminGroupesConfigSave(draft)
      onSaved(r.config || { ...config, ...draft }); setEdit(false); setMsg('Enregistré · 已保存')
    } catch (e) { setMsg(e?.message || 'Erreur') } finally { setBusy(false) }
  }
  let tiers = []
  try { tiers = JSON.parse(config.groupes_menu_tiers || '[]') } catch { tiers = [] }
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>⚙️ Paramètres · 参数设置</h2>
        {!edit && <button className={styles.refreshBtn} onClick={start} title="Modifier" style={{ fontSize: 13 }}>✎</button>}
      </div>
      {msg && <div style={{ fontSize: 12.5, color: '#7bd3a0', marginBottom: 8 }}>{msg}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {FIELDS.map(([k, lbl]) => (
          <div key={k} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '9px 11px' }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 4 }}>{lbl}</div>
            {edit ? (
              <input value={draft[k]} onChange={e => setDraft({ ...draft, [k]: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(0,0,0,0.25)', color: '#f5f0e8', fontSize: 15 }} />
            ) : (
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent-gold, #f5c518)' }}>{config[k] ?? '—'}</div>
            )}
          </div>
        ))}
      </div>
      {tiers.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          🍽️ Formules · 套餐档: {tiers.map(x => `${x.tier}→${eur(x.price)}`).join('  ·  ')}
        </div>
      )}
      {edit && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button disabled={busy} onClick={save} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#1d8a4e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>{busy ? '…' : '✓ Enregistrer · 保存'}</button>
          <button disabled={busy} onClick={() => setEdit(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border-color,#2a2a2a)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Annuler · 取消</button>
        </div>
      )}
    </div>
  )
}
