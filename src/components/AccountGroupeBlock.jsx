import { useState, useEffect } from 'react'
import { useLang } from '../hooks/useLang'
import { api } from '../utils/api'
import { StatementView } from './GroupesStatement'
import styles from './AccountDashboard.module.css'

// P6 — unified login. A member who also owns a groupe account (李总 = personal
// lijilei@czd.com.cn + groupe #9) sees their professional statement right here, under the
// wallet, instead of a second login. GET /me/statement returns account:null for the vast
// majority of members — in that case this renders NOTHING, so their page is byte-for-byte
// unchanged. A statement failure is self-contained (its own error + retry) and never
// affects the wallet above it.
const T = {
  fr: { title: 'Compte groupe', errNet: 'Réseau inaccessible — réessayez.', errHttp: 'Erreur serveur — HTTP {s}', errAny: 'Impossible de charger le relevé groupe.', retry: 'Réessayer' },
  zh: { title: '团体账单', errNet: '网络不可达 · 请重试', errHttp: '服务器返回错误 HTTP {s}', errAny: '团体账单加载失败', retry: '重试' },
  en: { title: 'Group account', errNet: 'Network unreachable — retry.', errHttp: 'Server error — HTTP {s}', errAny: 'Could not load the group statement.', retry: 'Retry' },
  es: { title: 'Cuenta de grupo', errNet: 'Red inaccesible — reinténtelo.', errHttp: 'Error del servidor — HTTP {s}', errAny: 'No se pudo cargar el estado de grupo.', retry: 'Reintentar' },
}
const fill = (s, o) => Object.entries(o).reduce((a, [k, v]) => a.replaceAll(`{${k}}`, v), s)

export default function AccountGroupeBlock() {
  const { lang } = useLang()
  const t = T[lang] || T.fr
  const [state, setState] = useState('loading')   // loading | none | ready | error
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  const load = () => {
    setState('loading'); setErr('')
    api.meStatement()
      .then(d => {
        if (!d || d.account == null) { setState('none'); return }   // plain member → nothing to show
        setData(d); setState('ready')
      })
      .catch(e => {
        if (e?.kind === 'auth') { setState('none'); return }        // not authed → just hide, wallet handles auth
        setErr(e?.kind === 'network' ? t.errNet : e?.kind === 'http' ? fill(t.errHttp, { s: e.status }) : t.errAny)
        setState('error')
      })
  }
  useEffect(() => { load() }, [])

  // Loading and the account:null case both render nothing — no flicker, no new element for
  // the ordinary member. The block only ever appears for an owner of a groupe account.
  if (state === 'loading' || state === 'none') return null

  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>🏢 {t.title}</h2>
      {state === 'error' ? (
        <div style={{ textAlign: 'center', padding: 14 }}>
          <p style={{ color: '#e08a8a', fontSize: 13.5 }}>{err}</p>
          <button className={styles.historyLink} onClick={load}>↻ {t.retry}</button>
        </div>
      ) : (
        <StatementView account={data.account} summary={data.summary} entries={data.entries} lang={lang} />
      )}
    </div>
  )
}
