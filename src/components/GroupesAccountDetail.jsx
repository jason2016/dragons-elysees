import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useLang } from '../hooks/useLang'
import AccountTypeBadge, { typeOf } from './AccountTypeBadge'
import styles from './AdminPanel.module.css'

// P4 — admin account detail: profile + commission config + the full ledger the account
// itself sees, plus the two write actions the owner needs (record a past service, invite
// the client to their statement). Every request goes through adminFetch's typed errors —
// a failure is always named, never silent (HF1/HF3 pattern).
const eur = (n) => (n == null ? '—' : `${Number(n).toFixed(2).replace('.', ',')} €`)
const fmtDate = (d) => { try { const [y, m, day] = String(d).slice(0, 10).split('-'); return `${day}/${m}/${y}` } catch { return d || '—' } }
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

const T = {
  fr: { back: '← Retour', entries: 'Visites', guests: 'Convives', amount: 'Total facturé', reward: 'Récompenses', ledger: 'Historique', empty: 'Aucune consommation.',
        manualBadge: 'Saisie restaurant', edit: 'Modifier', save: 'Enregistrer', cancel: 'Annuler', invite: '✉️ Envoyer l’invitation', inviteSent: 'Invitation envoyée.',
        inviteConfirm: 'Envoyer un email d’invitation à l’espace client à {email} ?', confirm: 'Envoyer', addTitle: 'Nouvelle consommation', add: 'Enregistrer la consommation',
        fDate: 'Date', fParty: 'Convives', fAmount: 'Montant encaissé €', fDiscount: 'Remise appliquée %', fNote: 'Note (optionnel)',
        commission: 'Récompense', cOff: 'Désactivée', cPercent: '% du montant', cPerHead: '€ par convive', discount: 'Remise compte',
        added: 'Consommation enregistrée.', noReward: 'Aucune récompense calculée (programme désactivé).', rewardAdded: 'Récompense : +{v}',
        errNet: 'Réseau inaccessible — vérifiez la connexion, puis réessayez.', errHttp: 'Erreur serveur — HTTP {s}', errAny: 'Échec — réessayez.',
        reqDate: 'Date requise (AAAA-MM-JJ).', reqParty: 'Nombre de convives requis.', reqAmount: 'Montant requis (≥ 0).', changedHint: 'Remise modifiée — tracée dans l’audit.' },
  zh: { back: '← 返回', entries: '消费笔数', guests: '总人数', amount: '消费总额', reward: '累计奖励', ledger: '消费流水', empty: '暂无消费记录。',
        manualBadge: '补录', edit: '编辑', save: '保存', cancel: '取消', invite: '✉️ 发送登录邀请', inviteSent: '邀请已发送。',
        inviteConfirm: '将向 {email} 发送账单开通邀请邮件?', confirm: '发送', addTitle: '新增消费记录', add: '保存消费记录',
        fDate: '日期', fParty: '人数', fAmount: '实收金额 €', fDiscount: '当单折扣 %', fNote: '备注(可选)',
        commission: '奖励方式', cOff: '已关闭', cPercent: '按金额百分比', cPerHead: '按每人 €', discount: '账户折扣',
        added: '消费记录已保存。', noReward: '未计提奖励(佣金关闭)。', rewardAdded: '奖励:+{v}',
        errNet: '网络不可达 · 请检查网络后重试', errHttp: '服务器返回错误 HTTP {s}', errAny: '操作失败 · 请重试',
        reqDate: '请填写日期(YYYY-MM-DD)。', reqParty: '请填写人数。', reqAmount: '请填写金额(≥0)。', changedHint: '折扣已改 — 将记入审计。' },
  en: { back: '← Back', entries: 'Visits', guests: 'Guests', amount: 'Total invoiced', reward: 'Rewards', ledger: 'History', empty: 'No consumption yet.',
        manualBadge: 'Added by restaurant', edit: 'Edit', save: 'Save', cancel: 'Cancel', invite: '✉️ Send invitation', inviteSent: 'Invitation sent.',
        inviteConfirm: 'Send a client-area invitation email to {email}?', confirm: 'Send', addTitle: 'New consumption', add: 'Save consumption',
        fDate: 'Date', fParty: 'Guests', fAmount: 'Amount collected €', fDiscount: 'Discount applied %', fNote: 'Note (optional)',
        commission: 'Reward', cOff: 'Disabled', cPercent: '% of amount', cPerHead: '€ per guest', discount: 'Account discount',
        added: 'Consumption saved.', noReward: 'No reward accrued (programme disabled).', rewardAdded: 'Reward: +{v}',
        errNet: 'Network unreachable — check the connection, then retry.', errHttp: 'Server error — HTTP {s}', errAny: 'Failed — please retry.',
        reqDate: 'Date required (YYYY-MM-DD).', reqParty: 'Guest count required.', reqAmount: 'Amount required (≥ 0).', changedHint: 'Discount changed — recorded in the audit log.' },
  es: { back: '← Volver', entries: 'Visitas', guests: 'Comensales', amount: 'Total facturado', reward: 'Recompensas', ledger: 'Historial', empty: 'Sin consumos.',
        manualBadge: 'Registrado por el restaurante', edit: 'Editar', save: 'Guardar', cancel: 'Cancelar', invite: '✉️ Enviar invitación', inviteSent: 'Invitación enviada.',
        inviteConfirm: '¿Enviar un email de invitación al área de cliente a {email}?', confirm: 'Enviar', addTitle: 'Nuevo consumo', add: 'Guardar consumo',
        fDate: 'Fecha', fParty: 'Comensales', fAmount: 'Importe cobrado €', fDiscount: 'Descuento aplicado %', fNote: 'Nota (opcional)',
        commission: 'Recompensa', cOff: 'Desactivada', cPercent: '% del importe', cPerHead: '€ por comensal', discount: 'Descuento de cuenta',
        added: 'Consumo guardado.', noReward: 'Sin recompensa (programa desactivado).', rewardAdded: 'Recompensa: +{v}',
        errNet: 'Red inaccesible — compruebe la conexión y reinténtelo.', errHttp: 'Error del servidor — HTTP {s}', errAny: 'Error — reinténtelo.',
        reqDate: 'Fecha requerida (AAAA-MM-DD).', reqParty: 'Número de comensales requerido.', reqAmount: 'Importe requerido (≥ 0).', changedHint: 'Descuento modificado — registrado en la auditoría.' },
}
const fill = (s, o) => Object.entries(o).reduce((a, [k, v]) => a.replaceAll(`{${k}}`, v), s)
const describe = (t, e) => e?.kind === 'network' ? t.errNet
  : e?.kind === 'http' ? `${fill(t.errHttp, { s: e.status })}${e.serverMessage ? ` — ${e.serverMessage}` : ''}`
  : (e?.serverMessage || t.errAny)

