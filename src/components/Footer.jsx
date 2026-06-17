import { useLang } from '../hooks/useLang'
import styles from './Footer.module.css'

// Small inline gold icons (project convention: inline SVG, no icon lib)
const PinIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)
const PhoneIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
)
const ClockIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <img
          src="/icons/logo5.png"
          alt="Dragons Élysées 龙城酒楼"
          className={styles.logo}
          width="110"
          height="128"
          loading="lazy"
        />
        <span className={styles.divider} aria-hidden="true" />
        <address className={styles.info}>
          <p className={styles.line}><PinIcon /><span>{t('footer.address')}</span></p>
          <p className={styles.line}>
            <PhoneIcon />
            <a className={styles.link} href="tel:+33144072617">{t('footer.phone')}</a>
          </p>
          <p className={styles.line}><ClockIcon /><span>{t('footer.hours')}</span></p>
        </address>
        <p className={styles.copyright}>{t('footer.rights')}</p>
      </div>
    </footer>
  )
}
