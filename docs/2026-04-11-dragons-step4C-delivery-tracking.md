# Dragons Elysées 龙城酒楼 — Step 4C: 外送体验优化

> 发送给 Dragons Elysées Workspace 的 Claude Code 执行
> 日期：2026-04-11
> 前置条件：v1.3.0（堂食/外送选择+客户信息表单已有）
> 优化点：注册引导、运费设置、地址自动补全、外送进度追踪

---

## 一、未注册用户注册引导

### 1.1 购物车中提醒

购物车侧边栏底部，如果用户未登录，显示金色提示：

```
┌─────────────────────────────────┐
│  Mon Panier 🛒                   │
│                                  │
│  Menu Midi  1×         26,00 €  │
│                                  │
│  Sous-total            26,00 €  │
│                                  │
│  ┌───────────────────────────┐  │
│  │ ⭐ Connectez-vous et       │  │
│  │ gagnez 2,60 € de cashback │  │
│  │ sur cette commande !      │  │
│  │ [Se connecter →]          │  │
│  └───────────────────────────┘  │
│                                  │
│  [Commander · 26,00 €]          │
└─────────────────────────────────┘
```

中文：
```
│  ┌───────────────────────────┐  │
│  │ ⭐ 登录后本次消费可获得     │  │
│  │ 2,60 € 返点！              │  │
│  │ [立即登录 →]               │  │
│  └───────────────────────────┘  │
```

### 1.2 结账页提醒

结账页面"您的信息"区块上方，未登录时显示：

```
┌─────────────────────────────────────────────┐
│  ⭐ Connectez-vous pour bénéficier de 10%    │
│     de cashback sur chaque commande.         │
│     [Se connecter →]  [Continuer sans compte]│
└─────────────────────────────────────────────┘
```

点"Se connecter" → 跳转 /#/account/login，登录后自动返回结账页
点"Continuer sans compte" → 关闭提示，继续填写客户信息表单

### 1.3 付款成功页注册引导（已有，确认优化）

未登录用户付款成功后，显示醒目的注册引导卡片：

```
┌─────────────────────────────────────────────┐
│  🎁 Vous auriez gagné 2,60 € de cashback !  │
│                                              │
│  Créez votre compte en 30 secondes :         │
│  ✓ 10% de cashback sur chaque commande      │
│  ✓ Suivi de vos commandes                   │
│  ✓ Paiement plus rapide                     │
│                                              │
│  [  Créer mon compte gratuitement →  ]       │
└─────────────────────────────────────────────┘
```

---

## 二、运费设置

### 2.1 配置化运费

在前端配置中（或从后端namespace配置读取），定义运费规则：

```javascript
// src/config.js 或 menu.json 中
const DELIVERY_CONFIG = {
  base_fee: 5.00,           // 基础配送费
  free_threshold: 50.00,    // 满50€免配送费
  max_distance_km: 5,       // 最大配送范围5公里
  restaurant_lat: 48.8738,  // 龙城酒楼纬度
  restaurant_lng: 2.3065,   // 龙城酒楼经度
};
```

### 2.2 结账页运费显示

根据订单金额动态显示：

**未满免配送门槛**：
```
Sous-total          26,00 €
Frais de livraison   5,00 €
  💡 Plus que 24,00 € pour la livraison gratuite
────────────────────────────
Total               31,00 €
```

**已满免配送门槛**：
```
Sous-total          56,00 €
Frais de livraison   0,00 €  ✅ Livraison offerte !
────────────────────────────
Total               56,00 €
```

### 2.3 菜单页外送横幅更新

```
🚗 Mode livraison · Livraison: 5,00 € (gratuite dès 50 €)
```

中文：
```
🚗 外卖模式 · 配送费: 5,00 €（满50€免运费）
```

---

## 三、地址自动补全

### 3.1 使用Google Places Autocomplete API

在配送地址输入框加自动补全，输入时实时显示巴黎地址建议：

```
Adresse de livraison *
┌──────────────────────────────────┐
│ 15 rue de                        │
├──────────────────────────────────┤
│ 📍 15 Rue de Berri, 75008 Paris  │
│ 📍 15 Rue de Rivoli, 75001 Paris │
│ 📍 15 Rue de la Paix, 75002 Paris│
└──────────────────────────────────┘
```

