// tools.js
import { getJson } from 'serpapi';

export async function searchProduct(partName) {
  // Debug: ensure your affiliate tag is loaded
  console.log('🔑 AFFILIATE_TAG is:', process.env.AFFILIATE_TAG);

  // 1️⃣ Query SerpAPI’s Amazon engine (uses `k` for the search term)
  const json = await getJson({
    engine:  'amazon',
    api_key: process.env.SERPAPI_KEY,
    k:       partName,
    country: 'US'
  });

  // 2️⃣ Inspect the top few raw results for debugging
  console.log(
    `🔴 SerpAPI raw shopping_results for "${partName}":`,
    json.shopping_results?.slice(0, 3)
  );

  const results = json.shopping_results || [];
  const top     = results.length > 0 ? results[0] : {};

  // 3️⃣ Always return a link field, even if null
  if (!top.link) {
    console.warn(`⚠️ No Amazon result for "${partName}"`);
    return {
      part:  partName,
      title: top.title || null,
      price: top.price || null,
      link:  null
    };
  }

  // 4️⃣ Prepare and log the raw URL before tagging
  const rawLink = top.link.endsWith('/') ? top.link : `${top.link}/`;
  console.log('📦 raw Amazon URL before tagging:', rawLink);

  // 5️⃣ Append your affiliate tag and log the final URL
  const url = new URL(rawLink);
  url.searchParams.set('tag', process.env.AFFILIATE_TAG);
  console.log('🏷️ tagged URL:', url.toString());

  // 6️⃣ Return the complete product info
  return {
    part:  partName,
    title: top.title,
    price: top.price,
    link:  url.toString()
  };
}
