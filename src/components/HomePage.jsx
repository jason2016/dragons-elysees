import { useNavigate } from 'react-router-dom'
import { useLang } from '../hooks/useLang'
import { useOrderType } from '../hooks/useOrderType'
import { FEATURES } from '../config'
import styles from './HomePage.module.css'

const DEMO_REVIEWS = [
  {
    id: 1,
    author_name: 'Marie L.',
    rating: 5,
    text: 'Excellent restaurant ! Les raviolis vapeur et le canard laqué sont absolument délicieux. Service impeccable et cadre élégant. Je recommande vivement !',
    date: '2026-04-15',
    is_loyalty_member: false,
  },
  {
    id: 2,
    author_name: 'Thomas D.',
    rating: 5,
    text: 'Une adresse incontournable à Paris. La cuisine est raffinée et authentique. Le programme de fidélité est vraiment avantageux.',
    date: '2026-04-10',
    is_loyalty_member: true,
  },
  {
    id: 3,
    author_name: '李明',
    rating: 5,
    text: '非常正宗的中国料理！环境优雅，服务热情。身在巴黎，却感受到了家乡的味道。强烈推荐！',
    date: '2026-04-05',
    is_loyalty_member: false,
  },
]

function Stars({ rating }) {
  return (
    <span className={styles.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  )
}

export default function HomePage() {
  const { t, lang } = useLang()
  const { setOrderType } = useOrderType()
  const navigate = useNavigate()

  const goMenu = (type) => {
    setOrderType(type)
    navigate('/menu')
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>{t('heroEyebrow')}</p>
          <img
            src="https://longcheng.futushow.org/assets/images/logo5.png"
            alt="Dragons Elysées 龙城酒楼"
            className={styles.heroLogo}
          />
          <div className={styles.goldDivider} />
          <p className={styles.heroSub}>
            {t('heroSub').split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </p>
          <div className={styles.heroCtas}>
            {FEATURES.delivery ? (
              <>
                <button className="btn-gold" onClick={() => goMenu('dine_in')}>
                  🍽️ {t('orderTypeDineInDesc')}
                </button>
                <button className={styles.btnDelivery} onClick={() => goMenu('delivery')}>
                  🚗 {t('orderTypeDeliveryDesc')}
                </button>
              </>
            ) : (
              <button className="btn-gold" onClick={() => goMenu('dine_in')}>
                {t('viewMenu')}
              </button>
            )}
          </div>
          <a href="tel:0144072617" className={styles.phoneLink}>
            📞 01 44 07 26 17
          </a>
        </div>
      </section>

      {/* Info strip */}
      <section className={styles.infoStrip}>
        <div className={styles.infoItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.8">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>11 Rue de Berri, 75008 Paris</span>
        </div>
        <div className={styles.infoItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>{t('hoursLabel')}</span>
        </div>
        <div className={styles.infoItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.8">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>{t('cashbackStrip')}</span>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📱</div>
            <h3>{t('feat1Title')}</h3>
            <p>{t('feat1Desc')}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎁</div>
            <h3>{t('feat2Title')}</h3>
            <p>{t('feat2Desc')}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⭐</div>
            <h3>{t('feat3Title')}</h3>
            <p>{t('feat3Desc')}</p>
          </div>
        </div>
      </section>

      {/* Reviews section */}
      <section className={styles.reviewsSection}>
        <div className={styles.reviewsInner}>
          <h2 className={styles.reviewsTitle}>
            {lang === 'zh' ? '顾客评价' : 'Avis de nos clients'}
          </h2>
          <div className={styles.reviewsGrid}>
            {DEMO_REVIEWS.map(review => (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewCardHeader}>
                  <div className={styles.reviewMeta}>
                    <span className={styles.reviewAuthor}>{review.author_name}</span>
                    <Stars rating={review.rating} />
                  </div>
                  {review.is_loyalty_member && (
                    <span className={styles.loyaltyBadge} title="Ce client est membre du programme fidélité Dragons">
                      ℹ️ {lang === 'zh' ? '会员' : 'Membre fidélité'}
                    </span>
                  )}
                </div>
                <p className={styles.reviewText}>{review.text}</p>
                <div className={styles.reviewDate}>
                  {new Date(review.date).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>

          {/* Compliance disclaimer */}
          <div className={styles.reviewDisclaimer}>
            <strong>{lang === 'zh' ? '透明声明：' : 'Transparence : '}</strong>
            {lang === 'zh'
              ? '部分顾客是我们龙城忠诚计划的会员，在分享用餐体验时可获得到店消费积分。所有评价均真实反映顾客个人感受，不受此优惠影响。'
              : 'Certains de nos clients sont membres de notre programme fidélité Dragons et peuvent recevoir un crédit utilisable sur place lorsqu\'ils partagent leur expérience. Les avis reflètent leurs opinions personnelles et ne sont pas influencés par cet avantage.'}
          </div>
        </div>
      </section>
    </div>
  )
}
