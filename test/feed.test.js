import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { extractArticleUrls, parseArticle } from '../src/parse.js'
import { buildRss } from '../src/rss.js'
import { selectItems } from '../src/select.js'

// Fixtures: real claude.com HTML (fetched 2026-11-13), trimmed to the tags parse.js reads.
const fx = (f) => readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8')

test('extracts article URLs from real listing, newest first, no nav/footer noise', () => {
  assert.deepEqual(extractArticleUrls(fx('listing.html')), [
    'https://claude.com/resources/articles/claude-for-manufacturing',
    'https://claude.com/resources/articles/self-hosted-claude-managed-agents',
    'https://claude.com/resources/articles/claude-meetings',
    'https://claude.com/resources/articles/interactive-connectors-full-tool',
    'https://claude.com/resources/articles/more-ways-to-work-with-claude-sheets-whiteboards-and-interactive-connectors',
    'https://claude.com/resources/articles/sheets-whiteboards-data',
    'https://claude.com/resources/articles/introducing-personal-finance-in-claude',
    'https://claude.com/resources/articles/claude-enterprise-security-updates',
    'https://claude.com/resources/articles/new-agents-and-products-claude-marketplace',
    'https://claude.com/resources/articles/message-threads',
  ])
})

test('dedupes, normalizes, ignores localized and other domains', () => {
  const html = `
    <a href="/resources/articles/Foo">x</a>
    <a href="https://claude.com/resources/articles/foo/?ref=nav">dup</a>
    <a href="https://www.claude.com/resources/articles/bar#top">bar</a>
    <a href="/fr/resources/articles/foo">fr</a>
    <a href="https://evil.example/resources/articles/baz">other domain</a>
    <a href="/resources/articles">index</a>`
  assert.deepEqual(extractArticleUrls(html), [
    'https://claude.com/resources/articles/foo',
    'https://claude.com/resources/articles/bar',
  ])
})

test('parses real product-update article', () => {
  const a = parseArticle(fx('article.html'), 'x')
  assert.equal(a.title, 'Introducing Claude Meetings, now in beta')
  assert.equal(a.description, 'Add Claude to your video calls to take notes, answer questions, and build docs and whiteboards while your team talks.')
  assert.equal(a.date.toISOString(), '2026-11-12T00:00:00.000Z')
  assert.equal(a.url, 'https://claude.com/resources/articles/claude-meetings')
  assert.equal(a.isProductUpdate, true)
})

test('real non product-update article is not flagged, despite full site nav', () => {
  const a = parseArticle(fx('article-other.html'), 'x')
  assert.equal(a.isProductUpdate, false)
  assert.equal(a.title, 'Agentic coding is straining CI. Here’s how we scaled test impact analysis at Anthropic')
  assert.ok(a.date)
})

test('rss escapes and uses URL as guid', () => {
  const xml = buildRss({
    title: 'T', link: 'https://claude.com', description: 'D',
    items: [{ title: 'A & B', url: 'https://claude.com/resources/articles/x', description: '<b>', date: new Date('2026-11-12') }],
  })
  assert.match(xml, /<title>A &amp; B<\/title>/)
  assert.match(xml, /<guid isPermaLink="true">https:\/\/claude.com\/resources\/articles\/x<\/guid>/)
  assert.match(xml, /&lt;b&gt;/)
})

test('selectItems: product updates only, after feedStart and max age, newest first, capped', () => {
  const a = (slug, date, pu = true) => ({ url: slug, date: new Date(date), isProductUpdate: pu })
  const opts = { now: new Date('2026-11-20T12:00:00Z'), feedStart: new Date('2026-11-13T00:00:00Z'), maxAgeDays: 14, maxItems: 2 }
  const picked = selectItems([
    a('before-start', '2026-11-12'), a('on-start', '2026-11-13'), a('other-cat', '2026-11-18', false),
    a('newest', '2026-11-19'), a('middle', '2026-11-15'),
  ], opts)
  assert.deepEqual(picked.map((x) => x.url), ['newest', 'middle'])
  assert.deepEqual(selectItems([a('on-start', '2026-11-13')], opts).map((x) => x.url), ['on-start'])
  // Long after feedStart, the max-age window governs.
  assert.deepEqual(selectItems([a('old', '2027-01-01'), a('fresh', '2027-02-10')], { ...opts, now: new Date('2027-02-15') }).map((x) => x.url), ['fresh'])
})
