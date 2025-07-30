// tools.js
import { getJson } from 'serpapi';

export async function searchProduct(partName) {
  // 1️⃣ Log entry
  console.log(`🔎 searchProduct() called for: "${partName}"`);
  console.log(`   AFFILIATE_TAG: "${process.env.AFFILIATE_TAG}"`);

  // 2️⃣ Fire the SerpAPI request
  const json = await getJson({
    engine:        'amazon',
    api_key:       process.env.SERPAPI_KEY,
    k:             partName,
    amazon_domain: 'amazon.com',
    no_cache:      true
  });

  // 3️⃣ Dump the raw shopping_results
  console.log(
    `   raw shopping_results (first 2) for "${partName}":`,
    JSON.stringify(json.shopping_results?.slice(0, 2), null, 2)
  );

  const results = json.shopping_results || [];
  const top     = results[0] || {};

  // 4️⃣ If no link, log and return null
  if (!top.link) {
    console.warn(`⚠️ No top.link for "${partName}", returning link:null`);
    return {
      part:  partName,
      title: top.title || null,
      price: top.price || null,
      link:  null
    };
  }

  // 5️⃣ Normalize & tag
  const rawLink = top.link.endsWith('/') ? top.link : `${top.link}/`;
  console.log(`   rawLink before tag: ${rawLink}`);

  const url = new URL(rawLink);
  url.searchParams.set('tag', process.env.AFFILIATE_TAG);
  console.log(`   tagged URL: ${url.toString()}`);

  // 6️⃣ Return full result
  return {
    part:  partName,
    title: top.title,
    price: top.price,
    link:  url.toString()
  };
}