const btn = (primary) => ({
  padding: '8px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  border: '1px solid ' + (primary ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.18)'),
  background: primary ? 'rgba(201,168,76,0.18)' : 'transparent',
  color: primary ? 'var(--accent-gold, #f5c518)' : 'var(--text-muted)',
})
const inp = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, fontSize: 14,
  background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary,#fff)', border: '1px solid rgba(255,255,255,0.14)',
}
function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 10, minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  )
}
function Tile({ value, label, accent }) {
  return (
    <div style={{ flex: '1 1 120px', minWidth: 110, borderRadius: 12, padding: '11px 13px',
      background: accent ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${accent ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.18)'}` }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-gold, #f5c518)', lineHeight: 1.2, overflowWrap: 'anywhere' }}>{value}</div>
      <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

export default function GroupesAccountDetail({ accountId, onBack }) {
  const { lang } = useLang()
  const t = T[lang] || T.fr
  const [d, setD] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [flash, setFlash] = useState('')

  const load = () => {
    setLoading(true); setErr('')
    api.adminGroupesAccountDetail(accountId)
      .then(setD)
      .catch(e => { if (e?.kind !== 'auth') setErr(describe(t, e)) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [accountId])

  if (loading) return <div className={styles.card}><div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>…</div></div>
  if (err && !d) return (
    <div className={styles.card}>
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ color: '#e08a8a', fontSize: 13.5 }}>{err}</p>
        <button onClick={load} style={btn(true)}>↻</button>
        <button onClick={onBack} style={{ ...btn(false), marginLeft: 8 }}>{t.back}</button>
      </div>
    </div>
  )

  const acc = d?.account || {}
  const s = d?.summary || {}
  const entries = d?.entries || []
  const rewardOff = String(acc.commission_mode || '').toUpperCase() === 'OFF'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ ...btn(false), alignSelf: 'flex-start' }}>{t.back}</button>
      {flash && <div style={{ fontSize: 13, color: '#7bd3a0' }}>{flash}</div>}
      {err && <div style={{ fontSize: 13, color: '#e08a8a' }}>{err}</div>}

      <Profile acc={acc} t={t} lang={lang} onSaved={(a) => { setD(x => ({ ...x, account: a })); setFlash(t.save) }} onErr={setErr} onInvited={() => setFlash(t.inviteSent)} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Tile value={s.entries_count ?? 0} label={t.entries} />
        <Tile value={s.total_guests ?? 0} label={t.guests} />
        <Tile value={eur(s.total_amount_eur)} label={t.amount} accent />
        {!rewardOff && <Tile value={eur(s.total_reward_eur)} label={t.reward} />}
      </div>

      <ManualOrderForm acc={acc} t={t} onDone={() => load()} onFlash={setFlash} onErr={setErr} />

      <div className={styles.card}>
        <div className={styles.cardHeader}><h2 className={styles.cardTitle}>🧾 {t.ledger} {entries.length > 0 && `· ${entries.length}`}</h2></div>
        {entries.length === 0 ? (
          <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>{t.empty}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.map(e => (
              <div key={`${e.source}-${e.id}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color,#2a2a2a)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14 }}>{fmtDate(e.date)}</strong>
                  {e.source === 'MANUAL' && <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: 'var(--text-muted)' }}>{t.manualBadge}</span>}
                  <strong style={{ marginLeft: 'auto', color: 'var(--accent-gold,#f5c518)' }}>{eur(e.amount_eur)}</strong>
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>👥 {e.party_size}</span>
                  {e.discount_applied_pct > 0 && <span>−{e.discount_applied_pct}%</span>}
                  {!rewardOff && e.reward_eur > 0 && <span>🎁 +{eur(e.reward_eur)}</span>}
                </div>
                {e.note && <div style={{ marginTop: 5, fontSize: 12.5, color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>💬 {e.note}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── profile card: identity, type, discount, commission + edit + invite ──
function Profile({ acc, t, lang, onSaved, onErr, onInvited }) {
  const [edit, setEdit] = useState(false)
  const [f, setF] = useState({})
  const [busy, setBusy] = useState(false)
  const [confirmInvite, setConfirmInvite] = useState(false)
  const start = () => {
    setF({ name: acc.name || '', company: acc.company || '', phone: acc.phone || '',
      discount_pct: String(acc.discount_pct ?? 0), commission_mode: String(acc.commission_mode || 'OFF').toUpperCase(),
      commission_value: String(acc.commission_value ?? 0) })
    setEdit(true)
  }
  const save = async () => {
    setBusy(true); onErr('')
    try {
      const r = await api.adminGroupesAccountPatch(acc.id, {
        name: f.name.trim(), company: f.company.trim(), phone: f.phone.trim(),
        discount_pct: parseFloat(f.discount_pct), commission_mode: f.commission_mode,
        commission_value: parseFloat(f.commission_value),
      })
      onSaved(r.account || { ...acc, ...f }); setEdit(false)
    } catch (e) { onErr(describe(t, e)) } finally { setBusy(false) }
  }
  const invite = async () => {
    setBusy(true); onErr(''); setConfirmInvite(false)
    try { await api.adminGroupesSendInvite(acc.id); onInvited() }
    catch (e) { onErr(describe(t, e)) } finally { setBusy(false) }
  }
  const cLabel = { OFF: t.cOff, PERCENT: t.cPercent, PER_HEAD: t.cPerHead }

  return (
    <div className={styles.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        <strong style={{ fontSize: 17, overflowWrap: 'anywhere' }}>{acc.name || '—'}</strong>
        <AccountTypeBadge account={acc} lang={lang} />
        {!edit && <button onClick={start} style={{ ...btn(false), marginLeft: 'auto' }}>✎ {t.edit}</button>}
      </div>
      {!edit ? (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>{acc.company || '—'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, overflowWrap: 'anywhere' }}>
            ✉️ {acc.email}{acc.phone ? ` · 📞 ${acc.phone}` : ''}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: 'var(--text-secondary)' }}>{t.discount} −{acc.discount_pct}%</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: 'var(--text-secondary)' }}>
              {t.commission} : {cLabel[String(acc.commission_mode || 'OFF').toUpperCase()] || acc.commission_mode}
              {String(acc.commission_mode || 'OFF').toUpperCase() !== 'OFF' ? ` (${acc.commission_value})` : ''}
            </span>
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setConfirmInvite(true)} disabled={busy} style={btn(true)}>{t.invite}</button>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 6 }}>
          <Field label={t.fNote ? 'Nom · 姓名' : ''}><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} style={inp} /></Field>
          <Field label="Société · 公司"><input value={f.company} onChange={e => setF({ ...f, company: e.target.value })} style={inp} /></Field>
          <Field label="Téléphone · 电话"><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} style={inp} /></Field>
          <Field label={`${t.discount} %`}><input value={f.discount_pct} inputMode="decimal" onChange={e => setF({ ...f, discount_pct: e.target.value })} style={inp} /></Field>
          <Field label={t.commission}>
            <select value={f.commission_mode} onChange={e => setF({ ...f, commission_mode: e.target.value })} style={{ ...inp, colorScheme: 'dark' }}>
              <option value="OFF">{t.cOff}</option>
              <option value="PERCENT">{t.cPercent}</option>
              <option value="PER_HEAD">{t.cPerHead}</option>
            </select>
          </Field>
          {f.commission_mode !== 'OFF' && (
            <Field label={f.commission_mode === 'PERCENT' ? '%' : '€'}>
              <input value={f.commission_value} inputMode="decimal" onChange={e => setF({ ...f, commission_value: e.target.value })} style={inp} />
            </Field>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={save} disabled={busy} style={btn(true)}>{busy ? '…' : `✓ ${t.save}`}</button>
            <button onClick={() => setEdit(false)} disabled={busy} style={btn(false)}>{t.cancel}</button>
          </div>
        </div>
      )}

      {confirmInvite && (
        <div onClick={() => setConfirmInvite(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 'min(420px,100%)', background: 'var(--bg-elevated,#16181d)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 14, padding: 'clamp(14px,4vw,20px)' }}>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-primary,#fff)', overflowWrap: 'anywhere' }}>{fill(t.inviteConfirm, { email: acc.email })}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => setConfirmInvite(false)} style={btn(false)}>{t.cancel}</button>
              <button onClick={invite} disabled={busy} style={btn(true)}>{busy ? '…' : t.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── record a past service (P4 priority 2) ──
function ManualOrderForm({ acc, t, onDone, onFlash, onErr }) {
  const accDisc = String(acc.discount_pct ?? 0)
  const [f, setF] = useState({ order_date: todayISO(), party_size: '', amount_eur: '', discount_pct: accDisc, note: '' })
  const [busy, setBusy] = useState(false)
  const [local, setLocal] = useState('')
  useEffect(() => { setF(x => ({ ...x, discount_pct: accDisc })) }, [accDisc])
  // Same gold-edge language as the promote grid: a discount that differs from the account's
  // standard is a deliberate, audited decision — make it visible before saving.
  const discChanged = String(f.discount_pct) !== accDisc && String(f.discount_pct).trim() !== ''

  const submit = async () => {
    setLocal(''); onErr('')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.order_date)) { setLocal(t.reqDate); return }
    const p = parseInt(f.party_size, 10)
    if (!p || p <= 0) { setLocal(t.reqParty); return }
    const amt = parseFloat(f.amount_eur)
    if (isNaN(amt) || amt < 0) { setLocal(t.reqAmount); return }
    setBusy(true)
    try {
      const r = await api.adminGroupesManualOrder({
        account_id: acc.id, order_date: f.order_date, party_size: p, amount_eur: amt,
        discount_pct: f.discount_pct === '' ? undefined : parseFloat(f.discount_pct),
        note: f.note.trim() || undefined,
      })
      // Report the backend's own reward decision verbatim — never imply an accrual it didn't make.
      const accrued = r?.reward?.accrued
      const rv = r?.reward?.amount_eur ?? r?.reward?.reward_eur
      onFlash(`${t.added} ${accrued === false ? t.noReward : (rv != null ? fill(t.rewardAdded, { v: eur(rv) }) : '')}`.trim())
      setF({ order_date: todayISO(), party_size: '', amount_eur: '', discount_pct: accDisc, note: '' })
      onDone()
    } catch (e) { setLocal(describe(t, e)) } finally { setBusy(false) }
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}><h2 className={styles.cardTitle}>➕ {t.addTitle}</h2></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        <Field label={t.fDate}><input type="date" value={f.order_date} onChange={e => setF({ ...f, order_date: e.target.value })} style={{ ...inp, colorScheme: 'dark' }} /></Field>
        <Field label={t.fParty}><input type="number" min="1" inputMode="numeric" value={f.party_size} onChange={e => setF({ ...f, party_size: e.target.value })} style={inp} /></Field>
        <Field label={t.fAmount}><input inputMode="decimal" value={f.amount_eur} onChange={e => setF({ ...f, amount_eur: e.target.value })} style={inp} /></Field>
        <Field label={t.fDiscount}>
          <input inputMode="decimal" value={f.discount_pct} onChange={e => setF({ ...f, discount_pct: e.target.value })}
            style={{ ...inp, border: '1px solid ' + (discChanged ? 'rgba(245,197,24,0.7)' : 'rgba(255,255,255,0.14)') }} />
        </Field>
      </div>
      <Field label={t.fNote}><input value={f.note} onChange={e => setF({ ...f, note: e.target.value })} style={inp} /></Field>
      {discChanged && <p style={{ margin: '0 0 8px', fontSize: 11.5, color: '#f5c518' }}>{t.changedHint}</p>}
      {local && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#e08a8a' }}>{local}</p>}
      <button onClick={submit} disabled={busy} style={btn(true)}>{busy ? '…' : t.add}</button>
    </div>
  )
}
