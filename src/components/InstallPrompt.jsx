import { useState, useEffect } from 'react'
import { useLang } from '../hooks/useLang'

export default function InstallPrompt() {
  const { lang } = useLang()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa-dismissed')) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS Safari doesn't fire beforeinstallprompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = window.navigator.standalone
    if (isIOS && !isStandalone) {
      setShowPrompt(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-dismissed', 'true')
  }

  if (!showPrompt) return null

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#1a1a1a', borderTop: '1px solid #c9a84c',
      padding: '16px', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '12px'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#f5f0e8', fontWeight: 600, fontSize: '14px' }}>
          🐉 {lang === 'zh' ? '添加到主屏幕' : "Ajouter à l'écran d'accueil"}
        </div>
        <div style={{ color: '#a09882', fontSize: '12px', marginTop: '4px' }}>
          {isIOS
            ? (lang === 'zh'
                ? '点击 ⎙ 分享按钮，然后选择"添加到主屏幕"'
                : 'Appuyez sur ⎙ Partager puis "Sur l\'écran d\'accueil"')
            : (lang === 'zh' ? '快速访问菜单和点餐' : 'Accédez rapidement au menu')
          }
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {!isIOS && (
          <button onClick={handleInstall} style={{
            background: '#c9a84c', color: '#0a0a0a', border: 'none',
            padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
            fontSize: '14px'
          }}>
            {lang === 'zh' ? '安装' : 'Installer'}
          </button>
        )}
        <button onClick={handleDismiss} style={{
          background: 'transparent', color: '#a09882', border: '1px solid #333',
          padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
        }}>
          ✕
        </button>
      </div>
    </div>
  )
}
