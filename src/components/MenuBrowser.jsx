import { useState, useEffect, useRef } from 'react'
import { useCart } from '../hooks/useCart'
import Cart from './Cart'
import { formatPrice } from '../utils/api'
import styles from './MenuBrowser.module.css'

export default function MenuBrowser() {
  const [menu, setMenu] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [addedId, setAddedId] = useState(null)
  const { addItem, count, total } = useCart()
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
            // scroll nav pill into view
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
        <p>Chargement du menu…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Category nav */}
      <div className={styles.catNavWrap}>
        <div className={styles.catNav} ref={navRef}>
          {menu.categories.map(cat => (
            <button
              key={cat.id}
              data-id={cat.id}
              className={`${styles.catBtn} ${activeCategory === cat.id ? styles.catBtnActive : ''}`}
              onClick={() => scrollToCategory(cat.id)}
            >
              <span className={styles.catIcon}>{cat.icon}</span>
              <span>{cat.name_fr}</span>
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
            <div className={styles.sectionHeader}>
              <div className={styles.sectionCover}>
                <img src={cat.cover} alt={cat.name_fr} loading="lazy" />
                <div className={styles.sectionCoverOverlay} />
              </div>
              <div className={styles.sectionTitles}>
                <h2 className={styles.sectionZh}>{cat.name_zh}</h2>
                <p className={styles.sectionFr}>{cat.name_fr}</p>
              </div>
            </div>

            <div className={styles.itemsGrid}>
              {cat.items.map(item => (
                <DishCard
                  key={item.id}
                  item={item}
                  cover={cat.cover}
                  onAdd={() => handleAdd(item)}
                  added={addedId === item.id}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Wine note */}
        <div className={styles.wineNote}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.8">
            <path d="M8 3h8l1 9c0 4.418-3.582 8-8 8a8 8 0 01-8-8L8 3z"/>
            <line x1="12" y1="12" x2="12" y2="20"/>
            <line x1="8" y1="20" x2="16" y2="20"/>
          </svg>
          <span>Carte des vins et boissons alcoolisées disponible auprès du serveur</span>
        </div>
      </div>

      {/* Cart bar */}
      {count > 0 && (
        <div className={styles.cartBar} onClick={() => setCartOpen(true)}>
          <div className={styles.cartBarLeft}>
            <span className={styles.cartBarBadge}>{count}</span>
            <span>Voir mon panier</span>
          </div>
          <span className={styles.cartBarTotal}>{formatPrice(total)}</span>
        </div>
      )}

      {/* Cart drawer */}
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}

function DishCard({ item, cover, onAdd, added }) {
  const imgSrc = item.image_url || cover

  return (
    <div className={styles.card}>
      <div className={styles.cardImg}>
        <img src={imgSrc} alt={item.name_fr} loading="lazy" />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardNames}>
          <span className={styles.cardZh}>{item.name_zh}</span>
          <span className={styles.cardFr}>{item.name_fr}</span>
          {item.note_fr && <span className={styles.cardNote}>{item.note_fr}</span>}
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>{formatPrice(item.price)}</span>
          <button
            className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
            onClick={onAdd}
            aria-label={`Ajouter ${item.name_fr}`}
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
