// tools.js
import { getJson } from 'serpapi';

export async function searchProduct(partName) {
  // 1️⃣ Use `k` for Amazon queries (not `q`)
  const json = await getJson({
    engine:  'amazon',
    api_key: process.env.SERPAPI_KEY,
    k:       partName,
    country: 'US'
  });

  const results = json.shopping_results || [];
  const top     = results.length > 0 ? results[0] : {};

  // 2️⃣ Always return a link field (null if no result)
  if (!top.link) {
    return { part: partName, title: null, price: null, link: null };
  }

  // 3️⃣ Append your affiliate tag
  const rawLink       = top.link;
  const withSlash     = rawLink.endsWith('/') ? rawLink : `${rawLink}/`;
  const url           = new URL(withSlash);
  url.searchParams.set('tag', process.env.AFFILIATE_TAG);

  return {
    part:  partName,
    title: top.title,
    price: top.price,
    link:  url.toString()
  };
}
