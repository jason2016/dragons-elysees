# Dragons Elysées 龙城酒楼 — Step 4B: 未注册用户下单 + 堂食/外送选择

> 发送给 Dragons Elysées Workspace 的 Claude Code 执行
> 日期：2026-04-11
> 前置条件：v1.2.0已上线（后厨大屏+管理后台+外送功能框架已有）
> 问题：未注册用户下单无身份标识；堂食/外送没有选择入口

---

## 一、问题1：未注册用户下单流程

### 1.1 现状问题

未登录用户可以下单，但：
- 没有姓名、电话，后厨不知道谁点的
- 堂食没有强制填桌号，后厨不知道送到哪桌
- 无法联系客户
- 未提示注册以获取返点

### 1.2 后端修改（stand9）

orders表新增字段：

```sql
-- SSH到stand9执行
sqlite3 /opt/clawshow-mcp-server/data/dragons-elysees.db
ALTER TABLE orders ADD COLUMN guest_name TEXT;
ALTER TABLE orders ADD COLUMN guest_phone TEXT;
```

POST /api/dragons-elysees/orders 接受新字段：
```json
{
  "guest_name": "M. Dupont",
  "guest_phone": "0612345678",
  "table_number": "12",
  ...其他现有字段
}
```

### 1.3 前端修改 — Checkout.jsx

结账页面根据登录状态显示不同表单：

**未登录用户（必填信息）**：

法语模式：
```
┌─────────────────────────────────┐
│  VOS COORDONNÉES                 │
│                                  │
│  Nom *                           │
│  [                             ] │
│                                  │
│  Téléphone *                     │
│  [                             ] │
│                                  │
│  Email (optionnel)               │
│  [                             ] │
│  💡 Créez un compte pour         │
│     bénéficier de 10% cashback  │
│                                  │
│  INFORMATIONS                    │
│  Numéro de table *  (堂食时)     │
│  [                             ] │
└─────────────────────────────────┘
```

中文模式：
```
┌─────────────────────────────────┐
│  您的信息                         │
│                                  │
│  姓名 *                          │
│  [                             ] │
│                                  │
│  电话 *                          │
│  [                             ] │
│                                  │
│  邮箱（选填）                     │
│  [                             ] │
│  💡 注册账户即享每次消费10%返点    │
│                                  │
│  桌号 *（堂食时）                 │
│  [                             ] │
└─────────────────────────────────┘
```

**已登录用户**：
- 姓名和电话从账户信息自动填充（可编辑）
- 堂食时仍需填桌号
- 不显示注册提示

**验证规则**：
- 姓名：必填，至少2个字符
- 电话：必填，法国手机号格式（06/07开头，10位）
- 邮箱：选填，但如果填了验证格式
- 桌号：堂食模式必填，外送模式隐藏
- 未填必填项时"支付"按钮禁用，显示红色提示

### 1.4 未登录用户的返点处理

结账时：
- 未登录 → 不计入Balance → 正常支付
- 付款成功页显示注册引导：

法语：
```
┌─────────────────────────────────┐
│  ✅ Commande confirmée !          │
│  #DRG-015                        │
│  Payé: 68,00 €                   │
│                                  │
│  ┌───────────────────────────┐  │
│  │ 🎁 Vous auriez gagné      │  │
│  │    6,80 € de cashback !   │  │
│  │                           │  │
│  │ Créez votre compte en     │  │
│  │ 30 secondes pour en       │  │
│  │ profiter dès maintenant.  │  │
│  │                           │  │
│  │ [Créer mon compte →]      │  │
│  └───────────────────────────┘  │
│                                  │
│  ⭐ Laisser un avis sur Google   │
└─────────────────────────────────┘
```

中文：
```
┌─────────────────────────────────┐
│  ✅ 订单已确认！                   │
│  #DRG-015                        │
│  已支付: 68,00 €                  │
│                                  │
│  ┌───────────────────────────┐  │
│  │ 🎁 您本次消费可获得          │  │
│  │    6,80 € 返点！            │  │
│  │                           │  │
│  │ 30秒注册账户，立即享受       │  │
│  │ 每次消费10%返点优惠。       │  │
│  │                           │  │
│  │ [立即注册 →]               │  │
│  └───────────────────────────┘  │
│                                  │
│  ⭐ 在Google上评价                │
└─────────────────────────────────┘
```

点"创建账户" → 跳转到 /#/account/login
- 如果结账时填了邮箱，自动填入OTP登录页面
- 注册成功后，可以把刚才的订单关联到新账户（可选，Phase 2再做）

