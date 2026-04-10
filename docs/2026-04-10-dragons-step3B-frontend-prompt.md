# Dragons Elysées Step 3B — 前端：Stancer支付跳转 + 余额抵扣UI

> 发送给 Dragons Elysées Workspace 的 Claude Code 执行
> 日期：2026-04-10
> 前置条件：Step 3A 后端已完成，以下API已确认可用：
>   - POST /payment/create → 返回Stancer payment_url
>   - POST /orders → 支持cashback_use余额扣减
>   - POST /payment/webhook → 支付回调触发返点
> API基础路径：https://mcp.clawshow.ai/api/dragons-elysees

---

## 任务：只改前端，不碰后端

### 1. Checkout.jsx — 余额抵扣UI

在结账页面增加余额抵扣选项。**条件：用户已登录且balance > 0**。

#### 法语模式：
```
┌──────────────────────────────────────┐
│  🎁 Votre solde : 6,80 €             │
│                                       │
│  [■ 开关] Utiliser mon solde          │
│                                       │
│  Sous-total           68,00 €        │
│  Solde utilisé        -6,80 €        │
│  ──────────────────────────────       │
│  À payer              61,20 €        │
│                                       │
│  [    Payer 61,20 €    ]             │
└──────────────────────────────────────┘
```

#### 中文模式：
```
┌──────────────────────────────────────┐
│  🎁 您的余额：6,80 €                  │
│                                       │
│  [■ 开关] 使用余额抵扣                 │
│                                       │
│  小计                68,00 €          │
│  余额抵扣            -6,80 €          │
│  ──────────────────────────────       │
│  需支付              61,20 €          │
│                                       │
│  [    支付 61,20 €    ]               │
└──────────────────────────────────────┘
```

#### 特殊情况 — 余额 >= 订单金额：

```
┌──────────────────────────────────────┐
│  🎁 Votre solde : 80,00 €            │
│                                       │
│  [■ 开关] Utiliser mon solde          │
│                                       │
│  Sous-total           68,00 €        │
│  Solde utilisé       -68,00 €        │
│  ──────────────────────────────       │
│  À payer               0,00 €        │
│                                       │
│  [  Payer avec mon solde  ]          │  ← 按钮文字变化
└──────────────────────────────────────┘
```

#### 实现逻辑：

```jsx
const [useBalance, setUseBalance] = useState(false);

// 计算
const cashbackUse = useBalance ? Math.min(balance, subtotal) : 0;
const totalToPay = Math.round((subtotal - cashbackUse) * 100) / 100;
const isFullBalancePayment = totalToPay === 0;

// UI开关样式：金色主题，和整体设计一致
// 抵扣金额用绿色显示（如 -6,80 €）
// 需支付金额用大字金色显示
```

### 2. Checkout.jsx — 支付流程handlePay()

替换当前的handlePay函数：

```javascript
async function handlePay() {
  setLoading(true);
  
  try {
    // Step 1: 创建订单
    const orderRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        items: cartItems.map(item => ({
          id: item.id,
          name_zh: item.name_zh,
          name_fr: item.name_fr,
          qty: item.qty,
          price: item.price
        })),
        subtotal: subtotal,
        cashback_use: cashbackUse,
        customer_id: customer?.id || null,
        table_number: tableNumber || null,
        payment_method: isFullBalancePayment ? 'balance' : 'stancer',
        note: note || ''
      })
    });
    
    if (!orderRes.ok) throw new Error('Order creation failed');
    const order = await orderRes.json();
    
    // Step 2: 余额全额支付 → 直接跳成功页
    if (order.total_paid === 0) {
      clearCart();
      navigate(`/payment-success?order=${order.order_number}`);
      return;
    }
    
    // Step 3: 需要在线支付 → 创建Stancer支付
    try {
      const payRes = await fetch(`${API_BASE}/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          amount: order.total_paid,
          return_url: `${window.location.origin}${import.meta.env.BASE_URL}#/payment-success?order=${order.order_number}`
        })
      });
      
      const payment = await payRes.json();
      
      if (payment.payment_url) {
        // 跳转Stancer支付页
        window.location.href = payment.payment_url;
        return;
      }
      
      if (payment.fallback) {
        throw new Error('Stancer unavailable');
      }
    } catch (stancerErr) {
      console.warn('Stancer unavailable, using fallback');
    }
    
    // Step 4: 降级 — Stancer不可用时直接标记paid
    await fetch(`${API_BASE}/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' })
    });
    
    clearCart();
    navigate(`/payment-success?order=${order.order_number}`);
    
  } catch (err) {
    console.error('Payment error:', err);
    setError(lang === 'zh' ? '支付失败，请重试' : 'Erreur de paiement, veuillez réessayer');
  } finally {
    setLoading(false);
  }
}
```

### 3. PaymentSuccess.jsx — 从后端获取真实订单数据

当前可能是前端模拟数据。改为从URL参数获取订单号，调API获取真实数据：

```javascript
useEffect(() => {
  async function loadOrder() {
    // 从URL获取订单号：#/payment-success?order=DRG-003
    const hash = window.location.hash;
    const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(queryStr);
    const orderNumber = params.get('order');
    
    if (!orderNumber) return;
    
    try {
      const res = await fetch(`${API_BASE}/orders?order_number=${orderNumber}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const order = data[0]; // 或 data 如果API直接返回对象
        setOrder(order);
        
        // 如果已登录，刷新余额
        if (token) {
          const meRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const me = await meRes.json();
          updateBalance(me.balance);
        }
      }
    } catch (err) {
      console.error('Failed to load order:', err);
    }
  }
  
  loadOrder();
}, []);
```

显示内容（根据order对象动态渲染）：

```
法语：
✅ Commande confirmée !
#DRG-003

