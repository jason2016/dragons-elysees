# -*- coding: utf-8 -*-
"""
Write set_menu structures into menu.json:
  - SM06 (Menu Découverte) converted in place -> type:set_menu (DECOUVERT)
  - new SM08 (Menu Classique) appended -> type:set_menu (CLASSIQUE)
Option display names map pinyin filename slug -> {zh,fr,en,es} (Jason to verify; uncertain ones flagged in report).
Images already at public/menu/set/{menu}/{course}/{slug}.webp . Reversible: git restore menu.json.
"""
import os, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MENU = os.path.join(ROOT, "public", "data", "menu.json")
BASE = "/menu/set"

COURSE_LABEL = {
    "entree":        {"zh": "头盘", "fr": "Entrée", "en": "Starter", "es": "Entrante"},
    "plat":          {"zh": "主菜", "fr": "Plat", "en": "Main", "es": "Plato"},
    "dessert":       {"zh": "甜点", "fr": "Dessert", "en": "Dessert", "es": "Postre"},
    "accompagnement":{"zh": "配菜", "fr": "Accompagnement", "en": "Side", "es": "Acompañamiento"},
}

# slug -> option display name (Jason verifies; '#' marks ones I'm unsure about)
NAMES = {
    "dian-xin":                 {"zh": "点心拼盘", "fr": "Assortiment Dim Sum", "en": "Dim Sum Platter", "es": "Surtido Dim Sum"},
    "ji-chun-juan":             {"zh": "鸡春卷", "fr": "Nems au poulet", "en": "Chicken Spring Rolls", "es": "Rollitos de pollo"},
    "suan-la-tang":             {"zh": "酸辣汤", "fr": "Soupe aigre-piquante", "en": "Hot & Sour Soup", "es": "Sopa agripicante"},
    "tai-shi-ji-sha-la":        {"zh": "泰式鸡沙拉", "fr": "Salade de poulet thaï", "en": "Thai Chicken Salad", "es": "Ensalada tailandesa de pollo"},
    "suan-xia-tang":            {"zh": "酸辣虾汤", "fr": "Soupe piquante aux crevettes", "en": "Spicy Prawn Soup", "es": "Sopa picante de gambas"},  # uncertain
    "zha-za-dian":              {"zh": "炸杂点", "fr": "Assortiment de fritures", "en": "Mixed Fritters", "es": "Surtido de frituras"},
    "gan-shao-xia":             {"zh": "干烧虾", "fr": "Crevettes sautées piquantes", "en": "Spicy Sautéed Prawns", "es": "Gambas salteadas picantes"},
    "jin-bu-hua-ya":            {"zh": "金不换鸭", "fr": "Canard au basilic thaï", "en": "Thai Basil Duck", "es": "Pato a la albahaca"},  # uncertain
    "yang-cong-niu":            {"zh": "洋葱牛", "fr": "Bœuf aux oignons", "en": "Beef with Onions", "es": "Ternera con cebolla"},
    "you-lin-ji":               {"zh": "油淋鸡", "fr": "Poulet croustillant", "en": "Crispy Chicken", "es": "Pollo crujiente"},
    "gan-shao-yu":              {"zh": "干烧鱼", "fr": "Poisson sauté piquant", "en": "Spicy Sautéed Fish", "es": "Pescado salteado picante"},
    "jiao-yan-xia":             {"zh": "椒盐虾", "fr": "Crevettes sel et poivre", "en": "Salt & Pepper Prawns", "es": "Gambas a la sal y pimienta"},
    "tie-ban-hei-jiao-niu-liu": {"zh": "铁板黑椒牛柳", "fr": "Bœuf au poivre noir (plancha)", "en": "Black Pepper Beef", "es": "Ternera a la pimienta negra"},
    "bing-ji-lin":              {"zh": "冰淇淋", "fr": "Glace", "en": "Ice Cream", "es": "Helado"},
    "bing-mi-ci":               {"zh": "冰麻糍", "fr": "Mochi glacé", "en": "Glazed Mochi", "es": "Mochi helado"},
    "jiang-tang-zhi-ma-tang":   {"zh": "姜糖芝麻汤圆", "fr": "Boules de sésame, sirop de gingembre", "en": "Sesame Rice Balls, Ginger Syrup", "es": "Bolas de sésamo con jengibre"},  # uncertain
    "li-zhi":                   {"zh": "荔枝", "fr": "Litchi", "en": "Lychee", "es": "Lichi"},
    "nuo-mi-ci":                {"zh": "糯米糍", "fr": "Boules de riz gluant", "en": "Glutinous Rice Balls", "es": "Bolas de arroz glutinoso"},
    "shui-guo-sha-la":          {"zh": "水果沙拉", "fr": "Salade de fruits", "en": "Fruit Salad", "es": "Ensalada de frutas"},
    "zha-xiang-jiao":           {"zh": "炸香蕉", "fr": "Banane frite", "en": "Fried Banana", "es": "Plátano frito"},
    "guang-dong-xia-chao-fan":  {"zh": "广东虾炒饭", "fr": "Riz sauté cantonais aux crevettes", "en": "Cantonese Prawn Fried Rice", "es": "Arroz frito cantonés con gambas"},  # filename has 虾
    "su-chao-mian":             {"zh": "素炒面", "fr": "Nouilles sautées aux légumes", "en": "Vegetable Fried Noodles", "es": "Fideos salteados con verduras"},
}