### 3.2 技术实现

使用Google Maps JavaScript API的Places Autocomplete：

```html
<!-- index.html 加载Google Maps API -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places&language=fr"></script>
```

```jsx
// AddressAutocomplete.jsx
import { useEffect, useRef } from 'react';

export default function AddressAutocomplete({ value, onChange, lang }) {
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (!window.google?.maps?.places) return;
    
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'fr' },
      fields: ['formatted_address', 'geometry']
    });
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        onChange(place.formatted_address);
        
        // 可选：计算距离判断是否在配送范围内
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          // 计算与餐厅的距离
        }
      }
    });
  }, []);
  
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={lang === 'zh' ? '输入配送地址...' : 'Entrez votre adresse...'}
    />
  );
}
```

### 3.3 如果没有Google Maps API Key

备选方案：使用法国政府免费地址API（api-adresse.data.gouv.fr）：

```javascript
// 免费，无需API key，法国地址专用
async function searchAddress(query) {
  const res = await fetch(
    `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&type=housenumber`
  );
  const data = await res.json();
  return data.features.map(f => ({
    label: f.properties.label,      // "15 Rue de Berri 75008 Paris"
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    postcode: f.properties.postcode,
    city: f.properties.city
  }));
}
```

**推荐用法国政府API**：免费、无限量、专门针对法国地址、不需要API key。

### 3.4 配送范围验证

选择地址后，计算与餐厅的距离：

```javascript
function calculateDistance(lat1, lng1, lat2, lng2) {
  // Haversine公式
  const R = 6371; // 地球半径km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// 餐厅坐标
const RESTAURANT = { lat: 48.8738, lng: 2.3065 };

// 检查是否在配送范围内
const distance = calculateDistance(RESTAURANT.lat, RESTAURANT.lng, customerLat, customerLng);
if (distance > 5) {
  // 显示提示："Désolé, cette adresse est hors de notre zone de livraison (5 km)"
}
```

---

## 四、外送进度追踪

### 4.1 订单状态扩展

外送订单的状态流转：

```
pending → paid → preparing → ready → picked_up → delivering → delivered
   ↓                                                              
cancelled
```

| 状态 | 法语 | 中文 | 图标 | 说明 |
|------|------|------|------|------|
| pending | En attente de paiement | 待付款 | 💳 | 等待支付 |
| paid | Payée | 已付款 | ✅ | 支付成功，等待后厨 |
| preparing | En préparation | 备餐中 | 🔥 | 后厨正在制作 |
| ready | Prêt | 已备好 | 📦 | 等待配送员取餐 |
| picked_up | Récupérée | 已取餐 | 🚗 | 配送员已取餐出发 |
| delivering | En livraison | 配送中 | 🛵 | 正在送往客户 |
| delivered | Livrée | 已送达 | ✅ | 配送完成 |

### 4.2 后端修改（stand9）

PATCH /orders/:id 支持新状态：

```python
VALID_STATUSES = ['pending', 'paid', 'preparing', 'ready', 'picked_up', 'delivering', 'delivered', 'completed', 'cancelled']

# 状态流转规则
ALLOWED_TRANSITIONS = {
    'paid': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['picked_up', 'completed'],  # picked_up=外送, completed=堂食取餐
    'picked_up': ['delivering'],
    'delivering': ['delivered'],
    'delivered': ['completed'],
}
```

新增API：
```
GET /api/dragons-elysees/orders/track/:order_number
```
返回订单详情 + 当前状态 + 状态历史（如果有）。不需要登录，用order_number直接查。

### 4.3 客户端进度条（PaymentSuccess页面 + 独立追踪页面）

付款成功后和订单追踪页面显示实时进度条：

**外送订单进度条**：
```
┌──────────────────────────────────────────────┐
│  📋 Commande #DRG-020                         │
│                                               │
│  ●───────●───────●───────○───────○───────○   │
│  Payée  Prépa-  Prêt   Récupé- En       Livrée
│         ration          rée    livraison       │
│                                               │
│  🔥 En préparation                             │
│  Votre commande est en cours de préparation.  │
│  Temps estimé: ~15 min                        │
│                                               │
│  📍 Livraison à:                               │
│  15 Rue de Berri, 75008 Paris                 │
│                                               │
│  ── Détails ──────────────────────────────    │
│  1× Menu Midi                    26,00 €     │
│  Frais de livraison               5,00 €     │
│  Total                           31,00 €     │
└──────────────────────────────────────────────┘
```

