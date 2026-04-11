# Dragons Elysées 龙城酒楼 — Step 4: 后厨大屏 + 管理后台 + 外送

> 发送给 Dragons Elysées Workspace 的 Claude Code 执行
> 日期：2026-04-11
> 前置条件：v1.1.0 已上线（菜单+支付+返点+PWA）
> 后端API已在stand9运行（订单CRUD+Balance+OTP全部可用）

---

## 一、后厨大屏（/#/kitchen）

### 1.1 进入方式

访问 `/#/kitchen` → 弹出密码框 → 输入 `dragons2026` → 进入大屏

### 1.2 界面设计

全屏模式，大字体，5米外可看清。暗色背景+金色文字（和主站风格一致）。

```
┌────────────────────────┬────────────────────────┐
│  🔥 待制作 (3)           │  ✅ 请取餐 (2)           │
│                         │                         │
│  ┌───────────────────┐  │  ┌───────────────────┐  │
│  │ #DRG-012  桌号:5   │  │  │ #DRG-010  ← 闪烁  │  │
│  │ V1 虾饺 ×2         │  │  │ 3分钟前完成        │  │
│  │ M5 铁板牛柳 ×1     │  │  └───────────────────┘  │
│  │ A15 白饭 ×2        │  │                         │
│  │ 14:32              │  │  ┌───────────────────┐  │
│  │ [✓ 完成]           │  │  │ #DRG-011          │  │
│  └───────────────────┘  │  │ 1分钟前完成        │  │
│                         │  │                     │  │
│  ┌───────────────────┐  │  └───────────────────┘  │
│  │ #DRG-013  桌号:8   │  │                         │
│  │ T221 咖喱鸡 ×1     │  │                         │
│  │ S1 鸡肉玉米汤 ×1   │  │                         │
│  │ 14:35              │  │                         │
│  │ [✓ 完成]           │  │                         │
│  └───────────────────┘  │                         │
│                         │                         │
│  ┌───────────────────┐  │                         │
│  │ #DRG-014  🚗外送   │  │                         │
│  │ M1 宫保鸡 ×2       │  │                         │
│  │ C2 椒盐明虾 ×1     │  │                         │
│  │ 地址: 15 rue...    │  │                         │
│  │ 14:38              │  │                         │
│  │ [✓ 完成]           │  │                         │
│  └───────────────────┘  │                         │
└────────────────────────┴────────────────────────┘
  🔊 声音: 开                        自动刷新: 5秒
```

### 1.3 功能说明

- **左侧：待制作** — 查询 status='paid' 的订单，按创建时间排序
- **右侧：请取餐** — 查询 status='ready' 的订单，最近30分钟内的
- **新订单到达** — 播放提示音（叮咚声）
- **点"✓ 完成"** — PATCH订单状态为 'ready'，订单从左侧移到右侧
- **请取餐超过10分钟** — 订单自动变暗/消失（PATCH为'completed'）
- **外送订单** — 显示🚗图标 + 配送地址
- **自动刷新** — 每5秒轮询API（GET /orders?status=paid,ready&date=today）
- **手机端适配** — 平板/手机上改为上下布局（待制作在上，请取餐在下）

### 1.4 技术实现

```jsx
// KitchenDisplay.jsx 核心逻辑

const [orders, setOrders] = useState({ preparing: [], ready: [] });

useEffect(() => {
  const interval = setInterval(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // 拉取待制作订单
    const paidRes = await fetch(`${API_BASE}/orders?status=paid&date=${today}`);
    const paid = await paidRes.json();
    
    // 拉取请取餐订单
    const readyRes = await fetch(`${API_BASE}/orders?status=ready&date=${today}`);
    const ready = await readyRes.json();
    
    // 检测新订单 → 播放提示音
    if (paid.length > orders.preparing.length) {
      playNotificationSound();
    }
    
    setOrders({ preparing: paid, ready: ready });
  }, 5000);
  
  return () => clearInterval(interval);
}, [orders.preparing.length]);

const markReady = async (orderId) => {
  await fetch(`${API_BASE}/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ready' })
  });
};
```

### 1.5 提示音

用Web Audio API生成简单的叮咚声，不需要音频文件：

```javascript
function playNotificationSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880; // A5音
  osc.type = 'sine';
  gain.gain.value = 0.3;
  osc.start();
  setTimeout(() => { osc.frequency.value = 1100; }, 150); // 叮咚效果
  setTimeout(() => { osc.stop(); ctx.close(); }, 400);
}
```

---

## 二、管理后台（/#/admin）

### 2.1 进入方式

访问 `/#/admin` → 密码 `admin2026` → 进入后台

