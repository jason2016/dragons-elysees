# 龙城单品菜单录入草稿 — Phase A（供 Jason / John 逐行核对）

> 来源 = John 的菜单照片（文字价目表 OCR）。**价格/名称均为 OCR，必有认错风险，请逐行核对。**
> 西语(es)按规则留空（前端兜底）。中文：菜单印的是**繁体**，本草稿统一转**简体**以匹配现站数据（见疑点 H）。
> ⚠️ 本草稿不改线上 menu.json，不上线。

## 图片 → 内容 映射（11 个文件）
| 文件 | 内容 | 用途 |
|---|---|---|
| #1 (114) | SOUPES ET SALADES 汤类沙拉 | 单品 → soups-salads |
| #2 (115) | CRUSTACÉS 虾蟹类 | 单品 → seafood |
| #3 (116) | CRUSTACÉS（**与 #2 完全重复**） | 去重，不重复录 |
| #4 (117) | DIM SUM 点心 + FRITURES 炸品 | 单品 → dim-sum + fried |
| #5 (118) | VIANDES VOLAILLES 肉类 | 单品 → meat |
| #6 (119) | **MENU CLASSIQUE 套餐页** | 套餐（已上线 SM08）非单品 |
| #7 (120) | PLATS VÉGÉTARIENS 素菜 + ACCOMPAGNEMENTS 配饭 | 单品 → vegetarian + rice-noodles |
| #8 (121) | SPÉCIALITÉS THAI 泰餐 | 单品 → thai-soups + thai-mains |
| #9 (122) | POISSONS 鱼类 | 单品 → fish |
| #10 (123) | **MENU DÉGUSTATION 套餐页** | 套餐（已上线 SM09）非单品 |
| #11 (124) | **MENU DÉCOUVERT 套餐页** | 套餐（已上线 SM06）非单品 |

**单品共 84 道，覆盖 10 个分类。未拍到：desserts 甜点 / drinks 饮品（无数据，建议继续隐藏）。**

---

## soups-salads 汤类和沙拉（图1）— 9 道
| FR | EN | ZH | €€ |
|---|---|---|---|
| Potage au poulet et maïs | Chicken and sweet corn soup | 鸡肉玉米汤 | 9.50 |
| Potage au crabe et aux asperges | Crab and asparagus soup | 蟹肉芦笋汤 | 13.50 |
| Potage pékinois (épicé) | Pekinese spicy sour soup | 北京酸辣汤 | 11.50 |
| Soupe de raviolis aux crevettes | Chinese dumplings soup with shrimps | 云吞汤 | 14.50 |
| Potage aux ailerons de requin | Shark's fin soup | 鱼翅汤 | 38.00 |
| Salade au crabe | Crab meat salad | 蟹沙拉 | 16.00 |
| Salade au poulet | Chicken salad | 鸡沙拉 | 12.00 |
| Salade aux crevettes | Shrimps salad | 虾沙拉 | 14.00 |
| Rouleaux de printemps (aux crevettes) - froid | Vietnamese fresh spring rolls (with shrimps) | 生春卷 | 14.00 |

## seafood 虾蟹类 CRUSTACÉS（图2/3）— 9 道
| FR | EN | ZH | €€ |
|---|---|---|---|
| Crevettes sautées à la sauce piquante (pimenté) | Shrimps with spicy sauce | 干烧虾 | 30.00 |
| Grosses crevettes au sel et poivre (pimenté) | Shrimps with salt and pepper (spicy) | 椒盐明虾 | 32.00 |
| Grosses crevettes au gingembre et ciboulette sur plaque chauffante | Shrimps with ginger and chives on hot plate | 铁板姜葱明虾 | 35.00 |
| Grosses crevettes sautées à l'ananas frais et noix de cajou | Sauteed shrimps with fresh pineapple and cashew nuts | 鲜菠萝腰果虾 | 35.00 |
| Grosses crevettes sautées aux asperges | Sauteed shrimps with asparagus | 芦笋虾 | 33.00 |
| Calmars sautées à la sauce XO | Stir-fried squids with XO sauce | XO酱炒鱿鱼 | 28.00 |
| Calamars au sel et poivre (épicé) | Squids with salt and pepper (spicy) | 椒盐鲜鱿鱼 | 28.00 |
| Cuisses de grenouilles au sel et poivre (épicé) | Frog legs with salt and pepper (spicy) | 椒盐田鸡腿 | 33.00 |
| Homard (gingembre et ciboulette / sel et poivre / à la sauce piquante) | Lobster (3 preparations) | 龙虾（姜葱／椒盐／干烧） | 88.00 |