### 1.5 后厨大屏和管理后台显示

后厨大屏订单卡片：
```
#DRG-015  桌号:12
M. Dupont · 📞 0612345678    ← 未登录用户显示guest_name+phone
V1 虾饺 ×2
M5 铁板牛柳 ×1
14:32
[✓ Prêt]

#DRG-016  桌号:8
luqiao2015                    ← 已登录用户显示用户名
T221 咖喱鸡 ×1
14:35
[✓ Prêt]
```

管理后台订单列表也同样显示客户信息。

---

## 二、问题2：堂食/外送选择时机

### 2.1 现状问题

菜单页面没有堂食/外送的选择入口，用户不知道什么时候选，外送流程无法触发。

### 2.2 首页增加两个入口

修改 HomePage.jsx，现有的"Voir le menu"按钮改为两个选项：

法语：
```
┌─────────────────────────────────┐
│                                  │
│      🐉 龙城酒楼                  │
│      Dragons Elysées             │
│                                  │
│  ┌─────────────┐ ┌────────────┐ │
│  │ 🍽️ Commander │ │ 🚗 Se faire │ │
│  │  sur place   │ │  livrer    │ │
│  └─────────────┘ └────────────┘ │
│                                  │
│       📞 01 44 07 26 17          │
│                                  │
└─────────────────────────────────┘
```

中文：
```
┌─────────────────────────────────┐
│                                  │
│      🐉 龙城酒楼                  │
│      Dragons Elysées             │
│                                  │
│  ┌─────────────┐ ┌────────────┐ │
│  │ 🍽️ 堂食点餐  │ │ 🚗 外卖配送 │ │
│  │              │ │            │ │
│  └─────────────┘ └────────────┘ │
│                                  │
│       📞 01 44 07 26 17          │
│                                  │
└─────────────────────────────────┘
```

- 点"堂食" → 设置 orderType='dine_in' → 跳转 /#/menu
- 点"外送" → 设置 orderType='delivery' → 跳转 /#/menu

### 2.3 菜单页面顶部模式指示+切换

进入菜单页后，分类导航栏上方显示当前模式：

```
┌─────────────────────────────────┐
│  [🍽️ Sur place]  [🚗 Livraison]  │  ← 可点击切换
└─────────────────────────────────┘
│  🔥 套餐  🍜 汤类  🥟 点心  ...   │  ← 分类导航
└─────────────────────────────────┘
```

- 当前选中的模式：金色背景高亮
- 点击可随时切换
- 选择外送时，下方出现小横幅提示：

```
🚗 Mode livraison · Frais de livraison: 5,00 €
```

或中文：
```
🚗 外卖模式 · 配送费: 5,00 €
```

### 2.4 购物车浮动栏变化

堂食模式：
```
┌─────────────────────────────────┐
│  🛒 3 articles · 68,00 €  [Commander] │
└─────────────────────────────────┘
```

外送模式：
```
┌─────────────────────────────────┐
│  🛒 3 articles · 68,00 € + 🚗5€  [Commander] │
└─────────────────────────────────┘
```

### 2.5 结账页面根据模式变化

**堂食模式（orderType='dine_in'）**：
```
VOS COORDONNÉES（或已登录自动填充）
  Nom *: [          ]
  Téléphone *: [          ]
  
INFORMATIONS
  Numéro de table *: [    ]
  Remarques: [              ]

🎁 余额抵扣（如已登录）

Sous-total      68,00 €
Total           68,00 €
[Payer 68,00 €]
```

**外送模式（orderType='delivery'）**：
```
VOS COORDONNÉES（或已登录自动填充）
  Nom *: [          ]
  Téléphone *: [          ]

ADRESSE DE LIVRAISON
  Adresse *: [                    ]
  Complément: [3ème étage, code...] 
  
Remarques: [                      ]

🎁 余额抵扣（如已登录）

Sous-total      68,00 €
Livraison        5,00 €
Total           73,00 €
[Payer 73,00 €]
```

### 2.6 全局状态管理

使用React Context管理orderType：

```jsx
// src/hooks/useOrderType.js（新建）
import { createContext, useContext, useState } from 'react';

const OrderTypeContext = createContext();

export function OrderTypeProvider({ children }) {
  const [orderType, setOrderType] = useState('dine_in'); // 'dine_in' | 'delivery'
  return (
    <OrderTypeContext.Provider value={{ orderType, setOrderType }}>
      {children}
    </OrderTypeContext.Provider>
  );
}

export function useOrderType() {
  return useContext(OrderTypeContext);
}
```

