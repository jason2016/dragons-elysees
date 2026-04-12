# Dragons Elysées 龙城酒楼 — Step 5: 收据和发票（法国合规）

> 发送给 Dragons Elysées Workspace 的 Claude Code 执行
> 日期：2026-04-12
> 前置条件：v1.3.2已上线
> 目标：每笔订单生成合规收据PDF，客户可选请求正式发票PDF

---

## 一、法规背景

### 适用法规
- **CGI Art. 286 I-3°bis** — 收银系统数据完整性要求（ISCA）
- **Loi n°2026-103 du 19 février 2026, Art.125** — 恢复自我认证（auto-certification）机制
- **Loi AGEC Art. L541-15-10** — 2023年8月起不再强制打印收据，客户要求时提供
- **CGI Art. 289** — 发票必备内容
- **Arrêté du 8 juin 1967** — 餐饮业价格展示和票据义务
- **≥25€必须提供收据** — 餐饮服务超过25€TTC必须主动提供

### 我们的合规定位
ClawShow系统处理的是**纯在线支付**（Stancer），资金通过欧盟持牌支付机构中介，**不涉及现金**。根据CGI Art.286和NF525适用范围的排除条款（"paiements entièrement intermédiés par un établissement bancaire de l'UE"），不在NF525强制认证范围内。2026年2月19日法律恢复了自我认证。

但仍需提供**正规的收据和发票文档**，包含所有法定必备信息。

---

## 二、TVA税率（餐饮业）

```
10% — 堂食消费（repas sur place）+ 非酒精饮料
 5.5% — 外卖食品（vente à emporter，可延迟消费的食品）
20% — 酒精饮料（boissons alcoolisées）
```

**我们的处理**：龙城目前全部堂食在线支付，统一按10% TVA计算。菜单中如有酒精饮料需标记20%。

简化方案（MVP）：在menu.json中给每个菜品加一个vat_rate字段，默认10%，酒精饮料标20%。

---

## 三、收据（Reçu / Note）

### 3.1 何时生成

- 付款成功后**自动生成**电子收据（PDF）
- 付款成功页面显示"📄 Télécharger le reçu"按钮
- 管理后台每个订单也有"📄 Reçu"下载按钮
- 如果客户填了邮箱，自动发送收据到邮箱（Phase 2）

### 3.2 收据必备内容

```
┌──────────────────────────────────────┐
│            🐉 DRAGONS ELYSÉES         │
│     Cuisine Chinoise & Thaïlandaise  │
│                                       │
│  11 Rue de Berri, 75008 Paris         │
│  Tél: 01 44 07 26 17                  │
│  SIRET: [à remplir par le patron]     │
│  N° TVA: FR[xx] [SIRET-based]         │
│                                       │
│  ─────────────────────────────────    │
│  REÇU N° DRG-2026-0015               │
│  Date: 12/04/2026 14:32               │
│  Table: 12                            │
│  Mode: Sur place                      │
│  ─────────────────────────────────    │
│                                       │
│  1× Menu Midi               26,00 €  │
│     午市套餐                           │
│  1× Soupe crabe asperges    18,50 €  │
│     蟹肉芦笋汤                         │
│  1× Bière Tsingtao (33cl)    5,50 €  │
│     青岛啤酒                           │
│                                       │
│  ─────────────────────────────────    │
│  Sous-total HT              45,45 €  │
│                                       │
│  TVA 10% (repas)              4,05 €  │
│  TVA 20% (alcool)             0,92 €  │
│                                       │
│  ═══════════════════════════════════  │
│  TOTAL TTC                  50,00 €  │  
│  ═══════════════════════════════════  │
│                                       │
│  Payé par: Carte bancaire (Stancer)   │
│  Réf. paiement: stc_xxx...xxx        │
│                                       │
│  ─────────────────────────────────    │
│  TVA non applicable sur les           │
│  paiements intermédiés par un         │
│  établissement bancaire de l'UE       │
│  (CGI Art. 286 I-3°bis)              │
│                                       │
│  Système de caisse auto-certifié     │
│  conforme aux critères ISCA           │
│  (Loi n°2026-103 du 19/02/2026,     │
│  Art. 125)                            │
│                                       │
│  ─────────────────────────────────    │
│  Merci de votre visite ! 谢谢光临！   │
│  ⭐ Laissez un avis sur Google        │
└──────────────────────────────────────┘
```

### 3.3 编号规则

收据编号格式：`DRG-YYYY-NNNN`
- DRG = namespace前缀
- YYYY = 年份
- NNNN = 当年连续编号（0001, 0002, ...）
- 不可跳号，不可修改

