import { useState, useEffect, useRef } from 'react'
import { useCart } from '../hooks/useCart'
import { useLang } from '../hooks/useLang'
import { useOrderType } from '../hooks/useOrderType'
import { formatPrice } from '../utils/api'
import { FEATURES } from '../config'
import styles from './MenuBrowser.module.css'

const DELIVERY_FEE = 5.00

export default function MenuBrowser() {
  const [menu, setMenu] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [addedId, setAddedId] = useState(null)
  const { addItem, count, total, openCart } = useCart()
  const { t, name, altName } = useLang()
  const { orderType, setOrderType } = useOrderType()
  const categoryRefs = useRef({})
  const navRef = useRef(null)

  useEffect(() => {
    fetch('/dragons-elysees/data/menu.json')
      .then(r => r.json())
      .then(data => {
        setMenu(data)
        setActiveCategory(data.categories[0].id)
      })
  }, [])

  const scrollToCategory = (id) => {
    const el = categoryRefs.current[id]
    if (!el) { setActiveCategory(id); return }
    // header 60px + sticky nav height (read from DOM) + 8px gap
    const navWrap = navRef.current?.parentElement
    const navHeight = navWrap ? navWrap.offsetHeight : 100
    const top = el.getBoundingClientRect().top + window.scrollY - (60 + navHeight + 8)
    window.scrollTo({ top, behavior: 'smooth' })
    setActiveCategory(id)
  }

  useEffect(() => {
    const handleScroll = () => {
      if (!menu) return
      for (const cat of [...menu.categories].reverse()) {
        const el = categoryRefs.current[cat.id]
        if (el && el.getBoundingClientRect().top <= 140) {
          setActiveCategory(cat.id)
          const btn = navRef.current?.querySelector(`[data-id="${cat.id}"]`)
          btn?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [menu])

  const handleAdd = (item) => {
    addItem(item)
    setAddedId(item.id)
    setTimeout(() => setAddedId(null), 800)
  }

  if (!menu) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>{t('loading')}</p>
      </div>
    )
  }

  const isDelivery = FEATURES.delivery && orderType === 'delivery'
  const cartTotal = isDelivery ? total + DELIVERY_FEE : total

  return (
    <div className={styles.page}>
      {/* Sticky category nav */}
      <div className={styles.catNavWrap}>
        {/* Order type toggle — delivery feature only */}
        {FEATURES.delivery && (
          <>
            <div className={styles.typeToggle}>
              <button
                className={`${styles.typeBtn} ${!isDelivery ? styles.typeBtnActive : ''}`}
                onClick={() => setOrderType('dine_in')}
              >
                🍽️ {t('orderTypeDineIn')}
              </button>
              <button
                className={`${styles.typeBtn} ${isDelivery ? styles.typeBtnActive : ''}`}
                onClick={() => setOrderType('delivery')}
              >
                🚗 {t('orderTypeDelivery')}
              </button>
            </div>
            {isDelivery && (
              <div className={styles.deliveryBanner}>{t('deliveryBanner')}</div>
            )}
          </>
        )}
        <div className={styles.catNav} ref={navRef}>
          {menu.categories.map(cat => (
            <button
              key={cat.id}
              data-id={cat.id}
              className={`${styles.catBtn} ${activeCategory === cat.id ? styles.catBtnActive : ''}`}
              onClick={() => scrollToCategory(cat.id)}
            >
              <span className={styles.catIcon}>{cat.icon}</span>
              <span>{name(cat)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu sections */}
      <div className={styles.content}>
        {menu.categories.map(cat => (
          <section
            key={cat.id}
            ref={el => { categoryRefs.current[cat.id] = el }}
            className={styles.section}
          >
            {/* Banner with real photo */}
            <div className={styles.sectionBanner}>
              <img
                src={cat.cover}
                alt={cat.name_fr}
                className={styles.sectionBannerImg}
                loading="lazy"
              />
              <div className={styles.sectionBannerOverlay} />
              <div className={styles.sectionTitles}>
                <h2 className={styles.sectionPrimary}>{name(cat)}</h2>
                <p className={styles.sectionAlt}>{altName(cat)}</p>
              </div>
            </div>

            <div className={styles.itemsGrid}>
              {cat.items.map(item => (
                <DishCard
                  key={item.id}
                  item={item}
                  catCover={cat.cover}
                  onAdd={() => handleAdd(item)}
                  added={addedId === item.id}
                  primaryName={name(item)}
                  altNameStr={altName(item)}
                />
              ))}
            </div>
          </section>
        ))}

        <div className={styles.wineNote}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.8">
            <path d="M8 3h8l1 9c0 4.418-3.582 8-8 8a8 8 0 01-8-8L8 3z"/>
            <line x1="12" y1="12" x2="12" y2="20"/>
            <line x1="8" y1="20" x2="16" y2="20"/>
          </svg>
          <span>{t('wineNote')}</span>
        </div>
      </div>

      {/* Cart bar */}
      {count > 0 && (
        <button className={styles.cartBar} onClick={openCart}>
          <div className={styles.cartBarLeft}>
            <span className={styles.cartBarBadge}>{count}</span>
            <span>{t('viewCart')}</span>
          </div>
          <div className={styles.cartBarRight}>
            {isDelivery && <span className={styles.cartBarDelivery}>+ 🚗 {formatPrice(DELIVERY_FEE)}</span>}
            <span className={styles.cartBarTotal}>{formatPrice(cartTotal)}</span>
          </div>
        </button>
      )}
    </div>
  )
}

function DishCard({ item, catCover, onAdd, added, primaryName, altNameStr }) {
  // Use item's own image if available, else category cover
  const imgSrc = item.image_url || catCover

  return (
    <div className={styles.card}>
      {/* Real photo thumbnail with dark overlay */}
      <div className={styles.cardThumb}>
        <img src={imgSrc} alt={primaryName} className={styles.cardThumbImg} loading="lazy" />
        <div className={styles.cardThumbOverlay} />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardNames}>
          {/* Primary name: current language, prominent */}
          <span className={styles.cardPrimary}>{primaryName}</span>
          {/* Alt name: other language, smaller gray */}
          {altNameStr && <span className={styles.cardAlt}>{altNameStr}</span>}
          {item.note_fr && <span className={styles.cardNote}>{item.note_fr}</span>}
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>{formatPrice(item.price)}</span>
          <button
            className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
            onClick={onAdd}
            aria-label={`Ajouter ${primaryName}`}
          >
            {added ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
