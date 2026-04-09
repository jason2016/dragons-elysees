import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { formatPrice, generateOrderNumber } from '../utils/api'
import styles from './Checkout.module.css'

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const { isLoggedIn, customer } = useAuth()
  const navigate = useNavigate()
  const [tableNumber, setTableNumber] = useState('')
  const [note, setNote] = useState('')
  const [useBalance, setUseBalance] = useState(false)
  const [loading, setLoading] = useState(false)

  const balance = customer?.balance || 0
  const balanceApplied = useBalance && isLoggedIn ? Math.min(balance, total) : 0
  const amountToPay = total - balanceApplied
  const cashbackEarned = amountToPay >= 15 ? Math.round(amountToPay * 0.10 * 100) / 100 : 0

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Votre panier est vide.</p>
        <button className="btn-gold" onClick={() => navigate('/menu')}>Retour au menu</button>
      </div>
    )
  }

  const handlePay = async () => {
    setLoading(true)
    try {
      const orderNumber = generateOrderNumber()
      // Store order data for success page
      const orderData = {
        order_number: orderNumber,
        items,
        subtotal: total,
        balance_used: balanceApplied,
        total_paid: amountToPay,
        cashback_earned: cashbackEarned,
        payment_method: balanceApplied >= total ? 'balance' : balanceApplied > 0 ? 'mixed' : 'stancer',
        table_number: tableNumber,
        note,
        status: 'paid',
        created_at: new Date().toISOString(),
      }
      sessionStorage.setItem('de-last-order', JSON.stringify(orderData))

      if (amountToPay > 0) {
        // In production: call API to get Stancer payment link
        // For now: simulate payment and redirect to success
        await new Promise(r => setTimeout(r, 1200))
      }

      clearCart()
      navigate('/payment-success')
    } catch (err) {
      alert('Erreur lors du paiement: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Récapitulatif de commande</h1>

        {/* Order items */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Vos plats</h2>
          <div className={styles.itemsList}>
            {items.map(item => (
              <div key={item.id} className={styles.lineItem}>
                <span className={styles.lineQty}>{item.qty}×</span>
                <span className={styles.lineName}>
                  <span>{item.name_zh}</span>
                  <span className={styles.lineNameFr}>{item.name_fr}</span>
                </span>
                <span className={styles.linePrice}>{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table & note */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Informations</h2>
          <div className={styles.formRow}>
            <label className={styles.label}>Numéro de table (optionnel)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="ex: 12"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Remarques (allergies, etc.)</label>
            <textarea
              className={styles.textarea}
              placeholder="ex: sans gluten, pas trop épicé…"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Balance */}
        {isLoggedIn && balance > 0 && (
          <div className={styles.card}>
            <div className={styles.balanceToggle}>
              <div>
                <div className={styles.balanceLabel}>Utiliser mon solde Balance</div>
                <div className={styles.balanceAmount}>Disponible : {formatPrice(balance)}</div>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={useBalance}
                  onChange={e => setUseBalance(e.target.checked)}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            {useBalance && (
              <div className={styles.balanceDeduct}>
                − {formatPrice(balanceApplied)} déduit du solde
              </div>
            )}
          </div>
        )}

        {!isLoggedIn && (
          <div className={styles.loginHint}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>
              <button className={styles.loginLink} onClick={() => navigate('/account/login')}>Connectez-vous</button>
              {' '}pour utiliser votre Balance et cumuler {formatPrice(total * 0.1)} de cashback
            </span>
          </div>
        )}

        {/* Summary */}
        <div className={styles.card}>
          <div className={styles.summaryRow}>
            <span>Sous-total</span>
            <span>{formatPrice(total)}</span>
          </div>
          {balanceApplied > 0 && (
            <div className={`${styles.summaryRow} ${styles.summaryGreen}`}>
              <span>Balance appliquée</span>
              <span>− {formatPrice(balanceApplied)}</span>
            </div>
          )}
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span>Total à payer</span>
            <span>{formatPrice(amountToPay)}</span>
          </div>
          {cashbackEarned > 0 && (
            <div className={styles.cashbackHint}>
              Vous gagnerez {formatPrice(cashbackEarned)} de cashback sur cette commande
            </div>
          )}
        </div>

        <button
          className="btn-gold"
          style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
          onClick={handlePay}
          disabled={loading}
        >
          {loading ? 'Traitement…' : amountToPay === 0 ? 'Confirmer (Balance)' : `Payer ${formatPrice(amountToPay)}`}
        </button>

        <button className={styles.backBtn} onClick={() => navigate('/menu')}>
          ← Modifier ma commande
        </button>
      </div>
    </div>
  )
}
