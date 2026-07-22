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

// ── Groupes (团体 / tour-guide) token — SESSION-level (sessionStorage), so it clears when
// the guide closes the tab. Fully separate from the admin token and the customer 'de-token'.
const GROUPES_TOKEN_SS = 'dragons_groupes_token'
export const getGroupesToken = () => sessionStorage.getItem(GROUPES_TOKEN_SS) || ''
export const setGroupesToken = (tok) => sessionStorage.setItem(GROUPES_TOKEN_SS, tok)
export const clearGroupesToken = () => sessionStorage.removeItem(GROUPES_TOKEN_SS)

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
// HF3 — typed admin failures. fetch() rejects ONLY on a transport-level problem (offline,
// DNS, TLS, blocked/failed service-worker interception); an HTTP error status still resolves.
// Tagging the two apart lets the UI say "device can't reach the network" vs "server said N",
// so a customer screenshot is already the diagnosis.
export const adminErrKind = (e) => (e && e.kind) || 'unknown'
async function adminFetch(path, options = {}) {
  const token = getAdminToken()
  let res
  try {
    res = await fetch(`${ADMIN_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    const err = new Error('network_unreachable'); err.kind = 'network'; throw err
  }
  if (res.status === 401) { onAdminUnauthorized(); const e = new Error('unauthorized'); e.kind = 'auth'; throw e }
  return res
}
// Raise a typed HTTP failure from a non-OK admin response.
function adminHttpError(res) {
  const e = new Error(`http_${res.status}`); e.kind = 'http'; e.status = res.status; return e
}
// Parse an admin JSON response, carrying the server's own message on failure — the P4
// endpoints return useful French validation text ("montant négatif", "date invalide …").
async function adminJson(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) { const e = adminHttpError(res); e.serverMessage = data.error || data.message || ''; throw e }
  return data
}

// Guide-side fetch for /api/dragons/groupes/* — carries the SESSION groupes token.
// A 401 here does NOT touch the admin session; the /groupes page handles it (back to login).
async function groupesFetch(path, options = {}) {
  const token = getGroupesToken()
  const res = await fetch(`${ADMIN_BASE}/groupes${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
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
  // RED LINE: GET /api/dragons-elysees/orders is the SHARED no-token endpoint
  // (customer by customer_id + kitchen/delivery by status). NEVER attach an admin token here.
  // The admin full-order list is a SEPARATE, semantically-distinct endpoint → adminGetOrders().
  createOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/orders${qs ? `?${qs}` : ''}`)
  },
  // Admin-only full order list — DEDICATED endpoint GET /api/dragons/admin/orders (Bearer),
  // NOT the shared /api/dragons-elysees/orders above. Filters: status/date/order_number/
  // order_type/payment_status (no customer_id). 401 → admin logout (handled in adminFetch).
  adminGetOrders: async (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const res = await adminFetch(`/admin/orders${qs ? `?${qs}` : ''}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  },
  // CRM phase 1 — read-only contact aggregation. GET /api/dragons/admin/contacts (Bearer).
  // params: { search, page, page_size, sort }. Returns { contacts, total, page, page_size }.
  adminGetContacts: async (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const res = await adminFetch(`/admin/contacts${qs ? `?${qs}` : ''}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  },
  // ── Avis (reviews funnel) — live backend, Bearer JWT (same auth as bookings) ──
  // GET /api/dragons/admin/avis?max_rating=3[&unread=1] →
  //   { reviews:[{ id, rating, comment, lang, source, created_at, read,
  //     booking:{ booking_code, customer_name, booking_date } }], total, unread }.
  // Private domain = 1–3★, so we ask the server for max_rating=3 by default.
  adminGetReviews: async (params = { max_rating: 3 }) => {
    const qs = new URLSearchParams(params).toString()
    const res = await adminFetch(`/admin/avis${qs ? `?${qs}` : ''}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  },
  // Mark one avis as read → { ok, read:true }.
  markReviewRead: async (id) => {
    const res = await adminFetch(`/admin/avis/${id}/read`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
  },
  // Note: guest-side submission lives entirely on the backend page (mcp.clawshow.ai/avis);
  // the frontend no longer posts reviews (single source of truth). See ReviewLanding.jsx.

  // ══ Groupes · 团体预定 (tour-guide bookings) ══
  // Guide-side, public (no token):
  //   POST /groupes/apply  { name*, email*, company?, phone? } → { ok, account_id, status, existing }
  //   POST /groupes/login  { email } (send OTP) → { ok, otp_sent, message }
  //   POST /groupes/login  { email, code } (verify) → { ok, token }  (7-day guide JWT)
  groupesApply: async (payload) => {
    const res = await fetch(`${ADMIN_BASE}/groupes/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
  },
  groupesLoginSend: async (email) => {
    const res = await fetch(`${ADMIN_BASE}/groupes/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data   // { ok, otp_sent, message }
  },
  groupesLoginVerify: async (email, code) => {
    const res = await fetch(`${ADMIN_BASE}/groupes/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    if (data.token) setGroupesToken(data.token)
    return data
  },
  // Guide-side, token-gated:
  //   GET  /groupes/menu → { discount_pct, currency, min_party, lead_hours, tiers:[…] }
  //   POST /groupes/book { booking_date*, party_size*, menu_tier*(5|6|7|8|'carte'), special_requests? }
  //        → { ok, id, total_estimate, per_head, reward_amount, period }  (carte → total_estimate:null)
  groupesMenu: async () => {
    const res = await groupesFetch('/menu')
    if (res.status === 401) throw new Error('unauthorized')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  },
  groupesBook: async (payload) => {
    const res = await groupesFetch('/book', { method: 'POST', body: JSON.stringify(payload) })
    const data = await res.json().catch(() => ({}))
    if (res.status === 401) throw new Error('unauthorized')
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
  },
  // Admin-side (Bearer admin JWT — same auth as bookings):
  adminGroupesAccounts: async () => {
    const res = await adminFetch('/admin/groupes/accounts')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()   // { accounts:[{ id, name, company, email, phone, status, discount_pct, created_at, approved_at }] }
  },
  // P3-B — read-only list of EVERY registered member (customers) + guide role.
  // Separate from adminGetContacts (which aggregates bookings): a member who registered
  // but never booked appears only here. params: { search, page, page_size }.
  adminGetMembers: async (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const res = await adminFetch(`/admin/members${qs ? `?${qs}` : ''}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()   // { members:[…], total, page, page_size, stats:{ total_members, total_guides } }
  },
  // P3-C — promote a registered member into an APPROVED guide account (no OTP/approval wait).
  // payload: { user_id*, name*, company?, phone?, discount_pct?, menu_tiers? }
  // 409 = already a guide (idempotency guard). Writes one admin_audit_log row server-side.
  adminPromoteGuide: async (payload) => {
    const res = await adminFetch('/admin/groupes/promote', { method: 'POST', body: JSON.stringify(payload) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`)
    return data
  },
  adminGroupesAccountAction: async (accountId, action) => {   // action: 'approve' | 'reject'
    const res = await adminFetch('/admin/groupes/accounts', { method: 'POST', body: JSON.stringify({ account_id: accountId, action }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
  },
  adminGroupesBookings: async () => {
    const res = await adminFetch('/admin/groupes/bookings')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()   // { bookings:[…], total }
  },
  adminGroupesRewards: async (period) => {   // period: 'YYYY-MM'
    const res = await adminFetch(`/admin/groupes/rewards?period=${encodeURIComponent(period)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()   // { period, by_account:[…], grand_total }
  },
  adminGroupesConfig: async () => {
    const res = await adminFetch('/admin/groupes/config')
    if (!res.ok) throw adminHttpError(res)
    return res.json()   // { ok, config:{…} }
  },
  // ══ P4 · account types (GUIDE / ENTREPRISE), statement, manual entries ══
  // Guide/company self-service statement — same {account, summary, entries} shape the admin
  // detail returns, scoped to the signed-in account by its groupes session token.
  groupesMyStatement: async () => {
    const res = await groupesFetch('/me/statement')
    if (res.status === 401) throw new Error('unauthorized')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  },
  // GET → { ok, account:{…, account_type, commission_mode, commission_value},
  //         summary:{entries_count,total_guests,total_amount_eur,total_reward_eur,first_date,last_date},
  //         entries:[{source,id,date,party_size,amount_eur,discount_applied_pct,reward_eur,note,created_at}] }
  adminGroupesAccountDetail: async (id) => {
    const res = await adminFetch(`/admin/groupes/accounts/${id}`)
    if (!res.ok) throw adminHttpError(res)
    return res.json()
  },
  adminGroupesAccountPatch: async (id, payload) => {
    const res = await adminFetch(`/admin/groupes/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return adminJson(res)
  },
  adminGroupesSendInvite: async (id) => {
    const res = await adminFetch(`/admin/groupes/accounts/${id}/send-invite`, { method: 'POST', body: '{}' })
    return adminJson(res)
  },
  // Manual consumption entry (the owner recording a past service).
  // NB: the REQUEST field is `order_date` — the response calls the same value `date`.
  // payload: { account_id*, order_date* 'YYYY-MM-DD', party_size, amount_eur (>=0), discount_pct?, note? }
  // → { ok, entry:{…}, reward:{ accrued: bool, … } }   accrued=false when commission is OFF.
  adminGroupesManualOrder: async (payload) => {
    const res = await adminFetch('/admin/groupes/manual-orders', { method: 'POST', body: JSON.stringify(payload) })
    return adminJson(res)
  },

  adminGroupesConfigSave: async (config) => {
    const res = await adminFetch('/admin/groupes/config', { method: 'POST', body: JSON.stringify(config) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
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
  // scope: 'upcoming' (today+future, asc) | 'past' (before today, desc) | '' (all). Paris-tz boundary backend-side.
  listBookings: async ({ scope = '', status = '' } = {}) => {
    const p = new URLSearchParams()
    if (scope) p.set('scope', scope)
    if (status) p.set('status', status)
    const qs = p.toString()
    const res = await adminFetch(`/bookings${qs ? `?${qs}` : ''}`)
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
  // Cancel a booking → status 'cancelled'; backend emails the guest (with the reason). 409 if
  // already terminal. → { ok, status:'cancelled' } | { ok:false, reason:'conflict' }.
  cancelBooking: async (id, reason = '') => {
    const res = await adminFetch(`/bookings/${id}/cancel`, {
      method: 'POST', body: JSON.stringify({ reason }),
    })
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
