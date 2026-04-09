# 🐉 Dragons Elysées 龙城酒楼 — MVP 执行 Prompt

> 发送给 VS Code Claude Code 执行
> 日期：2026-04-09
> 项目类型：餐厅扫码点餐 + Balance返点 + Google评价引导
> 参考项目：neige-rouge（红雪餐厅）

---

## 项目概述

为巴黎香榭丽舍旁的高端中餐厅"龙城酒楼 Dragons Elysées"（11 Rue de Berri, 75008 Paris）构建扫码点餐MVP系统。

**核心功能：**
1. 手机扫码浏览菜单 + 加购物车 + 提交订单 + 在线付款（Stancer）
2. 付款后自动获得10%返点到Balance账户（邮箱OTP登录查看余额）
3. 付款成功后引导客户到Google Maps给餐厅写评价
4. 后厨大屏显示订单队列 + 管理后台

**设计要求：** 高端、时尚、年轻化。香榭丽舍旁的中餐厅，客群是年轻人。暗色调+金色/红色点缀，菜品大图沉浸式体验，移动端优先。

---

## 第一步：创建项目

```bash
# 在本地创建项目
mkdir -p ~/projects/dragons-elysees
cd ~/projects/dragons-elysees
npm create vite@latest . -- --template react
npm install
```

**项目结构：**
```
dragons-elysees/
├── public/
│   └── data/
│       └── menu.json          # 菜单数据（见下方）
├── src/
│   ├── App.jsx                # 路由主入口
│   ├── main.jsx
│   ├── index.css              # 全局样式（暗色主题）
│   ├── components/
│   │   ├── MenuBrowser.jsx    # 菜单浏览（分类+大图+加购物车）
│   │   ├── Cart.jsx           # 购物车侧边栏/底部栏
│   │   ├── Checkout.jsx       # 结账页面（选择付款方式：在线/Balance）
│   │   ├── PaymentSuccess.jsx # 付款成功 + 返点通知 + Google评价引导
│   │   ├── AccountLogin.jsx   # 邮箱OTP登录
│   │   ├── AccountDashboard.jsx # 我的账户（余额+交易历史）
│   │   ├── KitchenDisplay.jsx # 后厨大屏
│   │   ├── AdminPanel.jsx     # 管理后台
│   │   └── Header.jsx         # 顶部导航
│   ├── hooks/
│   │   ├── useCart.js          # 购物车状态管理
│   │   └── useAuth.js         # 认证状态管理
│   └── utils/
│       └── api.js             # API调用封装
├── package.json
└── vite.config.js
```

---

## 第二步：GitHub仓库

```bash
# 在GitHub创建仓库（用jason2016账号）
# 仓库名：dragons-elysees
# 设为Public（GitHub Pages需要）

git init
git remote add origin git@github.com:jason2016/dragons-elysees.git
```

**GitHub Pages配置：** 和neige-rouge一样，用gh-pages分支部署。
```bash
npm install gh-pages --save-dev
```

package.json添加：
```json
{
  "homepage": "https://jason2016.github.io/dragons-elysees",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

vite.config.js：
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/dragons-elysees/'
})
```

---

## 第三步：菜单数据

创建 `public/data/menu.json`，内容如下。**注意：这是从现有OKO网站抓取的真实菜单数据，已结构化。**

菜品图片：大部分菜品在OKO网站上没有图片（只找到1张P12的图片）。MVP阶段使用分类占位图方案——每个分类一张美观的代表图，后续老板提供真实照片后替换。

