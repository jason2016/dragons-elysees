// P4 — the two account families must be tellable apart at a glance, everywhere the owner
// looks: Inscrits list, Groupes list, account detail and the account's own statement.
// ENTREPRISE = cool blue/silver, GUIDE = the existing warm gold. One component so the
// colours can never drift apart between screens.
export const ACCOUNT_TYPES = {
  ENTREPRISE: {
    fr: 'Entreprise', zh: '公司', en: 'Company', es: 'Empresa',
    fg: '#8fbaff', bg: 'rgba(96,149,255,0.14)', bd: 'rgba(96,149,255,0.55)', icon: '🏢',
  },
  GUIDE: {
    fr: 'Guide', zh: '导游', en: 'Guide', es: 'Guía',
    fg: '#e0b64a', bg: 'rgba(212,163,0,0.16)', bd: 'rgba(212,163,0,0.55)', icon: '🧭',
  },
}
export const typeOf = (a) => (String(a?.account_type || 'GUIDE').toUpperCase() === 'ENTREPRISE' ? 'ENTREPRISE' : 'GUIDE')

export default function AccountTypeBadge({ account, type, lang = 'fr', size = 'md' }) {
  const key = type ? (String(type).toUpperCase() === 'ENTREPRISE' ? 'ENTREPRISE' : 'GUIDE') : typeOf(account)
  const t = ACCOUNT_TYPES[key]
  const sm = size === 'sm'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
      padding: sm ? '2px 8px' : '3px 10px', borderRadius: 999,
      fontSize: sm ? 11 : 11.5, fontWeight: 800, letterSpacing: '0.02em',
      background: t.bg, border: `1px solid ${t.bd}`, color: t.fg,
    }}>
      <span aria-hidden="true">{t.icon}</span>
      {t[lang] || t.fr} · {t.zh}
    </span>
  )
}
