import { useState, useEffect, useMemo } from 'react'
import { api, adminErrKind } from '../utils/api'
import { useLang } from '../hooks/useLang'
import AccountTypeBadge from './AccountTypeBadge'
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

function RoleChip({ m, acctType, lang }) {
  // CEO — a promoted member is either a company or a guide; show which, in the shared colours.
  if (m.is_guide && acctType) return <AccountTypeBadge type={acctType} lang={lang} size="sm" />
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
const toGrid = (tiers) => (tiers || []).map(t => ({ ...t, price: t.price == null ? '' : String(t.price) }))

function PromoteModal({ member, tiers, defaultDiscount, cfgState, cfgErr, onRetryCfg, onClose, onDone }) {
  const [name, setName] = useState(member.name || '')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState(member.phone || '')
  const [discount, setDiscount] = useState(String(defaultDiscount ?? 10))
  const [acctType, setAcctType] = useState('GUIDE')   // P4: GUIDE | ENTREPRISE
  const [grid, setGrid] = useState(() => toGrid(tiers))
  const [priceTouched, setPriceTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [nameBad, setNameBad] = useState(false)
  const [confirmPrices, setConfirmPrices] = useState(null)   // ±50% guardrail

  // HF1: the standard prices arrive asynchronously (config fetch). If the modal was opened
  // before that resolved, the initial grid was empty — re-seed it whenever the tiers land,
  // as long as the owner hasn't edited a price yet.
  useEffect(() => {
    if (!priceTouched) setGrid(toGrid(tiers))
  }, [tiers, priceTouched])

  const setPrice = (i, v) => { setPriceTouched(true); setGrid(g => g.map((t, k) => (k === i ? { ...t, price: v } : t))) }
  // Only a value that actually DIFFERS from its standard price counts as a change — an empty
  // or not-yet-loaded grid must never be reported as "modified" (HF1 defect 1).
  const isChanged = (i, v) => { const std = tiers?.[i]?.price; return std != null && String(v) !== '' && String(std) !== String(v) }
  const changed = grid.length > 0 && grid.some((t, i) => isChanged(i, t.price))

  const isEnt = acctType === 'ENTREPRISE'
  // A company account carries no menu grid, so the price gate simply doesn't apply to it.
  const pricesReady = isEnt || (grid.length > 0 && grid.every(t => String(t.price).trim() !== ''))
  const priceNotice = isEnt ? ''
    : cfgState === 'loading' ? 'Chargement des tarifs standard… · 正在载入标准价'
    // HF3: surface WHY (network vs HTTP status) instead of a generic "unavailable".
    : !pricesReady ? (cfgErr || 'Tarifs standard indisponibles — promotion impossible. · 标准价加载失败,无法提升') : ''

  const submit = async () => {
    setErr(''); setNameBad(false)
    if (!name.trim()) { setErr('Nom requis · 姓名必填'); setNameBad(true); return }
    const d = parseFloat(discount)
    if (isNaN(d) || d < 0 || d > 100) { setErr('Remise 0–100 · 折扣需 0–100'); return }
    // Never submit an empty / unloaded price grid (guide accounts only).
    if (!pricesReady) { setErr('Tarifs standard non chargés — réessayez. · 标准价未加载,请重试'); return }
    let menu_tiers
    if (!isEnt) {
      menu_tiers = grid.map(t => ({ tier: Number(t.tier), label: t.label, price: parseFloat(t.price) }))
      if (menu_tiers.some(t => isNaN(t.price) || t.price < 0)) { setErr('Prix invalide · 价格无效'); return }
      // Guardrail: a price more than ±50% off the standard is almost always a typo
      // (the €1-instead-of-€11 class of slip). Make the owner confirm it deliberately.
      const wild = menu_tiers
        .map((t, i) => ({ label: t.label || `${t.tier} plats`, price: t.price, std: parseFloat(tiers?.[i]?.price) }))
        .filter(t => t.std > 0 && Math.abs(t.price - t.std) / t.std > 0.5)
      if (wild.length && !confirmPrices) { setConfirmPrices(wild); return }
    }
    setConfirmPrices(null)
    setBusy(true)
    try {
      const r = await api.adminPromoteGuide({
        user_id: member.id, name: name.trim(), company: company.trim(),
        phone: phone.trim(), discount_pct: d, account_type: acctType,
        ...(menu_tiers ? { menu_tiers } : {}),
      })
      onDone(r)
    } catch (e) {
      setErr(String(e.message || e))
    } finally { setBusy(false) }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(560px, 100%)', maxHeight: '88vh', overflowY: 'auto', overflowX: 'hidden',
        background: 'var(--bg-elevated, #16181d)', border: '1px solid rgba(201,168,76,0.35)',
        borderRadius: 16, padding: 'clamp(14px, 4vw, 22px)',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, color: 'var(--accent-gold, #f5c518)' }}>
          Promouvoir en compte groupe · 提升为团体账户
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--text-muted)' }}>
          {member.email} · ID {member.id}
        </p>

        {/* P4 — the account family decides the whole shape of the form, so it comes first. */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Type de compte · 账户类型 *
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['GUIDE', '🧭 Guide · 导游'], ['ENTREPRISE', '🏢 Entreprise · 公司']].map(([k, lbl]) => {
              const on = acctType === k
              const gold = k === 'GUIDE'
              return (
                <button key={k} onClick={() => setAcctType(k)}
                  style={{
                    flex: '1 1 140px', padding: '10px 12px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    border: '1px solid ' + (on ? (gold ? 'rgba(212,163,0,0.7)' : 'rgba(96,149,255,0.7)') : 'rgba(255,255,255,0.16)'),
                    background: on ? (gold ? 'rgba(212,163,0,0.16)' : 'rgba(96,149,255,0.16)') : 'transparent',
                    color: on ? (gold ? '#e0b64a' : '#8fbaff') : 'var(--text-muted)',
                  }}>{lbl}</button>
              )
            })}
          </div>
        </div>

        {/* HF1: the placeholder used to be a realistic name ("Li Jilei"), which on a phone reads
            as an already-filled value — the owner tapped Confirmer and hit "Nom requis" on what
            looked like a completed field. Placeholders are now unmistakably instructions. */}
        <Field label="Nom du guide · 导游姓名 *" value={name} placeholder="Saisir le nom · 请输入姓名" invalid={nameBad}
          onChange={v => { setName(v); if (nameBad) setNameBad(false) }} />
        <Field label="Société / agence · 公司" value={company} onChange={setCompany} placeholder="Optionnel · 可留空" />
        <Field label="Téléphone · 电话" value={phone} onChange={setPhone} placeholder="Optionnel · 可留空" />
        <Field label="Remise % · 折扣百分比" value={discount} onChange={setDiscount} placeholder="10" />

        {!isEnt && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Grille tarifaire · 套餐档位
            <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> — prix standard pré-remplis, modifiables · 标准价已预填,可改</span>
          </div>
          {grid.map((t, i) => (
            <div key={t.tier} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ flex: '1 1 auto', minWidth: 0, fontSize: 13, color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>{t.label || `${t.tier} plats`}</span>
              <input value={t.price} onChange={e => setPrice(i, e.target.value)} inputMode="decimal"
                style={{
                  width: 84, flex: '0 0 auto', padding: '6px 9px', borderRadius: 8, textAlign: 'right',
                  background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary,#fff)',
                  border: '1px solid ' + (isChanged(i, t.price) ? 'rgba(245,197,24,0.7)' : 'rgba(255,255,255,0.14)'),
                }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>€</span>
            </div>
          ))}
          {/* Prefill must never fail silently: say so and block the action. */}
          {priceNotice && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: cfgState === 'loading' ? 'var(--text-muted)' : '#e08a8a', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>{cfgState === 'loading' ? '⏳' : '⚠️'} {priceNotice}</span>
              {cfgState !== 'loading' && onRetryCfg && (
                <button onClick={onRetryCfg} style={{ ...btn(false), padding: '4px 10px', fontSize: 12 }}>Réessayer · 重试</button>
              )}
            </p>
          )}
          {changed && (
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#f5c518' }}>
              Prix modifiés — enregistrés pour ce compte et tracés dans l'audit · 改价将入审计
            </p>
          )}
        </div>)}

        {confirmPrices && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(193,59,59,0.12)', border: '1px solid rgba(193,59,59,0.5)' }}>
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#e08a8a' }}>
              ⚠️ Prix très éloigné du standard · 价格明显偏离标准
            </p>
            {confirmPrices.map((w, i) => (
              <p key={i} style={{ margin: '2px 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                {w.label} : <strong>{w.price} €</strong> <span style={{ color: 'var(--text-muted)' }}>(standard {w.std} €)</span>
              </p>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button onClick={submit} disabled={busy} style={btn(true)}>Confirmer quand même · 仍然确认</button>
              <button onClick={() => setConfirmPrices(null)} disabled={busy} style={btn(false)}>Corriger · 返回修改</button>
            </div>
          </div>
        )}
        {err && <p style={{ margin: '12px 0 0', fontSize: 13, color: '#e08a8a' }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18, flexWrap: 'wrap' }}>
          <button onClick={onClose} disabled={busy} style={btn(false)}>Annuler · 取消</button>
          <button onClick={submit} disabled={busy || !pricesReady} style={{ ...btn(true), opacity: (busy || !pricesReady) ? 0.45 : 1, cursor: (busy || !pricesReady) ? 'not-allowed' : 'pointer' }}
            title={!pricesReady ? 'Tarifs standard non chargés · 标准价未加载' : undefined}>
            {busy ? '…' : 'Confirmer · 确认提升'}
          </button>
        </div>
      </div>
    </div>
  )
}

const btn = (primary) => ({
  padding: '8px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
  whiteSpace: 'nowrap',
  border: '1px solid ' + (primary ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.18)'),
  background: primary ? 'rgba(201,168,76,0.18)' : 'transparent',
  color: primary ? 'var(--accent-gold, #f5c518)' : 'var(--text-muted)',
})

function Field({ label, value, onChange, placeholder, invalid }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: invalid ? '#e08a8a' : 'var(--text-secondary)', marginBottom: 4 }}>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 14,
          background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary,#fff)',
          border: '1px solid ' + (invalid ? '#e08a8a' : 'rgba(255,255,255,0.14)'),
        }} />
    </label>
  )
}

