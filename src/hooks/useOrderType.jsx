import { createContext, useContext, useState } from 'react'

const OrderTypeContext = createContext(null)

export function OrderTypeProvider({ children }) {
  const [orderType, setOrderType] = useState('dine_in') // 'dine_in' | 'delivery'
  return (
    <OrderTypeContext.Provider value={{ orderType, setOrderType }}>
      {children}
    </OrderTypeContext.Provider>
  )
}

export function useOrderType() {
  const ctx = useContext(OrderTypeContext)
  if (!ctx) throw new Error('useOrderType must be used within OrderTypeProvider')
  return ctx
}
