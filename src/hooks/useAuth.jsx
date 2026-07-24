import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('de-customer')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('de-token') || null)

  useEffect(() => {
    if (customer) {
      localStorage.setItem('de-customer', JSON.stringify(customer))
    } else {
      localStorage.removeItem('de-customer')
    }
  }, [customer])

  useEffect(() => {
    if (token) {
      localStorage.setItem('de-token', token)
    } else {
      localStorage.removeItem('de-token')
    }
  }, [token])

  // P6 — silently refresh the session once per app start while logged in. The backend TTL is
  // 365 days, so a single quiet refresh keeps a returning customer's token fresh without any
  // UX. Failure is ignored: the existing token stays valid and any real 401 is handled per-call.
  const refreshedRef = useRef(false)
  useEffect(() => {
    if (!customer || refreshedRef.current) return
    refreshedRef.current = true
    api.authRefresh()
      .then(data => { if (data?.token) setToken(data.token) })
      .catch(() => {})
  }, [customer])

  const login = (customerData, sessionToken) => {
    setCustomer(customerData)
    setToken(sessionToken)
  }

  const logout = () => {
    setCustomer(null)
    setToken(null)
  }

  const updateBalance = (newBalance) => {
    setCustomer(prev => prev ? { ...prev, balance: newBalance } : prev)
  }

  return (
    <AuthContext.Provider value={{ customer, token, login, logout, updateBalance, isLoggedIn: !!customer }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
