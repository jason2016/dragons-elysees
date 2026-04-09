import { useState, useEffect, createContext, useContext } from 'react'

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