Sous-total          68,00 €
Solde utilisé       -6,80 €     ← 只在cashback_used > 0时显示
Payé                61,20 €

🎁 +6,12 € de cashback gagné !
   Solde actuel : 6,12 €

⭐⭐⭐⭐⭐
Comment était votre expérience ?
[G Laisser un avis sur Google]

中文：
✅ 订单已确认！
#DRG-003

小计               68,00 €
余额抵扣           -6,80 €
实际支付           61,20 €

🎁 获得 6,12 € 返点！
   当前余额：6,12 €

⭐⭐⭐⭐⭐
您的用餐体验如何？
[G 在Google上评价]
```

**Google评价链接**（不变）：
```
https://search.google.com/local/writereview?placeid=ChIJGZMEfMFv5kcRwVHuMf-SVS4
```

### 4. 多语言翻译补充

在useLang翻译字典中添加以下key：

```javascript
// Checkout页面
'checkout.balance.title': { fr: 'Votre solde', zh: '您的余额' },
'checkout.balance.use': { fr: 'Utiliser mon solde', zh: '使用余额抵扣' },
'checkout.subtotal': { fr: 'Sous-total', zh: '小计' },
'checkout.balanceUsed': { fr: 'Solde utilisé', zh: '余额抵扣' },
'checkout.toPay': { fr: 'À payer', zh: '需支付' },
'checkout.payButton': { fr: 'Payer', zh: '支付' },
'checkout.payWithBalance': { fr: 'Payer avec mon solde', zh: '余额支付' },
'checkout.payError': { fr: 'Erreur de paiement, veuillez réessayer', zh: '支付失败，请重试' },

// PaymentSuccess页面
'success.confirmed': { fr: 'Commande confirmée !', zh: '订单已确认！' },
'success.subtotal': { fr: 'Sous-total', zh: '小计' },
'success.balanceUsed': { fr: 'Solde utilisé', zh: '余额抵扣' },
'success.paid': { fr: 'Payé', zh: '实际支付' },
'success.cashback': { fr: 'de cashback gagné !', zh: '返点！' },
'success.currentBalance': { fr: 'Solde actuel', zh: '当前余额' },
'success.rateUs': { fr: 'Comment était votre expérience ?', zh: '您的用餐体验如何？' },
'success.googleReview': { fr: 'Laisser un avis sur Google', zh: '在Google上评价' },
'success.paidWith.stancer': { fr: 'Payé par carte', zh: '银行卡支付' },
'success.paidWith.balance': { fr: 'Payé par solde', zh: '余额支付' },
'success.paidWith.mixed': { fr: 'Payé (carte + solde)', zh: '混合支付（卡+余额）' },
```

### 5. 部署

```bash
npm run deploy
```

确认 https://jason2016.github.io/dragons-elysees/ 更新。

### 6. 联调测试

前端部署完成后，在手机上测试完整流程：

**测试1 — 纯Stancer支付（不用余额）**
1. 登录luqiao2015@gmail.com
2. 选菜€35+
3. 不开启余额抵扣
4. 点支付 → 跳转Stancer → 用测试卡4242424242424242支付
5. 返回成功页 → 显示返点
6. 账户页余额增加

**测试2 — 余额部分抵扣**
1. 选菜€68
2. 开启余额抵扣 → 看到扣减金额和实际需支付金额
3. 点支付 → Stancer支付差额
4. 成功页显示：小计、余额抵扣、实际支付、返点

**测试3 — 余额全额支付**
1. 选一个便宜菜（如白饭€6）
2. 开启余额 → 按钮变为"余额支付"
3. 点击 → 直接跳成功页（不跳Stancer）
4. 不产生返点
5. 余额减少€6

**测试4 — 未登录支付**
1. 退出登录
2. 选菜 → 结账 → 不显示余额选项
3. 支付 → Stancer → 成功页（不显示返点，因为没有customer_id）

全部通过后截图给CTO确认。

---

*Step 3B完成后，龙城酒楼MVP全流程跑通，可以正式给老板演示。*
