import { Link } from 'react-router-dom'
import styles from './HomePage.module.css'

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>11 Rue de Berri · Paris 8e</p>
          <h1 className={styles.heroTitle}>
            <span className={styles.titleZh}>龙城酒楼</span>
            <span className={styles.titleSep}>·</span>
            <span className={styles.titleFr}>Dragons Elysées</span>
          </h1>
          <div className={styles.goldDivider} />
          <p className={styles.heroSub}>
            Cuisine Chinoise & Thaïlandaise raffinée<br />
            aux portes des Champs-Élysées
          </p>
          <div className={styles.heroCtas}>
            <Link to="/menu" className="btn-gold">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Voir le menu
            </Link>
            <a href="tel:0144072617" className="btn-ghost">
              01 44 07 26 17
            </a>
          </div>
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
          <span>Lun–Dim · 11h–14h &amp; 18h–23h</span>
        </div>
        <div className={styles.infoItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.8">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>10% cashback sur chaque commande</span>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📱</div>
            <h3>Commander en ligne</h3>
            <p>Scannez le QR code à votre table, choisissez vos plats et payez en un clic.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎁</div>
            <h3>Balance Cashback</h3>
            <p>10% de vos dépenses sont crédités sur votre compte et utilisables à la prochaine visite.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⭐</div>
            <h3>Vos avis comptent</h3>
            <p>Après chaque repas, aidez-nous à progresser en laissant votre avis sur Google.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