### 2.2 界面设计

```
┌─────────────────────────────────────────────┐
│  📊 Dragons Elysées — Administration         │
│  Aujourd'hui: 11 avril 2026                  │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 📦 12     │  │ 💰 486€  │  │ 🎁 48.6€ │  │
│  │ Commandes │  │ Revenu   │  │ Cashback │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 🍽️ 8      │  │ 🚗 3     │  │ 💳 1     │  │
│  │ Sur place │  │ Livraison│  │ Balance  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                              │
│  ── Commandes récentes ──────────────────   │
│                                              │
│  #DRG-014  🚗 14:38  €68.00  ✅ ready       │
│  #DRG-013  🍽️ 14:35  €44.50  🔥 paid        │
│  #DRG-012  🍽️ 14:32  €51.00  🔥 paid        │
│  #DRG-011  🍽️ 14:20  €35.00  ✅ completed   │
│  #DRG-010  🍽️ 14:05  €28.00  ✅ completed   │
│  ...                                        │
│                                              │
│  ── Filtres ────────────────────────────    │
│  [Aujourd'hui ▼] [Tous statuts ▼]          │
│                                              │
└─────────────────────────────────────────────┘
```

### 2.3 功能说明

- **统计卡片**：当日订单数、总收入、发放的返点、按类型分类（堂食/外送/余额支付）
- **订单列表**：当日所有订单，可筛选日期和状态
- **点击订单**：展开详情（菜品明细、客户信息、付款方式）
- **日期筛选**：可查看历史日期的订单和统计
- **多语言**：跟随主站语言切换

### 2.4 技术实现

```jsx
// AdminPanel.jsx

useEffect(() => {
  async function loadData() {
    const date = selectedDate; // YYYY-MM-DD
    const res = await fetch(`${API_BASE}/orders?date=${date}`);
    const allOrders = await res.json();
    
    setStats({
      total: allOrders.length,
      revenue: allOrders.filter(o => o.status !== 'cancelled')
                        .reduce((sum, o) => sum + o.total_paid, 0),
      cashback: allOrders.reduce((sum, o) => sum + (o.cashback_earned || 0), 0),
      dineIn: allOrders.filter(o => o.order_type === 'dine_in').length,
      delivery: allOrders.filter(o => o.order_type === 'delivery').length,
      balance: allOrders.filter(o => o.payment_method === 'balance').length,
    });
    setOrders(allOrders);
  }
  loadData();
}, [selectedDate]);
```

---

## 三、外送功能

### 3.1 点餐流程变化

在菜单页面顶部增加订单类型选择：

```
┌─────────────────────────────────┐
│  🍽️ Sur place    |   🚗 Livraison │
└─────────────────────────────────┘
```

默认"Sur place"（堂食），切换到"Livraison"后：
- 结账页面增加配送地址输入框
- 隐藏桌号输入
- 订单标记 order_type='delivery'

### 3.2 结账页面（外送模式）