```json
{
  "restaurant": {
    "name_zh": "龙城酒楼",
    "name_fr": "Dragons Elysées",
    "address": "11 Rue de Berri, 75008 Paris, France",
    "phone": "01 44 07 26 17",
    "hours": "周一至周日 11h-14h, 18h-23h",
    "google_place_id": "ChIJGZMEfMFv5kcRwVHuMf-SVS4",
    "logo_url": "https://ams3.digitaloceanspaces.com/tmi-images/dragons_elysees_龙城酒楼_376/logo/ef2bc4cd-8673-4207-bb8d-996975b823b3.png",
    "namespace": "dragons-elysees",
    "cashback_rate": 0.10,
    "cashback_min_order": 15
  },
  "categories": [
    {
      "id": "set-menus",
      "name_zh": "套餐",
      "name_fr": "Menus",
      "items": [
        {"id": "SM01", "name_zh": "午市套餐", "name_fr": "Menu Midi", "price": 26.00},
        {"id": "SM02", "name_zh": "午市套餐2", "name_fr": "Menu Midi 2", "price": 29.00},
        {"id": "SM03", "name_zh": "35号套餐", "name_fr": "Menu 35", "price": 35.00},
        {"id": "SM04", "name_zh": "39号套餐", "name_fr": "Menu 39", "price": 39.00},
        {"id": "SM05", "name_zh": "龙城套餐", "name_fr": "Menu Dragon", "price": 56.00},
        {"id": "SM06", "name_zh": "品鉴套餐", "name_fr": "Menu Découverte", "price": 150.00},
        {"id": "SM07", "name_zh": "鸭套餐", "name_fr": "Menu Canard", "price": 150.00}
      ]
    },
    {
      "id": "soups-salads",
      "name_zh": "汤类和沙拉",
      "name_fr": "Soupes et Salades",
      "items": [
        {"id": "S1", "name_zh": "鸡肉玉米汤", "name_fr": "Soupe poulet maïs", "price": 16.50},
        {"id": "S2", "name_zh": "蟹肉芦笋汤", "name_fr": "Soupe crabe asperges", "price": 18.50},
        {"id": "S3", "name_zh": "北京酸辣汤", "name_fr": "Soupe Pékinoise piquante", "price": 16.50},
        {"id": "S4", "name_zh": "粉丝鸡汤", "name_fr": "Soupe poulet vermicelles", "price": 16.50},
        {"id": "S5", "name_zh": "云吞汤", "name_fr": "Soupe wonton", "price": 18.50},
        {"id": "S6", "name_zh": "鱼翅汤", "name_fr": "Soupe aux ailerons", "price": 38.00},
        {"id": "S7", "name_zh": "蟹沙拉", "name_fr": "Salade de crabe", "price": 18.00},
        {"id": "S8", "name_zh": "鸡沙拉", "name_fr": "Salade de poulet", "price": 16.00},
        {"id": "S9", "name_zh": "虾沙拉", "name_fr": "Salade de crevettes", "price": 18.00},
        {"id": "S10", "name_zh": "生春卷", "name_fr": "Rouleaux de printemps frais", "price": 16.00}
      ]
    },
    {
      "id": "dim-sum",
      "name_zh": "点心",
      "name_fr": "Dim Sum",
      "items": [
        {"id": "V1", "name_zh": "虾饺", "name_fr": "Raviolis aux crevettes", "price": 16.50},
        {"id": "V2", "name_zh": "烧卖", "name_fr": "Siu Mai", "price": 16.50},
        {"id": "V3", "name_zh": "干贝烧卖", "name_fr": "Siu Mai St-Jacques", "price": 19.50},
        {"id": "V4", "name_zh": "粉果", "name_fr": "Fun Gor", "price": 16.50},
        {"id": "V5", "name_zh": "点心拼盘", "name_fr": "Assortiment Dim Sum", "price": 19.50},
        {"id": "V6", "name_zh": "鸡冠饺", "name_fr": "Raviolis crête de coq", "price": 16.50},
        {"id": "V7", "name_zh": "金不换鸡饺", "name_fr": "Raviolis poulet basilic", "price": 16.50},
        {"id": "V8", "name_zh": "素饺", "name_fr": "Raviolis végétariens", "price": 15.00},
        {"id": "V9", "name_zh": "鱼饺", "name_fr": "Raviolis au poisson", "price": 18.50},
        {"id": "V10", "name_zh": "锅贴", "name_fr": "Gyoza grillés", "price": 16.50},
        {"id": "V11", "name_zh": "鸡肉小笼包", "name_fr": "Xiao Long Bao poulet", "price": 16.50},
        {"id": "V12", "name_zh": "香煎鸡肉小笼包", "name_fr": "Xiao Long Bao grillé", "price": 16.50},
        {"id": "V13", "name_zh": "糯米鸡", "name_fr": "Riz gluant au poulet", "price": 18.50},
        {"id": "V14", "name_zh": "越式肠粉", "name_fr": "Bánh cuốn", "price": 15.00}
      ]
    },
    {
      "id": "fried",
      "name_zh": "炸品",
      "name_fr": "Fritures",
      "items": [
        {"id": "F1", "name_zh": "鸡春卷", "name_fr": "Nems au poulet", "price": 15.00},
        {"id": "F2", "name_zh": "虾春卷", "name_fr": "Nems aux crevettes", "price": 16.50},
        {"id": "F3", "name_zh": "龙虾饺", "name_fr": "Raviolis au homard frits", "price": 16.50},
        {"id": "F4", "name_zh": "炸虾", "name_fr": "Crevettes frites", "price": 18.00},
        {"id": "F5", "name_zh": "鱼多士", "name_fr": "Toasts au poisson", "price": 18.00},
        {"id": "F6", "name_zh": "虾多士", "name_fr": "Toasts aux crevettes", "price": 18.00},
        {"id": "F7", "name_zh": "百花蟹钳（两件）", "name_fr": "Pinces de crabe farcies (2 pcs)", "price": 26.50}
      ]
    },
    {
      "id": "seafood",
      "name_zh": "虾蟹类",
      "name_fr": "Fruits de Mer",
      "items": [
        {"id": "C1", "name_zh": "干烧虾", "name_fr": "Crevettes sautées piquantes", "price": 35.00},
        {"id": "C2", "name_zh": "椒盐明虾", "name_fr": "Gambas sel et poivre", "price": 37.00},
        {"id": "C3", "name_zh": "咕咾虾", "name_fr": "Crevettes aigre-douce", "price": 35.00},
        {"id": "C4", "name_zh": "铁板姜葱明虾", "name_fr": "Gambas gingembre ciboule", "price": 37.00},
        {"id": "C5", "name_zh": "鲜菠萝腰果虾", "name_fr": "Crevettes ananas cajou", "price": 37.00},
        {"id": "C6", "name_zh": "豉汁蒸明虾", "name_fr": "Gambas vapeur sauce soja", "price": 37.00},
        {"id": "C7", "name_zh": "干烧蟹钳", "name_fr": "Pinces de crabe sautées", "price": 37.00},
        {"id": "C8", "name_zh": "椒盐蟹钳", "name_fr": "Pinces de crabe sel poivre", "price": 37.00},
        {"id": "C9", "name_zh": "椒盐鲜鱿鱼", "name_fr": "Calamars sel et poivre", "price": 28.00},
        {"id": "C10", "name_zh": "椒盐田鸡腿", "name_fr": "Cuisses de grenouille sel poivre", "price": 33.00},
        {"id": "C11", "name_zh": "椒盐软壳蟹", "name_fr": "Crabe mou sel et poivre", "price": 35.00},
        {"id": "C12", "name_zh": "龙虾", "name_fr": "Homard", "price": 108.00, "note_zh": "姜葱/椒盐/干烧", "note_fr": "Gingembre/Sel-poivre/Piquant"}
      ]
    },
    {
      "id": "meat",
      "name_zh": "肉类",
      "name_fr": "Viandes",
      "items": [
        {"id": "M1", "name_zh": "宫保鸡", "name_fr": "Poulet Kung Pao", "price": 28.00},
        {"id": "M2", "name_zh": "咕咾鸡", "name_fr": "Poulet aigre-doux", "price": 28.00},
        {"id": "M3", "name_zh": "拔丝鸡", "name_fr": "Poulet caramélisé", "price": 28.00},
        {"id": "M4", "name_zh": "油淋鸡", "name_fr": "Poulet croustillant", "price": 28.00},
        {"id": "M5", "name_zh": "铁板洋葱牛柳", "name_fr": "Bœuf plancha oignons", "price": 35.00},
        {"id": "M6", "name_zh": "铁板宫保牛柳", "name_fr": "Bœuf Kung Pao plancha", "price": 35.00},
        {"id": "M7", "name_zh": "铁板沙茶牛柳", "name_fr": "Bœuf satay plancha", "price": 35.00},
        {"id": "M8", "name_zh": "铁板黑椒牛柳", "name_fr": "Bœuf poivre noir plancha", "price": 35.00},
        {"id": "M9", "name_zh": "铁板姜葱牛柳", "name_fr": "Bœuf gingembre plancha", "price": 35.00},
        {"id": "M10", "name_zh": "龙城牛柳", "name_fr": "Bœuf Dragons Elysées", "price": 35.00},
        {"id": "M11", "name_zh": "泰式牛柳", "name_fr": "Bœuf thaï", "price": 35.00},
        {"id": "M12", "name_zh": "广东烧鸭", "name_fr": "Canard rôti cantonais (demi)", "price": 45.00},
        {"id": "M13a", "name_zh": "北京片皮鸭（整只）", "name_fr": "Canard laqué pékinois (entier)", "price": 135.00},
        {"id": "M13b", "name_zh": "北京片皮鸭（半只）", "name_fr": "Canard laqué pékinois (demi)", "price": 68.00}
      ]
    },
    {
      "id": "fish",
      "name_zh": "鱼类",
      "name_fr": "Poissons",
      "items": [
        {"id": "P1", "name_zh": "清蒸鲈鱼", "name_fr": "Bar vapeur", "price": 40.00},
        {"id": "P2", "name_zh": "泰式煎鲈鱼", "name_fr": "Bar grillé thaï", "price": 40.00},
        {"id": "P3", "name_zh": "干烧鲷鱼", "name_fr": "Daurade sautée piquante", "price": 40.00},
        {"id": "P4", "name_zh": "清蒸龙利鱼", "name_fr": "Sole vapeur", "price": 43.00},
        {"id": "P5", "name_zh": "椒盐龙利鱼", "name_fr": "Sole sel et poivre", "price": 43.00},
        {"id": "P6", "name_zh": "黑椒龙利鱼", "name_fr": "Sole poivre noir", "price": 43.00},
        {"id": "P7", "name_zh": "拔丝龙利鱼", "name_fr": "Sole caramélisée", "price": 43.00},
        {"id": "P8", "name_zh": "糖醋龙利鱼", "name_fr": "Sole aigre-douce", "price": 43.00},
        {"id": "P9", "name_zh": "多宝鱼（清蒸/椒盐）", "name_fr": "Turbot (vapeur/sel-poivre)", "price": 128.00},
        {"id": "P10", "name_zh": "清蒸扇贝（4只）", "name_fr": "St-Jacques vapeur (4 pcs)", "price": 36.00},
        {"id": "P11", "name_zh": "干烧干贝", "name_fr": "St-Jacques sautées piquantes", "price": 36.00},
        {"id": "P12", "name_zh": "椒盐干贝", "name_fr": "St-Jacques sel et poivre", "price": 36.00, "image_url": "https://ams3.digitaloceanspaces.com/tmi-images/dragons_elysees_龙城酒楼_376/menu/dishes/FurLyAxyRNsXgjm4K.jpg"}
      ]
    },
    {
      "id": "thai-soups",
      "name_zh": "泰餐-汤和沙拉",
      "name_fr": "Thaï - Soupes et Salades",
      "items": [
        {"id": "T201", "name_zh": "冬阴功海鲜汤", "name_fr": "Tom Yum fruits de mer", "price": 20.00},
        {"id": "T202", "name_zh": "冬阴功虾汤", "name_fr": "Tom Yum crevettes", "price": 18.00},
        {"id": "T203", "name_zh": "椰汁鸡汤", "name_fr": "Tom Kha Kai", "price": 16.00},
        {"id": "T204", "name_zh": "椰汁虾汤", "name_fr": "Tom Kha crevettes", "price": 18.00},
        {"id": "T205", "name_zh": "泰式牛沙拉", "name_fr": "Salade thaï bœuf", "price": 18.00},
        {"id": "T206", "name_zh": "泰式芒果虾沙拉", "name_fr": "Salade mangue crevettes", "price": 18.00},
        {"id": "T207", "name_zh": "泰式鲜菠萝海鲜沙拉", "name_fr": "Salade ananas fruits de mer", "price": 23.00},
        {"id": "T208", "name_zh": "泰式虾春卷", "name_fr": "Nems thaï crevettes", "price": 16.50}
      ]
    },
    {
      "id": "thai-mains",
      "name_zh": "泰餐-泰式主菜",
      "name_fr": "Thaï - Plats Principaux",
      "items": [
        {"id": "T218", "name_zh": "串烧鸡（3件）", "name_fr": "Brochettes poulet (3 pcs)", "price": 18.00},
        {"id": "T219", "name_zh": "串烧牛（3件）", "name_fr": "Brochettes bœuf (3 pcs)", "price": 20.00},
        {"id": "T220", "name_zh": "串烧拼盘（4件）", "name_fr": "Assortiment brochettes (4 pcs)", "price": 25.00},
        {"id": "T221", "name_zh": "咖喱鸡", "name_fr": "Curry de poulet", "price": 28.00},
        {"id": "T222", "name_zh": "香茅鸡", "name_fr": "Poulet citronnelle", "price": 28.00},
        {"id": "T223", "name_zh": "铁板金不换鸡", "name_fr": "Poulet basilic plancha", "price": 29.00},
        {"id": "T224", "name_zh": "铁板金不换鸭", "name_fr": "Canard basilic plancha", "price": 32.00},
        {"id": "T225", "name_zh": "铁板金不换田鸡腿", "name_fr": "Grenouille basilic plancha", "price": 33.00},
        {"id": "T226", "name_zh": "铁板金不换虾", "name_fr": "Crevettes basilic plancha", "price": 37.00},
        {"id": "T227", "name_zh": "铁板金不换牛", "name_fr": "Bœuf basilic plancha", "price": 35.00},
        {"id": "T228", "name_zh": "铁板金不换干贝", "name_fr": "St-Jacques basilic plancha", "price": 36.00},
        {"id": "T229", "name_zh": "咖喱干贝", "name_fr": "Curry de St-Jacques", "price": 36.00},
        {"id": "T230", "name_zh": "串烧龙利鱼", "name_fr": "Brochettes de sole", "price": 38.00}
      ]
    },
    {
      "id": "vegetarian",
      "name_zh": "素餐",
      "name_fr": "Végétarien",
      "items": [
        {"id": "A1", "name_zh": "粉丝菜汤", "name_fr": "Soupe vermicelles légumes", "price": 16.50},
        {"id": "A2", "name_zh": "酸辣汤", "name_fr": "Soupe piquante", "price": 16.50},
        {"id": "A3", "name_zh": "泰式香茅沙拉", "name_fr": "Salade citronnelle thaï", "price": 16.50},
        {"id": "A4", "name_zh": "素春卷", "name_fr": "Nems végétariens", "price": 15.50},
        {"id": "A5", "name_zh": "素生春", "name_fr": "Rouleaux frais végétariens", "price": 15.50},
        {"id": "A6", "name_zh": "素炒饭", "name_fr": "Riz sauté végétarien", "price": 9.50},
        {"id": "A7", "name_zh": "素炒面", "name_fr": "Nouilles sautées végétariennes", "price": 12.00},
        {"id": "A8", "name_zh": "越式肠粉", "name_fr": "Bánh cuốn végétarien", "price": 15.50},
        {"id": "A9", "name_zh": "罗汉素煲", "name_fr": "Cassolette bouddha", "price": 22.00},
        {"id": "A10", "name_zh": "清炒木耳", "name_fr": "Champignons noirs sautés", "price": 14.50},
        {"id": "A11", "name_zh": "椒盐豆腐", "name_fr": "Tofu sel et poivre", "price": 16.00},
        {"id": "A12", "name_zh": "麻婆豆腐", "name_fr": "Mapo Tofu", "price": 18.00},
        {"id": "A13", "name_zh": "西兰花", "name_fr": "Brocoli sauté", "price": 18.00, "note_zh": "清炒/蒜蓉", "note_fr": "Sauté/Ail"},
        {"id": "A14", "name_zh": "炒时蔬", "name_fr": "Légumes de saison sautés", "price": 18.00}
      ]
    },
    {
      "id": "rice-noodles",
      "name_zh": "配饭",
      "name_fr": "Riz et Nouilles",
      "items": [
        {"id": "A15", "name_zh": "白饭", "name_fr": "Riz blanc", "price": 6.00},
        {"id": "A16", "name_zh": "糯米饭", "name_fr": "Riz gluant", "price": 8.00},
        {"id": "A17", "name_zh": "广东炒饭", "name_fr": "Riz cantonais", "price": 10.00},
        {"id": "A18", "name_zh": "素炒面", "name_fr": "Nouilles sautées", "price": 12.00},
        {"id": "A19", "name_zh": "泰式虾炒饭", "name_fr": "Riz sauté thaï crevettes", "price": 12.00},
        {"id": "A20", "name_zh": "杂炒", "name_fr": "Légumes sautés variés", "price": 16.00}
      ]
    },
    {
      "id": "desserts",
      "name_zh": "甜点",
      "name_fr": "Desserts",
      "items": [
        {"id": "D01", "name_zh": "冰淇淋2球", "name_fr": "Glace 2 boules", "price": 10.00},
        {"id": "D02", "name_zh": "冰淇淋1球", "name_fr": "Glace 1 boule", "price": 6.00},
        {"id": "D03", "name_zh": "芭提雅杯", "name_fr": "Coupe Pattaya", "price": 14.00},
        {"id": "D04", "name_zh": "太阳杯", "name_fr": "Coupe de Soleil", "price": 16.00},
        {"id": "D05", "name_zh": "泰式杯", "name_fr": "Coupe Thaï", "price": 14.00},
        {"id": "D06", "name_zh": "太平洋杯", "name_fr": "Coupe Pacifique", "price": 18.00},
        {"id": "D07", "name_zh": "黑森林", "name_fr": "Forêt Noire", "price": 16.00},
        {"id": "D08", "name_zh": "水果沙拉", "name_fr": "Salade de fruits", "price": 16.00},
        {"id": "D09", "name_zh": "新鲜芒果", "name_fr": "Mangue fraîche", "price": 16.00},
        {"id": "D10", "name_zh": "新鲜菠萝", "name_fr": "Ananas frais", "price": 14.00},
        {"id": "D11", "name_zh": "芒果糯米饭", "name_fr": "Riz gluant mangue", "price": 18.00},
        {"id": "D12", "name_zh": "泰式布丁", "name_fr": "Flan Thaï", "price": 12.00},
        {"id": "D13", "name_zh": "芝麻汤圆", "name_fr": "Boules de riz sésame noir", "price": 10.00},
        {"id": "D14", "name_zh": "火焰水果", "name_fr": "Beignets fruits flambés", "price": 18.00},
        {"id": "D15", "name_zh": "炸水果", "name_fr": "Beignets de fruits", "price": 14.00},
        {"id": "D16", "name_zh": "姜糖果仁", "name_fr": "Gingembres confits nougats", "price": 10.00},
        {"id": "D17", "name_zh": "冰麻薯", "name_fr": "Mochis glacés", "price": 10.00},
        {"id": "D18", "name_zh": "椰丝球", "name_fr": "Boules de coco", "price": 12.00},
        {"id": "D19", "name_zh": "巧克力春卷", "name_fr": "Nem au chocolat", "price": 15.00},
        {"id": "D20", "name_zh": "糖水荔枝", "name_fr": "Lychees en sirop", "price": 8.00}
      ]
    },
    {
      "id": "drinks",
      "name_zh": "饮品",
      "name_fr": "Boissons",
      "items": [
        {"id": "B01", "name_zh": "茶", "name_fr": "Thé chinois", "price": 8.00},
        {"id": "B02", "name_zh": "咖啡/低因", "name_fr": "Café/Déca", "price": 5.00},
        {"id": "B03", "name_zh": "卡布奇诺", "name_fr": "Café crème", "price": 7.00},
        {"id": "B04", "name_zh": "鲜榨橙汁", "name_fr": "Orange pressé", "price": 12.00},
        {"id": "B05", "name_zh": "果汁", "name_fr": "Jus de fruit", "price": 6.50},
        {"id": "B06", "name_zh": "冰茶/雪碧/橙汁汽水", "name_fr": "Ice tea/Sprite/Orangina", "price": 6.50},
        {"id": "B07", "name_zh": "可乐/零度", "name_fr": "Coca/Coca Zéro", "price": 6.50},
        {"id": "B08", "name_zh": "糖浆水", "name_fr": "Sirop", "price": 3.50},
        {"id": "B09", "name_zh": "矿泉水（半瓶）", "name_fr": "1/2 Evian/SP", "price": 7.00},
        {"id": "B10", "name_zh": "矿泉水（整瓶）", "name_fr": "Evian/SP", "price": 12.00}
      ]
    },
    {
      "id": "lobster-special",
      "name_zh": "龙虾专区",
      "name_fr": "Homard & Langouste",
      "items": [
        {"id": "L01", "name_zh": "龙虾", "name_fr": "Homard", "price": 90.00},
        {"id": "L02", "name_zh": "龙虾", "name_fr": "Homard", "price": 98.00},
        {"id": "L03", "name_zh": "龙虾", "name_fr": "Homard", "price": 120.00},
        {"id": "L04", "name_zh": "龙虾（大）", "name_fr": "Langouste", "price": 280.00},
        {"id": "L05", "name_zh": "龙虾（大）", "name_fr": "Langouste", "price": 350.00},
        {"id": "L06", "name_zh": "龙虾（大）", "name_fr": "Langouste", "price": 380.00}
      ]
    }
  ]
}
```

