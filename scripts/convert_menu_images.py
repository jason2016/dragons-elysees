# -*- coding: utf-8 -*-
"""
Batch 1 menu image conversion.
A banners -> public/menu/cover/{category-id}.webp  (~1200px wide, <120KB)
B dishes  -> public/menu/items/{item-id}.webp      (~400px, quality 72, 25-50KB)
Source for B = each dish folder's 400.jpg. Reports any missing sources.
"""
import os, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A_DIR = os.path.join(ROOT, "A-分类横图")
B_DIR = os.path.join(ROOT, "B-菜品缩略图")
OUT_COVER = os.path.join(ROOT, "public", "menu", "cover")
OUT_ITEMS = os.path.join(ROOT, "public", "menu", "items")
os.makedirs(OUT_COVER, exist_ok=True)
os.makedirs(OUT_ITEMS, exist_ok=True)

# --- A: category-id -> banner filename (relative to A_DIR) ---
COVERS = {
    "soups-salads": "汤类和沙拉.jpg",
    "fried":        "炸品.jpg",            # NOT zha pin.jpg (deprecated dup)
    "seafood":      "虾蟹类.jpg",
    "meat":         "肉类.jpg",
    "fish":         "鱼类.jpg",
    "thai-soups":   "泰餐-汤和沙拉.jpg",
    "thai-mains":   "泰餐-主菜.jpg",
    "vegetarian":   "蔬菜.jpg",
    "rice-noodles": "配饭.jpg",
    "desserts":     "甜品.jpg",
    "drinks":       "饮品.jpg",
}

# --- B: item-id -> dish source jpg (relative to B_DIR) ---
ITEMS = {
    # soups-salads
    "S5":  "汤类和沙拉/云吞汤/400.jpg",
    "S10": "汤类和沙拉/生春卷/400.jpg",
    "S9":  "汤类和沙拉/虾沙拉/400.jpg",
    "S7":  "汤类和沙拉/蟹沙拉/400.jpg",
    "S2":  "汤类和沙拉/蟹肉芦笋汤/400.jpg",
    "S8":  "汤类和沙拉/鸡沙拉/400.jpg",
    "S1":  "汤类和沙拉/鸡丝玉米汤/400.jpg",   # mid
    "S3":  "汤类和沙拉/背景酸辣汤/400.jpg",   # mid
    "S6":  "汤类和沙拉/鱼刺汤/400.jpg",             # mid
    # fried
    "F4":  "油炸品/炸虾/400.jpg",
    "F6":  "油炸品/虾多士/400.jpg",
    "F2":  "油炸品/虾春卷/400.jpg",
    "F1":  "油炸品/鸡春卷/400-.jpg",                         # note dash
    "F3":  "油炸品/龙虾饺/400.jpg",
    # thai-mains
    "T220": "泰国菜/主菜/串烧拼盘/400.jpg",
    "T219": "泰国菜/主菜/串烧牛/400.jpg",
    "T218": "泰国菜/主菜/串烧鸡/400.jpg",
    "T222": "泰国菜/主菜/香茅鸡/400.jpg",
    "T227": "泰国菜/主菜/铁板金不换牛/400.jpg",
    "T226": "泰国菜/主菜/铁板金不换虾/400.jpg",
    "T224": "泰国菜/主菜/铁板金不换鸭/400.jpg",
    # thai-soups
    "T202": "泰国菜/汤和沙拉/dong yin gong xia tang/400.jpg",
    "T203": "泰国菜/汤和沙拉/ye zhi ji tang/400.jpg",
    "T205": "泰国菜/汤和沙拉/泰式牛沙拉/400.jpg",
    "T206": "泰国菜/汤和沙拉/泰式虾沙拉/400.jpg",  # mid
    # dim-sum
    "V2":  "点心/xia mai/400.jpg",
    "V5":  "点心/点心拼盘/400.jpg",
    "V1":  "点心/虾饺/400.jpg",
    "V10": "点心/锅贴/400.jpg",
    "V6":  "点心/鸡冠饺/400.jpg",
    "V3":  "点心/干杯烧麦/400.jpg",                           # mid
    "V12": "点心/香干鸡肉小笼包/400.jpg",         # mid
    # desserts
    "D10": "甜品/H1-H13/xian bo luo/400.jpg",
    "D09": "甜品/H1-H13/xian mang guo/400.jpg",
    "D11": "甜品/H1-H13/mang guo nuo mi fan/400.jpg",
    "D19": "甜品/H1-H13/qiao ke li chun juan/400.jpg",
    "D08": "甜品/H1-H13/shui guo sha la/400.jpg",
    "D15": "甜品/H1-H13/zha shui guo/400.jpg",
    "D07": "甜品/G1-G6/hei sen lin/400.jpg",
    "D06": "甜品/G1-G6/tai pin yang/400.jpg",
    "D03": "甜品/G1-G6/ba ti ya/400.jpg",
    "D17": "甜品/H1-H13/bing mi ci/400.jpg",
    "D20": "甜品/H1-H13/li zhi/400.jpg",
    "D12": "甜品/H1-H13/tai shi ye nai bu ding/400.jpg",
    "D14": "甜品/H1-H13/shao shui guo/400.jpg",
    # meat
    "M1":  "肉类/宫保鸡/400.jpg",
    "M2":  "肉类/咕咾鸡/400.jpg",
    "M3":  "肉类/拔丝鸡/400.jpg",
    "M4":  "肉类/油淋鸡/400.jpg",
    "M12": "肉类/广东烧鸭/400.jpg",
    "M5":  "肉类/铁板洋葱牛/400.jpg",
    "M8":  "肉类/铁板黑椒牛柳/400.jpg",
    "M10": "肉类/龙城牛柳/400.jpg",
    "M6":  "肉类/铁板宫爆牛/400.jpg",                     # mid
    # vegetarian
    "A11": "蔬菜/jiao yan dou fu/400.jpg",
    "A12": "蔬菜/ma po dou fu/400.jpg",
    "A6":  "蔬菜/su chao fan/400.jpg",
    "A4":  "蔬菜/su chun juan/400.jpg",
    "A9":  "蔬菜/luo han zai bao/400.jpg",                                   # mid
    # seafood
    "C1":  "虾蟹类/gan shao xia/400.jpg",
    "C10": "虾蟹类/jiao yan tian ji tui/400.jpg",
    "C9":  "虾蟹类/jiao yan you yu/400.jpg",
    "C5":  "虾蟹类/xian bo luo yao guo xia/400.jpg",
    "C2":  "虾蟹类/jiao yan xia/400.jpg",
    "C4":  "虾蟹类/tie ban ming xia/400.jpg",
    # rice-noodles
    "A17": "配饭/guang dong chao fan/400.jpg",
    "A16": "配饭/nuo mifan/400.jpg",
    "A19": "配饭/tai shi xia chao fan/400.jpg",
    "A15": "配饭/mi fan/400.jpg",
    "A18": "配饭/su chao mian/400.jpg",
    "A20": "配饭/wu se shu cai/400.jpg",                                     # mid
    # fish
    "P7":  "鱼类/ba si long li yu/400.jpg",
    "P3":  "鱼类/gan shao diao yu/400.jpg",
    "P11": "鱼类/gan shao gan bei/400.jpg",
    "P6":  "鱼类/hei jiao long li yu/400.jpg",
    "P12": "鱼类/jiao yan gan bei/400.jpg",
    "P5":  "鱼类/jiao yan long li yu/400.jpg",
    "P1":  "鱼类/qing zheng lu yu/400.jpg",
    "P10": "鱼类/qing zheng shan bei/400.jpg",
    "P2":  "鱼类/tai shi jian lu yu/400.jpg",
    # drinks
    "B03": "饮品/Boissons shaudes/cafe creme/400.jpg",
    "B02": "饮品/Boissons shaudes/cafe/400.jpg",
    "B01": "饮品/Boissons shaudes/tea/400.jpg",
    "B07": "饮品/Soda et jus de fruits/coca/400.jpg",
    "B05": "饮品/Soda et jus de fruits/jus de fruits/400.jpg",
    "B04": "饮品/Soda et jus de fruits/orange frais presse/400.jpg",
}


