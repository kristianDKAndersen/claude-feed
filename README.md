# Claude product updates → RSS → Slack

Scrapes https://claude.com/resources/product-updates 3×/weekday, publishes `rss.xml` to GitHub Pages.
Slack's RSS app (`/feed`) posts new items to the channel. Unofficial mirror; content © Anthropic.

## How it works
1. Listing page → English `/resources/articles/*` links (max 15)
2. Each article → `og:title`, `og:description`, `article:published_time`, category link
3. Keep "Product updates" ≤ 14 days old and published on/after `FEED_START` (2026-11-13), newest 10 → `dist/rss.xml`.
   `FEED_START` means subscribing in Slack never posts a backlog; only articles published after launch appear.
4. Pages deploys **only** `dist/` (rss.xml + index.html). Repo itself can stay private.

Guardrails: no links / missing title or date → job fails, last good feed stays live.
`guid` = article URL → Slack never posts the same item twice.

## Setup
1. Settings → Pages → Source: **GitHub Actions**
2. Actions → Build feed → Run workflow
3. Open `https://<user>.github.io/<repo>/rss.xml`, check items
4. Slack test channel: `/feed subscribe https://<user>.github.io/<repo>/rss.xml`
5. Looks good → subscribe in the real channel, remove from test

## Ops
- Pause: `/feed remove` in channel (or disable workflow)
- Failure: GitHub emails on failed run → likely layout change → fix `src/parse.js`, update fixtures
- Local: `npm test`, `npm run build` (Node ≥ 20, zero deps)
- Tune: `src/config.js`
