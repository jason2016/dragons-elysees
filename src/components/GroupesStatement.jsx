import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import AccountTypeBadge from './AccountTypeBadge'

// P4 — "Mon compte · 我的账单": what a company (李总) or a guide sees after signing in.
// P6 reuses StatementView (below) to show the SAME ledger inside the personal account page
// when a member also owns a groupe account. Amounts are shown EXACTLY as invoiced (montant
// encaissé); we never net anything off, so this always reconciles against the real invoice.
const GOLD = '#c9a84c'
const eur = (n) => (n == null ? '—' : `${Number(n).toFixed(2).replace('.', ',')} €`)
const fmtDate = (d) => { try { const [y, m, day] = String(d).slice(0, 10).split('-'); return `${day}/${m}/${y}` } catch { return d || '—' } }

// Body labels — shared by the standalone page (P4) and the account-page block (P6).
export const STMT_T = {
  fr: { entries: 'Visites', guests: 'Convives', amount: 'Total facturé', reward: 'Récompenses cumulées', history: 'Détail des visites', empty: 'Aucune consommation enregistrée pour le moment.', manual: 'Saisie restaurant', discount: 'remise', period: 'Période', noCommission: 'Programme de récompense non actif sur ce compte.' },
  zh: { entries: '消费笔数', guests: '总人数', amount: '消费总额', reward: '累计奖励', history: '消费流水', empty: '暂无消费记录。', manual: '餐厅补录', discount: '折扣', period: '账期', noCommission: '本账户未启用奖励计划。' },
  en: { entries: 'Visits', guests: 'Guests', amount: 'Total invoiced', reward: 'Rewards earned', history: 'Visit history', empty: 'No consumption recorded yet.', manual: 'Added by restaurant', discount: 'discount', period: 'Period', noCommission: 'Reward programme not active on this account.' },
  es: { entries: 'Visitas', guests: 'Comensales', amount: 'Total facturado', reward: 'Recompensas acumuladas', history: 'Historial de visitas', empty: 'Aún no hay consumos registrados.', manual: 'Registrado por el restaurante', discount: 'descuento', period: 'Periodo', noCommission: 'Programa de recompensas no activo en esta cuenta.' },
}
const PAGE_T = {
  fr: { title: 'Mon compte', sub: 'Relevé de consommation', loading: 'Chargement…', err: 'Impossible de charger le relevé. Réessayez.', retry: 'Réessayer' },
  zh: { title: '我的账单', sub: '消费明细', loading: '加载中…', err: '账单加载失败,请重试。', retry: '重试' },
  en: { title: 'My account', sub: 'Statement', loading: 'Loading…', err: 'Could not load the statement. Please retry.', retry: 'Retry' },
  es: { title: 'Mi cuenta', sub: 'Estado de consumo', loading: 'Cargando…', err: 'No se pudo cargar el estado. Reinténtelo.', retry: 'Reintentar' },
}

function Tile({ value, label, accent }) {
  return (
    <div style={{ flex: '1 1 130px', minWidth: 120, borderRadius: 12, padding: '12px 14px',
      background: accent ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${accent ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.18)'}` }}>
      <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15, color: GOLD, overflowWrap: 'anywhere' }}>{value}</div>
      <div style={{ marginTop: 5, fontSize: 12, color: '#a99f88' }}>{label}</div>
    </div>
  )
}

// Presentational statement body — takes already-loaded data. Reused by P4 page + P6 block.
export function StatementView({ account, summary, entries, lang = 'fr' }) {
  const t = STMT_T[lang] || STMT_T.fr
  const acc = account || {}
  const s = summary || {}
  const list = entries || []
  const rewardOff = String(acc.commission_mode || '').toUpperCase() === 'OFF'
  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <AccountTypeBadge account={acc} lang={lang} />
        {acc.discount_pct != null && (
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#c9bfa6' }}>−{acc.discount_pct}%</span>
        )}
        {(acc.company || acc.name) && <span style={{ fontSize: 12.5, color: '#a99f88', overflowWrap: 'anywhere' }}>{acc.company ? `${acc.company}${acc.name ? ' · ' + acc.name : ''}` : acc.name}</span>}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        <Tile value={s.entries_count ?? 0} label={t.entries} />
        <Tile value={s.total_guests ?? 0} label={t.guests} />
        <Tile value={eur(s.total_amount_eur)} label={t.amount} accent />
        {!rewardOff && <Tile value={eur(s.total_reward_eur)} label={t.reward} />}
      </div>
      {rewardOff && <p style={{ fontSize: 11.5, color: '#8f866f', margin: '0 0 12px' }}>{t.noCommission}</p>}
      {(s.first_date || s.last_date) && (
        <p style={{ fontSize: 12, color: '#8f866f', margin: '4px 0 12px' }}>{t.period} : {fmtDate(s.first_date)} → {fmtDate(s.last_date)}</p>
      )}

      <div style={{ fontSize: 14, fontWeight: 700, margin: '4px 0 8px' }}>{t.history}</div>
      {list.length === 0 ? (
        <p style={{ color: '#8f866f', fontSize: 13.5, textAlign: 'center', padding: 16 }}>{t.empty}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map(e => (
            <div key={`${e.source}-${e.id}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.16)', borderRadius: 12, padding: '11px 13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14 }}>{fmtDate(e.date)}</strong>
                {e.source === 'MANUAL' && <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: '#a99f88' }}>{t.manual}</span>}
                <strong style={{ marginLeft: 'auto', fontSize: 15, color: GOLD }}>{eur(e.amount_eur)}</strong>
              </div>
              <div style={{ marginTop: 4, fontSize: 12.5, color: '#a99f88', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>👥 {e.party_size}</span>
                {e.discount_applied_pct > 0 && <span>−{e.discount_applied_pct}% {t.discount}</span>}
                {!rewardOff && e.reward_eur > 0 && <span>🎁 +{eur(e.reward_eur)}</span>}
              </div>
              {e.note && <div style={{ marginTop: 6, fontSize: 12.5, color: '#c9bfa6', overflowWrap: 'anywhere' }}>💬 {e.note}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// Standalone page (P4) — Groupes login → "Mon compte" tab. Fetches its own data.
export default function GroupesStatement({ lang = 'fr', onUnauthorized }) {
  const p = PAGE_T[lang] || PAGE_T.fr
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = () => {
    setLoading(true); setErr('')
    api.groupesMyStatement()
      .then(d => setData(d))
      .catch(e => { if (e?.message === 'unauthorized') onUnauthorized?.(); else setErr(p.err) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  if (loading) return <div style={{ textAlign: 'center', color: '#a99f88', padding: 26 }}>{p.loading}</div>
  if (err) return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <p style={{ color: '#f2a5a5', fontSize: 14 }}>{err}</p>
      <button onClick={load} style={{ padding: '9px 20px', borderRadius: 10, border: `1px solid ${GOLD}66`, background: 'transparent', color: GOLD, fontWeight: 700, cursor: 'pointer' }}>{p.retry}</button>
    </div>
  )

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 21, fontWeight: 700, margin: '0 0 4px' }}>{p.title}</h1>
        <p style={{ color: '#8f866f', fontSize: 12, margin: 0 }}>{p.sub}</p>
      </div>
      <StatementView account={data?.account || data?.profile} summary={data?.summary} entries={data?.entries} lang={lang} />
    </>
  )
}
