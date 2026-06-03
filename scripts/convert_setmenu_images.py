# -*- coding: utf-8 -*-
"""
Set-menu option + cover image conversion (CLASSIQUE + DECOUVERT only; DEGUSTATION skipped — no course data).
Source: B-菜品缩略图/MENU-套餐/MENU-{X}/{course}/{filename}.jpg  (single named jpg per option)
        B-菜品缩略图/MENU-套餐/MENU-{X}/400.jpg  (cover)
Output: public/menu/set/{menu-slug}/{course}/{option-slug}.webp  (~400px, q72, <60KB)
        public/menu/set/{menu-slug}/cover.webp
option-slug = filename minus ext, trimmed, lowercased, spaces->hyphen.
Prints a JSON manifest of {menu, course, file, slug, kb} for wiring into menu.json.
"""
import os, json, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_ROOT = os.path.join(ROOT, "B-菜品缩略图", "MENU-套餐")
OUT_ROOT = os.path.join(ROOT, "public", "menu", "set")

# folder name on disk -> output slug + course key
MENUS = {"MENU-CLASSIQUE": "classique", "MENU-DECOUVERT": "decouvert"}
# disk course folder -> normalized output course dir + key
COURSES = {"entree": "entree", "plat": "plat", "dessert": "dessert", "ACCOMPAGNMENT": "accompagnement"}


def slug(filename):
    base = os.path.splitext(filename)[0].strip().lower()
    return re.sub(r"[\s_]+", "-", base)


def save_webp(img, path, quality=72, target_kb=60, floor=55):
    if img.width > 400:
        h = round(img.height * 400 / img.width)
        img = img.resize((400, h), Image.LANCZOS)
    q = quality
    while True:
        img.save(path, "WEBP", quality=q, method=6)
        kb = os.path.getsize(path) / 1024
        if kb <= target_kb or q <= floor:
            return round(kb, 1)
        q -= 5


manifest = []
missing = []
for disk_menu, mslug in MENUS.items():
    mdir = os.path.join(SRC_ROOT, disk_menu)
    if not os.path.isdir(mdir):
        missing.append(disk_menu); continue
    # cover (from 400.jpg)
    cover_src = os.path.join(mdir, "400.jpg")
    if os.path.isfile(cover_src):
        os.makedirs(os.path.join(OUT_ROOT, mslug), exist_ok=True)
        kb = save_webp(Image.open(cover_src).convert("RGB"),
                       os.path.join(OUT_ROOT, mslug, "cover.webp"))
        manifest.append({"menu": mslug, "course": "_cover", "file": "400.jpg",
                         "slug": "cover", "kb": kb})
    for disk_course, ckey in COURSES.items():
        cdir = os.path.join(mdir, disk_course)
        if not os.path.isdir(cdir):
            missing.append(f"{disk_menu}/{disk_course}"); continue
        out_cdir = os.path.join(OUT_ROOT, mslug, ckey)
        os.makedirs(out_cdir, exist_ok=True)
        for fn in sorted(os.listdir(cdir)):
            if not fn.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            s = slug(fn)
            kb = save_webp(Image.open(os.path.join(cdir, fn)).convert("RGB"),
                           os.path.join(out_cdir, s + ".webp"))
            manifest.append({"menu": mslug, "course": ckey, "file": fn, "slug": s, "kb": kb})

print(json.dumps({
    "written": len([m for m in manifest if m["course"] != "_cover"]),
    "covers": len([m for m in manifest if m["course"] == "_cover"]),
    "missing": missing,
    "kb_range": [min(m["kb"] for m in manifest), max(m["kb"] for m in manifest)] if manifest else None,
    "manifest": manifest,
}, ensure_ascii=False, indent=1))
