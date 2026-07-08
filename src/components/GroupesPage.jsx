import { useState, useEffect } from 'react'
import { api, getGroupesToken, clearGroupesToken } from '../utils/api'
import { useLang } from '../hooks/useLang'

// Groupes & Guides — group-booking funnel for tour guides / agencies.
// Guide applies → owner approves → guide logs in by email OTP (session token) → books a
// formula (4 set menus, discounted per head) or « à la carte » (−10% settled on site, ≥3 pers).
// Mobile-first, 龙城 gold/black, 4 langs. Personal reservations are untouched (separate route).

const GOLD = '#c9a84c'
const eur = (n, cur = '€') => (n == null ? '—' : `${Number(n).toFixed(2).replace('.', ',')} ${cur}`)
const fill = (s, o) => Object.entries(o).reduce((a, [k, v]) => a.replaceAll(`{${k}}`, v), s)

const T = {
  fr: {
    eyebrow: 'Groupes & Guides', heroTitle: 'Réservations de groupe',
    lede: 'Tarifs préférentiels pour agences & guides touristiques — formules dès 8 personnes, à la carte dès 3, et une récompense guide sur chaque groupe.',
    tabApply: 'Nouveau compte', tabLogin: 'Se connecter',
    fName: 'Nom du responsable *', fEmail: 'Email *', fCompany: 'Agence / société', fPhone: 'Téléphone',
    applyBtn: 'Envoyer la demande', sending: '…',
    applyDoneTitle: 'Demande reçue', applyDoneMsg: 'Votre compte est en attente de validation. Vous recevrez un email dès son approbation — vous pourrez alors vous connecter et réserver.',
    applyExists: 'Un compte existe déjà pour cet email — connectez-vous.',
    loginEmail: 'Email du compte *', sendCode: 'Recevoir le code', codeSent: 'Code envoyé par email.',
    codeLabel: 'Code reçu par email *', verify: 'Se connecter', changeEmail: '← Changer d’email', resend: 'Renvoyer le code',
    welcome: 'Espace groupes', logout: 'Déconnexion',
    chooseFormula: 'Choisissez une formule', perHead: '/ pers.',
    carteTitle: 'À la carte', carteDesc: 'Prix à la carte sur place — remise groupe dès {min} personnes.',
    party: 'Nombre de personnes', partyMin: 'Min. {n} pers.', date: 'Date', lead: 'Au moins {h}h à l’avance',
    requests: 'Demandes spéciales (optionnel)', requestsPh: 'Allergies, salle privée, langue du guide…',
    book: 'Confirmer la réservation',
    errSelect: 'Choisissez une formule.', errParty: 'Min. {n} personnes pour cette formule.', errDate: 'Choisissez une date au moins {h}h à l’avance.',
    okTitle: 'Réservation confirmée !', ref: 'N°', total: 'Total estimé', perHeadLbl: 'Par personne', reward: 'Récompense guide', period: 'Période',
    carteNote: 'À la carte — remise réglée sur place selon la consommation.', newBooking: 'Nouvelle réservation',
    genErr: 'Une erreur est survenue. Réessayez.',
  },
  zh: {
    eyebrow: '团体 & 导游', heroTitle: '团体预定',
    lede: '面向旅行社与导游的优惠合作 —— 套餐 8 人起、单点 3 人起，每一团都有导游奖励。',
    tabApply: '申请账号', tabLogin: '登录',
    fName: '负责人姓名 *', fEmail: '邮箱 *', fCompany: '旅行社 / 公司', fPhone: '电话',
    applyBtn: '提交申请', sending: '…',
    applyDoneTitle: '申请已提交', applyDoneMsg: '您的账号正在审核中。通过后将邮件通知，即可登录并预定。',
    applyExists: '该邮箱已有账号——请直接登录。',
    loginEmail: '账号邮箱 *', sendCode: '获取验证码', codeSent: '验证码已发送至邮箱。',
    codeLabel: '邮箱验证码 *', verify: '登录', changeEmail: '← 更换邮箱', resend: '重新发送',
    welcome: '团体专区', logout: '退出',
    chooseFormula: '选择套餐', perHead: '/人',
    carteTitle: '单点 À la carte', carteDesc: '到店按单点计价 —— {min} 人起享团体折扣。',
    party: '人数', partyMin: '{n} 人起', date: '日期', lead: '需提前 {h} 小时',
    requests: '特殊要求（可选）', requestsPh: '过敏、包间、导游语言……',
    book: '确认预定',
    errSelect: '请选择套餐。', errParty: '该套餐至少 {n} 人。', errDate: '请选择至少提前 {h} 小时的时间。',
    okTitle: '预定成功！', ref: '编号', total: '预计总额', perHeadLbl: '每人', reward: '导游奖励', period: '账期',
    carteNote: '单点 —— 到店按实际消费享折扣结算。', newBooking: '再订一单',
    genErr: '出错了，请重试。',
  },
  en: {
    eyebrow: 'Groups & Guides', heroTitle: 'Group reservations',
    lede: 'Preferential rates for agencies & tour guides — set menus from 8 guests, à la carte from 3, and a guide reward on every group.',
    tabApply: 'New account', tabLogin: 'Sign in',
    fName: 'Contact name *', fEmail: 'Email *', fCompany: 'Agency / company', fPhone: 'Phone',
    applyBtn: 'Send request', sending: '…',
    applyDoneTitle: 'Request received', applyDoneMsg: 'Your account is pending validation. You’ll get an email once it’s approved — then you can sign in and book.',
    applyExists: 'An account already exists for this email — please sign in.',
    loginEmail: 'Account email *', sendCode: 'Get the code', codeSent: 'Code sent by email.',
    codeLabel: 'Code from email *', verify: 'Sign in', changeEmail: '← Change email', resend: 'Resend code',
    welcome: 'Groups area', logout: 'Sign out',
    chooseFormula: 'Choose a formula', perHead: '/ guest',
    carteTitle: 'À la carte', carteDesc: 'Priced à la carte on site — group discount from {min} guests.',
    party: 'Number of guests', partyMin: 'Min. {n} guests', date: 'Date', lead: 'At least {h}h in advance',
    requests: 'Special requests (optional)', requestsPh: 'Allergies, private room, guide language…',
    book: 'Confirm booking',
    errSelect: 'Choose a formula.', errParty: 'Min. {n} guests for this formula.', errDate: 'Pick a time at least {h}h ahead.',
    okTitle: 'Booking confirmed!', ref: 'No.', total: 'Estimated total', perHeadLbl: 'Per guest', reward: 'Guide reward', period: 'Period',
    carteNote: 'À la carte — discount settled on site based on consumption.', newBooking: 'New booking',
    genErr: 'Something went wrong. Try again.',
  },
  es: {
    eyebrow: 'Grupos y Guías', heroTitle: 'Reservas de grupo',
    lede: 'Tarifas preferentes para agencias y guías — menús desde 8 personas, à la carte desde 3, y una recompensa de guía en cada grupo.',
    tabApply: 'Nueva cuenta', tabLogin: 'Entrar',
    fName: 'Nombre del responsable *', fEmail: 'Email *', fCompany: 'Agencia / empresa', fPhone: 'Teléfono',
    applyBtn: 'Enviar solicitud', sending: '…',
    applyDoneTitle: 'Solicitud recibida', applyDoneMsg: 'Su cuenta está pendiente de validación. Recibirá un email al aprobarse — entonces podrá entrar y reservar.',
    applyExists: 'Ya existe una cuenta con este email — inicie sesión.',
    loginEmail: 'Email de la cuenta *', sendCode: 'Recibir el código', codeSent: 'Código enviado por email.',
    codeLabel: 'Código del email *', verify: 'Entrar', changeEmail: '← Cambiar email', resend: 'Reenviar código',
    welcome: 'Área de grupos', logout: 'Salir',
    chooseFormula: 'Elija una fórmula', perHead: '/ pers.',
    carteTitle: 'À la carte', carteDesc: 'Precio à la carte en el sitio — descuento de grupo desde {min} personas.',
    party: 'Número de personas', partyMin: 'Mín. {n} pers.', date: 'Fecha', lead: 'Al menos {h}h de antelación',
    requests: 'Peticiones especiales (opcional)', requestsPh: 'Alergias, sala privada, idioma del guía…',
    book: 'Confirmar reserva',
    errSelect: 'Elija una fórmula.', errParty: 'Mín. {n} personas para esta fórmula.', errDate: 'Elija una hora al menos {h}h antes.',
    okTitle: '¡Reserva confirmada!', ref: 'Nº', total: 'Total estimado', perHeadLbl: 'Por persona', reward: 'Recompensa de guía', period: 'Periodo',
    carteNote: 'À la carte — descuento liquidado en el sitio según el consumo.', newBooking: 'Nueva reserva',
    genErr: 'Algo salió mal. Inténtelo de nuevo.',
  },
}

