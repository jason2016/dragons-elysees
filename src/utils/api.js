const BASE_URL = `${import.meta.env.VITE_API_BASE}/api/dragons-elysees`

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
  verifyOtp: (email, code, referralCode = null) => request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code, ...(referralCode ? { referral_code: referralCode } : {}) }),
  }),
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

  // Stats
  getStats: (date) => {
    const qs = date ? `?date=${date}` : ''
    return request(`/stats${qs}`)
  },

  // Tracking (public, no auth)
  trackOrder: (orderNumber) => request(`/orders/track/${encodeURIComponent(orderNumber)}`),
  getDeliveryConfig: () => request('/delivery-config'),

  // Referral & balance history
  getReferral: (customerId) => request(`/customer/${customerId}/referral`),
  getBalanceHistory: (customerId) => request(`/customer/${customerId}/balance/history?limit=50`),
  completeOrder: (data) => request('/order/complete', { method: 'POST', body: JSON.stringify(data) }),

  // Admin demo (remove after 5/19)
  getAdminCustomers: () => request('/admin/customers-with-orders'),
  simulateGoogleReview: (data) => request('/admin/simulate-google-review', { method: 'POST', body: JSON.stringify(data) }),

  // Receipt & Invoice (return PDF blob)
  getReceiptUrl: (orderId) => `${BASE_URL}/orders/${orderId}/receipt`,
  getInvoiceUrl: (orderId) => `${BASE_URL}/orders/${orderId}/invoice`,
  createInvoice: async (orderId, data) => {
    const token = localStorage.getItem('de-token')
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    const res = await fetch(`${BASE_URL}/orders/${orderId}/invoice`, { method: 'POST', headers, body: JSON.stringify(data) })
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`) }
    return res.blob()
  },
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function generateOrderNumber() {
  const n = Math.floor(Math.random() * 900) + 100
  return `DRG-${String(n).padStart(3, '0')}`
}
