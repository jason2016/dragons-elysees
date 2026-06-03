import { useState, useEffect } from 'react'
import { useLang } from '../hooks/useLang'
import { useRegisterFullscreen } from '../hooks/useFullscreen'
import { formatPrice } from '../utils/api'
import styles from './DishDetail.module.css'

/**
 * Single-dish detail view: large image + name + price + optional note (description).
 * Opened by clicking the card body (the "+" button keeps its own direct-add behaviour).
 * Props:
 *   dish     — menu.json à-la-carte item { id, name, price, image_url?, note? }
 *   catCover — category cover, used as image fallback when the dish has no own image
 *   onClose  — close the detail
 *   onAdd()  — add this dish to the cart (same logic as the card "+")
 */
export default function DishDetail({ dish, catCover, onClose, onAdd }) {
  const { t, name, altName } = useLang()
  const [added, setAdded] = useState(false)

  // Same fallback chain as the card thumbnail: own image -> category cover.
  const sources = [dish.image_url, catCover].filter(Boolean)
  const [srcIdx, setSrcIdx] = useState(0)
  const imgSrc = sources[srcIdx]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Hide the bottom InstallPrompt banner while this fullscreen panel is open.
  useRegisterFullscreen()

  const note = dish.note ? name({ name: dish.note }) : ''

  const handleAdd = () => {
    onAdd()
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal="true">
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.hero}>
          {imgSrc && (
            <img
              src={imgSrc}
              alt={name(dish)}
              className={styles.heroImg}
              onError={() => setSrcIdx(i => i + 1)}
            />
          )}
        </div>

        <div className={styles.body}>
          <h2 className={styles.primary}>{name(dish)}</h2>
          {altName(dish) && <p className={styles.alt}>{altName(dish)}</p>}
          {note && <p className={styles.note}>{note}</p>}
          <div className={styles.price}>{formatPrice(dish.price)}</div>
        </div>

        <div className={styles.footer}>
          <button
            className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
            onClick={handleAdd}
          >
            {added ? t('addedToCart') : t('setMenuAddCart')}
          </button>
        </div>
      </div>
    </>
  )
}