**注意：** 酒水类（Vin Rouge/Blanc/Rosé, Champagnes, Apéritifs, Digestifs, Cocktails）数据量大但不是堂食点餐核心，MVP暂不放入菜单浏览。可以用一个"酒水单请咨询服务员"提示。后续Phase 2加入完整酒单。

---

## 第四步：后端API（stand9）

需要在stand9（51.77.201.82）上为dragons-elysees创建后端API。**和neige-rouge的架构完全一样**，用SQLite存储，namespace隔离。

### 数据库Schema

```sql
-- 文件: /opt/clawshow-mcp-server/data/dragons-elysees.db

-- 客户表
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    balance REAL DEFAULT 0,  -- 当前余额（缓存字段，实际以transactions为准）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Balance交易记录表
CREATE TABLE balance_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    type TEXT NOT NULL,  -- 'cashback' | 'payment' | 'topup' | 'adjustment'
    amount REAL NOT NULL,  -- 正数=入账，负数=扣款
    description TEXT,
    related_order_id INTEGER,  -- 关联的订单ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- 订单表
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,  -- DRG-001 格式
    customer_id INTEGER,  -- 可为NULL（未登录客户）
    items TEXT NOT NULL,  -- JSON: [{"id":"V1","name":"虾饺","qty":2,"price":16.50}]
    subtotal REAL NOT NULL,
    cashback_used REAL DEFAULT 0,  -- 本单使用的Balance金额
    total_paid REAL NOT NULL,  -- 实际支付金额
    cashback_earned REAL DEFAULT 0,  -- 本单获得的返点
    payment_method TEXT,  -- 'stancer' | 'balance' | 'mixed' | 'cash'
    payment_id TEXT,  -- Stancer交易ID
    status TEXT DEFAULT 'pending',  -- 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    table_number TEXT,  -- 桌号（可选）
    note TEXT,  -- 客户备注
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- OTP验证码表
CREATE TABLE otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,  -- 6位数字
    expires_at DATETIME NOT NULL,  -- 10分钟过期
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_balance_customer ON balance_transactions(customer_id);
CREATE INDEX idx_otp_email ON otp_codes(email, used);
```