## dim-sum 点心 DIM SUM（图4）— 9 道
| FR | EN | ZH | €€ |
|---|---|---|---|
| Raviolis aux crevettes (4ps) - Ha Kao | Steamed shrimps dumplings | 虾饺 | 13.50 |
| Bouchées aux crevettes (4ps) | Steamed shrimps balls | 虾卖(?) | 13.50 |
| Bouchées aux coquilles St-Jacques (4ps) | Steamed scallops balls | 干贝烧卖(?) | 14.50 |
| Assortiment à la vapeur (6ps) | Steamed assortment | 点心拼盘 | 18.50 |
| Raviolis au poulet (4ps) | Chicken dumplings | 鸡冠饺(?) | 12.50 |
| Raviolis cantonnais aux légumes (4ps) | Cantonese dumplings with vegetables | 素饺 | 9.50 |
| Raviolis pékinois grillés au poulet (4ps) | Grilled pekinese dumplings | 锅贴 | 12.50 |
| Bao grillés aux légumes (4ps) | Grilled buns with vegetables | 素小笼包 | 13.50 |
| Bao grillés au poulet (4ps) | Grilled chicken buns | 香煎鸡肉小笼包 | 14.50 |

## fried 炸品 FRITURES（图4）— 6 道
| FR | EN | ZH | €€ |
|---|---|---|---|
| Pâté impérial (nems au poulet) (4ps) | Chicken spring rolls | 鸡春卷 | 13.50 |
| Pâté impérial (nems aux crevettes) (4ps) | Shrimp spring rolls | 虾春卷 | 15.00 |
| Raviolis feuilletés aux crevettes (4ps) | Fried crisps shrimp dumplings | 龙虾饺(?) | 16.00 |
| Beignets aux crevettes (4ps) | Fried shrimps | 炸虾 | 16.00 |
| Assortiment de friture (6ps) | Fried assortment | 炸杂点 | 19.50 |
| Toasts aux crevettes du chef (4ps) | Chief's shrimp toasts | 虾多士 | 15.00 |

## meat 肉类 VIANDES VOLAILLES（图5）— 12 道（含烤鸭拆条）
| FR | EN | ZH | €€ |
|---|---|---|---|
| Poulet sauté à la sauce piquante (pimenté) | Chicken with spicy sauce | 宫保鸡 | 24.00 |
| Poulet à la sauce aigre-douce | Sweet and sour chicken | 咕噜鸡 | 22.00 |
| Poulet caramélisé | Caramelised chicken | 拔丝鸡 | 24.00 |
| Poulet croustillant du chef | Chief's crispy chicken | 油淋鸡 | 20.00 |
| Boeuf aux oignons sur plaque chauffante | Beef with onions on hot plate | 铁板洋葱牛柳 | 29.00 |
| Filet de boeuf à la sauce piquante sur plaque chauffante | Beef fillet with spicy sauce on hot plate | 铁板宫保牛柳 | 37.00 |
| Filet de boeuf au poivre noir sur plaque chauffante | Beef fillet with black pepper on hot plate | 铁板黑椒牛柳 | 37.00 |
| Agneau au gingembre et ciboulette sur plaque chauffante | Sizzling lamb with ginger and chives on hot plate | 铁板姜葱羊 | 35.00 |
| Filet de boeuf du chef | Chief's beef fillet | 龙城牛柳 | 37.00 |
| Canard laqué à la cantonnaise (demi-pièce désossée) | Cantonese roasted duck (boneless half piece) | 广东烧鸭（半只去骨） | 48.00 |
| Canard laqué à la pékinoise — Canard entier | Peking roast duck — whole | 北京片皮鸭（整只） | 128.00 |
| Canard laqué à la pékinoise — Demi canard | Peking roast duck — half | 北京片皮鸭（半只） | 68.00 |

