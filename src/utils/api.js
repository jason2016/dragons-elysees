const BASE_URL = `${import.meta.env.VITE_API_BASE}/api/dragons-elysees`
// Owner-admin v2 lives under a DIFFERENT base (login + bookings): /api/dragons
const ADMIN_BASE = `${import.meta.env.VITE_API_BASE}/api/dragons`

// ── Owner-admin token (single-password backend login, valid ~1 year) ──
// Stored under its OWN key, fully separate from the customer OTP token ('de-token').
// Customer / kitchen / delivery requests NEVER read or send this token.
const ADMIN_TOKEN_LS = 'dragons_admin_token'
export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_LS) || ''
export const setAdminToken = (tok) => localStorage.setItem(ADMIN_TOKEN_LS, tok)
export const clearAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_LS)

// Any admin request that comes back 401 → drop the token and notify the app so it
// returns to the admin login screen. (Listeners: AdminPanel.)
function onAdminUnauthorized() {
  clearAdminToken()
  try { window.dispatchEvent(new Event('dragons-admin-unauthorized')) } catch { /* SSR/no-window */ }
}

async function request(path, options = {}) {
  // `admin: true` → use the admin token (not the customer de-token) and treat 401
  // as an admin-session expiry. Default (no flag) is the untouched customer path.
  const { admin, ...init } = options
  const token = admin ? getAdminToken() : localStorage.getItem('de-token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  if (res.status === 401 && admin) { onAdminUnauthorized(); throw new Error('unauthorized') }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Network error' }))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

// Admin fetch for the /api/dragons namespace (bookings v2). Always carries the
// admin Bearer token; 401 → admin logout. Returns the raw Response (callers parse).
async function adminFetch(path, options = {}) {
  const token = getAdminToken()
  const res = await fetch(`${ADMIN_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 401) { onAdminUnauthorized(); throw new Error('unauthorized') }
  return res
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
  // RED LINE: createOrder / updateOrderStatus / getOrders-by-customer_id stay token-free
  // (customer + kitchen + delivery flows). Only the admin panel opts in via { admin: true }.
  createOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  getOrders: (params = {}, { admin = false } = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/orders${qs ? `?${qs}` : ''}`, { admin })
  },
  getOrder: (id) => request(`/orders/${id}`),
  updateOrderStatus: (id, status) => request(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  // Table-side settlement of a dine_in (post-pay) order — admin only. payload: { method, balance_amount?, customer_id? }
  settleOrder: (id, payload) => request(`/orders/${id}/settle`, { method: 'POST', admin: true, body: JSON.stringify(payload) }),

  // ── Owner-admin login (single password → 1-year token) ──
  // Password is the backend env value (Dragons2026); NEVER hardcoded here.
  // POST /api/dragons/admin/login { password } → { token, expires_days }.
  adminLogin: async (password) => {
    const res = await fetch(`${ADMIN_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.status === 401) throw new Error('invalid_password')
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    if (data.token) setAdminToken(data.token)
    return data
  },

  // ── Owner-admin reservations (Authorization: Bearer <admin token>) ──
  // Endpoints live at /api/dragons/bookings. Each booking carries confirm_source
  // (auto|manual) + lang + status. 401 anywhere → admin logout (handled in adminFetch).
  listBookings: async (status = '') => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    const res = await adminFetch(`/bookings${qs}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  },
  // Mark an auto-confirmed booking as personally handled (auto → manual). Status
  // unchanged, no email sent. → { ok, confirm_source:'manual' }.
  markBookingHandled: async (id) => {
    const res = await adminFetch(`/bookings/${id}/mark-handled`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
  },
  // Cancel a booking → status 'cancelled'; backend emails the guest. 409 if already
  // in a terminal state. → { ok, status:'cancelled' } | { ok:false, reason:'conflict' }.
  cancelBooking: async (id) => {
    const res = await adminFetch(`/bookings/${id}/cancel`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.status === 409) return { ok: false, reason: 'conflict', status: data.status }
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
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

  // Stats (admin only)
  getStats: (date) => {
    const qs = date ? `?date=${date}` : ''
    return request(`/stats${qs}`, { admin: true })
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
  // RED LINE: receipt stays token-free (plain <a download> link). Invoice = admin only.
  getReceiptUrl: (orderId) => `${BASE_URL}/orders/${orderId}/receipt`,
  getInvoiceUrl: (orderId) => `${BASE_URL}/orders/${orderId}/invoice`,
  createInvoice: async (orderId, data) => {
    const token = getAdminToken()
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    const res = await fetch(`${BASE_URL}/orders/${orderId}/invoice`, { method: 'POST', headers, body: JSON.stringify(data) })
    if (res.status === 401) { onAdminUnauthorized(); throw new Error('unauthorized') }
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