**堂食订单进度条（更简单）**：
```
┌──────────────────────────────────────────────┐
│  📋 Commande #DRG-021  ·  Table 12            │
│                                               │
│  ●───────────●───────────○                   │
│  Payée    En préparation   Prêt               │
│                                               │
│  🔥 En préparation                             │
│  Votre plat sera bientôt prêt !              │
└──────────────────────────────────────────────┘
```

### 4.4 进度条组件实现

```jsx
// src/components/OrderProgress.jsx

const DELIVERY_STEPS = [
  { key: 'paid', icon: '✅', fr: 'Payée', zh: '已付款' },
  { key: 'preparing', icon: '🔥', fr: 'Préparation', zh: '备餐中' },
  { key: 'ready', icon: '📦', fr: 'Prêt', zh: '已备好' },
  { key: 'picked_up', icon: '🚗', fr: 'Récupérée', zh: '已取餐' },
  { key: 'delivering', icon: '🛵', fr: 'En livraison', zh: '配送中' },
  { key: 'delivered', icon: '🎉', fr: 'Livrée', zh: '已送达' },
];

const DINEIN_STEPS = [
  { key: 'paid', icon: '✅', fr: 'Payée', zh: '已付款' },
  { key: 'preparing', icon: '🔥', fr: 'Préparation', zh: '备餐中' },
  { key: 'ready', icon: '🍽️', fr: 'Prêt', zh: '请取餐' },
];

export default function OrderProgress({ order, lang }) {
  const steps = order.order_type === 'delivery' ? DELIVERY_STEPS : DINEIN_STEPS;
  const currentIndex = steps.findIndex(s => s.key === order.status);
  
  return (
    <div className="order-progress">
      {/* 进度条 */}
      <div className="progress-bar">
        {steps.map((step, i) => (
          <div key={step.key} className="progress-step">
            {/* 圆点 */}
            <div className={`dot ${i <= currentIndex ? 'active' : ''} ${i === currentIndex ? 'current' : ''}`}>
              {i <= currentIndex ? step.icon : '○'}
            </div>
            {/* 连线 */}
            {i < steps.length - 1 && (
              <div className={`line ${i < currentIndex ? 'active' : ''}`} />
            )}
            {/* 标签 */}
            <div className="label">{lang === 'zh' ? step.zh : step.fr}</div>
          </div>
        ))}
      </div>
      
      {/* 当前状态说明 */}
      <div className="status-message">
        {getStatusMessage(order, lang)}
      </div>
    </div>
  );
}

function getStatusMessage(order, lang) {
  const messages = {
    paid: { 
      fr: 'Votre commande a été reçue. Préparation imminente.', 
      zh: '已收到您的订单，即将开始备餐。' 
    },
    preparing: { 
      fr: 'Votre commande est en cours de préparation. Temps estimé: ~15 min.', 
      zh: '您的餐品正在制作中，预计约15分钟。' 
    },
    ready: order.order_type === 'delivery'
      ? { fr: 'Votre commande est prête. En attente du livreur.', zh: '您的餐品已备好，等待配送员取餐。' }
      : { fr: 'Votre commande est prête ! Veuillez récupérer votre plat.', zh: '您的餐品已备好！请取餐。' },
    picked_up: { 
      fr: 'Le livreur a récupéré votre commande et est en route.', 
      zh: '配送员已取餐，正在赶来。' 
    },
    delivering: { 
      fr: 'Votre commande est en cours de livraison. Bientôt chez vous !', 
      zh: '您的餐品正在配送中，即将送达！' 
    },
    delivered: { 
      fr: 'Votre commande a été livrée. Bon appétit !', 
      zh: '您的餐品已送达，祝您用餐愉快！' 
    },
  };
  return messages[order.status]?.[lang] || '';
}
```

### 4.5 进度条CSS样式