// P3-B — every registered member, with role. Read-only except the P3-C promote action.
export default function MembersView() {
  const { t, lang } = useLang()
  const [members, setMembers] = useState([])
  const [stats, setStats] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [promo, setPromo] = useState(null)      // member being promoted
  const [cfg, setCfg] = useState(null)          // global groupes config (tier prefill)
  const [cfgState, setCfgState] = useState('loading')   // loading | ready | error
  const [cfgErr, setCfgErr] = useState('')              // HF3: typed reason, shown verbatim
  const [typeById, setTypeById] = useState({})          // guide_account_id → account_type
  const [flash, setFlash] = useState('')

  const load = async (p = page, s = search) => {
    setLoading(true); setErr('')
    try {
      const d = await api.adminGetMembers({ search: s, page: p, page_size: PAGE_SIZE })
      setMembers(d.members || []); setTotal(d.total || 0); setStats(d.stats || null)
    } catch (e) { setErr(String(e.message || e)) } finally { setLoading(false) }
  }

  useEffect(() => { load(1, '') }, [])
  // Standard tier prices for the promote form. A failure here used to be swallowed, leaving the
  // form silently price-less — track the state so the modal can say so and block (HF1).
  const loadCfg = () => {
    setCfgState('loading'); setCfgErr('')
    api.adminGroupesConfig()
      .then(d => { setCfg(d?.config || d); setCfgState('ready') })
      .catch(e => {
        // HF3 — name the failure so a screenshot is already the diagnosis.
        const kind = adminErrKind(e)
        setCfgErr(kind === 'network' ? t('admErrNetwork')
          : kind === 'http' ? t('admErrHttp', { status: e.status })
          : t('admErrUnknown'))
        setCfgState('error')
      })
  }
  useEffect(() => { loadCfg() }, [])
  useEffect(() => {
    api.adminGroupesAccounts()
      .then(d => setTypeById(Object.fromEntries((d.accounts || []).map(a => [a.id, a.account_type]))))
      .catch(() => {})   // badge is decorative — its absence must never block the list
  }, [])

  // Memoised so its identity only changes when the config does — the modal re-seeds its price
  // grid on [tiers], which would otherwise fire on every render and wipe the owner's edits.
  const tiers = useMemo(() => {
    try {
      const raw = cfg?.groupes_menu_tiers
      return typeof raw === 'string' ? JSON.parse(raw) : (raw || [])
    } catch { return [] }
  }, [cfg])
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
          {/* Long names / e-mail addresses must WRAP, never widen the row (375px baseline). */}
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary,#fff)', overflowWrap: 'anywhere' }}>
              {m.name || <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(sans nom · 无姓名)</span>}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{m.email}</div>
            {m.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{m.phone}</div>}
          </div>
          <div style={{ flex: '0 0 auto', fontSize: 11.5, color: 'var(--text-muted)' }}>
            Inscrit · 注册<br />{fmtWhen(m.created_at)}
          </div>
          <RoleChip m={m} acctType={typeById[m.guide_account_id]} lang={lang} />
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
          cfgState={cfgState}
          cfgErr={cfgErr}
          onRetryCfg={loadCfg}
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
