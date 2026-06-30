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
  // Table-side settlement of a dine_in (post-pay) order. payload: { method, balance_amount?, customer_id? }
  settleOrder: (id, payload) => request(`/orders/${id}/settle`, { method: 'POST', body: JSON.stringify(payload) }),

  // ── Owner admin reservations (X-Admin-Key, stored in localStorage, NOT in the bundle) ──
  // Endpoints live at /api/dragons/bookings (not the /api/dragons-elysees namespace base).
  listBookings: async (status = '') => {
    const key = localStorage.getItem('dragons_admin_key') || ''
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/dragons/bookings${qs}`, {
      headers: { 'X-Admin-Key': key },
    })
    if (res.status === 401) throw new Error('unauthorized')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  },
  // decision: 'confirm' | 'decline'. Returns { ok, status } or { ok:false, reason:'already_processed' }.
  bookingDecision: async (id, decision) => {
    const key = localStorage.getItem('dragons_admin_key') || ''
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/dragons/bookings/${id}/${decision}`, {
      method: 'POST', headers: { 'X-Admin-Key': key },
    })
    if (res.status === 401) throw new Error('unauthorized')
    const data = await res.json().catch(() => ({}))
    if (res.status === 409) return { ok: false, reason: 'already_processed', status: data.status }
    if (!res.ok) throw new Error(data.reason || `HTTP ${res.status}`)
    return data
  },

  // Balance (dual-ledger: paid_balance + bonus_balance + total_balance)
  getBalance: () => request('/balance'),
  getTransactions: () => request('/balance/transactions'),
  // Top up the PAID balance via Stancer. Returns { payment_url, payment_id, amount }.
  recharge: (amount, payment_method = 'stancer', return_url) =>
    request('/balance/recharge', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method, ...(return_url ? { return_url } : {}) }),
    }),
  // Verify a recharge after returning from Stancer (webhook fallback). Credits paid if paid.
  rechargeVerify: (payment_id) =>
    request('/balance/recharge/verify', { method: 'POST', body: JSON.stringify({ payment_id }) }),

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

  // Reservations (Stage 1). NOTE: this endpoint lives at /api/dragons/booking —
  // a DIFFERENT base from the rest of the app (/api/dragons-elysees), so it does
  // not use the request() helper. On 201 returns { success, booking_id, booking_code, status, message }.
  createBooking: async (data) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/dragons/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace: 'dragons-elysees', ...data }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
    return body
  },
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function generateOrderNumber() {
  const n = Math.floor(Math.random() * 900) + 100
  return `DRG-${String(n).padStart(3, '0')}`
}
