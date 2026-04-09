import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLang } from '../hooks/useLang'
import { formatPrice } from '../utils/api'
import styles from './Cart.module.css'

export default function Cart() {
  const { items, updateQty, clearCart, total, count, cartOpen, closeCart } = useCart()
  const { t, name } = useLang()
  const navigate = useNavigate()

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
              <div className={styles.cashbackHint}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {t('cashbackEarn', formatPrice(total * 0.10))}
              </div>
              <button className="btn-gold" style={{ width: '100%' }} onClick={handleCheckout}>
                {t('order')} · {formatPrice(total)}
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
