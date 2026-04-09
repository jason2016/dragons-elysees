import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../utils/api'
import styles from './Cart.module.css'

export default function Cart({ open, onClose }) {
  const { items, updateQty, removeItem, clearCart, total, count } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleCheckout = () => {
    onClose()
    navigate('/checkout')
  }

  if (!open) return null

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Mon Panier
            {count > 0 && <span className={styles.badge}>{count}</span>}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🛒</div>
            <p>Votre panier est vide</p>
            <button className={styles.continueShopping} onClick={onClose}>
              Parcourir le menu
            </button>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {items.map(item => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemZh}>{item.name_zh}</span>
                    <span className={styles.itemFr}>{item.name_fr}</span>
                    <span className={styles.itemUnit}>{formatPrice(item.price)}</span>
                  </div>
                  <div className={styles.itemControls}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      aria-label="Retirer"
                    >−</button>
                    <span className={styles.qty}>{item.qty}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      aria-label="Ajouter"
                    >+</button>
                    <span className={styles.itemTotal}>{formatPrice(item.price * item.qty)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <div className={styles.summary}>
                <span className={styles.summaryLabel}>Sous-total</span>
                <span className={styles.summaryValue}>{formatPrice(total)}</span>
              </div>
              <div className={styles.cashbackHint}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Vous gagnerez {formatPrice(total * 0.10)} de cashback
              </div>
              <button className="btn-gold" style={{ width: '100%' }} onClick={handleCheckout}>
                Commander · {formatPrice(total)}
              </button>
              <button className={styles.clearBtn} onClick={clearCart}>
                Vider le panier
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
