import { createContext, useContext, useState, useCallback } from 'react'
import i18n from '../i18n'

const LangContext = createContext(null)

// Maps keys that take positional args to their i18next param names (in order)
const INTERPOLATION_PARAMS = {
  cashbackEarn:           ['amount'],
  balanceAvailable:       ['amount'],
  balanceDeducted:        ['amount'],
  loginForCashback:       ['amount'],
  cashbackOnOrder:        ['amount'],
  pay:                    ['amount'],
  cashbackEarned:         ['amount'],
  cashbackCredited:       ['balance'],
  loginForCashbackSuccess:['amount'],
  loginSubOtp:            ['email'],
  resendIn:               ['s'],
  registerPromptTitle:    ['amount'],
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'fr')

  const toggle = useCallback(() => {
    const next = lang === 'fr' ? 'zh' : 'fr'
    i18n.changeLanguage(next)
    setLang(next)
  }, [lang])

  // Bridge: positional args → named i18next interpolation params
  const t = useCallback((key, ...args) => {
    if (args.length > 0) {
      const params = INTERPOLATION_PARAMS[key]
      if (params) {
        const opts = {}
        params.forEach((name, i) => { opts[name] = args[i] })
        return i18n.t(key, opts)
      }
    }
    return i18n.t(key)
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  // Primary name in current lang; secondary = the other lang
  // Supports both new format name:{zh,fr} and legacy name_zh/name_fr
  const name = (item) => {
    if (!item) return ''
    if (item.name && typeof item.name === 'object') return item.name[lang] || item.name.fr || ''
    return item[`name_${lang}`] || item?.name_fr || ''
  }
  const altName = (item) => {
    if (!item) return ''
    const other = lang === 'fr' ? 'zh' : 'fr'
    if (item.name && typeof item.name === 'object') return item.name[other] || ''
    return item[`name_${other}`] || ''
  }

  return (
    <LangContext.Provider value={{ lang, toggle, t, name, altName }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
