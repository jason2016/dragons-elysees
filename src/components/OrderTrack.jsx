import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, formatPrice } from '../utils/api'
import { useLang } from '../hooks/useLang'
import OrderProgress from './OrderProgress'
import styles from './OrderTrack.module.css'

const POLL_INTERVAL = 10000

export default function OrderTrack() {
  const { orderNumber } = useParams()
  const { t, lang } = useLang()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const intervalRef = useRef(null)

  const fetchOrder = async () => {
    try {
      const data = await api.trackOrder(orderNumber)
      setOrder(data)
      setNotFound(false)
      // Stop polling once delivered/completed
      if (data.status === 'delivered' || data.status === 'completed') {
        clearInterval(intervalRef.current)
      }
    } catch (_) {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
    intervalRef.current = setInterval(fetchOrder, POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [orderNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>
            {t('track.loading')}
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <div className={styles.notFoundIcon}>🔍</div>
            <h2>{t('track.notFound')}</h2>
            <p>{t('track.notFoundDesc', { number: orderNumber })}</p>
            <Link to="/menu" className="btn-gold">{t('backToMenu')}</Link>
          </div>
        </div>
      </div>
    )
  }

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []
  const orderNum = (order.order_number || '').replace('DRG-', '') || '—'
  const isDelivery = order.order_type === 'delivery'

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerSub}>{t('track.title')}</div>
          <div className={styles.orderNum}>
            #{orderNum}
            {isDelivery
              ? <span className={styles.typeBadge}>🚗 {t('track.deliveryBadge')}</span>
              : order.table_number
                ? <span className={styles.tableBadge}>Table {order.table_number}</span>
                : null
            }
          </div>
        </div>

        <div className={styles.card}>
          <OrderProgress order={order} lang={lang} />
        </div>

        {isDelivery && order.delivery_address && (
          <div className={styles.card}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>📍 {t('track.deliveryAddr')}</span>
              <span className={styles.infoVal}>{order.delivery_address}</span>
            </div>
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.sectionTitle}>{t('track.details')}</div>
          <div className={styles.items}>
            {items.map((item, i) => (
              <div key={i} className={styles.itemRow}>
                <span className={styles.itemQty}>{item.qty}×</span>
                <span className={styles.itemName}>
                  {item.name?.[lang] || item.name?.fr || item.name_fr}
                </span>
                <span className={styles.itemPrice}>{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          {order.delivery_fee > 0 && (
            <div className={styles.feeRow}>
              <span>{t('deliveryFee')}</span>
              <span>{formatPrice(order.delivery_fee)}</span>
            </div>
          )}
          <div className={styles.totalRow}>
            <span>{t('paid')}</span>
            <span>{formatPrice(order.total_paid)}</span>
          </div>
        </div>

        <div className={styles.refreshNote}>
          🔄 {t('track.autoRefresh')}
        </div>

        <Link to="/menu" className="btn-ghost">{t('newOrder')}</Link>
      </div>
    </div>
  )
}