### API端点

在stand9的ClawShow MCP Server中添加以下REST端点（和neige-rouge的API架构一致）：

```
基础路径: https://mcp.clawshow.ai/api/dragons-elysees

# 菜单
GET  /menu                         # 返回menu.json（前端也可直接读静态文件）

# 订单
POST /orders                       # 创建订单
GET  /orders                       # 查询订单（支持?status=&date=筛选）
GET  /orders/:id                   # 订单详情
PATCH /orders/:id                  # 更新订单状态（后厨用）

# 客户认证
POST /auth/send-otp               # 发送OTP到邮箱
POST /auth/verify-otp             # 验证OTP，返回session token
GET  /auth/me                     # 获取当前客户信息+余额

# Balance
GET  /balance                     # 查询余额（需认证）
GET  /balance/transactions        # 交易历史（需认证）

# 支付
POST /payment/create              # 创建Stancer支付
POST /payment/webhook             # Stancer/SumUp支付回调
```

### OTP邮件发送

复用ClawShow现有的send_notification邮件通道（Gmail SMTP，和红雪一样）：

```
发件人: ClawShow <notifications@clawshow.ai> 或配置的Gmail
主题: Dragons Elysées - Votre code de connexion
内容:
  Bonjour,
  Votre code de connexion est : 385291
  Ce code expire dans 10 minutes.
  Dragons Elysées 龙城酒楼
```

