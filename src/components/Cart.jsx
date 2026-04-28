import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { useOrderType } from '../hooks/useOrderType'
import { formatPrice } from '../utils/api'
import styles from './Cart.module.css'

const DELIVERY_CONFIG = { base_fee: 5.00, free_threshold: 50.00 }

export default function Cart() {
  const { items, updateQty, clearCart, total, count, cartOpen, closeCart } = useCart()
  const { isLoggedIn } = useAuth()
  const { t, name } = useLang()
  const { orderType } = useOrderType()
  const navigate = useNavigate()
  const isDelivery = orderType === 'delivery'
  const deliveryFee = isDelivery ? (total >= DELIVERY_CONFIG.free_threshold ? 0 : DELIVERY_CONFIG.base_fee) : 0
  const grandTotal = total + deliveryFee

  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [cartOpen])

  const handleCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  if (!cartOpen) return null

  return (
    <>
      <div className={styles.backdrop} onClick={closeCart} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {t('cartTitle')}
            {count > 0 && <span className={styles.badge}>{count}</span>}
          </h2>
          <button className={styles.closeBtn} onClick={closeCart} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🛒</div>
            <p>{t('cartEmpty')}</p>
            <button className={styles.continueShopping} onClick={closeCart}>
              {t('browseMenu')}
            </button>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {items.map(item => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{name(item)}</span>
                    <span className={styles.itemUnit}>{formatPrice(item.price)}</span>
                  </div>
                  <div className={styles.itemControls}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      aria-label="−"
                    >−</button>
                    <span className={styles.qty}>{item.qty}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      aria-label="+"
                    >+</button>
                    <span className={styles.itemTotal}>{formatPrice(item.price * item.qty)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <div className={styles.summary}>
                <span className={styles.summaryLabel}>{t('subtotal')}</span>
                <span className={styles.summaryValue}>{formatPrice(total)}</span>
              </div>
              {isDelivery && (
                <div className={styles.summary}>
                  <span className={styles.summaryLabel}>🚗 {t('deliveryFee')}</span>
                  <span className={styles.summaryValue}>
                    {deliveryFee === 0
                      ? <span className={styles.freeDelivery}>{t('cart.freeDelivery')}</span>
                      : formatPrice(deliveryFee)
                    }
                  </span>
                </div>
              )}
              {isDelivery && deliveryFee > 0 && (
                <div className={styles.freeHint}>
                  💡 {t('cart.freeDeliveryHint', { amount: formatPrice(DELIVERY_CONFIG.free_threshold - total) })}
                </div>
              )}
              {!isLoggedIn && (
                <div className={styles.loginPrompt}>
                  <div className={styles.loginPromptText}>
                    ⭐ {t('cart.loginPrompt', { amount: formatPrice(grandTotal * 0.10) })}
                  </div>
                  <button
                    className={styles.loginPromptBtn}
                    onClick={() => { closeCart(); navigate('/account/login') }}
                  >
                    {t('cart.loginBtn')}
                  </button>
                </div>
              )}
              {isLoggedIn && (
                <div className={styles.cashbackHint}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {t('cashbackEarn', formatPrice(grandTotal * 0.10))}
                </div>
              )}
              <button className="btn-gold" style={{ width: '100%' }} onClick={handleCheckout}>
                {t('order')} · {formatPrice(grandTotal)}
              </button>
              <button className={styles.clearBtn} onClick={clearCart}>
                {t('clearCart')}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
