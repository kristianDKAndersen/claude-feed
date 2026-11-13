export const SITE = 'https://claude.com'
export const LISTING_URL = `${SITE}/resources/product-updates`
export const CATEGORY_PATH = '/resources/product-updates'
export const USER_AGENT = 'claude-product-updates-feed/1.0 (+https://github.com/kristianDKAndersen)'

export const MAX_ITEMS = 10        // items kept in feed
export const MAX_AGE_DAYS = 14     // ignore older articles (limits first-subscribe noise)
export const MAX_ARTICLE_FETCHES = 15
export const FETCH_DELAY_MS = 500  // be polite
export const OUT_DIR = 'dist'