### Balance计算逻辑

```javascript
// 下单付款成功后
async function processPaymentSuccess(order, customerId) {
  // 1. 更新订单状态
  order.status = 'paid';
  
  // 2. 如果客户已登录且消费满€15，计算返点
  if (customerId && order.total_paid >= 15) {
    const cashback = Math.round(order.total_paid * 0.10 * 100) / 100; // 10%，精确到分
    
    // 记录返点交易
    await db.run(`INSERT INTO balance_transactions (customer_id, type, amount, description, related_order_id)
      VALUES (?, 'cashback', ?, ?, ?)`,
      [customerId, cashback, `10% cashback on order ${order.order_number}`, order.id]);
    
    // 更新缓存余额
    await db.run(`UPDATE customers SET balance = balance + ? WHERE id = ?`, [cashback, customerId]);
    
    order.cashback_earned = cashback;
  }
  
  return order;
}

// 使用Balance抵扣
async function applyBalanceToOrder(customerId, orderId, amount) {
  const customer = await db.get('SELECT balance FROM customers WHERE id = ?', customerId);
  const actualDeduct = Math.min(amount, customer.balance); // 不能超过余额
  
  await db.run(`INSERT INTO balance_transactions (customer_id, type, amount, description, related_order_id)
    VALUES (?, 'payment', ?, ?, ?)`,
    [customerId, -actualDeduct, `Balance payment for order`, orderId]);
  
  await db.run(`UPDATE customers SET balance = balance - ? WHERE id = ?`, [actualDeduct, customerId]);
  
  return actualDeduct;
}
```