后端需要一个计数器表：
```sql
CREATE TABLE receipt_counter (
    year INTEGER PRIMARY KEY,
    last_number INTEGER DEFAULT 0
);
```

---

## 四、发票（Facture）

### 4.1 何时生成

- 客户主动请求时（专业客户报销用）
- 管理后台每个订单有"📄 Facture"按钮
- 发票需要客户填写公司信息

### 4.2 发票必备内容（比收据多的部分）

收据的所有内容 + 以下额外信息：

```
┌──────────────────────────────────────┐
│           FACTURE N° F-2026-0003      │
│                                       │
│  ÉMETTEUR:                            │
│  Dragons Elysées SARL                 │
│  11 Rue de Berri, 75008 Paris         │
│  SIRET: [xxx xxx xxx xxxxx]           │
│  N° TVA: FR[xx] [xxxxxxxxx]           │
│  RCS Paris B [xxxxxxxxx]              │
│                                       │
│  CLIENT:                              │
│  [Nom de l'entreprise]                │
│  [Adresse]                            │
│  [N° TVA si applicable]               │
│                                       │
│  Date: 12/04/2026                     │
│  Date d'échéance: Payée               │
│  ─────────────────────────────────    │
│                                       │
│  Désignation          Qté   PU HT     │
│  ─────────────────────────────────    │
│  Menu Midi (TVA 10%)   1   23,64 €   │
│  Soupe crabe (TVA 10%) 1   16,82 €   │
│  Bière Tsingtao(TVA20%)1    4,58 €   │
│                                       │
│  ─────────────────────────────────    │
│  Total HT                  45,04 €   │
│  TVA 10%                    4,05 €   │
│  TVA 20%                    0,92 €   │
│  ═══════════════════════════════════  │
│  Total TTC                 50,00 €   │
│  ═══════════════════════════════════  │
│                                       │
│  Conditions: Payée par carte          │
│  bancaire le 12/04/2026               │
│                                       │
│  Catégorie: Prestation de services    │
│  (Art. 242 nonies A, Annexe II CGI)   │
│                                       │
│  Mentions e-facture:                  │
│  Conformément à la réforme de la      │
│  facturation électronique (Loi de     │
│  finances 2024, Art. 91), ce          │
│  document est disponible au format    │
│  PDF. Version Factur-X disponible     │
│  sur demande.                         │
│                                       │
│  Système auto-certifié ISCA           │
│  (Loi n°2026-103, Art. 125)          │
└──────────────────────────────────────┘
```

### 4.3 发票编号

格式：`F-YYYY-NNNN`（和收据分开编号）

```sql
CREATE TABLE invoice_counter (
    year INTEGER PRIMARY KEY,
    last_number INTEGER DEFAULT 0
);
```

---

## 五、后端实现（stand9）

### 5.1 数据库

```sql
-- SSH到stand9执行
sqlite3 /opt/clawshow-mcp-server/data/dragons-elysees.db

-- 收据计数器
CREATE TABLE IF NOT EXISTS receipt_counter (
    year INTEGER PRIMARY KEY,
    last_number INTEGER DEFAULT 0
);

-- 发票计数器
CREATE TABLE IF NOT EXISTS invoice_counter (
    year INTEGER PRIMARY KEY,
    last_number INTEGER DEFAULT 0
);

-- 发票记录（含客户公司信息）
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    client_company TEXT,
    client_address TEXT,
    client_vat_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 给orders表加收据编号
ALTER TABLE orders ADD COLUMN receipt_number TEXT;
```

### 5.2 新增API

**生成收据PDF**：
```
GET /api/dragons-elysees/orders/:id/receipt
→ 返回PDF文件（Content-Type: application/pdf）
→ 首次调用时自动分配收据编号
```

**生成发票PDF**：
```
POST /api/dragons-elysees/orders/:id/invoice
Body: {
  "client_company": "Acme SARL",
  "client_address": "10 rue de Rivoli, 75001 Paris",
  "client_vat_number": "FR12345678901"  // 可选
}
→ 返回PDF文件
→ 自动分配发票编号
```

**查询发票**：
```
GET /api/dragons-elysees/orders/:id/invoice
→ 如果已生成，返回PDF
→ 如果未生成，返回404
```

### 5.3 PDF生成

用Python的reportlab或fpdf2生成PDF：

```bash
pip install fpdf2 --break-system-packages
```

PDF生成逻辑放在后端 `/opt/clawshow-mcp-server/src/receipt_generator.py`

