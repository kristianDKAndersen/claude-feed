# CLAUDE.md

Zero-dependency Node 20 ESM. Builds RSS of claude.com "Product updates" for Slack /feed. See README.

## Rules
- Keep zero runtime deps. Regex HTML parsing is deliberate: we only read <a href>, <meta>, <link rel=canonical>.
- Content verbatim from og:title / og:description. Never rewrite, summarize, or add text.
- Only https://claude.com/resources/articles/* URLs (English). Never other domains.
- Failing loudly > publishing a wrong feed.
- Be polite to claude.com: ≤15 article fetches/run, 500ms delay, identifiable User-Agent.

## First-run tasks (not yet verified against live site — built from rendered snapshots)
1. Check https://claude.com/robots.txt allows /resources/. Stop and report if not.
2. `curl -sA 'claude-product-updates-feed/1.0' https://claude.com/resources/product-updates > /tmp/l.html`
   Confirm article links are in the raw HTML (not JS-rendered only). If client-rendered:
   check https://claude.com/sitemap.xml as alternative discovery source; report before changing approach.
3. Fetch one article (e.g. /resources/articles/claude-meetings). Confirm og:title, og:description,
   article:published_time, and a category href to /resources/product-updates exist in raw HTML.
4. Check category href is NOT in global nav/footer (else isProductUpdate always true). If it is, scope match to article body.
5. Replace test/fixtures/*.html with trimmed real HTML; keep tests green.
6. `npm run build` locally; sanity-check dist/rss.xml.
7. Create private repo, push, enable Pages (Source: GitHub Actions), run workflow manually.