```
┌─────────────────────────────────┐
│  VOS PLATS                       │
│  1× 宫保鸡 M1         28,00 €  │
│  2× 虾饺 V1           33,00 €  │
│                                  │
│  LIVRAISON                       │
│  Adresse *                       │
│  [15 rue de Berri, 75008 Paris] │
│                                  │
│  Téléphone *                     │
│  [06 12 34 56 78              ] │
│                                  │
│  Instructions (optionnel)        │
│  [3ème étage, code 1234       ] │
│                                  │
│  🎁 Votre solde : 6,80 €        │
│  [■] Utiliser mon solde          │
│                                  │
│  Sous-total         61,00 €     │
│  Livraison           5,00 €     │
│  Solde utilisé      -6,80 €     │
│  ────────────────────────        │
│  Total              59,20 €     │
│                                  │
│  [    Payer 59,20 €    ]        │
└─────────────────────────────────┘
```

### 3.3 后端修改（stand9）

orders表新增字段：

```sql
ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'dine_in';  -- 'dine_in' | 'delivery'
ALTER TABLE orders ADD COLUMN delivery_address TEXT;
ALTER TABLE orders ADD COLUMN delivery_phone TEXT;
ALTER TABLE orders ADD COLUMN delivery_instructions TEXT;
ALTER TABLE orders ADD COLUMN delivery_fee REAL DEFAULT 0;
```

POST /orders 接口接受新字段：
```json
{
  "order_type": "delivery",
  "delivery_address": "15 rue de Berri, 75008 Paris",
  "delivery_phone": "0612345678",
  "delivery_instructions": "3ème étage, code 1234",
  "delivery_fee": 5.00
}
```

total_paid 计算：subtotal + delivery_fee - cashback_used

### 3.4 配送员界面（/#/delivery）

访问 `/#/delivery` → 密码 `delivery2026` → 进入配送视图

```
┌─────────────────────────────────┐
│  🚗 Livraisons          3 en cours │
├─────────────────────────────────┤
│                                  │
│  ┌───────────────────────────┐  │
│  │ #DRG-014  🟡 En attente    │  │
│  │ 📍 15 rue de Berri 75008   │  │
│  │ 📞 06 12 34 56 78          │  │
│  │ 🏷️ 3ème étage, code 1234   │  │
│  │ 📦 M1×2, C2×1              │  │
│  │ 14:38                      │  │
│  │                             │  │
│  │ [📦 Récupéré]  [📞 Appeler] │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌───────────────────────────┐  │
│  │ #DRG-016  🟢 En route      │  │
│  │ 📍 8 avenue Montaigne      │  │
│  │ 📞 06 98 76 54 32          │  │
│  │                             │  │
│  │ [✅ Livré]    [📞 Appeler]  │  │
│  └───────────────────────────┘  │
│                                  │
└─────────────────────────────────┘
```

**状态流转**：
```
paid → [后厨点完成] → ready → [配送员点"Récupéré"] → delivering → [配送员点"Livré"] → completed
```

**功能**：
- 只显示 order_type='delivery' 且 status='ready' 或 'delivering' 的订单
- "Récupéré"按钮 → PATCH status='delivering'
- "Livré"按钮 → PATCH status='completed'
- "Appeler"按钮 → 直接拨打客户电话（tel:链接）
- 自动刷新5秒
- 地址可点击 → 跳转Google Maps导航

### 3.5 订单状态流转（完整）

```
堂食：pending → paid → [后厨完成] ready → [客户取餐] completed
外送：pending → paid → [后厨完成] ready → [配送取餐] delivering → [配送送达] completed
```

---

## 四、后端修改汇总（stand9）

需要在ClawShow workspace执行的后端修改：

### 4.1 数据库迁移

```sql
-- SSH到stand9执行
sqlite3 /opt/clawshow-mcp-server/data/dragons-elysees.db

ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'dine_in';
ALTER TABLE orders ADD COLUMN delivery_address TEXT;
ALTER TABLE orders ADD COLUMN delivery_phone TEXT;
ALTER TABLE orders ADD COLUMN delivery_instructions TEXT;
ALTER TABLE orders ADD COLUMN delivery_fee REAL DEFAULT 0;
```

### 4.2 API修改

