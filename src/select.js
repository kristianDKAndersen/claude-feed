// Which parsed articles go in the feed. Pure, so it can be unit-tested.
export function selectItems(articles, { now, feedStart, maxAgeDays, maxItems }) {
  const cutoff = Math.max(now.getTime() - maxAgeDays * 864e5, feedStart.getTime())
  return articles
    .filter((a) => a.isProductUpdate && a.date.getTime() >= cutoff)
    .sort((a, b) => b.date - a.date)
    .slice(0, maxItems)
}