def save_webp_under(img, path, quality, target_kb=None, floor_q=55):
    """Save webp; if target_kb set, step quality down until <= target_kb (or floor)."""
    q = quality
    while True:
        img.save(path, "WEBP", quality=q, method=6)
        kb = os.path.getsize(path) / 1024
        if target_kb is None or kb <= target_kb or q <= floor_q:
            return kb, q
        q -= 5


missing = []
cover_results = []
item_results = []

# A banners -> ~1200px wide, <120KB
for cid, fname in COVERS.items():
    src = os.path.join(A_DIR, fname)
    if not os.path.isfile(src):
        missing.append(("cover", cid, fname))
        continue
    im = Image.open(src).convert("RGB")
    if im.width > 1200:
        h = round(im.height * 1200 / im.width)
        im = im.resize((1200, h), Image.LANCZOS)
    out = os.path.join(OUT_COVER, cid + ".webp")
    kb, q = save_webp_under(im, out, quality=82, target_kb=120)
    cover_results.append((cid, round(kb, 1), q, im.size))

# B dishes -> ~400px, quality 72
for iid, rel in ITEMS.items():
    src = os.path.join(B_DIR, rel)
    if not os.path.isfile(src):
        missing.append(("item", iid, rel))
        continue
    im = Image.open(src).convert("RGB")
    if im.width > 400:
        h = round(im.height * 400 / im.width)
        im = im.resize((400, h), Image.LANCZOS)
    out = os.path.join(OUT_ITEMS, iid + ".webp")
    kb, q = save_webp_under(im, out, quality=72, target_kb=60)
    item_results.append((iid, round(kb, 1), q, im.size))

print(json.dumps({
    "covers_written": len(cover_results),
    "items_written": len(item_results),
    "missing": missing,
    "cover_kb_range": [min(r[1] for r in cover_results), max(r[1] for r in cover_results)] if cover_results else None,
    "item_kb_range": [min(r[1] for r in item_results), max(r[1] for r in item_results)] if item_results else None,
    "cover_detail": cover_results,
    "item_detail": item_results,
}, ensure_ascii=False, indent=1))