- POST /orders — 接受 order_type, delivery_address, delivery_phone, delivery_instructions, delivery_fee
- GET /orders — 支持 ?order_type=delivery 筛选
- PATCH /orders/:id — 支持 status='delivering' 新状态
- total_paid计算加入delivery_fee

### 4.3 统计API（新增）

GET /api/dragons-elysees/stats?date=2026-04-11

返回：
```json
{
  "total_orders": 12,
  "revenue": 486.00,
  "cashback_issued": 48.60,
  "by_type": { "dine_in": 8, "delivery": 3, "balance_only": 1 },
  "by_status": { "paid": 2, "ready": 1, "delivering": 1, "completed": 8 }
}
```

---

## 五、前端路由更新

```
/#/              → 首页
/#/menu          → 菜单浏览+购物车
/#/checkout      → 结账
/#/payment-success → 付款成功
/#/account       → 我的账户
/#/account/login → OTP登录
/#/kitchen       → 后厨大屏（密码: dragons2026）
/#/admin         → 管理后台（密码: admin2026）
/#/delivery      → 配送员界面（密码: delivery2026）
```

---

## 六、多语言补充

所有新增页面都要支持FR/ZH切换：

```javascript
// Kitchen
'kitchen.preparing': { fr: 'En préparation', zh: '待制作' },
'kitchen.ready': { fr: 'Prêt - À récupérer', zh: '请取餐' },
'kitchen.done': { fr: 'Terminé', zh: '完成' },
'kitchen.table': { fr: 'Table', zh: '桌号' },
'kitchen.delivery': { fr: 'Livraison', zh: '外送' },

// Admin
'admin.title': { fr: 'Administration', zh: '管理后台' },
'admin.orders': { fr: 'Commandes', zh: '订单' },
'admin.revenue': { fr: 'Revenu', zh: '收入' },
'admin.cashback': { fr: 'Cashback émis', zh: '返点发放' },
'admin.dineIn': { fr: 'Sur place', zh: '堂食' },
'admin.delivery': { fr: 'Livraison', zh: '外送' },

// Delivery
'delivery.title': { fr: 'Livraisons', zh: '外送订单' },
'delivery.pickup': { fr: 'Récupéré', zh: '已取餐' },
'delivery.delivered': { fr: 'Livré', zh: '已送达' },
'delivery.call': { fr: 'Appeler', zh: '拨打电话' },
'delivery.address': { fr: 'Adresse', zh: '地址' },

// Checkout
'checkout.dineIn': { fr: 'Sur place', zh: '堂食' },
'checkout.delivery': { fr: 'Livraison', zh: '外送' },
'checkout.deliveryAddress': { fr: 'Adresse de livraison', zh: '配送地址' },
'checkout.deliveryPhone': { fr: 'Téléphone', zh: '联系电话' },
'checkout.deliveryInstructions': { fr: 'Instructions', zh: '配送说明' },
'checkout.deliveryFee': { fr: 'Frais de livraison', zh: '配送费' },
```

---

## 七、执行顺序

### 第一步：后端修改（发给ClawShow workspace）
1. stand9数据库迁移（新增字段）
2. API修改（接受外送字段、新增stats端点）
3. 测试：curl验证

### 第二步：前端实现（发给dragons-elysees workspace）
1. KitchenDisplay.jsx — 后厨大屏
2. AdminPanel.jsx — 管理后台
3. 修改Checkout.jsx — 增加堂食/外送切换+配送地址
4. 新增DeliveryPanel.jsx — 配送员界面
5. 更新App.jsx路由
6. 多语言翻译补充
7. deploy

### 第三步：联调测试
- [ ] 后厨大屏：实时显示新订单，点完成移到取餐区
- [ ] 管理后台：当日统计正确，订单列表可筛选
- [ ] 堂食点餐：正常流程不受影响
- [ ] 外送点餐：地址+电话+配送费正确
- [ ] 配送员界面：看到外送订单，点取餐/送达状态流转
- [ ] 提示音：新订单到达时响声

完成后打tag v1.2.0。

---

*Powered by ClawShow — Instant Backend for Small Business*
