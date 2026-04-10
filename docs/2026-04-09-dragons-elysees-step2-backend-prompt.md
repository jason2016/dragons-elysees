# Dragons Elysées 龙城酒楼 — Step 2: 后端API

> 发送给 ClawShow Workspace 的 VS Code Claude Code 执行
> 日期：2026-04-09
> 前置条件：Step 1 前端已完成并部署到 https://jason2016.github.io/dragons-elysees/
> 服务器：stand9（51.77.201.82）
> 参考：neige-rouge 后端架构（同一服务器，同一MCP Server进程）

---

## 项目背景

龙城酒楼（Dragons Elysées）是ClawShow第二个餐厅客户，位于巴黎香榭丽舍旁（11 Rue de Berri, 75008 Paris）。前端菜单浏览+购物车已上线，现在需要后端API支持以下功能：

1. **邮箱OTP登录**（零成本，Gmail SMTP）
2. **在线支付**（Stancer，复用现有generate_payment逻辑）
3. **Balance返点系统**（消费满€15自动10%返点，余额可抵扣）
4. **订单管理**（创建/查询/状态流转，后厨大屏用）
5. **Google评价引导**（前端已有，后端只需返回正确的订单状态）

namespace: `dragons-elysees`

---

## 第一步：创建数据库

SSH到stand9，创建SQLite数据库：

```bash
ssh root@51.77.201.82
sqlite3 /opt/clawshow-mcp-server/data/dragons-elysees.db
```

执行以下SQL：

```sql
-- 客户表
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Balance交易记录表（余额=SUM(amount)，不存冗余字段）
CREATE TABLE balance_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    type TEXT NOT NULL,          -- 'cashback' | 'payment' | 'adjustment'
    amount REAL NOT NULL,        -- 正数=入账（返点），负数=扣款（使用余额）
    description TEXT,
    related_order_id INTEGER,    -- 关联订单ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- 订单表
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,   -- DRG-001 格式
    customer_id INTEGER,                 -- 可为NULL（未登录客户）
    items TEXT NOT NULL,                 -- JSON: [{"id":"V1","name_zh":"虾饺","name_fr":"Raviolis aux crevettes","qty":2,"price":16.50}]
    subtotal REAL NOT NULL,              -- 菜品总价
    cashback_used REAL DEFAULT 0,        -- 本单使用的Balance金额
    total_paid REAL NOT NULL,            -- 实际支付金额（subtotal - cashback_used）
    cashback_earned REAL DEFAULT 0,      -- 本单获得的返点
    payment_method TEXT,                 -- 'stancer' | 'balance' | 'mixed' | 'cash'
    payment_id TEXT,                     -- Stancer交易ID
    status TEXT DEFAULT 'pending',       -- 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    table_number TEXT,                   -- 桌号（扫码点餐时传入）
    note TEXT,                           -- 客户备注
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- OTP验证码表
CREATE TABLE otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,           -- 6位数字
    expires_at DATETIME NOT NULL, -- 10分钟过期
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_balance_customer ON balance_transactions(customer_id);
CREATE INDEX idx_otp_email ON otp_codes(email, used);
```

---

## 第二步：API路由实现

在stand9的ClawShow MCP Server中添加REST端点。和neige-rouge的API架构保持一致（同一个Express/Fastify进程，按namespace路由）。

**基础路径：** `/api/dragons-elysees`

### 2.1 认证端点

#### POST /api/dragons-elysees/auth/send-otp

请求：
```json
{
  "email": "client@example.com"
}
```

逻辑：
1. 生成6位随机数字验证码
2. 存入otp_codes表，expires_at = NOW() + 10分钟
3. 通过Gmail SMTP发送邮件（复用neige-rouge的send_notification邮件通道，smtp.gmail.com:465）
4. 返回 `{ "success": true, "message": "Code envoyé" }`

邮件内容：
```
From: Dragons Elysées <配置的Gmail地址>
Subject: Dragons Elysées - Votre code de connexion
Body:
  Bonjour,

  Votre code de connexion : 385291

  Ce code expire dans 10 minutes.

  Dragons Elysées 龙城酒楼
  11 Rue de Berri, 75008 Paris
```

#### POST /api/dragons-elysees/auth/verify-otp

请求：
```json
{
  "email": "client@example.com",
  "code": "385291"
}
```

