import { useState, useEffect, useRef } from 'react'
import { useCart } from '../hooks/useCart'
import { useLang } from '../hooks/useLang'
import { formatPrice } from '../utils/api'
import styles from './MenuBrowser.module.css'

// Category visual config: gradient + emoji (overrides menu.json icon)
const CAT_STYLE = {
  'set-menus':      { gradient: 'linear-gradient(135deg, #c9a84c 0%, #7a5010 100%)', emoji: '⭐' },
  'soups-salads':   { gradient: 'linear-gradient(135deg, #e07a40 0%, #8b2e0a 100%)', emoji: '🍜' },
  'dim-sum':        { gradient: 'linear-gradient(135deg, #d4aa60 0%, #855510 100%)', emoji: '🥟' },
  'fried':          { gradient: 'linear-gradient(135deg, #8b2020 0%, #400808 100%)', emoji: '🍤' },
  'seafood':        { gradient: 'linear-gradient(135deg, #1e6fa0 0%, #082a42 100%)', emoji: '🦐' },
  'meat':           { gradient: 'linear-gradient(135deg, #6b3018 0%, #2c1006 100%)', emoji: '🥩' },
  'fish':           { gradient: 'linear-gradient(135deg, #1a7a8a 0%, #083240 100%)', emoji: '🐟' },
  'thai-soups':     { gradient: 'linear-gradient(135deg, #2e7a46 0%, #0e3018 100%)', emoji: '🌿' },
  'thai-mains':     { gradient: 'linear-gradient(135deg, #1e5c14 0%, #0a2608 100%)', emoji: '🍛' },
  'vegetarian':     { gradient: 'linear-gradient(135deg, #2e8c40 0%, #0e3a18 100%)', emoji: '🥬' },
  'rice-noodles':   { gradient: 'linear-gradient(135deg, #9c8458 0%, #503c1a 100%)', emoji: '🍚' },
  'desserts':       { gradient: 'linear-gradient(135deg, #8c3a7a 0%, #3a1030 100%)', emoji: '🍮' },
  'drinks':         { gradient: 'linear-gradient(135deg, #3a7aaa 0%, #10304a 100%)', emoji: '🍵' },
  'lobster-special':{ gradient: 'linear-gradient(135deg, #b03020 0%, #c9a84c 100%)', emoji: '🦞' },
}

export default function MenuBrowser() {
  const [menu, setMenu] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [addedId, setAddedId] = useState(null)
  const { addItem, count, total, openCart } = useCart()
  const { t, name } = useLang()
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
    if (el) {
      const offset = 120
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
    setActiveCategory(id)
  }

  useEffect(() => {
    const handleScroll = () => {
      if (!menu) return
      for (const cat of [...menu.categories].reverse()) {
        const el = categoryRefs.current[cat.id]
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 140) {
            setActiveCategory(cat.id)
            const navEl = navRef.current
            if (navEl) {
              const activeBtn = navEl.querySelector(`[data-id="${cat.id}"]`)
              if (activeBtn) activeBtn.scrollIntoView({ inline: 'nearest', block: 'nearest' })
            }
            break
          }
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

  return (
    <div className={styles.page}>
      {/* Category nav */}
      <div className={styles.catNavWrap}>
        <div className={styles.catNav} ref={navRef}>
          {menu.categories.map(cat => {
            const cs = CAT_STYLE[cat.id] || {}
            return (
              <button
                key={cat.id}
                data-id={cat.id}
                className={`${styles.catBtn} ${activeCategory === cat.id ? styles.catBtnActive : ''}`}
                onClick={() => scrollToCategory(cat.id)}
              >
                <span className={styles.catIcon}>{cs.emoji || cat.icon}</span>
                <span>{name(cat)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Menu sections */}
      <div className={styles.content}>
        {menu.categories.map(cat => {
          const cs = CAT_STYLE[cat.id] || { gradient: 'linear-gradient(135deg, #2a2520, #0a0a0a)', emoji: cat.icon }
          return (
            <section
              key={cat.id}
              ref={el => { categoryRefs.current[cat.id] = el }}
              className={styles.section}
            >
              <div className={styles.sectionHeader} style={{ background: cs.gradient }}>
                <div className={styles.sectionHeaderOverlay} />
                <div className={styles.sectionEmoji}>{cs.emoji}</div>
                <div className={styles.sectionTitles}>
                  <h2 className={styles.sectionPrimary}>{name(cat)}</h2>
                  <p className={styles.sectionSecondary}>{cat.name_zh}</p>
                </div>
              </div>

              <div className={styles.itemsGrid}>
                {cat.items.map(item => (
                  <DishCard
                    key={item.id}
                    item={item}
                    catStyle={cs}
                    onAdd={() => handleAdd(item)}
                    added={addedId === item.id}
                    nameStr={name(item)}
                    subNameStr={item.name_zh}
                  />
                ))}
              </div>
            </section>
          )
        })}

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
          <span className={styles.cartBarTotal}>{formatPrice(total)}</span>
        </button>
      )}
    </div>
  )
}

function DishCard({ item, catStyle, onAdd, added, nameStr, subNameStr }) {
  return (
    <div className={styles.card}>
      {/* Gradient thumb with emoji */}
      <div
        className={styles.cardThumb}
        style={item.image_url
          ? { backgroundImage: `url(${item.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: catStyle.gradient }
        }
      >
        {!item.image_url && (
          <span className={styles.cardThumbEmoji}>{catStyle.emoji}</span>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardNames}>
          <span className={styles.cardPrimary}>{nameStr}</span>
          <span className={styles.cardSecondary}>{subNameStr}</span>
          {item.note_fr && <span className={styles.cardNote}>{item.note_fr}</span>}
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>{formatPrice(item.price)}</span>
          <button
            className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
            onClick={onAdd}
            aria-label={`Ajouter ${nameStr}`}
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
