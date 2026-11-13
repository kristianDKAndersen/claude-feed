import { SITE, CATEGORY_PATH } from './config.js'

// English-only: localized paths (/fr/, /ja/…) never match since path must start with /resources
const ARTICLE_RE = /^(?:https?:\/\/(?:www\.)?claude\.com)?\/resources\/articles\/([a-z0-9][a-z0-9-]*)\/?(?:[?#].*)?$/i

export function extractArticleUrls(html) {
  const urls = new Set()
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
    const m = href.trim().match(ARTICLE_RE)
    if (m) urls.add(`${SITE}/resources/articles/${m[1].toLowerCase()}`)
  }
  return [...urls]
}

const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<')
   .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')

function metaTags(html) {
  const map = {}
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const key = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase()
    const val = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1]
    if (key && val != null && !(key in map)) map[key] = decode(val.trim())
  }
  return map
}

export function parseArticle(html, url) {
  const meta = metaTags(html)
  const rawTitle = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? ''
  const title = meta['og:title'] || decode(rawTitle).replace(/\s*\|\s*Claude.*$/, '')
  const description = meta['og:description'] || meta['description'] || ''
  const published = meta['article:published_time']
  const canonical =
    html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ??
    html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1]
  const catRe = new RegExp(`href=["'](?:https?://(?:www\\.)?claude\\.com)?${CATEGORY_PATH}/?["']`, 'i')
  const date = published ? new Date(published) : null

  return {
    url: canonical && ARTICLE_RE.test(canonical) ? canonical : url,
    title: title.trim(),
    description: description.trim(),
    date: date && !isNaN(date) ? date : null,
    isProductUpdate: catRe.test(html),
  }
}