// Dietary presets — the token (stored in special_requests as [token]) is canonical French,
// so the owner sees a stable, highlightable prefix regardless of the guide's UI language.
const DIETS = [
  { token: 'Sans porc',  label: { fr: 'Sans porc', zh: '不吃猪肉', en: 'No pork', es: 'Sin cerdo' } },
  { token: 'Sans bœuf',  label: { fr: 'Sans bœuf', zh: '不吃牛肉', en: 'No beef', es: 'Sin ternera' } },
  { token: 'Végétarien', label: { fr: 'Végétarien', zh: '素食', en: 'Vegetarian', es: 'Vegetariano' } },
  { token: 'Végan',      label: { fr: 'Végan', zh: '纯素', en: 'Vegan', es: 'Vegano' } },
  { token: 'Allergies',  label: { fr: 'Allergies', zh: '过敏', en: 'Allergies', es: 'Alergias' } },
]
const DIET_T = {
  fr: { allergyReq: 'Précisez l’allergie.', allergyPh: 'Précisez l’allergie *' },
  zh: { allergyReq: '请填写过敏说明。', allergyPh: '请注明过敏原 *' },
  en: { allergyReq: 'Please specify the allergy.', allergyPh: 'Specify the allergy *' },
  es: { allergyReq: 'Indique la alergia.', allergyPh: 'Indique la alergia *' },
}
// Dish-pool collapsible (plan A — pure display, no selection). Labels 4-lang; the pool
// content + note come entirely from the backend (data-driven, John edits without a deploy).
const POOL_T = {
  fr: { toggle: 'Voir les plats au choix', soups: 'Soupes', dishes: 'Plats' },
  zh: { toggle: '查看可选菜品', soups: '汤', dishes: '菜品' },
  en: { toggle: 'See the dishes to choose from', soups: 'Soups', dishes: 'Dishes' },
  es: { toggle: 'Ver los platos a elegir', soups: 'Sopas', dishes: 'Platos' },
}
const dishName = (d, lang) => (d && (d[lang] || d.fr)) || ''   // ignores unknown keys (e.g. future url)

