# Dragons Elysées 龙城酒楼 — PWA优化

> 发送给 Dragons Elysées Workspace 的 Claude Code 执行
> 日期：2026-04-10
> 目标：让网站在手机上的体验接近原生APP（全屏、有图标、有启动画面、不会滑出去）

---

## 任务：添加PWA支持

### 1. 创建 public/manifest.json

```json
{
  "name": "Dragons Elysées 龙城酒楼",
  "short_name": "龙城酒楼",
  "description": "Cuisine Chinoise & Thaïlandaise raffinée - Commander en ligne",
  "start_url": "/dragons-elysees/#/menu",
  "scope": "/dragons-elysees/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "categories": ["food", "restaurant"],
  "lang": "fr",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 2. 生成APP图标

在 `public/icons/` 目录下创建图标。用Canvas/SVG生成：
- 背景：#0a0a0a（暗色）
- 前景：金色龙字「龍」或餐厅Logo
- 尺寸：192x192 和 512x512

最简方案：用现有Logo图片裁剪为正方形，加暗色背景填充。

Logo URL：`https://ams3.digitaloceanspaces.com/tmi-images/dragons_elysees_龙城酒楼_376/logo/ef2bc4cd-8673-4207-bb8d-996975b823b3.png`

下载这个Logo，处理成192和512两个尺寸的正方形图标（暗色背景居中放置）。如果下载不了，用SVG生成一个金色「龍」字图标。

### 3. 创建 public/sw.js（Service Worker）

```javascript
const CACHE_NAME = 'dragons-elysees-v1';
const ASSETS_TO_CACHE = [
  '/dragons-elysees/',
  '/dragons-elysees/index.html',
  '/dragons-elysees/data/menu.json'
];

// 安装：缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：网络优先，失败时用缓存
self.addEventListener('fetch', event => {
  // API请求不缓存
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 成功时更新缓存
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // 网络失败时用缓存
        return caches.match(event.request);
      })
  );
});
```

### 4. 更新 index.html

在 `<head>` 中添加：

```html
<!-- PWA Meta Tags -->
<meta name="theme-color" content="#0a0a0a">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="龙城酒楼">
<meta name="mobile-web-app-capable" content="yes">

<!-- Manifest -->
<link rel="manifest" href="/dragons-elysees/manifest.json">

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" href="/dragons-elysees/icons/icon-192.png">

<!-- Prevent zoom on input focus (iOS) -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

在 `<body>` 底部或main.jsx中注册Service Worker：

```javascript
// 在 src/main.jsx 或 index.html 的 <script> 中
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/dragons-elysees/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.error('SW registration failed:', err));
  });
}
```

### 5. 添加"安装提示"组件

创建 `src/components/InstallPrompt.jsx`：

用户首次访问时，底部弹出提示栏：

```
法语：
┌──────────────────────────────────────────┐
│  🐉 Ajouter à l'écran d'accueil          │
│  Accédez rapidement au menu              │
│  [Installer]                    [✕ Plus tard] │
└──────────────────────────────────────────┘

中文：
┌──────────────────────────────────────────┐
│  🐉 添加到主屏幕                           │
│  快速访问菜单和点餐                         │
│  [安装]                         [✕ 以后再说] │
└──────────────────────────────────────────┘
```

实现逻辑：

```jsx
import { useState, useEffect } from 'react';

export default function InstallPrompt({ lang }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 如果已经安装或用户之前关闭过，不再显示
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('pwa-dismissed')) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // iOS Safari 不触发 beforeinstallprompt，手动显示提示
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone;
    if (isIOS && !isStandalone) {
      setShowPrompt(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!showPrompt) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#1a1a1a', borderTop: '1px solid #c9a84c',
      padding: '16px', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      <div>
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
      <div style={{ display: 'flex', gap: '8px' }}>
        {!isIOS && (
          <button onClick={handleInstall} style={{
            background: '#c9a84c', color: '#0a0a0a', border: 'none',
            padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
          }}>
            {lang === 'zh' ? '安装' : 'Installer'}
          </button>
        )}
        <button onClick={handleDismiss} style={{
          background: 'transparent', color: '#a09882', border: '1px solid #333',
          padding: '8px 12px', borderRadius: '6px', cursor: 'pointer'
        }}>
          ✕
        </button>
      </div>
    </div>
  );
}
```

在 App.jsx 中引入：
```jsx
import InstallPrompt from './components/InstallPrompt';

// 在路由最外层添加
<InstallPrompt lang={lang} />
```

### 6. 防止页面滑出去的CSS优化

在 index.css 中添加：

```css
/* 防止iOS橡皮筋效果和误触滑出 */
html, body {
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#root {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* 防止长按弹出系统菜单 */
* {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* 输入框允许选择文字 */
input, textarea {
  -webkit-user-select: auto;
  user-select: auto;
}

/* 安全区域适配（iPhone刘海屏） */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 7. 启动画面（Splash Screen）

Apple需要特殊的启动画面标签。在index.html的 `<head>` 中添加：

```html
<!-- iPhone启动画面（简单方案：用主题色） -->
<meta name="apple-mobile-web-app-capable" content="yes">
<style>
  /* 启动画面加载时的背景 */
  body {
    background-color: #0a0a0a;
  }
</style>
```

启动时用户会看到黑色背景（和APP主题一致），然后页面加载完成。

### 8. 部署并测试

```bash
npm run deploy
```

### 9. 测试清单

部署后在手机上测试：

**Android（Chrome）：**
- [ ] 打开网站 → 底部出现"安装"提示
- [ ] 点安装 → 桌面出现"龙城酒楼"图标
- [ ] 点图标 → 全屏打开，没有浏览器地址栏
- [ ] 浏览菜单、加购物车 → 不会滑出到浏览器
- [ ] 断网后打开 → 显示缓存的菜单页面

**iOS（Safari）：**
- [ ] 打开网站 → 底部出现"添加到主屏幕"提示（含操作说明）
- [ ] 点分享按钮 → "添加到主屏幕" → 桌面出现图标
- [ ] 点图标 → 全屏打开，状态栏融入暗色主题
- [ ] 左右滑动不会退出APP
- [ ] 下拉不会出现Safari的刷新控件

全部通过后截图给CTO确认。

---

*Powered by ClawShow — 让每个网站都像原生APP*
