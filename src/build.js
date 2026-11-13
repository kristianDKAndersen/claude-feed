import { mkdir, writeFile } from 'node:fs/promises'
import { LISTING_URL, USER_AGENT, MAX_ITEMS, MAX_AGE_DAYS, MAX_ARTICLE_FETCHES, FETCH_DELAY_MS, OUT_DIR } from './config.js'
import { extractArticleUrls, parseArticle } from './parse.js'
import { buildRss } from './rss.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(url) {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT, accept: 'text/html' } })
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`)
  return res.text()
}

async function main() {
  const urls = extractArticleUrls(await get(LISTING_URL)).slice(0, MAX_ARTICLE_FETCHES)
  // Guardrail: 0 links = layout changed. Fail → last good feed stays published.
  if (urls.length === 0) throw new Error('No article links on listing page — layout changed?')

  const cutoff = Date.now() - MAX_AGE_DAYS * 864e5
  const items = []
  for (const url of urls) {
    const a = parseArticle(await get(url), url)
    if (!a.title || !a.date) throw new Error(`Missing title/date for ${url} — parser broken?`)
    if (a.isProductUpdate && a.date.getTime() >= cutoff) items.push(a)
    await sleep(FETCH_DELAY_MS)
  }

  items.sort((a, b) => b.date - a.date)
  const feedItems = items.slice(0, MAX_ITEMS)

  const xml = buildRss({
    title: 'Claude — Product updates',
    link: LISTING_URL,
    description: 'Unofficial mirror of claude.com Product updates. Content © Anthropic.',
    selfUrl: process.env.FEED_URL,
    items: feedItems,
  })

  await mkdir(OUT_DIR, { recursive: true })
  await writeFile(`${OUT_DIR}/rss.xml`, xml)
  await writeFile(`${OUT_DIR}/index.html`, '<!doctype html><meta charset="utf-8"><title>Claude product updates feed</title><p><a href="rss.xml">rss.xml</a></p>\n')
  console.log(`Scanned ${urls.length} links, ${feedItems.length} items in feed:`)
  for (const i of feedItems) console.log(`  ${i.date.toISOString().slice(0, 10)}  ${i.title}`)
}

main().catch((e) => { console.error(e.message); process.exit(1) })