---

## 第五步：前端实现要点

### 设计规范（Design Token）

```css
:root {
  /* 龙城酒楼 — 暗色高端主题 */
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --bg-card: #1a1a1a;
  --bg-card-hover: #222222;
  
  --text-primary: #f5f0e8;      /* 暖白 */
  --text-secondary: #a09882;     /* 暖灰 */
  --text-muted: #6b6355;
  
  --accent-gold: #c9a84c;        /* 主金色 */
  --accent-gold-light: #e8d48b;
  --accent-red: #c13b3b;         /* 中国红 */
  --accent-red-dark: #8b1a1a;
  
  --border-color: #2a2520;
  --border-gold: rgba(201, 168, 76, 0.3);
  
  /* 字体 — 高端感 */
  --font-display: 'Playfair Display', serif;  /* 标题 */
  --font-body: 'Noto Sans SC', 'DM Sans', sans-serif;  /* 正文，支持中文 */
  --font-price: 'DM Mono', monospace;  /* 价格 */
  
  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  
  /* 动效 */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
}
```

### Google Fonts 引入
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
```

### 路由结构

```
/#/                    → 首页（Logo + "开始点餐"按钮 + 餐厅简介）
/#/menu                → 菜单浏览 + 购物车
/#/checkout            → 结账（登录提示 + 付款方式选择）
/#/payment-success     → 付款成功 + 返点 + Google评价引导
/#/account             → 我的账户（需登录）
/#/account/login       → 邮箱OTP登录
/#/kitchen             → 后厨大屏（密码保护）
/#/admin               → 管理后台（密码保护）
```

### 关键交互流程

**点餐流程：**
```
菜单浏览 → 点击菜品卡片展开详情 → 点"加入购物车"
→ 底部购物车栏显示已选数量和总价
→ 点"去结账" → 结账页面
→ 选择：
  a) 直接付款（未登录）→ Stancer支付 → 成功页
  b) 登录后付款 → 显示Balance余额 → 可选"用余额抵扣" → 剩余金额Stancer支付 → 成功页
