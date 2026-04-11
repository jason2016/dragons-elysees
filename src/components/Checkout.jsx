import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { api, formatPrice } from '../utils/api'
import styles from './Checkout.module.css'

const DELIVERY_FEE = 5.00

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const { isLoggedIn, customer, updateBalance } = useAuth()
  const { t, name, lang } = useLang()
  const navigate = useNavigate()

  const [orderType, setOrderType] = useState('dine_in')
  const [tableNumber, setTableNumber] = useState('')
  const [note, setNote] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryPhone, setDeliveryPhone] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [useBalance, setUseBalance] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isDelivery = orderType === 'delivery'
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0
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

  const handlePay = async () => {
    if (isDelivery && !deliveryAddress.trim()) {
      setError(lang === 'zh' ? '请填写配送地址' : 'Veuillez entrer une adresse de livraison')
      return
    }
    if (isDelivery && !deliveryPhone.trim()) {
      setError(lang === 'zh' ? '请填写联系电话' : 'Veuillez entrer un numéro de téléphone')
      return
    }
    setLoading(true)
    setError(null)
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
        delivery_phone: deliveryPhone,
        delivery_instructions: deliveryInstructions,
        delivery_fee: deliveryFee,
      })

      if (order.total_paid === 0) {
        const paidOrder = await api.updateOrderStatus(order.id, 'paid')
        if (isLoggedIn) {
          try { const me = await api.getMe(); updateBalance(me.balance) } catch (_) {}
        }
        sessionStorage.setItem('de-last-order', JSON.stringify(toCache(paidOrder)))
        clearCart()
        navigate(`/payment-success?order=${paidOrder.order_number}`)
        return
      }

      try {
        const returnUrl = `${window.location.origin}${import.meta.env.BASE_URL}#/payment-success?order=${order.order_number}`
        const pay = await api.createPayment({ order_id: order.id, amount: order.total_paid, return_url: returnUrl })
        if (pay.payment_url) {
          sessionStorage.setItem('de-last-order', JSON.stringify(toCache(order)))
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
      clearCart()
      navigate(`/payment-success?order=${paidOrder.order_number}`)
    } catch (err) {
      setError(lang === 'zh' ? '支付失败，请重试' : 'Erreur de paiement, veuillez réessayer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('checkoutTitle')}</h1>

        {/* Order type toggle */}
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

        {/* Order items */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>{t('yourDishes')}</h2>
          <div className={styles.itemsList}>
            {items.map(item => (
              <div key={item.id} className={styles.lineItem}>
                <span className={styles.lineQty}>{item.qty}×</span>
                <span className={styles.lineName}>
                  <span>{name(item)}</span>
                  <span className={styles.lineNameSub}>{item.name_zh}</span>
                </span>
                <span className={styles.linePrice}>{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dine-in: table & note */}
        {!isDelivery && (
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>{t('info')}</h2>
            <div className={styles.formRow}>
              <label className={styles.label}>{t('tableNumber')}</label>
              <input
                type="text"
                className={styles.input}
                placeholder={t('tablePlaceholder')}
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>{t('notes')}</label>
              <textarea
                className={styles.textarea}
                placeholder={t('notesPlaceholder')}
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
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
              <input
                type="text"
                className={styles.input}
                placeholder={t('deliveryAddressPlaceholder')}
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>{t('deliveryPhone')}</label>
              <input
                type="tel"
                className={styles.input}
                placeholder={t('deliveryPhonePlaceholder')}
                value={deliveryPhone}
                onChange={e => setDeliveryPhone(e.target.value)}
              />
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
                {lang === 'zh' ? '您的余额' : 'Votre solde'} : {formatPrice(balance)}
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

        {/* Login hint */}
        {!isLoggedIn && (
          <div className={styles.loginHint}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>
              <button className={styles.loginLink} onClick={() => navigate('/account/login')}>{t('connect')}</button>
              {' '}{t('loginForCashback', formatPrice(total * 0.1))}
            </span>
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
              <span>{formatPrice(deliveryFee)}</span>
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

        {error && <div className={styles.errorMsg}>{error}</div>}

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
    subtotal: order.subtotal,
    balance_used: order.cashback_used ?? 0,
    total_paid: order.total_paid,
    cashback_earned: order.cashback_earned ?? 0,
  }
}
