import { useState, useEffect } from 'react'
import { useLang } from '../hooks/useLang'
import styles from './SetMenuSelector.module.css'

/**
 * Step-by-step set-menu composer.
 * Props:
 *   setMenu  — the menu.json item with { id, name, cover, courses[] }
 *   onClose  — close the modal
 *   onAdd(cartItem) — add the configured menu to the cart
 * Course count is driven entirely by setMenu.courses (not hard-coded).
 * Each course is required: one option must be picked to advance / to add.
 */
export default function SetMenuSelector({ setMenu, onClose, onAdd }) {
  const { t, name } = useLang()
  const courses = setMenu.courses || []
  const [step, setStep] = useState(0)
  const [choices, setChoices] = useState({}) // courseKey -> option

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (courses.length === 0) return null
  const course = courses[step]
  const chosen = choices[course.key]
  const isLast = step === courses.length - 1
  const allChosen = courses.every(c => choices[c.key])

  const pick = (option) => setChoices(prev => ({ ...prev, [course.key]: option }))

  const handleAdd = () => {
    if (!allChosen) return
    const selections = courses.map(c => ({
      key: c.key,
      label: c.label,
      name: choices[c.key].name,
    }))
    // Unique id per configuration so different selections are distinct cart lines,
    // while an identical configuration increments qty.
    const configId = setMenu.id + '::' + courses.map(c => `${c.key}:${choices[c.key].id}`).join('|')
    onAdd({
      id: configId,
      type: 'set_menu',
      setMenuId: setMenu.id,
      name: setMenu.name,
      price: 0,
      price_todo: true,
      selections,
    })
    onClose()
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.menuName}>{name(setMenu)}</span>
            <span className={styles.priceTBC}>{t('setMenuPriceTBC')}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className={styles.progress}>
          <span className={styles.progressLabel}>
            {t('setMenuStep')} {step + 1}/{courses.length}
          </span>
          <div className={styles.dots}>
            {courses.map((c, i) => (
              <span
                key={c.key}
                className={`${styles.dot} ${i === step ? styles.dotActive : ''} ${choices[c.key] ? styles.dotDone : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Current course */}
        <div className={styles.courseHead}>
          <h3 className={styles.courseTitle}>{name({ name: course.label })}</h3>
          <span className={styles.coursePick}>{t('setMenuPick1')}</span>
        </div>

        <div className={styles.options}>
          {course.options.map(opt => {
            const selected = chosen?.id === opt.id
            return (
              <button
                key={opt.id}
                className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                onClick={() => pick(opt)}
              >
                <div className={styles.optThumb}>
                  {opt.image && (
                    <img
                      src={opt.image}
                      alt={name(opt)}
                      loading="lazy"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                  {selected && (
                    <span className={styles.optCheck}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </div>
                <span className={styles.optName}>{name(opt)}</span>
              </button>
            )
          })}
        </div>

        {/* Footer nav */}
        <div className={styles.footer}>
          {step > 0 ? (
            <button className={styles.backBtn} onClick={() => setStep(s => s - 1)}>
              {t('setMenuBack')}
            </button>
          ) : <span />}
          {!isLast ? (
            <button
              className={styles.nextBtn}
              disabled={!chosen}
              onClick={() => setStep(s => s + 1)}
            >
              {t('setMenuNext')}
            </button>
          ) : (
            <button
              className={styles.addBtn}
              disabled={!allChosen}
              onClick={handleAdd}
            >
              {t('setMenuAddCart')}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
