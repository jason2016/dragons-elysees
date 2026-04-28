import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { useOrderType } from '../hooks/useOrderType'
import { api, formatPrice } from '../utils/api'
import AddressAutocomplete from './AddressAutocomplete'
import { FEATURES } from '../config'
import styles from './Checkout.module.css'

const DELIVERY_CONFIG = { base_fee: 5.00, free_threshold: 50.00 }

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const { isLoggedIn, customer, updateBalance } = useAuth()
  const { t, name } = useLang()
  const { orderType, setOrderType } = useOrderType()
  const navigate = useNavigate()

  const isDelivery = FEATURES.delivery && orderType === 'delivery'

  // Guest info (pre-fill from account if logged in)
  const [guestName, setGuestName] = useState(customer?.name || '')
  const [guestPhone, setGuestPhone] = useState(customer?.phone || '')
  const [guestEmail, setGuestEmail] = useState(customer?.email || '')

  // Order info
  const [tableNumber, setTableNumber] = useState('')
  const [note, setNote] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryPhone, setDeliveryPhone] = useState(customer?.phone || '')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')

  const [useBalance, setUseBalance] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showLoginBanner, setShowLoginBanner] = useState(!isLoggedIn)

  const deliveryFee = isDelivery
    ? (total >= DELIVERY_CONFIG.free_threshold ? 0 : DELIVERY_CONFIG.base_fee)
    : 0
  const balance = customer?.balance || 0
  const balanceApplied = useBalance && isLoggedIn ? Math.min(balance, total + deliveryFee) : 0
  const amountToPay = Math.round((total + deliveryFee - balanceApplied) * 100) / 100
  const isFullBalancePayment = amountToPay === 0
  const cashbackEarned = amountToPay >= 15 ? Math.round(amountToPay * 0.10 * 100) / 100 : 0

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{t('emptyCart')}</p>
        <button className="btn-gold" onClick={() => navigate('/menu')}>{t('backToMenu')}</button>
      </div>
    )
  }

  const validate = () => {
    const errs = {}
    // Delivery: name + phone + address required
    if (isDelivery) {
      if (!guestName.trim() || guestName.trim().length < 2) errs.name = t('nameRequired')
      if (!guestPhone.trim()) errs.phone = t('phoneRequired')
      if (!deliveryAddress.trim()) errs.address = t('checkout.addressRequired')
    }
    // Dine-in: only table required
    if (!isDelivery && !tableNumber.trim()) errs.table = t('tableRequiredMsg')
    return errs
  }

  const handlePay = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const order = await api.createOrder({
        items,
        customer_id: customer?.id || null,
        cashback_use: balanceApplied,
        payment_method: isFullBalancePayment ? 'balance' : balanceApplied > 0 ? 'mixed' : 'stancer',
        table_number: tableNumber,
        note,
        order_type: orderType,
        delivery_address: deliveryAddress,
        delivery_phone: isDelivery ? deliveryPhone : guestPhone,
        delivery_instructions: deliveryInstructions,
        delivery_fee: deliveryFee,
        guest_name: isLoggedIn ? (customer?.name || guestName) : guestName,
        guest_phone: isLoggedIn ? (customer?.phone || guestPhone) : guestPhone,
      })

      if (order.total_paid === 0) {
        const paidOrder = await api.updateOrderStatus(order.id, 'paid')
        if (isLoggedIn) {
          try { const me = await api.getMe(); updateBalance(me.balance) } catch (_) {}
        }
        sessionStorage.setItem('de-last-order', JSON.stringify(toCache(paidOrder)))
        // Pass guest email for potential registration
        if (!isLoggedIn && guestEmail) sessionStorage.setItem('de-guest-email', guestEmail)
        clearCart()
        navigate(`/payment-success?order=${paidOrder.order_number}`)
        return
      }

      try {
        const returnUrl = `${window.location.origin}${import.meta.env.BASE_URL}#/payment-success?order=${order.order_number}`
        const pay = await api.createPayment({ order_id: order.id, amount: order.total_paid, return_url: returnUrl })
        if (pay.payment_url) {
          sessionStorage.setItem('de-last-order', JSON.stringify(toCache(order)))
          if (!isLoggedIn && guestEmail) sessionStorage.setItem('de-guest-email', guestEmail)
          clearCart()
          window.location.href = pay.payment_url
          return
        }
      } catch (_) {}

      const paidOrder = await api.updateOrderStatus(order.id, 'paid')
      if (isLoggedIn) {
        try { const me = await api.getMe(); updateBalance(me.balance) } catch (_) {}
      }
      sessionStorage.setItem('de-last-order', JSON.stringify(toCache(paidOrder)))
      if (!isLoggedIn && guestEmail) sessionStorage.setItem('de-guest-email', guestEmail)
      clearCart()
      navigate(`/payment-success?order=${paidOrder.order_number}`)
    } catch (err) {
      setErrors({ submit: t('checkout.payError') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('checkoutTitle')}</h1>

        {/* Login banner for non-logged-in users */}
        {showLoginBanner && (
          <div className={styles.loginBanner}>
            <span className={styles.loginBannerText}>
              ⭐ {t('checkout.loginBannerText')}
            </span>
            <div className={styles.loginBannerActions}>
              <button
                className={styles.loginBannerBtn}
                onClick={() => {
                  sessionStorage.setItem('de-checkout-return', '1')
                  navigate('/account/login')
                }}
              >
                {t('common.connectBtn')}
              </button>
              <button
                className={styles.loginBannerDismiss}
                onClick={() => setShowLoginBanner(false)}
              >
                {t('checkout.continueGuest')}
              </button>
            </div>
          </div>
        )}

        {/* Order type toggle — delivery feature only */}
        {FEATURES.delivery && (
          <div className={styles.typeToggle}>
            <button
              className={`${styles.typeBtn} ${!isDelivery ? styles.typeBtnActive : ''}`}
              onClick={() => setOrderType('dine_in')}
            >
              🍽️ {t('orderTypeDineIn')}
            </button>
            <button
              className={`${styles.typeBtn} ${isDelivery ? styles.typeBtnActive : ''}`}
              onClick={() => setOrderType('delivery')}
            >
              🚗 {t('orderTypeDelivery')}
            </button>
          </div>
        )}

        {/* Order items */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>{t('yourDishes')}</h2>
          <div className={styles.itemsList}>
            {items.map(item => (
              <div key={item.id} className={styles.lineItem}>
                <span className={styles.lineQty}>{item.qty}×</span>
                <span className={styles.lineName}>
                  <span>{name(item)}</span>
                  <span className={styles.lineNameSub}>{item.name?.zh || item.name_zh}</span>
                </span>
                <span className={styles.linePrice}>{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>{t('yourInfo')}</h2>

          {/* Name */}
          <div className={styles.formRow}>
            <label className={styles.label}>
              {isDelivery ? t('guestName') : t('checkout.nameOptional')}
            </label>
            <input
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder={t('guestNamePlaceholder')}
              value={guestName}
              onChange={e => { setGuestName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
            />
            {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
          </div>

          {/* Phone */}
          <div className={styles.formRow}>
            <label className={styles.label}>
              {isDelivery ? t('guestPhone') : t('checkout.phoneOptional')}
            </label>
            <input
              type="tel"
              className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
              placeholder={t('guestPhonePlaceholder')}
              value={guestPhone}
              onChange={e => { setGuestPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
            />
            {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
          </div>

          {/* Email — delivery only, non-logged-in */}
          {isDelivery && !isLoggedIn && (
            <>
              <div className={styles.formRow}>
                <label className={styles.label}>{t('guestEmail')}</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder={t('guestEmailPlaceholder')}
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                />
              </div>
              <div className={styles.emailHint}>{t('guestEmailHint')}</div>
            </>
          )}

          {/* Dine-in cashback hint (no email field) */}
          {!isDelivery && !isLoggedIn && (
            <div className={styles.emailHint}>
              💡 {t('checkout.registerHint')}
            </div>
          )}
        </div>

        {/* Dine-in: table & note */}
        {!isDelivery && (
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>{t('info')}</h2>
            <div className={styles.formRow}>
              <label className={styles.label}>{t('tableNumberRequired')}</label>
              <input
                type="text"
                className={`${styles.input} ${errors.table ? styles.inputError : ''}`}
                placeholder={t('tablePlaceholder')}
                value={tableNumber}
                onChange={e => { setTableNumber(e.target.value); setErrors(p => ({ ...p, table: '' })) }}
              />
              {errors.table && <span className={styles.fieldError}>{errors.table}</span>}
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>{t('notes')}</label>
              <textarea
                className={styles.textarea}
                placeholder={t('notesPlaceholder')}
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Delivery fields */}
        {isDelivery && (
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>{t('deliverySection')}</h2>
            <div className={styles.formRow}>
              <label className={styles.label}>{t('deliveryAddress')}</label>
              <AddressAutocomplete
                value={deliveryAddress}
                onChange={v => { setDeliveryAddress(v); setErrors(p => ({ ...p, address: '' })) }}
                onDistanceError={msg => setErrors(p => ({ ...p, distance: msg }))}
                placeholder={t('deliveryAddressPlaceholder')}
                hasError={!!errors.address}
              />
              {errors.address && <span className={styles.fieldError}>{errors.address}</span>}
              {errors.distance && <span className={styles.fieldError}>{errors.distance}</span>}
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>{t('deliveryInstructions')}</label>
              <textarea
                className={styles.textarea}
                placeholder={t('deliveryInstructionsPlaceholder')}
                value={deliveryInstructions}
                onChange={e => setDeliveryInstructions(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Balance toggle */}
        {isLoggedIn && balance > 0 && (
          <div className={styles.card}>
            <div className={styles.balanceHeader}>
              <span className={styles.balanceHeaderIcon}>🎁</span>
              <span className={styles.balanceHeaderText}>
                {t('checkout.yourBalance')} : {formatPrice(balance)}
              </span>
            </div>
            <div className={styles.balanceToggle}>
              <div className={styles.balanceLabel}>{t('useBalance')}</div>
              <label className={styles.toggle}>
                <input type="checkbox" checked={useBalance} onChange={e => setUseBalance(e.target.checked)} />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            {useBalance && (
              <div className={styles.balanceDeduct}>{t('balanceDeducted', formatPrice(balanceApplied))}</div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className={styles.card}>
          <div className={styles.summaryRow}>
            <span>{t('subtotal')}</span>
            <span>{formatPrice(total)}</span>
          </div>
          {isDelivery && (
            <div className={styles.summaryRow}>
              <span>{t('deliveryFee')}</span>
              <span>
                {deliveryFee === 0
                  ? <span className={styles.freeDelivery}>{formatPrice(0)} ✅ {t('checkout.freeDelivery')}</span>
                  : formatPrice(deliveryFee)
                }
              </span>
            </div>
          )}
          {isDelivery && deliveryFee > 0 && (
            <div className={styles.deliveryHint}>
              💡 {t('common.freeDeliveryHint', { amount: formatPrice(DELIVERY_CONFIG.free_threshold - total) })}
            </div>
          )}
          {balanceApplied > 0 && (
            <div className={`${styles.summaryRow} ${styles.summaryGreen}`}>
              <span>{t('balanceApplied')}</span>
              <span>− {formatPrice(balanceApplied)}</span>
            </div>
          )}
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span>{t('totalToPay')}</span>
            <span>{formatPrice(amountToPay)}</span>
          </div>
          {cashbackEarned > 0 && (
            <div className={styles.cashbackHint}>{t('cashbackOnOrder', formatPrice(cashbackEarned))}</div>
          )}
        </div>

        {errors.submit && <div className={styles.errorMsg}>{errors.submit}</div>}

        <button
          className="btn-gold"
          style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
          onClick={handlePay}
          disabled={loading}
        >
          {loading
            ? t('processing')
            : isFullBalancePayment
              ? t('payBalance')
              : t('pay', formatPrice(amountToPay))}
        </button>

        <button className={styles.backBtn} onClick={() => navigate('/menu')}>
          {t('editOrder')}
        </button>
      </div>
    </div>
  )
}

function toCache(order) {
  return {
    id: order.id,
    order_number: order.order_number,
    order_type: order.order_type,
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee ?? 0,
    delivery_address: order.delivery_address ?? '',
    balance_used: order.cashback_used ?? 0,
    total_paid: order.total_paid,
    cashback_earned: order.cashback_earned ?? 0,
    status: order.status,
    table_number: order.table_number ?? '',
    items: order.items ?? [],
  }
}
