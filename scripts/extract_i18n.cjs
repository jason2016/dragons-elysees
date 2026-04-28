/**
 * One-time script: extract translations from useLang.jsx → locale JSON files.
 * Run: node scripts/extract_i18n.js
 */
const fs = require('fs')
const path = require('path')

const src = fs.readFileSync(
  path.join(__dirname, '../src/hooks/useLang.jsx'),
  'utf8'
)

// Pull out the translations object: between 'const translations = ' and '\nexport function LangProvider'
const exportIdx = src.indexOf('\nexport function LangProvider')
const declIdx   = src.indexOf('const translations = {')
const block = src.slice(declIdx + 'const translations = '.length, exportIdx).trimEnd()

let translations
try {
  translations = eval('(' + block + ')')
} catch (e) {
  console.error('Failed to eval translations block:', e.message)
  process.exit(1)
}

/**
 * Convert function-valued keys to i18next interpolation strings.
 * e.g. (amount) => `Vous gagnerez ${amount} de cashback`
 *   → "Vous gagnerez {{amount}} de cashback"
 */
function serialize(obj) {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'function') {
      const fnStr = v.toString()
      // Match arrow function body: backtick template or quoted string
      const tmplMatch = fnStr.match(/=>\s*`([\s\S]*?)`/)
      const strMatch  = fnStr.match(/=>\s*['"](.+?)['"]/)
      if (tmplMatch) {
        // Replace ${param} → {{param}}
        result[k] = tmplMatch[1].replace(/\$\{([^}]+)\}/g, '{{$1}}')
      } else if (strMatch) {
        result[k] = strMatch[1]
      } else {
        result[k] = `[fn:${k}]`
      }
    } else {
      result[k] = v
    }
  }
  return result
}

const fr = serialize(translations.fr)
const zh = serialize(translations.zh)

console.log(`fr: ${Object.keys(fr).length} keys`)
console.log(`zh: ${Object.keys(zh).length} keys`)

// Verify a function key converted correctly
console.log('cashbackEarn fr:', fr.cashbackEarn)
console.log('cashbackEarn zh:', zh.cashbackEarn)

const outDir = path.join(__dirname, '../src/i18n/locales')
fs.mkdirSync(outDir, { recursive: true })

fs.writeFileSync(path.join(outDir, 'fr.json'), JSON.stringify(fr, null, 2), 'utf8')
fs.writeFileSync(path.join(outDir, 'zh.json'), JSON.stringify(zh, null, 2), 'utf8')
fs.writeFileSync(path.join(outDir, 'en.json'), JSON.stringify({}, null, 2), 'utf8')
fs.writeFileSync(path.join(outDir, 'es.json'), JSON.stringify({}, null, 2), 'utf8')

console.log('Written: fr.json, zh.json, en.json, es.json → src/i18n/locales/')
