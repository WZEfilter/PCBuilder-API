// tools.js
import { getJson } from 'serpapi';

export async function searchProduct(partName) {
  // Hit SerpApi's Amazon Search API (uses `k` for the query)
  const json = await getJson({
    engine:  'amazon',
    api_key: process.env.SERPAPI_KEY,
    k:       partName,
    country: 'US'
  });

  // Grab the top result (if any)
  const results = json.shopping_results || [];
  const top     = results.length > 0 ? results[0] : {};
  if (!top.link) {
    return { part: partName, error: 'No result found' };
  }

  // Ensure trailing slash before appending tag
  const rawLink       = top.link;
  const linkWithSlash = rawLink.endsWith('/') ? rawLink : `${rawLink}/`;
  const url           = new URL(linkWithSlash);

  // Attach your affiliate tag
  url.searchParams.set('tag', process.env.AFFILIATE_TAG);

  return {
    part:  partName,
    title: top.title,
    price: top.price,
    link:  url.toString()
  };
}
