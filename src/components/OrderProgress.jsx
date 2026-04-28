import styles from './OrderProgress.module.css'

const DELIVERY_STEPS = [
  { key: 'paid',      icon: '✅', fr: 'Payée',        zh: '已付款' },
  { key: 'preparing', icon: '🔥', fr: 'Préparation',  zh: '备餐中' },
  { key: 'ready',     icon: '📦', fr: 'Prêt',         zh: '已备好' },
  { key: 'picked_up', icon: '🚗', fr: 'Récupérée',    zh: '已取餐' },
  { key: 'delivering',icon: '🛵', fr: 'En livraison', zh: '配送中' },
  { key: 'delivered', icon: '🎉', fr: 'Livrée',       zh: '已送达' },
]

const DINEIN_STEPS = [
  { key: 'paid',      icon: '✅', fr: 'Payée',        zh: '已付款' },
  { key: 'preparing', icon: '🔥', fr: 'Préparation',  zh: '备餐中' },
  { key: 'ready',     icon: '🍽️', fr: 'Prêt',        zh: '请取餐' },
]

const STATUS_MSG = {
  paid:       { fr: 'Commande reçue — préparation imminente.', zh: '已收到您的订单，即将开始备餐。' },
  preparing:  { fr: 'En cours de préparation (~15 min).', zh: '餐品制作中，预计约15分钟。' },
  ready_delivery: { fr: 'Prêt — en attente du livreur.', zh: '餐品已备好，等待配送员取餐。' },
  ready_dine: { fr: 'Votre commande est prête ! Veuillez récupérer votre plat.', zh: '餐品已备好，请取餐！' },
  picked_up:  { fr: 'Le livreur est en route vers vous !', zh: '配送员已取餐，正在赶来！' },
  delivering: { fr: 'Livraison en cours — bientôt chez vous !', zh: '配送中，即将送达！' },
  delivered:  { fr: 'Commande livrée. Bon appétit !', zh: '已送达，祝您用餐愉快！' },
  completed:  { fr: 'Commande servie. Merci !', zh: '已完成，谢谢！' },
}

function getMsg(order, lang) {
  if (order.status === 'ready') {
    const key = order.order_type === 'delivery' ? 'ready_delivery' : 'ready_dine'
    return STATUS_MSG[key]?.[lang] || ''
  }
  return STATUS_MSG[order.status]?.[lang] || ''
}

export default function OrderProgress({ order, lang }) {
  const isDelivery = order.order_type === 'delivery'
  const steps = isDelivery ? DELIVERY_STEPS : DINEIN_STEPS

  // Map delivered/completed to last step for progress display
  let displayStatus = order.status
  if (displayStatus === 'completed') displayStatus = isDelivery ? 'delivered' : 'ready'

  const currentIndex = steps.findIndex(s => s.key === displayStatus)

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        {steps.map((step, i) => {
          const done = i <= currentIndex
          const current = i === currentIndex
          return (
            <div key={step.key} className={styles.step}>
              <div className={styles.dotRow}>
                {i > 0 && (
                  <div className={`${styles.line} ${i <= currentIndex ? styles.lineActive : ''}`} />
                )}
                <div className={`${styles.dot} ${done ? styles.dotDone : ''} ${current ? styles.dotCurrent : ''}`}>
                  {done ? step.icon : '○'}
                </div>
                {i < steps.length - 1 && (
                  <div className={`${styles.line} ${i < currentIndex ? styles.lineActive : ''}`} />
                )}
              </div>
              <div className={`${styles.label} ${done ? styles.labelDone : ''}`}>
                {step[lang] || step.fr}
              </div>
            </div>
          )
        })}
      </div>
      <div className={styles.msg}>{getMsg(order, lang)}</div>
    </div>
  )
}
