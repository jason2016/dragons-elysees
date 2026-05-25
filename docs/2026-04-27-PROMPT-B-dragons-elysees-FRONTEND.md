# Prompt B: 龙城推荐 + Loyalty — 前端实施

> **接收方**: VS Code Claude Code (dragons-elysees workspace)  
> **生成**: Claude.ai (CTO/Co-Founder)  
> **日期**: 2026-04-27  
> **优先级**: 🔴 P0 (龙城本周老板见面前完成)  
> **预计工时**: 3-4 小时  
> **遵守**: ClawShow Co-Founder 协作宪章 v1  
> **依赖**: Prompt A 后端 API ready (后端 Git push 后开始)

---

## 🎯 任务概述

为龙城餐厅 PWA (`dragons-elysees`) 实施 2 个新功能的**前端**:

1. **客户推荐客户** — 顾客个人中心显示推荐码 + QR + 统计
2. **Google 评价奖励** — Demo 模式 admin 页 + 评价显示合规标注

**重要**: 
- 龙城单店 PWA, 不影响主站 / 其他餐厅
- 5/19 后改 admin 页删除, 接真实邮件

---

## 🛠️ 后端 API 端点 (Prompt A 已实施)

```
所有 API base: https://mcp.clawshow.ai/api/dragons-elysees/

GET  /customer/{id}/referral              - 获取推荐码 + QR + 统计
POST /customer/register                   - 注册 (含 referral_code 字段)
POST /order/complete                      - 订单完成 (Checkout 已自动调用)
POST /order/redeem-balance                - Balance 抵扣
GET  /customer/{id}/balance/history       - Balance 流水

POST /admin/simulate-google-review        - Admin Demo 触发 (5/19 后删除)
GET  /admin/customers-with-orders         - Admin 顾客列表 (5/19 后删除)
```

---

## 📋 Part 1: 4 个页面修改 / 新增

### 1.1 `/profile` 顾客个人中心 — 加 2 个 Section

**位置**: `src/pages/Profile.tsx` (扩展现有页面)

