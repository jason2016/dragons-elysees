const BASE_URL = 'https://mcp.clawshow.ai/api/dragons-elysees'

async function request(path, options = {}) {
  const token = localStorage.getItem('de-token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Network error' }))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Auth
  sendOtp: (email) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (email, code) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, code }) }),
  getMe: () => request('/auth/me'),

  // Orders
  createOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/orders${qs ? `?${qs}` : ''}`)
  },
  getOrder: (id) => request(`/orders/${id}`),
  updateOrderStatus: (id, status) => request(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Balance
  getBalance: () => request('/balance'),
  getTransactions: () => request('/balance/transactions'),

  // Payment
  createPayment: (data) => request('/payment/create', { method: 'POST', body: JSON.stringify(data) }),
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function generateOrderNumber() {
  const n = Math.floor(Math.random() * 900) + 100
  return `DRG-${String(n).padStart(3, '0')}`
}