> 北京片皮鸭说明（写进描述）：分两道上 — 1.皮配米饼 2.切肉；配菜：蔬菜炒饭 (riz sauté aux légumes)。

## vegetarian 素菜 PLATS VÉGÉTARIENS（图7）— 11 道
| FR | EN | ZH | €€ |
|---|---|---|---|
| Soupe aux légumes mélangés | Soup with mix vegetables | 什锦素菜汤 | 10.50 |
| Salade de concombre | Cucumber salad | 黄瓜沙拉 | 12.50 |
| Salade d'algues | Seaweed salad | 海带沙拉 | 11.50 |
| Pâtés impériaux (nems aux légumes) | Vietnamese fried spring rolls (with vegetables) | 素春卷 | 13.50 |
| Riz sauté aux légumes | Fried rice with vegetables | 素炒饭 | 9.50 |
| Marmite aux cinq trésors (tofu et légume) | Braised tofu with assorted vegetables | 罗汉斋煲 | 22.00 |
| Champignons noirs et brocolis sautés nature | Stir-fried black mushrooms and broccoli | 清炒木耳西兰花 | 18.00 |
| Tofu sel au poivre | Tofu fried with salt and pepper | 椒盐豆腐 | 16.00 |
| Tofu mapo à la sichuanese (piquant) | Sichuan style mapo tofu (spicy) | 麻婆豆腐 | 18.00 |
| Haricots verts sautés aux épices au Sichuan | Dry-fried green beans with Sichuan spices | 干煸豆角 | 18.00 |
| Légumes de saison sauté (choux chinois, épinards, légumes verts) | Sauteed seasonal vegetables | 炒时蔬（包菜/菠菜/白菜/上海青） | 18.00 |

## rice-noodles 配饭 ACCOMPAGNEMENTS（图7）— 6 道
| FR | EN | ZH | €€ |
|---|---|---|---|
| Riz nature | White rice | 白饭 | 5.00 |
| Riz gluant | Sticky rice | 糯米饭 | 8.00 |
| Riz cantonnais aux crevettes | Cantonese fried rice | 广东炒饭 | 10.00 |
| Nouilles sautées aux légumes | Sauteed noodles with egg and vegetables | 素炒面 | 12.00 |
| Riz sauté thaï aux crevettes | Fried rice with shrimps Thai style | 泰式虾炒饭 | 12.00 |
| Légumes variés sautés | Sauteed vegetables | 杂炒（五色蔬菜） | 16.00 |

## thai-soups 泰餐·汤沙拉 SPÉCIALITÉS THAI（图8）— 4 道
| FR | EN | ZH | €€ |
|---|---|---|---|
| Soupe Tom Yam aux crevettes à la citronnelle (piquant) | Shrimps tom yam soup Thai style with citronella | 冬阴功虾汤 | 16.00 |
| Soupe Tom Yam de poulet au lait de coco | Chicken tom yam soup with coconut milk | 椰汁鸡汤 | 14.50 |
| Salade de boeuf à la citronnelle | Beef salad with citronella Thai style | 泰式牛沙拉 | 18.00 |
| Salade de crevettes à la citronnelle | Shrimps salad with citronella Thai style | 泰式虾沙拉 | 18.00 |

## thai-mains 泰餐·主菜 PLATS THAÏLANDAIS（图8）— 9 道
| FR | EN | ZH | €€ |
|---|---|---|---|
| Brochettes de poulet grillées au saté (3ps) | Chicken skewers grilled with satay | 串烧鸡 | 18.00 |
| Brochettes de boeuf grillées au saté (3ps) | Beef skewers grilled with satay | 串烧牛 | 20.00 |
| Assortiment de brochettes (4ps) | Assorted skewers | 串烧拼盘 | 25.00 |
| Poulet au curry thaï | Thai chicken curry | 咖喱鸡 | 24.00 |
| Poulet grillé à la citronnelle | Grilled chicken with citronella | 香茅鸡 | 24.00 |
| Poulet sauté au basilic sur plaque chauffante | Sauteed chicken with basil on hot plate | 铁板金不换鸡 | 26.00 |
| Crevettes sautées au basilic sur plaque chauffante | Sauteed shrimps with basil on hot plate | 铁板金不换虾 | 35.00 |
| Filet de boeuf sautées au basilic sur plaque chauffante | Sauteed beef with basil on hot plate | 铁板金不换牛 | 37.00 |
| Coquilles St-Jacques sautées au basilic sur plaque chauffante | Sauteed scallops with basil on hot plate | 铁板金不换干贝 | 36.00 |

