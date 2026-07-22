import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import styles from './AdminPanel.module.css'

const PAGE_SIZE = 20

const fmtWhen = (s) => {
  if (!s) return '—'
  try {
    const d = new Date(s)
    if (isNaN(d)) return String(s).slice(0, 10)
    return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch { return String(s).slice(0, 10) }
}

function Stat({ value, fr, zh, primary }) {
  return (
    <div style={{
      flex: '1 1 130px', minWidth: 118,
      background: primary ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
      border: '1px solid ' + (primary ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.18)'),
      borderRadius: 12, padding: '12px 14px',
    }}>
      <div style={{ fontSize: primary ? 34 : 26, fontWeight: 800, lineHeight: 1, color: 'var(--accent-gold, #f5c518)' }}>
        {value == null ? '—' : value}
      </div>
      <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)' }}>{fr}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{zh}</div>
    </div>
  )
}

function RoleChip({ m }) {
  const guide = m.is_guide
  const bg = guide ? 'rgba(76,175,125,0.14)' : 'rgba(255,255,255,0.05)'
  const bd = guide ? 'rgba(76,175,125,0.5)' : 'rgba(255,255,255,0.14)'
  const fg = guide ? '#7bd3a0' : 'var(--text-muted)'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: 11.5,
      fontWeight: 700, background: bg, border: '1px solid ' + bd, color: fg, whiteSpace: 'nowrap',
    }}>
      {guide ? `Guide · 导游${m.guide_status && m.guide_status !== 'approved' ? ' (' + m.guide_status + ')' : ''}` : 'Membre · 会员'}
    </span>
  )
}

// Promotion form. Standard tier prices are pre-filled from the live global config and stay
// editable — any change is persisted as a per-account grid AND recorded in admin_audit_log.
function PromoteModal({ member, tiers, defaultDiscount, onClose, onDone }) {
  const [name, setName] = useState(member.name || '')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState(member.phone || '')
  const [discount, setDiscount] = useState(String(defaultDiscount ?? 10))
  const [grid, setGrid] = useState(() => (tiers || []).map(t => ({ ...t, price: String(t.price) })))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const setPrice = (i, v) => setGrid(g => g.map((t, k) => (k === i ? { ...t, price: v } : t)))
  const changed = (tiers || []).some((t, i) => String(t.price) !== String(grid[i]?.price))

  const submit = async () => {
    setErr('')
    if (!name.trim()) { setErr('Nom requis · 姓名必填'); return }
    const d = parseFloat(discount)
    if (isNaN(d) || d < 0 || d > 100) { setErr('Remise 0–100 · 折扣需 0–100'); return }
    const menu_tiers = grid.map(t => ({ tier: Number(t.tier), label: t.label, price: parseFloat(t.price) }))
    if (menu_tiers.some(t => isNaN(t.price) || t.price < 0)) { setErr('Prix invalide · 价格无效'); return }
    setBusy(true)
    try {
      const r = await api.adminPromoteGuide({
        user_id: member.id, name: name.trim(), company: company.trim(),
        phone: phone.trim(), discount_pct: d, menu_tiers,
      })
      onDone(r)
    } catch (e) {
      setErr(String(e.message || e))
    } finally { setBusy(false) }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(560px, 100%)', maxHeight: '88vh', overflowY: 'auto',
        background: 'var(--bg-elevated, #16181d)', border: '1px solid rgba(201,168,76,0.35)',
        borderRadius: 16, padding: '20px 22px',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, color: 'var(--accent-gold, #f5c518)' }}>
          Promouvoir en compte groupe · 提升为团体账户
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--text-muted)' }}>
          {member.email} · ID {member.id}
        </p>

        <Field label="Nom du guide · 导游姓名 *" value={name} onChange={setName} placeholder="Li Jilei" />
        <Field label="Société / agence · 公司" value={company} onChange={setCompany} placeholder="—" />
        <Field label="Téléphone · 电话" value={phone} onChange={setPhone} placeholder="—" />
        <Field label="Remise % · 折扣百分比" value={discount} onChange={setDiscount} placeholder="10" />

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Grille tarifaire · 套餐档位
            <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> — prix standard pré-remplis, modifiables · 标准价已预填,可改</span>
          </div>
          {grid.map((t, i) => (
            <div key={t.tier} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{t.label || `${t.tier} plats`}</span>
              <input value={t.price} onChange={e => setPrice(i, e.target.value)} inputMode="decimal"
                style={{
                  width: 90, padding: '6px 9px', borderRadius: 8, textAlign: 'right',
                  background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary,#fff)',
                  border: '1px solid ' + (String(tiers[i]?.price) !== String(t.price) ? 'rgba(245,197,24,0.7)' : 'rgba(255,255,255,0.14)'),
                }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>€</span>
            </div>
          ))}
          {changed && (
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#f5c518' }}>
              Prix modifiés — enregistrés pour ce compte et tracés dans l'audit · 改价将入审计
            </p>
          )}
        </div>

        {err && <p style={{ margin: '12px 0 0', fontSize: 13, color: '#e08a8a' }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} disabled={busy} style={btn(false)}>Annuler · 取消</button>
          <button onClick={submit} disabled={busy} style={btn(true)}>
            {busy ? '…' : 'Confirmer · 确认提升'}
          </button>
        </div>
      </div>
    </div>
  )
}