在App.jsx中包裹：
```jsx
<OrderTypeProvider>
  <LangProvider>
    <CartProvider>
      {/* routes */}
    </CartProvider>
  </LangProvider>
</OrderTypeProvider>
```

---

## 三、多语言翻译补充

```javascript
// Guest checkout
'checkout.yourInfo': { fr: 'Vos coordonnées', zh: '您的信息' },
'checkout.name': { fr: 'Nom', zh: '姓名' },
'checkout.phone': { fr: 'Téléphone', zh: '电话' },
'checkout.email': { fr: 'Email (optionnel)', zh: '邮箱（选填）' },
'checkout.emailHint': { fr: 'Créez un compte pour 10% cashback', zh: '注册账户即享10%返点' },
'checkout.tableRequired': { fr: 'Numéro de table', zh: '桌号' },
'checkout.nameRequired': { fr: 'Le nom est requis', zh: '请填写姓名' },
'checkout.phoneRequired': { fr: 'Le téléphone est requis', zh: '请填写电话' },
'checkout.tableRequiredMsg': { fr: 'Le numéro de table est requis', zh: '请填写桌号' },

// Order type selection
'orderType.dineIn': { fr: 'Sur place', zh: '堂食点餐' },
'orderType.delivery': { fr: 'Livraison', zh: '外卖配送' },
'orderType.dineInDesc': { fr: 'Commander sur place', zh: '堂食点餐' },
'orderType.deliveryDesc': { fr: 'Se faire livrer', zh: '外卖配送' },
'orderType.deliveryBanner': { fr: 'Mode livraison · Frais: 5,00 €', zh: '外卖模式 · 配送费: 5,00 €' },
'orderType.deliveryAddress': { fr: 'Adresse de livraison', zh: '配送地址' },
'orderType.deliveryComplement': { fr: 'Complément (étage, code...)', zh: '补充信息（楼层、门禁码...）' },
'orderType.deliveryFee': { fr: 'Frais de livraison', zh: '配送费' },

// Registration prompt on success page
'success.registerPromptTitle': { fr: 'Vous auriez gagné', zh: '您本次可获得' },
'success.registerPromptCashback': { fr: 'de cashback !', zh: '返点！' },
'success.registerPromptDesc': { fr: 'Créez votre compte en 30 secondes pour en profiter dès maintenant.', zh: '30秒注册账户，立即享受每次消费10%返点优惠。' },
'success.registerButton': { fr: 'Créer mon compte', zh: '立即注册' },

// Kitchen display guest info
'kitchen.guest': { fr: 'Client', zh: '顾客' },
'kitchen.table': { fr: 'Table', zh: '桌号' },
```

---

## 四、执行顺序

### 第一步：后端（stand9）
```
1. ALTER TABLE orders ADD COLUMN guest_name TEXT;
2. ALTER TABLE orders ADD COLUMN guest_phone TEXT;
3. POST /orders 接受 guest_name, guest_phone 字段
4. GET /orders 返回 guest_name, guest_phone
5. 重启服务
```

### 第二步：前端
```
1. 新建 useOrderType.js Context
2. 修改 App.jsx 包裹 OrderTypeProvider
3. 修改 HomePage.jsx 两个入口按钮
4. 修改 MenuBrowser.jsx 顶部模式切换+横幅
5. 修改 Cart.jsx 购物车栏显示配送费
6. 修改 Checkout.jsx 完整表单改造（最大改动）
7. 修改 PaymentSuccess.jsx 注册引导
8. 修改 KitchenDisplay.jsx 显示客户信息
9. 修改 AdminPanel.jsx 显示客户信息
10. 更新 useLang.js 翻译字典
11. deploy
```

### 第三步：测试

- [ ] 未登录堂食：填姓名+电话+桌号 → 下单 → 成功页显示注册引导
- [ ] 未登录外送：填姓名+电话+地址 → 下单 → 成功页显示注册引导
- [ ] 已登录堂食：自动填充信息+填桌号 → 下单 → 返点入账
- [ ] 已登录外送：自动填充+填地址 → 下单 → 含配送费 → 返点入账
- [ ] 后厨大屏：显示客户姓名和桌号/外送地址
- [ ] 首页两个入口按钮正确设置orderType
- [ ] 菜单页模式切换正常
- [ ] 必填项验证：漏填时按钮禁用+红色提示
- [ ] 中法双语全部正确

完成后打tag v1.3.0。

---

*Powered by ClawShow — Instant Backend for Small Business*