## fish 鱼类 POISSONS（图9）— 9 道
| FR | EN | ZH | €€ |
|---|---|---|---|
| Filets de bar à la vapeur (sauce soja) | Steamed bar fish fillets (soy sauce) | 清蒸鲈鱼 | 40.00 |
| Filets de bar grillés (sauce thaï) | Grilled bar fish fillets (thai sauce) | 泰式煎鲈鱼 | 40.00 |
| Daurade royale à la sauce piquante (pimenté) - frit pièces complet | Sea bream cooked with spicy - whole piece | 干烧鲷鱼（整条） | 36.00 |
| Sole au sel et au poivre (épicé) | Sole fish with salt and pepper (spicy) | 椒盐龙利鱼 | 40.00 |
| Sole à la sauce au poivre | Sole fish with pepper sauce | 黑椒龙利鱼 | 40.00 |
| Sole caramélisée | Caramelised sole fish | 拔丝龙利鱼 | 40.00 |
| Coquilles St-Jacques fraîches à la vapeur (4ps) | Steam-cooked scallop | 清蒸扇贝（4只） | 36.00 |
| Coquilles St-Jacques à la sauce piquante | Scallops with spicy sauce | 干烧干贝 | 36.00 |
| Coquilles St-Jacques au sel et au poivre | Scallops with salt and pepper | 椒盐干贝 | 36.00 |

---

## 需 Jason / John 拍板的疑点

**A. 图片覆盖范围**
- 可录入 10 分类 84 道（上表）。
- **未拍到**：desserts 甜点、drinks 饮品 —— 无价目表来源，建议继续隐藏，等 John 补图再录。
- **lobster-special 龙虾专区**：无独立页；真实龙虾 = seafood 页的 HOMARD 88€。决策：放 seafood 即可、lobster-special 继续隐藏？还是单独激活 lobster-special 放这一道？

**B. 拆条 / 合并**
- 北京片皮鸭 → 拆 整鸭128€ / 半鸭68€ 两条（归 meat），服务方式+配菜写描述。请确认。
- 广东烧鸭 48€（半只去骨）= 另一道，独立保留（≠北京鸭）。
- HOMARD 龙虾 88€，三做法 → 合并一条，做法写名/描述，不做选择器。请确认。

**C. OCR 不确定（多为小号中文；价格与法名清晰）**
- dim-sum「虾卖」（Bouchées aux crevettes / shrimp balls）中文存疑
- dim-sum「干贝烧卖」（scallop balls）中文存疑
- dim-sum「鸡冠饺」（Raviolis au poulet / chicken dumplings）中文存疑（或鸡肉饺）
- fried「龙虾饺」（Raviolis feuilletés aux crevettes）— 中文 OCR 似「龍蝦餃」但法/英=crevettes/shrimp（虾），名称矛盾，请 John 确认是虾还是龙虾

**D. 与套餐重名（信息，非阻断）**：单品里的菜（椒盐虾/黑椒牛柳/点心拼盘/炸杂点等）与三套餐选择器内的选项部分重名，正常不冲突。

**E. 套餐页附带发现（超出单品范围，重要）**
- 图11 DÉCOUVERT 56€ 标注「* UN COCKTAIL MAISON OFFERT」（送1杯招牌鸡尾酒）
- 图10 DÉGUSTATION 138€/2人 标注「* 2 COCKTAIL MAISON OFFERT」（送2杯）
- 现站 SM06/SM09 数据无"赠送鸡尾酒"信息 → 是否补进套餐说明？（单独任务）
- 图6 CLASSIQUE 33€（两道）/38€（三道），现站 SM08 仅上 38€ 单档（你之前定的本期方案）。

**F. 西语 es**：按规则全部留空。
**G. 重复图**：#3=#2（CRUSTACÉS）完全重复，已去重。
**H. 繁简体**：菜单印**繁体**（湯/類/蝦/點心），本草稿转**简体**以匹配现站 zh 数据。若要保留繁体请说明。
