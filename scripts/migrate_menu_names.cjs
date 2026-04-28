/**
 * One-time migration: name_zh / name_fr → name: { zh, fr }
 * Also handles note_zh / note_fr → note: { zh, fr }
 * Run: node scripts/migrate_menu_names.cjs
 */
const fs = require('fs')
const path = require('path')

const menuPath = path.join(__dirname, '../public/data/menu.json')
const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'))

function migrateNames(obj) {
  const result = { ...obj }
  if ('name_zh' in result || 'name_fr' in result) {
    result.name = { zh: result.name_zh || '', fr: result.name_fr || '' }
    delete result.name_zh
    delete result.name_fr
  }
  if ('note_zh' in result || 'note_fr' in result) {
    result.note = { zh: result.note_zh || '', fr: result.note_fr || '' }
    delete result.note_zh
    delete result.note_fr
  }
  return result
}

menu.categories = menu.categories.map(cat => {
  const migrated = migrateNames(cat)
  migrated.items = cat.items.map(migrateNames)
  return migrated
})

fs.writeFileSync(menuPath, JSON.stringify(menu, null, 2), 'utf8')
console.log('menu.json migrated: name_zh/name_fr → name: { zh, fr }')
const sample = menu.categories[0].items[0]
console.log('sample item:', JSON.stringify(sample))