关键点：
- 页面尺寸：A4（210×297mm）或80mm热敏纸宽度
- 字体：需要支持中文（用思源黑体或Noto Sans CJK）
- 从stand9的 `/opt/clawshow-mcp-server/fonts/` 目录加载字体
- 先下载Noto Sans CJK字体文件

```bash
mkdir -p /opt/clawshow-mcp-server/fonts
cd /opt/clawshow-mcp-server/fonts
wget https://github.com/googlefonts/noto-cjk/raw/main/Sans/Variable/OTF/NotoSansCJKsc-VF.otf.ttc -O NotoSansCJK.ttc
# 如果下载不了，用 fpdf2 内置的 unifont 也可以支持中文
```

### 5.4 餐厅配置

在namespace配置中添加餐厅信息：

```python
RESTAURANT_INFO = {
    "dragons-elysees": {
        "name": "Dragons Elysées 龙城酒楼",
        "legal_name": "Dragons Elysées",  # 老板提供
        "address": "11 Rue de Berri, 75008 Paris",
        "phone": "01 44 07 26 17",
        "siret": "",           # 老板提供
        "tva_number": "",      # 老板提供
        "rcs": "",             # 老板提供
        "default_vat_rate": 0.10,
        "alcohol_vat_rate": 0.20,
    }
}
```

SIRET、TVA号码、RCS号码暂时留空，等老板提供后再填入。PDF上这些字段如果为空，显示"[À compléter]"。

---

## 六、前端实现

### 6.1 付款成功页添加收据下载

PaymentSuccess.jsx 添加收据按钮：

```
┌──────────────────────────────────────┐
│  ✅ Commande confirmée !              │
│  #DRG-015  ·  Table 12               │
│                                       │
│  Total payé: 50,00 €                  │
│                                       │
│  [📄 Télécharger le reçu]            │
│                                       │
│  ⭐ Laisser un avis sur Google        │
└──────────────────────────────────────┘
```

点击按钮 → 调用 GET /orders/:id/receipt → 下载PDF

### 6.2 管理后台添加收据/发票按钮

AdminPanel.jsx 订单详情展开后，底部添加：

```
#DRG-015  🍽️ 14:32  50,00€  ✅ completed
  展开详情：
    1× Menu Midi         26,00€
    1× Soupe crabe       18,50€
    1× Bière Tsingtao     5,50€
    
    [📄 Reçu]  [📄 Facture]
```

点"Facture" → 弹出表单填写客户公司信息 → 提交后下载PDF

### 6.3 发票客户信息表单

```
┌──────────────────────────────────────┐
│  📄 Générer une facture               │
│                                       │
│  Entreprise *                         │
│  [Acme SARL                        ] │
│                                       │
│  Adresse *                            │
│  [10 rue de Rivoli, 75001 Paris    ] │
│                                       │
│  N° TVA (optionnel)                   │
│  [FR12345678901                    ] │
│                                       │
│  [Générer la facture]                 │
└──────────────────────────────────────┘
```

---

## 七、菜单TVA标记

在menu.json中，给含酒精的菜品加 `vat_rate: 0.20`，其他默认10%。

需要识别的酒精饮料分类：Boissons中的啤酒、葡萄酒、烈酒。

---

## 八、执行顺序

### 第一步：后端（stand9）
1. 创建 receipt_counter, invoice_counter, invoices 表
2. orders表加 receipt_number 字段
3. 安装 fpdf2，下载中文字体
4. 实现 receipt_generator.py（收据+发票PDF生成）
5. 新增 GET /orders/:id/receipt API
6. 新增 POST /orders/:id/invoice API
7. 测试：curl下载PDF验证

### 第二步：前端
1. PaymentSuccess.jsx 加"Télécharger le reçu"按钮
2. AdminPanel.jsx 订单展开加"Reçu"和"Facture"按钮
3. InvoiceForm.jsx 发票客户信息弹窗
4. deploy

### 第三步：测试
- [ ] 付款成功后点下载收据 → PDF格式正确，含所有法定信息
- [ ] 收据编号连续（DRG-2026-0001, 0002...）
- [ ] 管理后台下载收据 → 和付款成功页一样
- [ ] 管理后台生成发票 → 填客户信息 → PDF含完整发票信息
- [ ] 发票编号连续（F-2026-0001, 0002...）
- [ ] 中文菜名正确显示
- [ ] TVA按10%/20%正确分拆
- [ ] 法律条文引用正确

完成后打tag v1.4.0。

---

*Powered by ClawShow — Instant Backend for Small Business*
*合规经营，从第一张收据开始。*
