// tools.js
import { getJson } from 'serpapi';

export async function searchProduct(partName) {
  // 1️⃣ Debug your affiliate tag
  console.log('🔑 AFFILIATE_TAG:', process.env.AFFILIATE_TAG);

  // 2️⃣ Perform a live Amazon search (no cache) on amazon.com
  const json = await getJson({
    engine:        'amazon',           // use the Amazon engine
    api_key:       process.env.SERPAPI_KEY,
    k:             partName,           // your search term :contentReference[oaicite:0]{index=0}
    amazon_domain: 'amazon.com',       // ensure results come from amazon.com :contentReference[oaicite:1]{index=1}
    no_cache:      true                // force fresh results
  });

  // 3️⃣ Log out the first 3 results so you can inspect titles & links
  console.log(
    `🔴 SerpAPI raw shopping_results for "${partName}":`,
    JSON.stringify(json.shopping_results?.slice(0, 3), null, 2)
  );

  const results = json.shopping_results || [];
  const top     = results[0] || {};

  // 4️⃣ Always return a link field (null if nothing found)
  if (!top.link) {
    console.warn(`⚠️ No Amazon result for "${partName}"`);
    return { part: partName, title: top.title || null, price: top.price || null, link: null };
  }

  // 5️⃣ Normalize URL and append your affiliate tag
  const rawLink = top.link.endsWith('/') ? top.link : `${top.link}/`;
  console.log('📦 raw Amazon URL before tagging:', rawLink);

  const url = new URL(rawLink);
  url.searchParams.set('tag', process.env.AFFILIATE_TAG);
  console.log('🏷️ tagged URL:', url.toString());

  // 6️⃣ Return the enriched result
  return {
    part:  partName,
    title: top.title,
    price: top.price,
    link:  url.toString()
  };
}