const btn = (primary) => ({
  padding: '8px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
  border: '1px solid ' + (primary ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.18)'),
  background: primary ? 'rgba(201,168,76,0.18)' : 'transparent',
  color: primary ? 'var(--accent-gold, #f5c518)' : 'var(--text-muted)',
})

function Field({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 14,
          background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary,#fff)',
          border: '1px solid rgba(255,255,255,0.14)',
        }} />
    </label>
  )
}

// P3-B — every registered member, with role. Read-only except the P3-C promote action.
export default function MembersView() {
  const [members, setMembers] = useState([])
  const [stats, setStats] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [promo, setPromo] = useState(null)      // member being promoted
  const [cfg, setCfg] = useState(null)          // global groupes config (tier prefill)
  const [flash, setFlash] = useState('')

  const load = async (p = page, s = search) => {
    setLoading(true); setErr('')
    try {
      const d = await api.adminGetMembers({ search: s, page: p, page_size: PAGE_SIZE })
      setMembers(d.members || []); setTotal(d.total || 0); setStats(d.stats || null)
    } catch (e) { setErr(String(e.message || e)) } finally { setLoading(false) }
  }

  useEffect(() => { load(1, '') }, [])
  useEffect(() => { api.adminGroupesConfig().then(d => setCfg(d?.config || d)).catch(() => {}) }, [])

  const tiers = (() => {
    try {
      const raw = cfg?.groupes_menu_tiers
      return typeof raw === 'string' ? JSON.parse(raw) : (raw || [])
    } catch { return [] }
  })()
  const defaultDiscount = Number(cfg?.groupes_discount_pct ?? 10)

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <Stat value={stats?.total_members} fr="Inscrits" zh="注册用户" primary />
        <Stat value={stats?.total_guides} fr="Comptes groupe" zh="团体账户" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setPage(1); load(1, search) } }}
          placeholder="Email / nom / téléphone · 搜索"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: 14,
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary,#fff)',
            border: '1px solid rgba(255,255,255,0.14)',
          }} />
        <button onClick={() => { setPage(1); load(1, search) }} style={btn(false)}>🔍</button>
        <button onClick={() => load(page, search)} style={btn(false)} title="Actualiser">↻</button>
      </div>

      {flash && <p style={{ fontSize: 13, color: '#7bd3a0', marginBottom: 10 }}>{flash}</p>}
      {err && <p style={{ fontSize: 13, color: '#e08a8a', marginBottom: 10 }}>{err}</p>}
      {loading && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>…</p>}

      {!loading && members.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucun inscrit · 暂无注册用户</p>
      )}

      {members.map(m => (
        <div key={m.id} style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          padding: '11px 13px', marginBottom: 8, borderRadius: 12,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.16)',
        }}>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary,#fff)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {m.name || <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(sans nom · 无姓名)</span>}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{m.email}</div>
            {m.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.phone}</div>}
          </div>
          <div style={{ flex: '0 0 auto', fontSize: 11.5, color: 'var(--text-muted)' }}>
            Inscrit · 注册<br />{fmtWhen(m.created_at)}
          </div>
          <RoleChip m={m} />
          <div style={{ flex: '0 0 auto' }}>
            {m.is_guide ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                −{m.guide_discount_pct}%
              </span>
            ) : (
              <button onClick={() => setPromo(m)} style={btn(true)}>Promouvoir · 提升</button>
            )}
          </div>
        </div>
      ))}

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
          <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p, search) }} style={btn(false)}>←</button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p, search) }} style={btn(false)}>→</button>
        </div>
      )}

      {promo && (
        <PromoteModal
          member={promo}
          tiers={tiers}
          defaultDiscount={defaultDiscount}
          onClose={() => setPromo(null)}
          onDone={(r) => {
            setPromo(null)
            setFlash(`✓ ${promo.email} → compte groupe #${r.account_id}${r.tiers_overridden ? ' (prix personnalisés · 自定价)' : ''}`)
            load(page, search)
          }}
        />
      )}
    </div>
  )
}