```

**付款成功页（关键页面）：**
```
✅ 订单确认
  订单号: DRG-042
  金额: €56.00
  已用余额抵扣: €5.60
  实际支付: €50.40
  
🎁 恭喜获得 €5.04 返点！
  已存入您的账户，下次可用。
  当前余额: €5.04
  
⭐ 您的用餐体验如何？
  [在Google上给我们评价]  ← 大按钮，跳转Google Maps评价页
  
📋 您的取餐号: #042
  请等待叫号取餐
```

**Google评价链接：**
```
https://search.google.com/local/writereview?placeid=ChIJGZMEfMFv5kcRwVHuMf-SVS4
```

### 菜品卡片设计（移动端）

```
┌─────────────────────────┐
│  [菜品大图 / 分类占位图]   │  ← 16:10比例
│                          │
├──────────────────────────┤
│  V1. 虾饺                 │  ← 中文名（大字，金色）
│  Raviolis aux crevettes   │  ← 法文名（小字，灰色）
│                          │
│  €16.50          [+ 加入] │  ← 价格（等宽字体）+ 加入按钮
└──────────────────────────┘
```

### 后厨大屏（复用红雪方案）

```
密码: dragons2026（stand9 .env 配置）

┌──────────────────┬──────────────────┐
│  🔥 待制作 (3)     │  ✅ 请取餐 (2)     │
│                   │                  │
│  #DRG-045         │  #DRG-043 ← 闪烁  │
│  V1 虾饺 ×2       │  #DRG-044        │
│  M5 铁板牛柳 ×1   │                  │
│  A15 白饭 ×2      │                  │
│  [✓ 完成]         │                  │
└──────────────────┴──────────────────┘
```

---

## 第六步：部署

1. **前端**：GitHub Pages → `https://jason2016.github.io/dragons-elysees/`
2. **后端API**：stand9上的ClawShow MCP Server（和红雪共用，namespace隔离）
3. **数据库**：stand9上 `/opt/clawshow-mcp-server/data/dragons-elysees.db`

