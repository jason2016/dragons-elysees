import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './AddressAutocomplete.module.css'

const RESTAURANT = { lat: 48.8738, lng: 2.3065 }
const MAX_DISTANCE_KM = 5

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function AddressAutocomplete({ value, onChange, onDistanceError, placeholder, hasError, lang }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  const search = useCallback(async (q) => {
    if (q.length < 5) { setSuggestions([]); setOpen(false); return }
    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5&type=housenumber`
      )
      const data = await res.json()
      const results = (data.features || []).map(f => ({
        label: f.properties.label,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      }))
      setSuggestions(results)
      setOpen(results.length > 0)
    } catch (_) {}
  }, [])

  const handleInput = (e) => {
    const v = e.target.value
    onChange(v)
    if (onDistanceError) onDistanceError('')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 350)
  }

  const selectSuggestion = (s) => {
    onChange(s.label)
    setSuggestions([])
    setOpen(false)
    if (onDistanceError) {
      const dist = haversine(RESTAURANT.lat, RESTAURANT.lng, s.lat, s.lng)
      if (dist > MAX_DISTANCE_KM) {
        onDistanceError(
          lang === 'zh'
            ? `抱歉，该地址超出配送范围（5公里）`
            : `Désolé, cette adresse est hors de notre zone de livraison (5 km)`
        )
      }
    }
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={styles.wrap} ref={containerRef}>
      <input
        type="text"
        className={`${styles.input} ${hasError ? styles.inputError : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={handleInput}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className={styles.dropdown}>
          {suggestions.map((s, i) => (
            <li
              key={i}
              className={styles.suggestion}
              onMouseDown={() => selectSuggestion(s)}
            >
              <span className={styles.pin}>📍</span>
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
