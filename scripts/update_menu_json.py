# -*- coding: utf-8 -*-
"""
Wire the converted webp files into public/data/menu.json.
- category.cover     <- /dragons-elysees/menu/cover/{category-id}.webp   (if file exists)
- item.image_url     <- /dragons-elysees/menu/items/{item-id}.webp       (if file exists)
Only touches categories/items whose webp was produced this batch. All else untouched.
"""
import os, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MENU = os.path.join(ROOT, "public", "data", "menu.json")
COVER_DIR = os.path.join(ROOT, "public", "menu", "cover")
ITEM_DIR = os.path.join(ROOT, "public", "menu", "items")
BASE = "/dragons-elysees/menu"

covers = {f[:-5] for f in os.listdir(COVER_DIR) if f.endswith(".webp")}
items = {f[:-5] for f in os.listdir(ITEM_DIR) if f.endswith(".webp")}

with open(MENU, encoding="utf-8") as fh:
    menu = json.load(fh)

cover_set, item_set = [], []
for cat in menu["categories"]:
    if cat["id"] in covers:
        cat["cover"] = f"{BASE}/cover/{cat['id']}.webp"
        cover_set.append(cat["id"])
    for it in cat["items"]:
        if it["id"] in items:
            it["image_url"] = f"{BASE}/items/{it['id']}.webp"
            item_set.append(it["id"])

with open(MENU, "w", encoding="utf-8") as fh:
    json.dump(menu, fh, ensure_ascii=False, indent=2)
    fh.write("\n")

unwired_covers = sorted(covers - set(cover_set))
unwired_items = sorted(items - set(item_set))
print(json.dumps({
    "covers_wired": sorted(cover_set),
    "items_wired_count": len(item_set),
    "unwired_cover_files": unwired_covers,   # webp exists but no matching category id
    "unwired_item_files": unwired_items,     # webp exists but no matching item id
}, ensure_ascii=False, indent=1))
