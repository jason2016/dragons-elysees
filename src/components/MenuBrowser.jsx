import { useState, useEffect, useRef } from 'react'
import { useCart } from '../hooks/useCart'
import { useLang } from '../hooks/useLang'
import { useOrderType } from '../hooks/useOrderType'
import { formatPrice } from '../utils/api'
import { FEATURES } from '../config'
import SetMenuSelector from './SetMenuSelector'
import DishDetail from './DishDetail'
import styles from './MenuBrowser.module.css'

const DELIVERY_FEE = 5.00

export default function MenuBrowser() {
  const [menu, setMenu] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [addedId, setAddedId] = useState(null)
  const [activeSetMenu, setActiveSetMenu] = useState(null)
  const [activeDish, setActiveDish] = useState(null)
  const { addItem, count, total, openCart, items: cartItems } = useCart()
  const { t, name, altName } = useLang()
  const { orderType, setOrderType } = useOrderType()
  const categoryRefs = useRef({})
  const navRef = useRef(null)

  useEffect(() => {
    fetch('/dragons-elysees/data/menu.json')
      .then(r => r.json())
      .then(data => {
        setMenu(data)
        const firstVisible = data.categories.find(c => !c.hidden)
        if (firstVisible) setActiveCategory(firstVisible.id)
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
  // Price-pending set menu in cart → show "Prix à confirmer" instead of €0.00 on the cart bar.
  const cartHasPriceTodo = cartItems.some(i => i.price_todo)
  // Hide categories flagged hidden:true in menu.json (reversible — remove the flag to restore)
  const categories = menu.categories.filter(c => !c.hidden)

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
          {categories.map(cat => (
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
        {categories.map(cat => (
          <section
            key={cat.id}
            ref={el => { categoryRefs.current[cat.id] = el }}
            className={styles.section}
          >
            {/* Banner with real photo */}
            <div className={styles.sectionBanner}>
              <img
                src={cat.cover}
                alt={cat.name?.fr || cat.name_fr}
                className={styles.sectionBannerImg}
                loading="lazy"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
              <div className={styles.sectionBannerOverlay} />
              <div className={styles.sectionTitles}>
                <h2 className={styles.sectionPrimary}>{name(cat)}</h2>
                <p className={styles.sectionAlt}>{altName(cat)}</p>
              </div>
            </div>

            <div className={styles.itemsGrid}>
              {cat.items.map(item => (
                item.type === 'set_menu' ? (
                  <SetMenuCard
                    key={item.id}
                    item={item}
                    catCover={cat.cover}
                    onCompose={() => setActiveSetMenu(item)}
                    primaryName={name(item)}
                    altNameStr={altName(item)}
                    composeTag={t('setMenuComposeTag')}
                    composeBtn={t('setMenuComposeBtn')}
                  />
                ) : (
                  <DishCard
                    key={item.id}
                    item={item}
                    catCover={cat.cover}
                    onAdd={() => handleAdd(item)}
                    onOpenDetail={() => setActiveDish({ item, catCover: cat.cover })}
                    added={addedId === item.id}
                    primaryName={name(item)}
                    altNameStr={altName(item)}
                  />
                )
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
            <span className={styles.cartBarTotal}>
              {cartHasPriceTodo ? t('setMenuPriceTBC') : formatPrice(cartTotal)}
            </span>
          </div>
        </button>
      )}

      {/* Set-menu step-by-step composer */}
      {activeSetMenu && (
        <SetMenuSelector
          setMenu={activeSetMenu}
          onClose={() => setActiveSetMenu(null)}
          onAdd={(cartItem) => { addItem(cartItem); openCart() }}
        />
      )}

      {/* À-la-carte dish detail (large image); the card "+" keeps direct-add */}
      {activeDish && (
        <DishDetail
          dish={activeDish.item}
          catCover={activeDish.catCover}
          onClose={() => setActiveDish(null)}
          onAdd={() => handleAdd(activeDish.item)}
        />
      )}
    </div>
  )
}

function SetMenuCard({ item, catCover, onCompose, primaryName, altNameStr, composeTag, composeBtn }) {
  const sources = [item.cover, catCover].filter(Boolean)
  const [srcIdx, setSrcIdx] = useState(0)
  const imgSrc = sources[srcIdx]

  return (
    <div className={`${styles.card} ${styles.setCard}`} onClick={onCompose} role="button" tabIndex={0}>
      <div className={styles.cardThumb}>
        {imgSrc && (
          <img
            src={imgSrc}
            alt={primaryName}
            className={styles.cardThumbImg}
            loading="lazy"
            onError={() => setSrcIdx(i => i + 1)}
          />
        )}
        <div className={styles.cardThumbOverlay} />
        <span className={styles.setTag}>{composeTag}</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardNames}>
          <span className={styles.cardPrimary}>{primaryName}</span>
          {altNameStr && <span className={styles.cardAlt}>{altNameStr}</span>}
        </div>
        <div className={styles.cardFooter}>
          {!item.price_todo && <span className={styles.cardPrice}>{formatPrice(item.price)}</span>}
          <button className={styles.setComposeBtn} onClick={(e) => { e.stopPropagation(); onCompose() }}>
            {composeBtn} ›
          </button>
        </div>
      </div>
    </div>
  )
}

function DishCard({ item, catCover, onAdd, onOpenDetail, added, primaryName, altNameStr }) {
  // Fallback chain: dish photo -> category cover -> nothing (container shows dark fallback bg)
  const sources = [item.image_url, catCover].filter(Boolean)
  const [srcIdx, setSrcIdx] = useState(0)
  const imgSrc = sources[srcIdx]

  return (
    // Tapping the card opens the detail view; the "+" button stops propagation and adds directly.
    <div className={styles.card} onClick={onOpenDetail} role="button" tabIndex={0}>
      {/* Real photo thumbnail with dark overlay */}
      <div className={styles.cardThumb}>
        {imgSrc && (
          <img
            src={imgSrc}
            alt={primaryName}
            className={styles.cardThumbImg}
            loading="lazy"
            onError={() => setSrcIdx(i => i + 1)}
          />
        )}
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
            onClick={(e) => { e.stopPropagation(); onAdd() }}
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