```tsx
// 在现有内容下方, 加 2 个 sections

import { useEffect, useState } from 'react';

export default function Profile() {
  // ... 现有代码 ...
  
  const [referralData, setReferralData] = useState(null);
  const [balanceHistory, setBalanceHistory] = useState(null);
  
  useEffect(() => {
    if (!customer?.id) return;
    
    fetch(`https://mcp.clawshow.ai/api/dragons-elysees/customer/${customer.id}/referral`)
      .then(r => r.json())
      .then(setReferralData);
  }, [customer?.id]);
  
  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralData.referral_code);
    alert('Code copié!');
  };
  
  const shareWhatsApp = () => {
    const text = `Découvrez Dragons Elysées! Utilisez mon code ${referralData.referral_code} et nous gagnons tous les deux! ${referralData.referral_url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };
  
  return (
    <div className="min-h-screen bg-amber-50 pb-20">
      <header className="bg-red-900 text-white p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Mon profil</h1>
      </header>
      
      <div className="p-4 space-y-4">
        
        {/* 现有内容 (顾客信息等) */}
        {/* ... */}
        
        {/* ═══════════════════════════════════════════════════════ */}
        {/* Section A: Balance 余额 (放在最显眼位置) */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-2">Mon crédit Dragons</h2>
          
          <div className="text-center py-6 bg-gradient-to-br from-red-700 to-red-900 text-white rounded-xl mb-4">
            <div className="text-sm opacity-80 mb-2">Solde actuel</div>
            <div className="text-5xl font-bold">
              €{customer?.balance_amount?.toFixed(2) || '0.00'}
            </div>
            <div className="text-xs opacity-70 mt-2">
              Utilisable sur place uniquement
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/balance/history')}
            className="w-full py-2 text-center text-red-700 font-semibold"
          >
            Voir l'historique →
          </button>
        </section>
        
        {/* ═══════════════════════════════════════════════════════ */}
        {/* Section B: 推荐码 */}
        {/* ═══════════════════════════════════════════════════════ */}
        {referralData && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Recommandez Dragons Elysées</h2>
            
            {/* 推荐码 */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
              <div className="text-sm text-amber-900 mb-1">Votre code</div>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-mono font-bold text-amber-900 tracking-wider">
                  {referralData.referral_code}
                </span>
                <button 
                  onClick={copyReferralCode}
                  className="text-amber-700 hover:text-amber-900 px-3 py-1.5 bg-amber-100 rounded-lg text-sm"
                >
                  📋 Copier
                </button>
              </div>
            </div>
            
            {/* QR Code */}
            <div className="text-center mb-4">
              <img 
                src={referralData.qr_code_url} 
                alt="QR Code recommandation" 
                className="mx-auto w-48 h-48 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-2">
                Scannez ou partagez le lien
              </p>
            </div>
            
            {/* 分享链接 */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm break-all mb-4 font-mono text-xs">
              {referralData.referral_url}
            </div>
            
            {/* WhatsApp 分享 */}
            <button 
              onClick={shareWhatsApp}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              💬 Partager sur WhatsApp
            </button>
            
            {/* 解释 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-900">
              <div className="font-semibold mb-2">Comment ça marche?</div>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Partagez votre code avec vos amis</li>
                <li>Ils saisissent le code à leur première commande</li>
                <li>Vous recevez 10% de leur commande en crédit Dragons</li>
                <li>Utilisez votre crédit lors de vos prochaines visites</li>
              </ol>
            </div>
            
            {/* 统计 */}
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-amber-600">
                  {referralData.stats.total_referred}
                </div>
                <div className="text-xs text-gray-500">Amis recommandés</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">
                  €{referralData.stats.total_earned.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">Total gagné</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-600">
                  {referralData.stats.pending_referrals}
                </div>
                <div className="text-xs text-gray-500">En attente</div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
```

### 1.2 `/balance/history` Balance 流水页 (新)

**位置**: `src/pages/BalanceHistory.tsx`

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../hooks/useCustomer';

export default function BalanceHistory() {
  const navigate = useNavigate();
  const { customer } = useCustomer();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    if (!customer?.id) return;
    
    fetch(`https://mcp.clawshow.ai/api/dragons-elysees/customer/${customer.id}/balance/history?limit=50`)
      .then(r => r.json())
      .then(setData);
  }, [customer?.id]);
  
  const formatType = (type) => {
    const map = {
      'credit_referral': { label: '🎁 Recommandation', color: 'text-green-600' },
      'credit_review': { label: '⭐ Avis Google', color: 'text-amber-600' },
      'debit_order': { label: '🍜 Utilisé', color: 'text-red-600' },
      'admin_adjust': { label: '⚙️ Ajustement', color: 'text-gray-600' }
    };
    return map[type] || { label: type, color: 'text-gray-600' };
  };
  
  return (
    <div className="min-h-screen bg-amber-50 pb-20">
      <header className="bg-red-900 text-white p-4 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-2xl">←</button>
        <h1 className="text-xl font-bold">Historique du crédit</h1>
      </header>
      
      {/* 当前余额 */}
      {data && (
        <div className="bg-gradient-to-br from-red-700 to-red-900 text-white p-6 mb-4">
          <div className="text-sm opacity-80 mb-1">Solde actuel</div>
          <div className="text-4xl font-bold">€{data.current_balance.toFixed(2)}</div>
        </div>
      )}
      
      {/* 流水列表 */}
      <div className="p-4 space-y-3">
        {!data ? (
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        ) : data.transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">💰</div>
            <p>Aucune transaction pour le moment</p>
            <p className="text-sm mt-2">
              Recommandez vos amis pour gagner du crédit!
            </p>
          </div>
        ) : (
          data.transactions.map(tx => {
            const typeInfo = formatType(tx.type);
            return (
              <div key={tx.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <span className={`font-bold text-lg ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}€{tx.amount.toFixed(2)}
                  </span>
                </div>
                {tx.note && (
                  <div className="text-sm text-gray-600 mb-1">{tx.note}</div>
                )}
                <div className="text-xs text-gray-400">
                  {new Date(tx.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
```

### 1.3 注册流程加推荐码字段

**位置**: 找到现有 Register / SignUp 组件 (可能在 `src/pages/Register.tsx`)

```tsx
import { useSearchParams } from 'react-router-dom';

export default function Register() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    name: '',
    referral_code: searchParams.get('ref')?.toUpperCase() || ''  // URL ?ref=ABC12345 自动填
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const res = await fetch('https://mcp.clawshow.ai/api/dragons-elysees/customer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await res.json();
    
    if (data.success) {
      // 保存到 localStorage / context
      saveCustomer(data);
      
      if (data.referred_by) {
        alert(`Bienvenue! Vous bénéficiez du programme de recommandation 🎉`);
      }
      
      navigate('/menu');
    } else {
      alert(data.error || 'Erreur');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Créer mon compte</h1>
      
      <input 
        type="tel"
        required
        placeholder="Téléphone"
        value={formData.phone}
        onChange={e => setFormData({...formData, phone: e.target.value})}
        className="w-full p-3 border rounded-lg"
      />
      
      <input 
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={e => setFormData({...formData, email: e.target.value})}
        className="w-full p-3 border rounded-lg"
      />
      
      <input 
        type="text"
        required
        placeholder="Nom"
        value={formData.name}
        onChange={e => setFormData({...formData, name: e.target.value})}
        className="w-full p-3 border rounded-lg"
      />
      
      {/* 新增: 推荐码字段 */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Code de recommandation 
          <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
        </label>
        <input 
          type="text"
          placeholder="ABC12345"
          maxLength={8}
          value={formData.referral_code}
          onChange={e => setFormData({...formData, referral_code: e.target.value.toUpperCase()})}
          className="w-full p-3 border rounded-lg font-mono uppercase tracking-wider"
        />
        <p className="text-xs text-gray-500 mt-1">
          Si un ami vous a recommandé Dragons, saisissez son code pour qu'il gagne du crédit.
        </p>
      </div>
      
      <button type="submit" className="w-full py-3 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-800">
        Créer mon compte
      </button>
    </form>
  );
}
```

### 1.4 `/admin/simulate-review` Admin Demo 页 (新, 5/19 后删除)

**位置**: `src/pages/Admin/SimulateReview.tsx`

```tsx
// ⚠️ Demo 模式专用页, 5/19 后接真实邮件后删除此页

import { useState, useEffect } from 'react';

export default function AdminSimulateReview() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  useEffect(() => {
    fetch('https://mcp.clawshow.ai/api/dragons-elysees/admin/customers-with-orders')
      .then(r => r.json())
      .then(setCustomers);
  }, []);
  
  const trigger = async () => {
    if (!customerId) {
      alert('Sélectionnez un client');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const res = await fetch('https://mcp.clawshow.ai/api/dragons-elysees/admin/simulate-google-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customer_id: parseInt(customerId), 
          rating, 
          review_text: reviewText 
        })
      });
      const data = await res.json();
      setResult(data);
      
      // 重新加载顾客列表 (balance 已更新)
      const refreshed = await fetch('https://mcp.clawshow.ai/api/dragons-elysees/admin/customers-with-orders').then(r => r.json());
      setCustomers(refreshed);
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const selectedCustomer = customers.find(c => c.id === parseInt(customerId));
  
  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">⚙️ Admin: Démo Avis Google</h1>
        <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 text-sm text-amber-900">
          ⚠️ <strong>Mode Démo uniquement.</strong> Cette page sera remplacée par 
          l'écoute automatique des emails Google après le 5/19.
        </div>
      </header>
      
      <div className="bg-white rounded-xl p-6 shadow space-y-4">
        
        {/* 选择顾客 */}
        <div>
          <label className="block text-sm font-medium mb-2">Client</label>
          <select 
            value={customerId} 
            onChange={e => setCustomerId(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Sélectionnez un client...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone}) - solde: €{c.balance_amount.toFixed(2)} - dernière commande: €{c.last_order_amount.toFixed(2)}
              </option>
            ))}
          </select>
          {selectedCustomer && (
            <div className="mt-2 text-sm text-gray-600">
              💰 Solde actuel: <strong>€{selectedCustomer.balance_amount.toFixed(2)}</strong> · 
              🍜 Dernière commande: €{selectedCustomer.last_order_amount.toFixed(2)} · 
              💎 Récompense calculée: <strong className="text-amber-600">€{(selectedCustomer.last_order_amount * 0.10).toFixed(2)}</strong>
            </div>
          )}
        </div>
        
        {/* 星级 */}
        <div>
          <label className="block text-sm font-medium mb-2">Note (étoiles Google)</label>
          <div className="flex gap-2">
            {[5, 4, 3, 2, 1].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`flex-1 py-3 rounded-lg font-semibold ${
                  rating === n 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {'⭐'.repeat(n)}
              </button>
            ))}
          </div>
        </div>
        
        {/* 评价文字 */}
        <div>
          <label className="block text-sm font-medium mb-2">Texte de l'avis</label>
          <textarea 
            value={reviewText} 
            onChange={e => setReviewText(e.target.value)} 
            placeholder="Ex: Excellent restaurant chinois, plats authentiques, accueil chaleureux..."
            className="w-full p-3 border rounded-lg h-24"
          />
        </div>
        
        {/* 触发按钮 */}
        <button 
          onClick={trigger}
          disabled={!customerId || loading}
          className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Traitement...' : 'Déclencher la récompense'}
        </button>
        
        {/* 结果 */}
        {result && result.success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
            <div className="font-semibold text-green-900 mb-2">✅ Récompense déclenchée!</div>
            <div className="text-sm space-y-1 text-green-800">
              <div>Récompense: <strong>€{result.reward_amount?.toFixed(2)}</strong></div>
              <div>Nouveau solde du client: <strong>€{result.customer_balance_after?.toFixed(2)}</strong></div>
              <div>Review ID: {result.review_id}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Demo 演示指南 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-900">
        <strong>📋 Comment démontrer au patron:</strong>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Ouvrir le profil du client dans un autre onglet (incognito)</li>
          <li>Noter le solde actuel du client</li>
          <li>Revenir ici, sélectionner ce client</li>
          <li>Choisir étoiles + texte, cliquer "Déclencher"</li>
          <li>Rafraîchir le profil → le solde a augmenté</li>
          <li>Expliquer: "En production (après 5/19), ceci se déclenchera automatiquement quand vous recevez un email Google"</li>
        </ol>
      </div>
    </div>
  );
}
```

### 1.5 路由配置

**位置**: `src/App.tsx` (或 main router 文件)

```tsx
import BalanceHistory from './pages/BalanceHistory';
import AdminSimulateReview from './pages/Admin/SimulateReview';

// 在 Routes 加:
<Route path="/balance/history" element={<BalanceHistory />} />
<Route path="/admin/simulate-review" element={<AdminSimulateReview />} />
```

⚠️ **Admin 路径不放 Navbar / 主导航**, Jason 直接访问 URL 即可.

---

## 📋 Part 2: Checkout 加 Balance 抵扣

**位置**: `src/pages/Checkout.tsx` (扩展)

```tsx
// 在 Checkout 流程加 Balance 抵扣 Section

const [useBalance, setUseBalance] = useState(false);
const [balanceToUse, setBalanceToUse] = useState(0);
const customerBalance = customer?.balance_amount || 0;

// 在订单提交前调用 redeem-balance API
const submitOrder = async () => {
  let finalAmount = orderTotal;
  
  // 如果使用 balance, 先调用 redeem
  if (useBalance && balanceToUse > 0) {
    const redeemRes = await fetch('https://mcp.clawshow.ai/api/dragons-elysees/order/redeem-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: customer.id,
        order_id: tempOrderId,
        order_amount: orderTotal,
        redeem_amount: balanceToUse
      })
    });
    
    const redeemData = await redeemRes.json();
    if (redeemData.success) {
      finalAmount = redeemData.order_amount_after;
    } else {
      alert('Erreur lors de l\'utilisation du crédit');
      return;
    }
  }
  
  // 用 finalAmount 走 SumUp / Stripe checkout
  await processPayment(finalAmount);
  
  // 订单完成后, 触发推荐奖励 (如果是首单)
  await fetch('https://mcp.clawshow.ai/api/dragons-elysees/order/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: orderId,
      customer_id: customer.id,
      order_amount: finalAmount  // 或 orderTotal, 看老板决定佣金按哪个算
    })
  });
};