```css
.order-progress {
  padding: 24px;
}

.progress-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  margin-bottom: 24px;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  z-index: 1;
}

.dot.active {
  background: var(--accent-gold);
  border-color: var(--accent-gold);
}

.dot.current {
  animation: pulse 2s infinite;
  box-shadow: 0 0 12px rgba(201, 168, 76, 0.5);
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(201, 168, 76, 0.3); }
  50% { box-shadow: 0 0 20px rgba(201, 168, 76, 0.6); }
}

.line {
  position: absolute;
  top: 18px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--border-color);
}

.line.active {
  background: var(--accent-gold);
}

.label {
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-secondary);
  text-align: center;
}

.status-message {
  text-align: center;
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
}
```

### 4.6 独立追踪页面（/#/track/:orderNumber）

客户可以通过链接随时查看订单进度：

```
路由：/#/track/DRG-020

页面内容：
  - OrderProgress进度条组件
  - 订单详情（菜品+金额）
  - 配送地址
  - 自动刷新（每10秒轮询）
  - 不需要登录，用order_number查询
```

付款成功后的return_url带上追踪链接：
```
"您可以随时查看订单进度："
[📋 Suivre ma commande] → /#/track/DRG-020
```

### 4.7 后厨大屏更新

后厨大屏增加"preparing"状态：

```
paid → 点"开始制作" → preparing → 点"完成" → ready
```

```
┌────────────────────────┬────────────────────────┐
│  📥 新订单 (1)           │  🔥 制作中 (2)           │
│                         │                         │
│  #DRG-022  桌号:5       │  #DRG-020  🚗外送        │
│  V1 虾饺 ×2             │  M1 宫保鸡 ×2            │
│  [▶ 开始制作]           │  [✓ 完成]                │
│                         │                         │
│                         │  #DRG-021  桌号:8        │
│                         │  T221 咖喱鸡 ×1          │
│                         │  [✓ 完成]                │
├────────────────────────┼────────────────────────┤
│  ✅ 请取餐 (1)           │  🚗 等待配送 (1)         │
│                         │                         │
│  #DRG-019  桌号:3       │  #DRG-018  🚗            │
│                         │  📍 15 rue de Berri      │
└────────────────────────┴────────────────────────┘
```

### 4.8 配送员界面更新

配送员界面增加"已取餐→配送中→已送达"三步操作：

```
┌──────────────────────────────────┐
│  🚗 #DRG-020                      │
│                                   │
│  📍 15 Rue de Berri, 75008 Paris  │
│  📞 06 12 34 56 78                │
│  🏷️ 3ème étage, code 1234         │
│                                   │
│  📦 M1 宫保鸡 ×2, C2 椒盐明虾 ×1  │
│                                   │
│  ●──●──●──○──○                   │
│  备好 取餐 配送 送达                │
│                                   │
│  [📦 已取餐]  [📞 拨打客户]        │
│                                   │
│  --- 取餐后变为 ---                │
│  [🛵 配送中]  [📍 导航]            │
│                                   │
│  --- 送达后 ---                    │
│  [✅ 已送达]                       │
└──────────────────────────────────┘
```

---

## 五、后端修改汇总

### 5.1 数据库

```sql
-- 订单状态历史表（可选，记录每一步的时间）
CREATE TABLE order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    changed_by TEXT,  -- 'customer' | 'kitchen' | 'delivery' | 'system'
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### 5.2 API修改

PATCH /orders/:id 时自动记录状态历史：
```python
# 更新状态时同时写入历史
INSERT INTO order_status_history (order_id, status, changed_by) VALUES (?, ?, ?)
```

新增追踪API：
```
GET /api/dragons-elysees/orders/track/:order_number
→ 返回订单详情 + 状态历史时间线
```

### 5.3 配送费API

```
GET /api/dragons-elysees/delivery-config
→ { "base_fee": 5.00, "free_threshold": 50.00, "max_distance_km": 5 }
```

---

## 六、新增路由

```
/#/track/:orderNumber  → 订单追踪页（无需登录）
```

---

## 七、多语言翻译补充

```javascript
// 注册引导
'cart.loginPrompt': { fr: 'Connectez-vous et gagnez {amount} € de cashback !', zh: '登录后可获得 {amount} € 返点！' },
'cart.loginButton': { fr: 'Se connecter', zh: '立即登录' },
'checkout.loginPrompt': { fr: 'Connectez-vous pour bénéficier de 10% de cashback', zh: '登录即享10%返点' },
'checkout.continueGuest': { fr: 'Continuer sans compte', zh: '不登录继续' },

