import { useState, useEffect, createContext, useContext } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('de-cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('de-cart', JSON.stringify(items))
  }, [items])

  const addItem = (item) => {
    // Flatten name:{zh,fr} → name_zh/name_fr so order/kitchen/delivery panels stay unchanged
    const flat = { ...item }
    if (flat.name && typeof flat.name === 'object') {
      flat.name_zh = flat.name.zh || ''
      flat.name_fr = flat.name.fr || ''
      delete flat.name
    }
    if (flat.note && typeof flat.note === 'object') {
      flat.note_zh = flat.note.zh || ''
      flat.note_fr = flat.note.fr || ''
      delete flat.note
    }
    setItems(prev => {
      const existing = prev.find(i => i.id === flat.id)
      if (existing) {
        return prev.map(i => i.id === flat.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...flat, qty: 1 }]
    })
  }

  const removeItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      removeItem(id)
      return
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const clearCart = () => setItems([])

  const [cartOpen, setCartOpen] = useState(false)
  const openCart = () => setCartOpen(true)
  const closeCart = () => setCartOpen(false)

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count, cartOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