return (
  <div className="checkout-page">
    
    {/* 现有 Cart / Address / Payment 等 */}
    
    {/* ═══════════════════════════════════════════════════════ */}
    {/* 新增: Balance 抵扣 Section */}
    {/* ═══════════════════════════════════════════════════════ */}
    <section className="bg-white rounded-xl p-4 mb-4">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        💰 Crédit Dragons
      </h3>
      
      {customerBalance > 0 ? (
        <div>
          <div className="text-sm text-gray-600 mb-3">
            Vous avez <strong>€{customerBalance.toFixed(2)}</strong> disponibles
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input 
              type="checkbox"
              checked={useBalance}
              onChange={e => {
                setUseBalance(e.target.checked);
                if (!e.target.checked) setBalanceToUse(0);
              }}
              className="w-5 h-5"
            />
            <span className="font-medium">Utiliser mon crédit</span>
          </label>
          
          {useBalance && (
            <div>
              <input 
                type="number"
                min={0}
                max={Math.min(customerBalance, orderTotal)}
                step="0.50"
                value={balanceToUse}
                onChange={e => setBalanceToUse(parseFloat(e.target.value) || 0)}
                className="w-full p-3 border rounded-lg font-mono text-lg"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Min: €0.50</span>
                <span>Max: €{Math.min(customerBalance, orderTotal).toFixed(2)}</span>
              </div>
              
              {/* 快捷按钮 */}
              <div className="flex gap-2 mt-2">
                <button 
                  type="button"
                  onClick={() => setBalanceToUse(Math.min(customerBalance, orderTotal))}
                  className="flex-1 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium"
                >
                  Maximum (€{Math.min(customerBalance, orderTotal).toFixed(2)})
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Vous n'avez pas encore de crédit. 
          <a href="/profile" className="text-red-700 ml-1 font-semibold">
            Découvrez le programme de recommandation →
          </a>
        </div>
      )}
    </section>
    
    {/* ═══════════════════════════════════════════════════════ */}
    {/* 订单总计 (更新显示) */}
    {/* ═══════════════════════════════════════════════════════ */}
    <div className="bg-white rounded-xl p-4 mb-4 space-y-2">
      <div className="flex justify-between">
        <span>Sous-total</span>
        <span>€{orderTotal.toFixed(2)}</span>
      </div>
      
      {useBalance && balanceToUse > 0 && (
        <div className="flex justify-between text-amber-600 font-medium">
          <span>💰 Crédit utilisé</span>
          <span>-€{balanceToUse.toFixed(2)}</span>
        </div>
      )}
      
      <div className="flex justify-between font-bold text-xl pt-2 border-t-2">
        <span>À payer</span>
        <span className="text-red-700">€{(orderTotal - (useBalance ? balanceToUse : 0)).toFixed(2)}</span>
      </div>
    </div>
    
    {/* 支付按钮 */}
    <button 
      onClick={submitOrder}
      className="w-full py-4 bg-red-700 text-white text-lg font-bold rounded-xl"
    >
      Payer €{(orderTotal - (useBalance ? balanceToUse : 0)).toFixed(2)}
    </button>
  </div>
);
```

---

## 📋 Part 3: 评价显示加合规标注

**位置**: 找到现有评价 / Reviews 显示组件 (可能在主页或 menu 页)

```tsx
// 评价卡片渲染

<div className="review-card bg-white rounded-lg p-4 mb-3">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <span className="font-semibold">{review.author_name}</span>
      <Stars rating={review.rating} />
    </div>
    
    {/* 合规标注: 如果该评价者有 loyalty 奖励 */}
    {review.is_loyalty_member && (
      <span className="text-xs text-gray-500 italic flex items-center gap-1">
        <span title="Ce client est membre du programme fidélité Dragons">
          ℹ️ Membre fidélité
        </span>
      </span>
    )}
  </div>
  
  <p className="text-sm text-gray-700">{review.text}</p>
  
  <div className="text-xs text-gray-400 mt-2">
    {new Date(review.date).toLocaleDateString('fr-FR')}
  </div>
</div>

// 评价列表底部, 整体合规声明
<div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
  <strong className="text-gray-800">Transparence :</strong> Certains de nos clients 
  sont membres de notre programme fidélité Dragons et peuvent recevoir un crédit 
  utilisable sur place lorsqu'ils partagent leur expérience. Les avis reflètent 
  leurs opinions personnelles et ne sont pas influencés par cet avantage.
</div>
```

---

## ✅ Part 4: 测试 (本地 + Lighthouse)

### 4.1 本地测试

```bash
cd dragons-elysees
git checkout -b feat/referral-balance

# 实施完成后:
npm run dev
# 访问 http://localhost:5173
```

### 4.2 浏览器测试场景

```
[ ] Scenario 1: 顾客 A 注册 + 看到推荐码
    - 访问 /profile
    - Section A (Balance €0) 显示
    - Section B (推荐码 + QR + 统计) 显示
    - 推荐码 8 位
    
[ ] Scenario 2: 顾客 B 用推荐码注册
    - 访问 /register?ref=ABCXXXX
    - referral_code 字段自动填
    - 注册成功, 跳到 /menu
    - 看到欢迎消息 (referred_by)
    
[ ] Scenario 3: B 第一单完成 → A 收到佣金
    - B 下单 €50, 走完支付
    - A 刷新 /profile → Balance €5
    - A 访问 /balance/history → 看到 +€5 流水
    
[ ] Scenario 4: A 用 Balance 抵扣
    - A 下单 €30
    - Checkout 看到 Balance €5
    - 勾选 "Utiliser mon crédit", 输入 5
    - 总计显示: 30 - 5 = €25
    - 支付 €25
    - 完成后 Balance €0
    
[ ] Scenario 5: Admin Demo 触发评价奖励
    - 访问 /admin/simulate-review
    - 选择 customer (有最近订单)
    - 选 5 星, 输入文字
    - 点 Trigger → 看到成功结果
    - 切到该 customer /profile → Balance 增加
    
[ ] Scenario 6: 评价合规标注
    - 主页 / 评价区显示评价
    - Loyalty 用户的评价有 "Membre fidélité" 标注
    - 评价区底部有整体合规声明
```

### 4.3 4 张截图

```
[ ] 1. /profile 页 (含 Balance + 推荐码 2 个 Section)
[ ] 2. /balance/history 页 (流水列表)
[ ] 3. /admin/simulate-review 页 (Demo Admin)
[ ] 4. Checkout 页 (含 Balance 抵扣)
```

### 4.4 Lighthouse

```
目标:
- Performance 85+
- Accessibility 90+
- Best Practices 95+
- SEO 90+
```

---

## 🚀 Part 5: 部署计划

```bash
cd dragons-elysees
git add -A
git commit -m "feat: referral + balance system + google review demo

- Profile: balance section + referral code + QR + stats
- New page: /balance/history (transactions)
- New page: /admin/simulate-review (demo only, removed after 5/19)
- Register: referral_code field with URL ?ref= auto-fill
- Checkout: balance redemption integration
- Reviews: loyalty member tag + transparency disclaimer

Backend dependency: feat/dragons-elysees-referral branch on clawshow-mcp-server

Closes: 龙城见面前 demo 准备
"

git push origin feat/referral-balance

# Build + deploy (GitHub Pages)
npm run deploy
# 或 GitHub Actions 自动
```

⚠️ **不**部署 stand9, 等 Jason 通知 (后端 + 前端一起部署).

---

## 📦 Part 6: 交付清单

```
前端必交付:
[ ] src/pages/Profile.tsx (扩展, 加 Balance + 推荐码 Section)
[ ] src/pages/BalanceHistory.tsx (新)
[ ] src/pages/Admin/SimulateReview.tsx (新, Demo 用)
[ ] src/pages/Register.tsx (扩展, 加 referral_code 字段)
[ ] src/pages/Checkout.tsx (扩展, 加 Balance 抵扣)
[ ] 评价显示加合规标注
[ ] 路由配置 (App.tsx)

依赖: 后端 (Prompt A) API 必须 ready
- mcp.clawshow.ai/api/dragons-elysees/* 全部 200

测试:
[ ] 6 个浏览器测试场景全通
[ ] 4 张截图
[ ] Lighthouse 达标

部署:
[ ] Git commit + push (feat/referral-balance 分支)
[ ] GitHub Pages 部署
[ ] 真实浏览器访问验证
[ ] 等 Jason 通知, 一起切 stand9 后端
```

---

## ⏱️ 预计时间

```
Profile 扩展 (Balance + 推荐码 Section): 60 分钟
BalanceHistory 页: 30 分钟
Register 加 referral_code: 30 分钟
Checkout 加 Balance 抵扣: 60 分钟
Admin Demo 页: 45 分钟
评价合规标注: 30 分钟
路由 + 测试: 30 分钟
本地预览 + 调试: 30-60 分钟

总计: 4-5 小时
```

---

## 🔒 严格约束

1. ❌ 不影响主菜单 / Cart / 现有支付流程的核心逻辑
2. ❌ Admin 路径不放主导航 (老板看不到)
3. ❌ 不部署 stand9 (Git push 后等 Jason)
4. ✅ 所有 API 调用 base = `https://mcp.clawshow.ai/api/dragons-elysees/`
5. ✅ 评价合规标注必须显示
6. ✅ URL ?ref= 自动填推荐码字段
7. ✅ 4 张截图 + 6 场景测试

---

## 完成后汇报

```
前端实施完成

- Git branch: feat/referral-balance
- Commit hash: <hash>
- 新页面: /balance/history, /admin/simulate-review
- 扩展: /profile, /register, /checkout
- 4 张截图 (本地 npm run dev 截图)
- Lighthouse: P/A/B/SEO

GitHub Pages 已部署: https://jason2016.github.io/dragons-elysees/
等 Jason 确认后, 通知后端一起切生产 stand9.
```

---

## 关联文档

- Prompt A: 后端 (clawshow-mcp-server) 实施 — 必须先完成
- 2026-04-26-referral-engine-execution-plan-v1.md: 5/19 后通用引擎
- 2026-04-26-cofounder-charter-v1.md: 协作宪章

---

*这是龙城单店紧急前端实施 — 5/19 后迁移到通用引擎.*  
*遵守: ClawShow Co-Founder 协作宪章 v1*