逻辑：
1. 查找otp_codes中email匹配、未使用、未过期的最新记录
2. 验证code是否匹配
3. 标记OTP为已使用（used = 1）
4. 如果customers表中不存在该email，自动创建新客户记录
5. 更新customer的last_login
6. 生成JWT token（payload: { customer_id, email }，密钥从.env读取）
7. 返回：
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "customer": {
    "id": 1,
    "email": "client@example.com",
    "name": null,
    "balance": 0
  }
}
```

#### GET /api/dragons-elysees/auth/me

Headers: `Authorization: Bearer <token>`

逻辑：
1. 验证JWT token
2. 查询customer信息
3. 计算余额：`SELECT COALESCE(SUM(amount), 0) FROM balance_transactions WHERE customer_id = ?`
4. 返回客户信息 + 余额

---

### 2.2 订单端点

#### POST /api/dragons-elysees/orders

请求：
```json
{
  "items": [
    {"id": "V1", "name_zh": "虾饺", "name_fr": "Raviolis aux crevettes", "qty": 2, "price": 16.50},
    {"id": "M5", "name_zh": "铁板洋葱牛柳", "name_fr": "Bœuf plancha oignons", "qty": 1, "price": 35.00}
  ],
  "table_number": "5",
  "note": "",
  "customer_id": null,
  "cashback_use": 0,
  "payment_method": "stancer"
}
```

逻辑：
1. 生成订单号：查询当日最大序号，+1，格式 `DRG-XXX`（三位数，每日不重置，持续递增）
2. 计算 subtotal = SUM(qty * price)
3. 如果 customer_id 存在且 cashback_use > 0：
   - 查询客户当前余额
   - cashback_used = MIN(cashback_use, 当前余额)
   - total_paid = subtotal - cashback_used
   - 写入 balance_transactions: type='payment', amount=-cashback_used
4. 否则：total_paid = subtotal
5. 插入orders表
6. 返回订单详情（含order_number）

#### GET /api/dragons-elysees/orders

Query参数：
- `status` — 按状态筛选（可选）
- `date` — 按日期筛选，格式YYYY-MM-DD（可选）
- `customer_id` — 按客户筛选（可选）

返回订单列表。

#### GET /api/dragons-elysees/orders/:id

返回单个订单详情。

#### PATCH /api/dragons-elysees/orders/:id

请求：
```json
{
  "status": "preparing"
}
```

逻辑：
1. 更新订单状态
2. 更新 updated_at = NOW()
3. 如果新状态是 'paid' 且之前不是 'paid'：触发返点逻辑（见下方）
4. 返回更新后的订单

---

### 2.3 Balance端点

#### GET /api/dragons-elysees/balance

Headers: `Authorization: Bearer <token>`

返回：
```json
{
  "balance": 12.50,
  "total_earned": 25.00,
  "total_used": 12.50
}
```

#### GET /api/dragons-elysees/balance/transactions

Headers: `Authorization: Bearer <token>`

Query参数：
- `limit` — 返回条数，默认20
- `offset` — 翻页偏移

返回：
```json
{
  "transactions": [
    {
      "id": 5,
      "type": "cashback",
      "amount": 3.50,
      "description": "10% cashback - Commande DRG-042",
      "related_order_id": 42,
      "created_at": "2026-04-09T12:30:00Z"
    },
    {
      "id": 4,
      "type": "payment",
      "amount": -5.00,
      "description": "Paiement par solde - Commande DRG-041",
      "related_order_id": 41,
      "created_at": "2026-04-09T11:15:00Z"
    }
  ],
  "total": 5
}
```

---

### 2.4 支付端点

#### POST /api/dragons-elysees/payment/create

请求：
```json
{
  "order_id": 42,
  "amount": 50.40,
  "return_url": "https://jason2016.github.io/dragons-elysees/#/payment-success?order=DRG-042"
}
```

逻辑：
1. 调用Stancer API创建支付（复用现有generate_payment工具的Stancer逻辑）
2. 返回支付链接URL
3. 如果Stancer不可用，fallback到SumUp

返回：
```json
{
  "payment_url": "https://payment.stancer.com/...",
  "payment_id": "paym_xxx"
}
```

#### POST /api/dragons-elysees/payment/webhook

Stancer支付回调（或SumUp回调）：

逻辑：
1. 验证回调签名
2. 找到对应订单（通过payment_id）
3. 更新订单状态为 'paid'
4. **触发返点逻辑：**
   - 如果 customer_id 存在 且 total_paid >= 15.00
   - cashback = ROUND(total_paid * 0.10, 2)
   - 写入 balance_transactions: type='cashback', amount=cashback, description='10% cashback - Commande DRG-XXX'
   - 更新 orders.cashback_earned = cashback
5. 返回 200 OK

---

## 第三步：返点业务规则

| 规则 | 值 |
|------|-----|
| 返点比例 | 10% |
| 最低消费门槛 | €15.00（total_paid >= 15才返） |
| 返点精度 | 精确到分（ROUND(x, 2)） |
| 返点入账时机 | 支付成功回调时立即入账 |
| 余额使用 | 结账时可选全额或部分抵扣，不能超过当前余额 |
| 余额抵扣部分 | 不再产生返点（只对实际支付金额计算返点） |
| 余额过期 | MVP阶段不过期 |

**示例：**
```
客户余额: €5.60
点餐总价: €56.00
选择用余额抵扣: €5.60
实际Stancer支付: €50.40
获得返点: €50.40 × 10% = €5.04（只对实际支付金额返点）
新余额: €0 + €5.04 = €5.04
```

---

## 第四步：CORS配置

允许以下来源的跨域请求（和neige-rouge一样的方式）：

```javascript
const allowedOrigins = [
  'https://jason2016.github.io',
  'http://localhost:5173',  // 本地开发
  'http://localhost:3000'
];
```

---

## 第五步：环境变量

在stand9的 `/opt/clawshow-mcp-server/.env` 中确认/添加：

```bash
# 已有（neige-rouge共用）
GMAIL_USER=xxx@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
STANCER_API_KEY=stest_xxx  # 或正式key