# per-menu course -> ordered list of option slugs (matches converted files)
MENU_COURSES = {
    "decouvert": [
        ("entree",        ["dian-xin", "suan-xia-tang", "zha-za-dian"]),
        ("plat",          ["gan-shao-yu", "jiao-yan-xia", "tie-ban-hei-jiao-niu-liu"]),
        ("dessert",       ["nuo-mi-ci", "shui-guo-sha-la", "zha-xiang-jiao"]),
        ("accompagnement",["guang-dong-xia-chao-fan", "su-chao-mian"]),
    ],
    "classique": [
        ("entree",        ["dian-xin", "ji-chun-juan", "suan-la-tang", "tai-shi-ji-sha-la"]),
        ("plat",          ["gan-shao-xia", "jin-bu-hua-ya", "yang-cong-niu", "you-lin-ji"]),
        ("dessert",       ["bing-ji-lin", "bing-mi-ci", "jiang-tang-zhi-ma-tang", "li-zhi"]),
        ("accompagnement",["guang-dong-xia-chao-fan", "su-chao-mian"]),
    ],
}


def build_courses(menu_slug):
    courses = []
    for ckey, slugs in MENU_COURSES[menu_slug]:
        opts = []
        for s in slugs:
            opts.append({
                "id": s,
                "name": NAMES[s],
                "image": f"{BASE}/{menu_slug}/{ckey}/{s}.webp",
            })
        courses.append({"key": ckey, "label": COURSE_LABEL[ckey], "required": True, "options": opts})
    return courses


with open(MENU, encoding="utf-8") as fh:
    menu = json.load(fh)
sm = next(c for c in menu["categories"] if c["id"] == "set-menus")

# 1) SM06 -> DECOUVERT set_menu (in place, keep id + name)
sm06 = next(it for it in sm["items"] if it["id"] == "SM06")
sm06["type"] = "set_menu"
sm06["price"] = 0
sm06["price_todo"] = True
sm06["cover"] = f"{BASE}/decouvert/cover.webp"
sm06["courses"] = build_courses("decouvert")

# 2) new SM08 -> CLASSIQUE
if not any(it["id"] == "SM08" for it in sm["items"]):
    sm["items"].append({
        "id": "SM08",
        "type": "set_menu",
        "price": 0,
        "price_todo": True,
        "name": {"zh": "经典套餐", "fr": "Menu Classique", "en": "Classic Set Menu", "es": "Menú Clásico"},
        "cover": f"{BASE}/classique/cover.webp",
        "courses": build_courses("classique"),
    })

with open(MENU, "w", encoding="utf-8") as fh:
    json.dump(menu, fh, ensure_ascii=False, indent=2)
    fh.write("\n")

print(json.dumps({
    "SM06_courses": [c["key"] + ":" + str(len(c["options"])) for c in sm06["courses"]],
    "SM08_added": any(it["id"] == "SM08" for it in sm["items"]),
    "SM08_courses": [c["key"] + ":" + str(len(c["options"])) for it in sm["items"] if it["id"] == "SM08" for c in it["courses"]],
    "total_set_menu_items": sum(1 for it in sm["items"] if it.get("type") == "set_menu"),
}, ensure_ascii=False, indent=1))