// 运费
'delivery.freeThreshold': { fr: 'Livraison gratuite dès {amount} €', zh: '满{amount}€免运费' },
'delivery.freeDelivery': { fr: 'Livraison offerte !', zh: '免运费！' },
'delivery.moreForFree': { fr: 'Plus que {amount} € pour la livraison gratuite', zh: '再加{amount}€即可免运费' },
'delivery.outOfRange': { fr: 'Désolé, cette adresse est hors de notre zone (5 km)', zh: '抱歉，该地址超出配送范围（5公里）' },

// 地址
'delivery.addressPlaceholder': { fr: 'Entrez votre adresse...', zh: '输入配送地址...' },

// 订单追踪
'track.title': { fr: 'Suivi de commande', zh: '订单追踪' },
'track.paid': { fr: 'Payée', zh: '已付款' },
'track.preparing': { fr: 'En préparation', zh: '备餐中' },
'track.ready': { fr: 'Prêt', zh: '已备好' },
'track.pickedUp': { fr: 'Récupérée', zh: '已取餐' },
'track.delivering': { fr: 'En livraison', zh: '配送中' },
'track.delivered': { fr: 'Livrée', zh: '已送达' },
'track.estimatedTime': { fr: 'Temps estimé', zh: '预计时间' },
'track.followOrder': { fr: 'Suivre ma commande', zh: '追踪订单' },

// 后厨
'kitchen.newOrders': { fr: 'Nouvelles commandes', zh: '新订单' },
'kitchen.cooking': { fr: 'En préparation', zh: '制作中' },
'kitchen.readyPickup': { fr: 'Prêt — À récupérer', zh: '请取餐' },
'kitchen.waitingDelivery': { fr: 'En attente livraison', zh: '等待配送' },
'kitchen.startCooking': { fr: 'Commencer', zh: '开始制作' },
'kitchen.markReady': { fr: 'Terminé', zh: '完成' },
```

---

## 八、执行顺序

### 第一步：后端（stand9）
1. 创建 order_status_history 表
2. PATCH /orders/:id 加状态历史记录
3. 新增 GET /orders/track/:order_number
4. 新增 GET /delivery-config
5. 支持 preparing/picked_up/delivering/delivered 状态

### 第二步：前端
1. OrderProgress.jsx — 进度条组件（含CSS动画）
2. AddressAutocomplete.jsx — 地址自动补全（法国政府API）
3. OrderTrack.jsx — 独立追踪页面 /#/track/:orderNumber
4. 修改 Cart.jsx — 未登录注册引导
5. 修改 Checkout.jsx — 登录提示 + 运费逻辑 + 地址组件
6. 修改 PaymentSuccess.jsx — 加进度条 + 追踪链接
7. 修改 KitchenDisplay.jsx — 四栏布局（新订单/制作中/请取餐/等待配送）
8. 修改 DeliveryPanel.jsx — 三步操作 + 进度显示
9. 更新 App.jsx 路由
10. 多语言翻译
11. deploy

### 第三步：测试
- [ ] 未登录：购物车+结账页显示注册引导
- [ ] 外送地址：输入时自动补全法国地址
- [ ] 超出5km：显示超范围提示
- [ ] 运费：满50€免运费正确计算
- [ ] 外送下单后：进度条显示"已付款"
- [ ] 后厨点"开始制作"：进度变为"备餐中"
- [ ] 后厨点"完成"：进度变为"已备好"
- [ ] 配送员点"已取餐"：进度变为"已取餐"
- [ ] 配送员点"配送中"：客户看到"配送中"
- [ ] 配送员点"已送达"：完成
- [ ] 追踪页面：自动刷新，实时更新状态
- [ ] 堂食订单：只显示三步进度条

完成后打tag v1.3.1。

---

*Powered by ClawShow — Instant Backend for Small Business*
