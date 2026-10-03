#!/usr/bin/env node
// Verifica la vista previa y el SEO básico del sitio SOBRE LA COMPILACIÓN (dist/). Uso: npm run build && node scripts/verificar-seo.mjs
// Con --autoprueba comprueba además que este verificador SÍ detecta el problema: lo corre contra el index.html anterior (git HEAD) y contra
// variantes rotas del actual, y exige que fallen. Sin dependencias; solo lectura. Código de salida 1 si algo falla.
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const DIST = path.join(RAIZ, 'dist')

const meta = (html, attr, nombre) => {
  const m = html.match(new RegExp(`<meta[^>]*${attr}="${nombre}"[^>]*content="([^"]*)"`, 'i')) ||
            html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${nombre}"`, 'i'))
  return m ? m[1] : ''
}
function pngInfo(file) {  // lee ancho/alto de un PNG o un JPG real (no se fía de la extensión)
  const b = fs.readFileSync(file)
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue }
      const m = b[i + 1]
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5), bytes: b.length }
      i += 2 + b.readUInt16BE(i + 2)
    }
  }
  return null
}

/** Devuelve la lista de fallos de un index.html frente a la carpeta publicada `dist`. */
export function revisarHtml(html, dist) {
  const f = []
  const falla = (c, msg) => { if (!c) f.push(msg) }
  falla(/<html[^>]*lang="es"/i.test(html), 'html lang debe ser "es"')
  const titulo = (html.match(/<title>([^<]*)<\/title>/i) || [, ''])[1].trim()
  falla(titulo.length >= 20 && titulo.length <= 60, `título de ${titulo.length} caracteres (usar 20-60): «${titulo}»`)
  const desc = meta(html, 'name', 'description')
  falla(desc.length >= 70 && desc.length <= 160, `meta description de ${desc.length} caracteres (usar 70-160)`)
  falla(/<link[^>]*rel="canonical"[^>]*href="https:\/\/grupo-ac\.com\.gt\/"/i.test(html), 'falta canonical https://grupo-ac.com.gt/')
  for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:locale', 'og:image:width', 'og:image:height'])
    falla(meta(html, 'property', p), `falta ${p}`)
  falla(meta(html, 'name', 'twitter:card') === 'summary_large_image', 'falta twitter:card summary_large_image')
  const img = meta(html, 'property', 'og:image')
  falla(/^https:\/\//.test(img), 'og:image debe ser una URL absoluta https (los redes no resuelven rutas relativas)')
  if (img.startsWith('https://grupo-ac.com.gt/')) {
    const f2 = path.join(dist, img.replace('https://grupo-ac.com.gt/', ''))
    const info = fs.existsSync(f2) ? pngInfo(f2) : null
    falla(info, `el archivo de og:image no existe o no es PNG/JPG en dist: ${img}`)
    if (info) {
      falla(info.w === 1200 && info.h === 630, `og:image mide ${info.w}x${info.h} (debe ser 1200x630)`)
      falla(info.bytes < 300 * 1024, `og:image pesa ${Math.round(info.bytes / 1024)} KB (usar < 300 KB para que WhatsApp la muestre)`)
    }
  }
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  falla(ld, 'falta JSON-LD (datos estructurados)')
  if (ld) {
    try {
      const j = JSON.parse(ld[1])
      falla(j['@type'] === 'Organization' && j.name === 'Grupo AC', 'JSON-LD debe ser Organization «Grupo AC»')
      for (const prohibido of ['telephone', 'address', 'taxID', 'vatID', 'aggregateRating', 'review', 'priceRange', 'foundingDate', 'numberOfEmployees'])
        falla(!(prohibido in j), `JSON-LD no debe incluir «${prohibido}»: dato no verificado (no se inventan hechos de la empresa)`)
      falla(j.email === 'info@grupo-ac.com.gt', 'el correo del JSON-LD debe ser el público info@grupo-ac.com.gt')
    } catch { f.push('el JSON-LD no es JSON válido') }
  }
  const ns = html.match(/<noscript>([\s\S]*?)<\/noscript>/i)
  falla(ns && /<h1>/.test(ns[1]) && (ns[1].match(/<li>/g) || []).length >= 3, 'falta <noscript> con h1 y al menos 3 servicios (para buscadores sin JavaScript)')
  falla(/<div id="root"><\/div>/.test(html) && /type="module"[^>]*src="[^"]*(main|index)[^"]*"/.test(html), 'la app React debe seguir montándose (#root y script de módulo)')
  falla(!/vite\.svg/.test(html), 'sigue apuntando al ícono por defecto de Vite (vite.svg)')
  falla(/rel="icon"[^>]*favicon-32\.png/.test(html) && /rel="apple-touch-icon"/.test(html), 'faltan los íconos favicon-32.png / apple-touch-icon')
  return f
}

function revisarArchivos(dist) {
  const f = []
  const falla = (c, msg) => { if (!c) f.push(msg) }
  const rb = path.join(dist, 'robots.txt')
  falla(fs.existsSync(rb), 'falta robots.txt en dist')
  if (fs.existsSync(rb)) {
    const t = fs.readFileSync(rb, 'utf8')
    falla(/User-agent:\s*\*/i.test(t), 'robots.txt sin User-agent: *')
    falla(!/Disallow:\s*\/\s*$/im.test(t), 'robots.txt bloquea todo el sitio (Disallow: /)')
    falla(/Sitemap:\s*https:\/\/grupo-ac\.com\.gt\/sitemap\.xml/i.test(t), 'robots.txt sin la línea Sitemap absoluta')
  }
  const sm = path.join(dist, 'sitemap.xml')
  falla(fs.existsSync(sm), 'falta sitemap.xml en dist')
  if (fs.existsSync(sm)) {
    const t = fs.readFileSync(sm, 'utf8')
    falla(/<urlset[^>]*sitemaps\.org/.test(t) && /<loc>https:\/\/grupo-ac\.com\.gt\/<\/loc>/.test(t), 'sitemap.xml inválido o sin la portada')
    falla(!/#\//.test(t), 'el sitemap no debe listar rutas con #/ (los buscadores las ignoran y son del portal privado)')
  }
  for (const [n, w, h] of [['favicon-32.png', 32, 32], ['favicon-192.png', 192, 192], ['apple-touch-icon.png', 180, 180]]) {
    const p = path.join(dist, n), i = fs.existsSync(p) ? pngInfo(p) : null
    falla(i && i.w === w && i.h === h, `${n} falta o no mide ${w}x${h}`)
  }
  falla(!fs.existsSync(path.join(dist, 'vite.svg')), 'dist todavía publica vite.svg')
  return f
}

const args = process.argv.slice(2)
let malos = 0
const informar = (titulo, fallos) => { console.log(`${fallos.length ? 'FALLA' : 'PASA '}  ${titulo}`); fallos.forEach(x => console.log('        → ' + x)); if (fallos.length) malos++ }

if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('No hay dist/: corre npm run build primero.'); process.exit(2) }
const actual = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
informar('index.html compilado: vista previa, SEO, JSON-LD, noscript, app intacta', revisarHtml(actual, DIST))
informar('archivos publicados: robots.txt, sitemap.xml, íconos', revisarArchivos(DIST))

if (args.includes('--autoprueba')) {
  const debeFallar = (titulo, html, minimo = 1) => { const n = revisarHtml(html, DIST).length; console.log(`${n >= minimo ? 'PASA ' : 'FALLA'}  autoprueba: ${titulo} (${n} fallos detectados)`); if (n < minimo) malos++ }
  let anterior = ''
  // El «anterior» es la versión del historial con MÁS fallos frente al verificador (la original, sin vista previa): así la autoprueba
  // sigue valiendo esté o no commiteado el arreglo.
  let peor = 0
  for (const ref of ['HEAD', 'HEAD~1', 'HEAD~2', 'HEAD~3']) {
    try {
      const h = execSync(`git show ${ref}:index.html`, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      const n = revisarHtml(h, DIST).length
      if (n > peor) { peor = n; anterior = h }
    } catch { /* sin git o sin esa versión */ }
  }
  if (anterior) debeFallar('el index.html ANTERIOR (sin vista previa) debe fallar', anterior, 8)
  debeFallar('sin og:image', actual.replace(/<meta property="og:image"[^>]*>/, ''))
  debeFallar('og:image relativa', actual.replace('https://grupo-ac.com.gt/og-image.jpg', '/og-image.jpg'))
  debeFallar('descripción demasiado corta', actual.replace(/name="description" content="[^"]*"/, 'name="description" content="Corta"'))
  debeFallar('JSON-LD con teléfono inventado', actual.replace('"areaServed"', '"telephone": "+502 0000-0000", "areaServed"'))
  debeFallar('sin noscript', actual.replace(/<noscript>[\s\S]*?<\/noscript>/, ''))
  debeFallar('sin #root (app rota)', actual.replace('<div id="root"></div>', ''))
  debeFallar('lang=en', actual.replace('lang="es"', 'lang="en"'))
}
console.log(malos ? `\n${malos} comprobación(es) con fallos.` : '\nTodo en orden.')
process.exit(malos ? 1 : 0)
