const fs = require('fs');
const path = require('path');

const menuPath = path.join(__dirname, '..', 'public', 'data', 'menu.json');
const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

// 分类翻译
const CATEGORY_TRANSLATIONS = {
  'set-menus':       { en: 'Set Menus',                  es: 'Menús' },
  'soups-salads':    { en: 'Soups & Salads',             es: 'Sopas y Ensaladas' },
  'dim-sum':         { en: 'Dim Sum',                    es: 'Dim Sum' },
  'fried':           { en: 'Fried Specialties',          es: 'Frituras' },
  'seafood':         { en: 'Seafood',                    es: 'Mariscos' },
  'meat':            { en: 'Meat Dishes',                es: 'Carnes' },
  'fish':            { en: 'Fish',                       es: 'Pescados' },
  'thai-soups':      { en: 'Thai — Soups & Salads',      es: 'Tailandés — Sopas y Ensaladas' },
  'thai-mains':      { en: 'Thai — Main Dishes',         es: 'Tailandés — Platos Principales' },
  'vegetarian':      { en: 'Vegetarian',                 es: 'Vegetariano' },
  'rice-noodles':    { en: 'Rice & Noodles',             es: 'Arroz y Fideos' },
  'desserts':        { en: 'Desserts',                   es: 'Postres' },
  'drinks':          { en: 'Drinks',                     es: 'Bebidas' },
  'lobster-special': { en: 'Lobster & Langoustine',      es: 'Langosta y Bogavante' },
};