### 部署命令
```bash
# 前端部署
npm run deploy

# stand9后端（SSH进去更新）
ssh root@51.77.201.82
cd /opt/clawshow-mcp-server
# 添加dragons-elysees相关API路由和数据库初始化
# 重启服务
systemctl restart clawshow-mcp
```

---

## 第七步：验收标准

MVP完成时，以下场景必须全部跑通：

- [ ] 手机访问网站，浏览菜单，中法双语显示正确
- [ ] 加入多个菜品到购物车，数量和总价正确
- [ ] 未登录直接付款 → Stancer支付链接 → 付款成功 → 显示取餐号
- [ ] 邮箱OTP登录 → 收到验证码邮件 → 验证成功 → 进入账户
- [ ] 登录后付款 → 选择用余额抵扣 → 剩余Stancer支付 → 返点入账
- [ ] 付款成功页显示Google评价引导按钮 → 点击跳转到Google Maps评价页
- [ ] 我的账户页显示余额和交易历史
- [ ] 后厨大屏实时显示新订单 → 点完成 → 移到叫号区
- [ ] 管理后台查看当日订单汇总

---

## 执行优先级

**今天必须完成（Step 1）：**
1. 创建GitHub仓库 `dragons-elysees`
2. Vite + React项目初始化
3. menu.json放入public/data/
4. 菜单浏览页面（分类导航 + 菜品卡片 + 购物车）
5. 首页 + 基本路由
6. 部署到GitHub Pages，确认可访问

**明天完成（Step 2）：**
7. stand9后端API（数据库+订单+OTP+Balance端点）
8. Stancer支付对接
9. 付款成功页 + Google评价引导
10. 后厨大屏 + 管理后台
11. 完整流程测试

---

*Powered by ClawShow — Instant Backend for Small Business*