export default function GroupesPage() {
  const { lang } = useLang()
  const t = T[lang] || T.fr

  const [phase, setPhase] = useState(() => (getGroupesToken() ? 'booking' : 'gate'))
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(165deg, #1a1206 0%, #0a0a0a 55%)', color: '#f5f0e8', fontFamily: 'var(--font-body, system-ui)', padding: '28px 18px 56px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 460, margin: '0 auto' }}>
        <img src="/icons/logo5.png" alt="Dragons Élysées 龙城酒楼" style={{ width: 96, height: 'auto', margin: '0 auto 10px', display: 'block', filter: 'drop-shadow(0 2px 10px rgba(201,168,76,0.35))' }} />
        <div style={{ textAlign: 'center', fontSize: 12.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 18 }}>{t.eyebrow}</div>

        {phase === 'gate' && <Gate t={t} onApplied={() => setPhase('applied')} onLoggedIn={() => setPhase('booking')} />}
        {phase === 'applied' && <Applied t={t} onBack={() => setPhase('gate')} />}
        {phase === 'booking' && <Booking t={t} lang={lang} onLogout={() => { clearGroupesToken(); setPhase('gate') }} />}
      </div>
    </div>
  )
}

// ── shared field styles ──
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 11, border: `1px solid ${GOLD}44`, background: 'rgba(255,255,255,0.05)', color: '#f5f0e8', fontSize: 15, marginBottom: 12 }
const btnGold = { width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${GOLD}, #b8973a)`, color: '#0a0a0a', fontWeight: 800, fontSize: 16, cursor: 'pointer' }
function Field({ label, ...props }) {
  return <input {...props} placeholder={label} style={inputStyle} />
}

// ═══ GATE: apply / login ═══
function Gate({ t, onApplied, onLoggedIn }) {
  const [mode, setMode] = useState('apply')
  const tab = (active) => ({ flex: 1, padding: '10px 0', textAlign: 'center', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: active ? '#0a0a0a' : GOLD, background: active ? GOLD : 'transparent', borderRadius: 9 })
  return (
    <>
      <h1 style={{ fontSize: 21, fontWeight: 700, textAlign: 'center', margin: '0 0 8px' }}>{t.heroTitle}</h1>
      <p style={{ color: '#a99f88', fontSize: 13.5, lineHeight: 1.6, textAlign: 'center', margin: '0 0 22px' }}>{t.lede}</p>
      <div style={{ display: 'flex', gap: 6, padding: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 18 }}>
        <div style={tab(mode === 'apply')} onClick={() => setMode('apply')}>{t.tabApply}</div>
        <div style={tab(mode === 'login')} onClick={() => setMode('login')}>{t.tabLogin}</div>
      </div>
      {mode === 'apply' ? <ApplyForm t={t} onApplied={onApplied} /> : <LoginForm t={t} onLoggedIn={onLoggedIn} />}
    </>
  )
}

function ApplyForm({ t, onApplied }) {
  const [f, setF] = useState({ name: '', email: '', company: '', phone: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async () => {
    if (!f.name.trim() || !f.email.trim()) { setErr('*'); return }
    setBusy(true); setErr('')
    try {
      const r = await api.groupesApply({ name: f.name.trim(), email: f.email.trim(), company: f.company.trim() || undefined, phone: f.phone.trim() || undefined })
      if (r.existing) { setErr(t.applyExists); setBusy(false); return }
      onApplied()
    } catch { setErr(t.genErr); setBusy(false) }
  }
  return (
    <>
      <Field label={t.fName} value={f.name} onChange={set('name')} />
      <Field label={t.fEmail} type="email" value={f.email} onChange={set('email')} />
      <Field label={t.fCompany} value={f.company} onChange={set('company')} />
      <Field label={t.fPhone} type="tel" value={f.phone} onChange={set('phone')} />
      {err && <div style={{ color: '#f2a5a5', fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <button style={btnGold} onClick={submit} disabled={busy}>{busy ? t.sending : t.applyBtn}</button>
    </>
  )
}

function LoginForm({ t, onLoggedIn }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email')   // email | code
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const send = async () => {
    if (!email.trim()) { setErr('*'); return }
    setBusy(true); setErr(''); setMsg('')
    try {
      const r = await api.groupesLoginSend(email.trim())
      if (r.otp_sent) { setStep('code'); setMsg(t.codeSent) }
      else { setErr(r.message || t.genErr) }
    } catch { setErr(t.genErr) } finally { setBusy(false) }
  }
  const verify = async () => {
    if (!code.trim()) { setErr('*'); return }
    setBusy(true); setErr('')
    try {
      const r = await api.groupesLoginVerify(email.trim(), code.trim())
      if (r.token) onLoggedIn()
      else setErr(r.error || t.genErr)
    } catch (e) { setErr(e?.message === 'unauthorized' ? t.genErr : (e?.message || t.genErr)) } finally { setBusy(false) }
  }
  return (
    <>
      {step === 'email' ? (
        <>
          <Field label={t.loginEmail} type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          {err && <div style={{ color: '#f2a5a5', fontSize: 13, marginBottom: 10 }}>{err}</div>}
          <button style={btnGold} onClick={send} disabled={busy}>{busy ? t.sending : t.sendCode}</button>
        </>
      ) : (
        <>
          {msg && <div style={{ color: '#9cc7a0', fontSize: 13, marginBottom: 10 }}>{msg}</div>}
          <Field label={t.codeLabel} inputMode="numeric" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && verify()} autoFocus />
          {err && <div style={{ color: '#f2a5a5', fontSize: 13, marginBottom: 10 }}>{err}</div>}
          <button style={btnGold} onClick={verify} disabled={busy}>{busy ? t.sending : t.verify}</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 13 }}>
            <button onClick={() => { setStep('email'); setErr(''); setMsg('') }} style={{ background: 'none', border: 'none', color: '#a99f88', cursor: 'pointer' }}>{t.changeEmail}</button>
            <button onClick={send} disabled={busy} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer' }}>{t.resend}</button>
          </div>
        </>
      )}
    </>
  )
}

function Applied({ t, onBack }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 4px' }}>
      <div style={{ fontSize: 42, marginBottom: 8 }}>📨</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>{t.applyDoneTitle}</h1>
      <p style={{ color: '#a99f88', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 22px' }}>{t.applyDoneMsg}</p>
      <button style={{ ...btnGold, background: 'transparent', color: GOLD, border: `1px solid ${GOLD}66` }} onClick={onBack}>{t.tabLogin}</button>
    </div>
  )
}

// ═══ BOOKING: menu tiers + form + confirmation ═══
function Booking({ t, lang, onLogout }) {
  const [menu, setMenu] = useState(null)
  const [loadErr, setLoadErr] = useState('')
  const [tier, setTier] = useState(null)          // 5|6|7|8|'carte'
  const [party, setParty] = useState('')
  const [when, setWhen] = useState('')            // datetime-local value
  const [diets, setDiets] = useState({})          // { token: true } dietary presets
  const [requests, setRequests] = useState('')
  const [poolOpen, setPoolOpen] = useState(false) // dish-pool collapsible — collapsed by default
  const [busy, setBusy] = useState(false)
  const dt = DIET_T[lang] || DIET_T.fr
  const pt = POOL_T[lang] || POOL_T.fr
  const [err, setErr] = useState('')
  const [done, setDone] = useState(null)          // booking response

  useEffect(() => {
    let alive = true
    api.groupesMenu()
      .then(m => { if (alive) setMenu(m) })
      .catch(e => { if (alive) setLoadErr(e?.message === 'unauthorized' ? 'unauthorized' : t.genErr) })
    return () => { alive = false }
  }, [])

  // Session expired / invalid → back to login gate.
  useEffect(() => { if (loadErr === 'unauthorized') onLogout() }, [loadErr])

  if (!menu) return <div style={{ textAlign: 'center', color: '#a99f88', padding: 30 }}>{loadErr && loadErr !== 'unauthorized' ? loadErr : '…'}</div>

  const cur = menu.currency || '€'
  const pct = menu.discount_pct ?? 10
  const setTiers = (menu.tiers || []).filter(x => x.tier !== 'carte')
  const carte = (menu.tiers || []).find(x => x.tier === 'carte')
  const minFor = (tr) => tr === 'carte' ? (carte?.min_party || menu.min_party_carte || 3) : (menu.min_party || 8)
  const lead = menu.lead_hours ?? 24

  const submit = async () => {
    setErr('')
    if (!tier) { setErr(t.errSelect); return }
    const min = minFor(tier)
    const p = parseInt(party, 10)
    if (!p || p < min) { setErr(fill(t.errParty, { n: min })); return }
    if (!when) { setErr(fill(t.errDate, { h: lead })); return }
    const chosen = new Date(when).getTime()
    if (isNaN(chosen) || chosen < Date.now() + lead * 3600 * 1000) { setErr(fill(t.errDate, { h: lead })); return }
    // Dietary: checked presets become a canonical [token] prefix; Allergies needs a description.
    const free = requests.trim()
    if (diets['Allergies'] && !free) { setErr(dt.allergyReq); return }
    const tokens = DIETS.filter(d => diets[d.token]).map(d => `[${d.token}]`).join('')
    const special = (tokens + (free ? (tokens ? ' ' : '') + free : '')).trim()
    setBusy(true)
    try {
      // backend expects a plain calendar date (YYYY-MM-DD) — the <input type="date"> value is already that
      const r = await api.groupesBook({ booking_date: when, party_size: p, menu_tier: tier, special_requests: special || undefined })
      setDone(r)
    } catch (e) { setErr(e?.message === 'unauthorized' ? t.genErr : (e?.message || t.genErr)) } finally { setBusy(false) }
  }

  if (done) return <Confirmed t={t} r={done} isCarte={tier === 'carte'} cur={cur} pct={pct} onNew={() => { setDone(null); setTier(null); setParty(''); setWhen(''); setRequests(''); setDiets({}) }} />

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: '#a99f88' }}>{t.welcome}</span>
        <button onClick={onLogout} style={{ background: 'none', border: `1px solid ${GOLD}44`, color: GOLD, borderRadius: 8, padding: '5px 11px', fontSize: 12.5, cursor: 'pointer' }}>{t.logout}</button>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{t.chooseFormula}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {setTiers.map(x => (
          <TierCard key={x.tier} selected={tier === x.tier} onClick={() => setTier(x.tier)}
            title={x.label} badge={`−${pct}%`}
            main={<span><strong style={{ fontSize: 20, color: GOLD }}>{eur(x.price_discounted, cur)}</strong> <span style={{ fontSize: 12.5, color: '#8f866f' }}>{t.perHead}</span></span>}
            sub={x.price_base != null && <span style={{ textDecoration: 'line-through', color: '#7a725f', fontSize: 13 }}>{eur(x.price_base, cur)}</span>} />
        ))}
        {carte && (
          <TierCard selected={tier === 'carte'} onClick={() => setTier('carte')}
            title={t.carteTitle} badge={`−${pct}%`}
            main={<span style={{ fontSize: 15, fontWeight: 700, color: GOLD }}>{carte.label || `À la carte −${pct}%`}</span>}
            sub={<span style={{ fontSize: 12.5, color: '#a99f88', lineHeight: 1.5 }}>{fill(t.carteDesc, { min: minFor('carte') })}</span>} />
        )}
      </div>

      {/* Dish pool — pure display (plan A). Applies to the set formulas only (à la carte uses the
          in-house menu), so it's hidden when carte is selected. Content is 100% from the API. */}
      <DishPool menu={menu} lang={lang} pt={pt} tier={tier} open={poolOpen} setOpen={setPoolOpen} />

      {tier && (
        <>
          <label style={{ fontSize: 13.5, color: '#c9bfa6', display: 'block', marginBottom: 5 }}>{t.party} · <span style={{ color: '#8f866f' }}>{fill(t.partyMin, { n: minFor(tier) })}</span></label>
          <Field label={t.party} type="number" min={minFor(tier)} value={party} onChange={e => setParty(e.target.value)} />
          <label style={{ fontSize: 13.5, color: '#c9bfa6', display: 'block', marginBottom: 5 }}>{t.date} · <span style={{ color: '#8f866f' }}>{fill(t.lead, { h: lead })}</span></label>
          <input type="date" value={when} onChange={e => setWhen(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
          <label style={{ fontSize: 13.5, color: '#c9bfa6', display: 'block', marginBottom: 7 }}>{t.requests}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {DIETS.map(d => {
              const on = !!diets[d.token]
              return (
                <label key={d.token} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 13, userSelect: 'none', border: `1px solid ${on ? GOLD : 'rgba(201,168,76,0.25)'}`, background: on ? 'rgba(201,168,76,0.15)' : 'transparent', color: on ? '#f5f0e8' : '#a99f88' }}>
                  <input type="checkbox" checked={on} onChange={e => setDiets({ ...diets, [d.token]: e.target.checked })} style={{ accentColor: GOLD, margin: 0 }} />
                  {d.label[lang] || d.label.fr}
                </label>
              )
            })}
          </div>
          <textarea value={requests} onChange={e => setRequests(e.target.value)} rows={3}
            placeholder={diets['Allergies'] ? dt.allergyPh : t.requestsPh}
            style={{ ...inputStyle, resize: 'vertical', border: diets['Allergies'] && !requests.trim() ? '1px solid #d98a6a88' : inputStyle.border }} />
          {err && <div style={{ color: '#f2a5a5', fontSize: 13, marginBottom: 10 }}>{err}</div>}
          <button style={btnGold} onClick={submit} disabled={busy}>{busy ? t.sending : t.book}</button>
        </>
      )}
    </>
  )
}

function TierCard({ selected, onClick, title, badge, main, sub }) {
  return (
    <div onClick={onClick} style={{
      cursor: 'pointer', borderRadius: 13, padding: '14px 15px',
      border: `1.5px solid ${selected ? GOLD : 'rgba(201,168,76,0.22)'}`,
      background: selected ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
      display: 'flex', alignItems: 'center', gap: 12, transition: 'all .12s',
    }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected ? GOLD : '#5a5344'}`, background: selected ? GOLD : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <span style={{ color: '#0a0a0a', fontSize: 12, fontWeight: 900 }}>✓</span>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: GOLD, color: '#1a1208' }}>{badge}</span>
        </div>
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>{main}{sub}</div>
      </div>
    </div>
  )
}

// Collapsible « plats au choix » — pure display, no checkbox, no quantity rule (plan A).
// Hidden for à la carte. dish_note's "N" → the selected formula's plat count (graceful « … » if none).
function DishPool({ menu, lang, pt, tier, open, setOpen }) {
  const pool = menu.dish_pool
  if (!pool || tier === 'carte') return null
  const soups = pool.soups || []
  const dishes = pool.dishes || []
  if (!soups.length && !dishes.length) return null
  const raw = menu.dish_note
    ? (typeof menu.dish_note === 'string' ? menu.dish_note : (menu.dish_note[lang] || menu.dish_note.fr || ''))
    : ''
  const note = raw.replace(/\bN\b/g, typeof tier === 'number' ? String(tier) : '…')

  const group = (title, items) => items.length > 0 && (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: GOLD, marginBottom: 5 }}>{title} · {items.length}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '2px 14px' }}>
        {items.map((d, i) => <div key={i} style={{ fontSize: 12.5, color: '#c9bfa6', lineHeight: 1.5 }}>· {dishName(d, lang)}</div>)}
      </div>
    </div>
  )

  return (
    <div style={{ marginBottom: 20, border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: 'none', color: GOLD, fontWeight: 700, fontSize: 14, cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ display: 'inline-block', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none' }}>▸</span>
        {pt.toggle}
      </button>
      {open && (
        <div style={{ padding: '2px 14px 14px' }}>
          {note && <p style={{ fontSize: 13, color: '#a99f88', lineHeight: 1.6, margin: '8px 0 2px' }}>{note}</p>}
          {group(pt.soups, soups)}
          {group(pt.dishes, dishes)}
        </div>
      )}
    </div>
  )
}

function Confirmed({ t, r, isCarte, cur, pct, onNew }) {
  return (
    <div style={{ textAlign: 'center', padding: '6px 4px' }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
      <h1 style={{ fontSize: 23, fontWeight: 700, margin: '0 0 4px' }}>{t.okTitle}</h1>
      {r.id != null && <div style={{ color: '#a99f88', fontSize: 13, marginBottom: 18 }}>{t.ref} {r.id}</div>}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${GOLD}33`, borderRadius: 14, padding: '16px 18px', textAlign: 'left', margin: '0 0 20px' }}>
        {isCarte ? (
          <div style={{ fontSize: 14, color: '#e9e1cf', lineHeight: 1.6 }}>🍽️ {fill(t.carteNote, { pct })}</div>
        ) : (
          <>
            <Row label={t.total} value={<strong style={{ color: GOLD, fontSize: 20 }}>{eur(r.total_estimate, cur)}</strong>} />
            {r.per_head != null && <Row label={t.perHeadLbl} value={eur(r.per_head, cur)} />}
          </>
        )}
        {r.reward_amount != null && <Row label={`🎁 ${t.reward}`} value={<strong style={{ color: '#9cc7a0' }}>+{eur(r.reward_amount, cur)}</strong>} />}
        {r.period && <Row label={t.period} value={r.period} />}
      </div>
      <button style={{ ...btnGold, background: 'transparent', color: GOLD, border: `1px solid ${GOLD}66` }} onClick={onNew}>{t.newBooking}</button>
    </div>
  )
}
function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#a99f88', fontSize: 13.5 }}>{label}</span>
      <span style={{ fontSize: 14.5 }}>{value}</span>
    </div>
  )
}
