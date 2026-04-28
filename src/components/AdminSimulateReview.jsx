// ⚠️ Demo mode only — remove this page after 5/19 when real Google email listener is live

import { useState, useEffect } from 'react'
import { api, formatPrice } from '../utils/api'
import styles from './AdminSimulateReview.module.css'

export default function AdminSimulateReview() {
  const [customers, setCustomers] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [result, setResult] = useState(null)

  useEffect(() => {
    api.getAdminCustomers()
      .then(setCustomers)
      .catch(() => setCustomers([]))
      .finally(() => setLoadingCustomers(false))
  }, [])

  const refreshCustomers = () =>
    api.getAdminCustomers().then(setCustomers).catch(() => {})

  const trigger = async () => {
    if (!customerId) { alert('Sélectionnez un client'); return }
    setLoading(true)
    setResult(null)
    try {
      const data = await api.simulateGoogleReview({
        customer_id: parseInt(customerId, 10),
        rating,
        review_text: reviewText,
      })
      setResult(data)
      await refreshCustomers()
    } catch (err) {
      alert(`Erreur: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const selected = customers.find(c => c.id === parseInt(customerId, 10))

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>⚙️ Admin — Démo Avis Google</h1>
          <div className={styles.demoBanner}>
            ⚠️ <strong>Mode Démo.</strong> Cette page sera supprimée après le 5/19 — remplacée par l'écoute automatique des emails Google.
          </div>
        </header>

        <div className={styles.card}>

          {/* Customer picker */}
          <div className={styles.field}>
            <label className={styles.label}>Client</label>
            {loadingCustomers ? (
              <div className={styles.muted}>Chargement des clients…</div>
            ) : (
              <select
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className={styles.select}
              >
                <option value="">Sélectionnez un client…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || c.email}) — solde: {formatPrice(c.balance_amount ?? 0)} — dernière commande: {formatPrice(c.last_order_amount ?? 0)}
                  </option>
                ))}
              </select>
            )}
            {selected && (
              <div className={styles.customerMeta}>
                💰 Solde actuel: <strong>{formatPrice(selected.balance_amount ?? 0)}</strong>
                &nbsp;·&nbsp;
                🍜 Dernière commande: {formatPrice(selected.last_order_amount ?? 0)}
                &nbsp;·&nbsp;
                💎 Récompense calculée: <strong className={styles.reward}>{formatPrice((selected.last_order_amount ?? 0) * 0.10)}</strong>
              </div>
            )}
          </div>

          {/* Star rating */}
          <div className={styles.field}>
            <label className={styles.label}>Note (étoiles Google)</label>
            <div className={styles.stars}>
              {[5, 4, 3, 2, 1].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`${styles.starBtn} ${rating === n ? styles.starBtnActive : ''}`}
                >
                  {'⭐'.repeat(n)}
                </button>
              ))}
            </div>
          </div>

          {/* Review text */}
          <div className={styles.field}>
            <label className={styles.label}>Texte de l'avis</label>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Ex: Excellent restaurant chinois, plats authentiques, accueil chaleureux…"
              className={styles.textarea}
              rows={4}
            />
          </div>

          {/* Trigger */}
          <button
            className={styles.triggerBtn}
            onClick={trigger}
            disabled={!customerId || loading}
          >
            {loading ? 'Traitement…' : 'Déclencher la récompense'}
          </button>

          {/* Result */}
          {result?.success && (
            <div className={styles.result}>
              <div className={styles.resultTitle}>✅ Récompense déclenchée !</div>
              <div className={styles.resultRow}>
                Récompense: <strong>{formatPrice(result.reward_amount ?? 0)}</strong>
              </div>
              <div className={styles.resultRow}>
                Nouveau solde du client: <strong>{formatPrice(result.customer_balance_after ?? 0)}</strong>
              </div>
              {result.review_id && (
                <div className={styles.resultRow}>
                  Review ID: <span className={styles.mono}>{result.review_id}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Demo guide */}
        <div className={styles.guide}>
          <strong>📋 Comment démontrer au patron :</strong>
          <ol className={styles.guideList}>
            <li>Ouvrir le profil du client dans un autre onglet (incognito)</li>
            <li>Noter le solde actuel du client</li>
            <li>Revenir ici, sélectionner ce client</li>
            <li>Choisir étoiles + texte, cliquer "Déclencher"</li>
            <li>Rafraîchir le profil → le solde a augmenté</li>
            <li>Expliquer : "En production (après 5/19), ceci se déclenchera automatiquement quand vous recevez un email Google"</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