// 菜品翻译（按 ID 索引）
const ITEM_TRANSLATIONS = {
  // ━━━ Set Menus ━━━
  'SM01': { en: 'Lunch Set',                   es: 'Menú del Almuerzo' },
  'SM02': { en: 'Lunch Set 2',                 es: 'Menú del Almuerzo 2' },
  'SM03': { en: 'Set Menu 35',                 es: 'Menú 35' },
  'SM04': { en: 'Set Menu 39',                 es: 'Menú 39' },
  'SM05': { en: 'Dragon Set Menu',             es: 'Menú Dragón' },
  'SM06': { en: 'Discovery Tasting Menu',      es: 'Menú Degustación' },
  'SM07': { en: 'Duck Set Menu',               es: 'Menú Pato' },

  // ━━━ Soups & Salads ━━━
  'S1':   { en: 'Chicken & Sweet Corn Soup',   es: 'Sopa de Pollo y Maíz' },
  'S2':   { en: 'Crab & Asparagus Soup',       es: 'Sopa de Cangrejo y Espárragos' },
  'S3':   { en: 'Beijing Hot & Sour Soup',     es: 'Sopa Picante de Pekín' },
  'S4':   { en: 'Chicken Vermicelli Soup',     es: 'Sopa de Pollo con Fideos' },
  'S5':   { en: 'Wonton Soup',                 es: 'Sopa Wonton' },
  'S6':   { en: 'Shark Fin Soup',              es: 'Sopa de Aleta de Tiburón' },
  'S7':   { en: 'Crab Salad',                  es: 'Ensalada de Cangrejo' },
  'S8':   { en: 'Chicken Salad',               es: 'Ensalada de Pollo' },
  'S9':   { en: 'Prawn Salad',                 es: 'Ensalada de Gambas' },
  'S10':  { en: 'Fresh Spring Rolls',          es: 'Rollitos de Primavera Frescos' },

  // ━━━ Dim Sum ━━━
  'V1':   { en: 'Har Gow (Shrimp Dumplings)',  es: 'Empanadillas de Gambas' },
  'V2':   { en: 'Siu Mai',                     es: 'Siu Mai' },
  'V3':   { en: 'Scallop Siu Mai',             es: 'Siu Mai de Vieiras' },
  'V4':   { en: 'Fun Gor Dumplings',           es: 'Empanadillas Fun Gor' },
  'V5':   { en: 'Dim Sum Platter',             es: 'Surtido de Dim Sum' },
  'V6':   { en: 'Crested Dumplings',           es: 'Empanadillas Crestadas' },
  'V7':   { en: 'Chicken & Basil Dumplings',   es: 'Empanadillas de Pollo y Albahaca' },
  'V8':   { en: 'Vegetable Dumplings',         es: 'Empanadillas Vegetarianas' },
  'V9':   { en: 'Fish Dumplings',              es: 'Empanadillas de Pescado' },
  'V10':  { en: 'Pan-fried Gyoza',             es: 'Gyoza a la Plancha' },
  'V11':  { en: 'Chicken Xiao Long Bao',       es: 'Xiao Long Bao de Pollo' },
  'V12':  { en: 'Pan-fried Xiao Long Bao',     es: 'Xiao Long Bao a la Plancha' },
  'V13':  { en: 'Sticky Rice with Chicken',    es: 'Arroz Glutinoso con Pollo' },
  'V14':  { en: 'Vietnamese Bánh Cuốn',        es: 'Bánh Cuốn Vietnamita' },

  // ━━━ Fried ━━━
  'F1':   { en: 'Chicken Spring Rolls',        es: 'Rollitos de Pollo' },
  'F2':   { en: 'Shrimp Spring Rolls',         es: 'Rollitos de Gambas' },
  'F3':   { en: 'Fried Lobster Dumplings',     es: 'Empanadillas Fritas de Bogavante' },
  'F4':   { en: 'Fried Prawns',                es: 'Gambas Fritas' },
  'F5':   { en: 'Fish Toast',                  es: 'Tostadas de Pescado' },
  'F6':   { en: 'Shrimp Toast',                es: 'Tostadas de Gambas' },
  'F7':   { en: 'Stuffed Crab Claws (2 pcs)',  es: 'Pinzas de Cangrejo Rellenas (2 uds)' },

  // ━━━ Seafood ━━━
  'C1':   { en: 'Spicy Sautéed Prawns',        es: 'Gambas Salteadas Picantes' },
  'C2':   { en: 'Salt & Pepper Gambas',        es: 'Gambas a la Sal y Pimienta' },
  'C3':   { en: 'Sweet & Sour Prawns',         es: 'Gambas Agridulces' },
  'C4':   { en: 'Ginger Scallion Gambas',      es: 'Gambas con Jengibre y Cebollino' },
  'C5':   { en: 'Pineapple Cashew Prawns',     es: 'Gambas con Piña y Anacardos' },
  'C6':   { en: 'Steamed Gambas in Soy Sauce', es: 'Gambas al Vapor con Soja' },
  'C7':   { en: 'Spicy Crab Claws',            es: 'Pinzas de Cangrejo Picantes' },
  'C8':   { en: 'Salt & Pepper Crab Claws',    es: 'Pinzas de Cangrejo a la Sal y Pimienta' },
  'C9':   { en: 'Salt & Pepper Squid',         es: 'Calamares a la Sal y Pimienta' },
  'C10':  { en: 'Salt & Pepper Frog Legs',     es: 'Ancas de Rana a la Sal y Pimienta' },
  'C11':  { en: 'Salt & Pepper Soft Shell Crab', es: 'Cangrejo de Caparazón Blando a la Sal' },
  'C12':  { en: 'Lobster',                     es: 'Bogavante' },

  // ━━━ Meat ━━━
  'M1':   { en: 'Kung Pao Chicken',            es: 'Pollo Kung Pao' },
  'M2':   { en: 'Sweet & Sour Chicken',        es: 'Pollo Agridulce' },
  'M3':   { en: 'Caramelized Chicken',         es: 'Pollo Caramelizado' },
  'M4':   { en: 'Crispy Chicken',              es: 'Pollo Crujiente' },
  'M5':   { en: 'Sizzling Beef with Onions',   es: 'Ternera a la Plancha con Cebolla' },
  'M6':   { en: 'Kung Pao Beef Sizzling',      es: 'Ternera Kung Pao a la Plancha' },
  'M7':   { en: 'Satay Beef Sizzling',         es: 'Ternera Satay a la Plancha' },
  'M8':   { en: 'Black Pepper Beef Sizzling',  es: 'Ternera al Pimiento Negro a la Plancha' },
  'M9':   { en: 'Ginger Scallion Beef',        es: 'Ternera con Jengibre y Cebollino' },
  'M10':  { en: 'Dragons Elysées Beef',        es: 'Ternera Dragons Elysées' },
  'M11':  { en: 'Thai Beef',                   es: 'Ternera Tailandesa' },
  'M12':  { en: 'Cantonese Roast Duck (Half)', es: 'Pato Asado Cantonés (Medio)' },
  'M13a': { en: 'Peking Duck (Whole)',         es: 'Pato Pekinés (Entero)' },
  'M13b': { en: 'Peking Duck (Half)',          es: 'Pato Pekinés (Medio)' },

  // ━━━ Fish ━━━
  'P1':   { en: 'Steamed Sea Bass',            es: 'Lubina al Vapor' },
  'P2':   { en: 'Thai Grilled Sea Bass',       es: 'Lubina a la Plancha Tailandesa' },
  'P3':   { en: 'Spicy Sautéed Sea Bream',     es: 'Dorada Salteada Picante' },
  'P4':   { en: 'Steamed Sole',                es: 'Lenguado al Vapor' },
  'P5':   { en: 'Salt & Pepper Sole',          es: 'Lenguado a la Sal y Pimienta' },
  'P6':   { en: 'Black Pepper Sole',           es: 'Lenguado al Pimiento Negro' },
  'P7':   { en: 'Caramelized Sole',            es: 'Lenguado Caramelizado' },
  'P8':   { en: 'Sweet & Sour Sole',           es: 'Lenguado Agridulce' },
  'P9':   { en: 'Turbot (Steamed/Salt-Pepper)', es: 'Rodaballo (Vapor/Sal-Pimienta)' },
  'P10':  { en: 'Steamed Scallops (4 pcs)',    es: 'Vieiras al Vapor (4 uds)' },
  'P11':  { en: 'Spicy Sautéed Scallops',      es: 'Vieiras Salteadas Picantes' },
  'P12':  { en: 'Salt & Pepper Scallops',      es: 'Vieiras a la Sal y Pimienta' },

  // ━━━ Thai Soups ━━━
  'T201': { en: 'Tom Yum Seafood',             es: 'Tom Yum de Mariscos' },
  'T202': { en: 'Tom Yum Goong (Prawns)',      es: 'Tom Yum de Gambas' },
  'T203': { en: 'Tom Kha Gai',                 es: 'Tom Kha Gai (Pollo y Coco)' },
  'T204': { en: 'Tom Kha with Prawns',         es: 'Tom Kha de Gambas' },
  'T205': { en: 'Thai Beef Salad',             es: 'Ensalada Tailandesa de Ternera' },
  'T206': { en: 'Mango Prawn Salad',           es: 'Ensalada de Mango y Gambas' },
  'T207': { en: 'Pineapple Seafood Salad',     es: 'Ensalada de Piña y Mariscos' },
  'T208': { en: 'Thai Shrimp Spring Rolls',    es: 'Rollitos Tailandeses de Gambas' },

  // ━━━ Thai Mains ━━━
  'T218': { en: 'Chicken Skewers (3 pcs)',     es: 'Brochetas de Pollo (3 uds)' },
  'T219': { en: 'Beef Skewers (3 pcs)',        es: 'Brochetas de Ternera (3 uds)' },
  'T220': { en: 'Mixed Skewers (4 pcs)',       es: 'Brochetas Variadas (4 uds)' },
  'T221': { en: 'Chicken Curry',               es: 'Curry de Pollo' },
  'T222': { en: 'Lemongrass Chicken',          es: 'Pollo a la Hierba Limón' },
  'T223': { en: 'Basil Chicken Sizzling',      es: 'Pollo a la Albahaca a la Plancha' },
  'T224': { en: 'Basil Duck Sizzling',         es: 'Pato a la Albahaca a la Plancha' },
  'T225': { en: 'Basil Frog Legs Sizzling',    es: 'Ancas de Rana a la Albahaca a la Plancha' },
  'T226': { en: 'Basil Prawns Sizzling',       es: 'Gambas a la Albahaca a la Plancha' },
  'T227': { en: 'Basil Beef Sizzling',         es: 'Ternera a la Albahaca a la Plancha' },
  'T228': { en: 'Basil Scallops Sizzling',     es: 'Vieiras a la Albahaca a la Plancha' },
  'T229': { en: 'Scallop Curry',               es: 'Curry de Vieiras' },
  'T230': { en: 'Sole Skewers',                es: 'Brochetas de Lenguado' },

  // ━━━ Vegetarian ━━━
  'A1':   { en: 'Vegetable Vermicelli Soup',   es: 'Sopa de Verduras y Fideos' },
  'A2':   { en: 'Hot & Sour Soup',             es: 'Sopa Agripicante' },
  'A3':   { en: 'Thai Lemongrass Salad',       es: 'Ensalada Tailandesa de Hierba Limón' },
  'A4':   { en: 'Vegetable Spring Rolls',      es: 'Rollitos Vegetarianos' },
  'A5':   { en: 'Fresh Vegetable Rolls',       es: 'Rollitos Frescos Vegetarianos' },
  'A6':   { en: 'Vegetable Fried Rice',        es: 'Arroz Salteado Vegetariano' },
  'A7':   { en: 'Vegetable Stir-fried Noodles', es: 'Fideos Salteados Vegetarianos' },
  'A8':   { en: 'Vegetarian Bánh Cuốn',        es: 'Bánh Cuốn Vegetariano' },
  'A9':   { en: 'Buddha Clay Pot',             es: 'Cazuela Buda' },
  'A10':  { en: 'Stir-fried Black Mushrooms',  es: 'Setas Negras Salteadas' },
  'A11':  { en: 'Salt & Pepper Tofu',          es: 'Tofu a la Sal y Pimienta' },
  'A12':  { en: 'Mapo Tofu',                   es: 'Mapo Tofu' },
  'A13':  { en: 'Sautéed Broccoli',            es: 'Brócoli Salteado' },
  'A14':  { en: 'Stir-fried Seasonal Vegetables', es: 'Verduras de Temporada Salteadas' },

  // ━━━ Rice & Noodles ━━━
  'A15':  { en: 'Steamed White Rice',          es: 'Arroz Blanco' },
  'A16':  { en: 'Sticky Rice',                 es: 'Arroz Glutinoso' },
  'A17':  { en: 'Cantonese Fried Rice',        es: 'Arroz Cantonés' },
  'A18':  { en: 'Stir-fried Noodles',          es: 'Fideos Salteados' },
  'A19':  { en: 'Thai Shrimp Fried Rice',      es: 'Arroz Salteado Tailandés con Gambas' },
  'A20':  { en: 'Mixed Stir-fried Vegetables', es: 'Salteado Variado de Verduras' },

  // ━━━ Desserts ━━━
  'D01':  { en: 'Ice Cream (2 scoops)',        es: 'Helado (2 bolas)' },
  'D02':  { en: 'Ice Cream (1 scoop)',         es: 'Helado (1 bola)' },
  'D03':  { en: 'Pattaya Sundae',              es: 'Copa Pattaya' },
  'D04':  { en: 'Sun Sundae',                  es: 'Copa Sol' },
  'D05':  { en: 'Thai Sundae',                 es: 'Copa Tailandesa' },
  'D06':  { en: 'Pacific Sundae',              es: 'Copa Pacífico' },
  'D07':  { en: 'Black Forest',                es: 'Selva Negra' },
  'D08':  { en: 'Fruit Salad',                 es: 'Macedonia de Frutas' },
  'D09':  { en: 'Fresh Mango',                 es: 'Mango Fresco' },
  'D10':  { en: 'Fresh Pineapple',             es: 'Piña Fresca' },
  'D11':  { en: 'Mango Sticky Rice',           es: 'Arroz Glutinoso con Mango' },
  'D12':  { en: 'Thai Pudding',                es: 'Flan Tailandés' },
  'D13':  { en: 'Black Sesame Rice Balls',     es: 'Bolas de Arroz con Sésamo Negro' },
  'D14':  { en: 'Flambéed Fruit Fritters',     es: 'Buñuelos de Fruta Flameados' },
  'D15':  { en: 'Fruit Fritters',              es: 'Buñuelos de Fruta' },
  'D16':  { en: 'Candied Ginger & Nuts',       es: 'Jengibre Confitado con Frutos Secos' },
  'D17':  { en: 'Mochi Ice Cream',             es: 'Mochis Helados' },
  'D18':  { en: 'Coconut Balls',               es: 'Bolas de Coco' },
  'D19':  { en: 'Chocolate Spring Roll',       es: 'Rollito de Chocolate' },
  'D20':  { en: 'Lychees in Syrup',            es: 'Lichis en Almíbar' },

  // ━━━ Drinks ━━━
  'B01':  { en: 'Chinese Tea',                 es: 'Té Chino' },
  'B02':  { en: 'Coffee / Decaf',              es: 'Café / Descafeinado' },
  'B03':  { en: 'Cappuccino',                  es: 'Café con Leche' },
  'B04':  { en: 'Fresh Orange Juice',          es: 'Zumo de Naranja Natural' },
  'B05':  { en: 'Fruit Juice',                 es: 'Zumo de Fruta' },
  'B06':  { en: 'Ice Tea / Sprite / Orangina', es: 'Té Helado / Sprite / Orangina' },
  'B07':  { en: 'Coke / Coke Zero',            es: 'Coca-Cola / Coca-Cola Zero' },
  'B08':  { en: 'Flavored Syrup Water',        es: 'Agua con Sirope' },
  'B09':  { en: 'Mineral Water (1/2 bottle)',  es: 'Agua Mineral (1/2 botella)' },
  'B10':  { en: 'Mineral Water (bottle)',      es: 'Agua Mineral (botella)' },

  // ━━━ Lobster Special ━━━
  'L01':  { en: 'Lobster (500g)',              es: 'Bogavante (500g)' },
  'L02':  { en: 'Lobster (600g)',              es: 'Bogavante (600g)' },
  'L03':  { en: 'Lobster (700g+)',             es: 'Bogavante (700g+)' },
  'L04':  { en: 'Langoustine (500g)',          es: 'Langosta (500g)' },
  'L05':  { en: 'Langoustine (600g)',          es: 'Langosta (600g)' },
  'L06':  { en: 'Langoustine (700g+)',         es: 'Langosta (700g+)' },
};