# 新增
DRAGONS_JWT_SECRET=随机生成一个32位字符串
DRAGONS_KITCHEN_PASSWORD=dragons2026
DRAGONS_ADMIN_PASSWORD=admin2026
```

---

## 第六步：前端对接

后端API全部就绪后，需要更新dragons-elysees前端项目（另一个workspace）的 `src/utils/api.js`，将API基础URL指向：

```javascript
const API_BASE = 'https://mcp.clawshow.ai/api/dragons-elysees';
// 或者直接用stand9 IP（如果MCP Server和API在同一进程）
// const API_BASE = 'https://51.77.201.82:端口/api/dragons-elysees';
```

确保以下调用全部正常：
- 登录页 → send-otp → verify-otp → 拿到token
- 账户页 → auth/me → 显示余额
- 结账页 → orders POST → payment/create → 跳转支付
- 支付成功 → webhook触发 → 返点入账
- 后厨大屏 → orders GET(?status=paid,preparing) → PATCH更新状态

---

## 第七步：测试验收

### 7.1 OTP登录测试
```bash
# 发送OTP
curl -X POST https://mcp.clawshow.ai/api/dragons-elysees/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"jasonlu612@gmail.com"}'

# 检查邮箱收到验证码后
curl -X POST https://mcp.clawshow.ai/api/dragons-elysees/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"jasonlu612@gmail.com","code":"123456"}'
# 应返回token
```

### 7.2 订单+返点测试
```bash
# 创建订单
curl -X POST https://mcp.clawshow.ai/api/dragons-elysees/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items":[{"id":"V1","name_zh":"虾饺","name_fr":"Raviolis","qty":2,"price":16.50},{"id":"M5","name_zh":"铁板牛柳","name_fr":"Boeuf","qty":1,"price":35.00}],
    "subtotal":68.00,
    "cashback_use":0,
    "total_paid":68.00,
    "payment_method":"stancer"
  }'

# 模拟支付成功回调（测试返点）
curl -X POST https://mcp.clawshow.ai/api/dragons-elysees/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"payment_id":"test_xxx","status":"paid"}'

# 查询余额（应该有 68.00 * 10% = 6.80）
curl https://mcp.clawshow.ai/api/dragons-elysees/balance \
  -H "Authorization: Bearer <token>"
```

### 7.3 后厨大屏测试
```bash
# 查询待处理订单
curl "https://mcp.clawshow.ai/api/dragons-elysees/orders?status=paid"

# 更新为制作中
curl -X PATCH https://mcp.clawshow.ai/api/dragons-elysees/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"preparing"}'

# 更新为请取餐
curl -X PATCH https://mcp.clawshow.ai/api/dragons-elysees/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"ready"}'
```

### 7.4 完整前端流程测试

在手机上打开 https://jason2016.github.io/dragons-elysees/：
- [ ] 浏览菜单，加入购物车
- [ ] 点击结账 → 选择"登录"→ 输入邮箱 → 收到OTP → 验证成功
- [ ] 看到余额（首次为0）→ 选择Stancer支付 → 跳转支付页
- [ ] 支付成功 → 返回成功页 → 显示返点金额 + Google评价按钮
- [ ] 点击Google评价按钮 → 跳转到Google Maps评价页
- [ ] 进入"我的账户"→ 看到余额和交易历史
- [ ] 后厨大屏（密码dragons2026）→ 显示新订单 → 点完成 → 叫号

全部通过则Step 2完成，可以正式给老板演示完整流程。

---

*Powered by ClawShow — Instant Backend for Small Business*