// Note 翻译（仅 2 道菜）
const NOTE_TRANSLATIONS = {
  'C12': { en: 'Ginger-Scallion / Salt-Pepper / Spicy', es: 'Jengibre-Cebollino / Sal-Pimienta / Picante' },
  'A13': { en: 'Stir-fried / Garlic',                   es: 'Salteado / Ajo' },
};

// 应用翻译
let categoryCount = 0;
let itemCount = 0;
let noteCount = 0;
let missingItems = [];

menu.categories.forEach(cat => {
  // 分类
  const catTrans = CATEGORY_TRANSLATIONS[cat.id];
  if (catTrans) {
    cat.name.en = catTrans.en;
    cat.name.es = catTrans.es;
    categoryCount++;
  } else {
    console.warn('Missing category translation:', cat.id);
  }

  // 菜品
  (cat.items || []).forEach(item => {
    const itemTrans = ITEM_TRANSLATIONS[item.id];
    if (itemTrans) {
      item.name.en = itemTrans.en;
      item.name.es = itemTrans.es;
      itemCount++;
    } else {
      missingItems.push(item.id + ' (' + (item.name.fr || '?') + ')');
    }

    // Note
    if (item.note && NOTE_TRANSLATIONS[item.id]) {
      item.note.en = NOTE_TRANSLATIONS[item.id].en;
      item.note.es = NOTE_TRANSLATIONS[item.id].es;
      noteCount++;
    }
  });
});

// 写回
fs.writeFileSync(menuPath, JSON.stringify(menu, null, 2) + '\n');

// 报告
console.log('═══════════════════════════════════════');
console.log('Translation applied:');
console.log('  Categories: ' + categoryCount + '/14');
console.log('  Items:      ' + itemCount + '/153');
console.log('  Notes:      ' + noteCount + '/2');
if (missingItems.length > 0) {
  console.log('  ⚠️  Missing item translations:');
  missingItems.forEach(m => console.log('     - ' + m));
}
console.log('═══════════════════════════════════════');
