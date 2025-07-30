// tools.js
import { getJson } from 'serpapi';

export async function searchProduct(partName) {
  console.log(`🔎 searchProduct() for: "${partName}"`);
  console.log(`   AFFILIATE_TAG: "${process.env.AFFILIATE_TAG}"`);

  // 1) Try SerpAPI’s Amazon engine
  const json = await getJson({
    engine:        'amazon',
    api_key:       process.env.SERPAPI_KEY,
    k:             partName,
    amazon_domain: 'amazon.com',
    no_cache:      true
  });

  console.log(
    `   raw shopping_results:`,
    JSON.stringify(json.shopping_results?.slice(0,2), null, 2)
  );

  const results = json.shopping_results || [];
  const top     = results[0] || {};

  let link;
  if (top.link) {
    // 2a) We got a direct product URL
    const rawLink = top.link.endsWith('/') ? top.link : `${top.link}/`;
    console.log(`   rawLink before tagging: ${rawLink}`);
    const url = new URL(rawLink);
    url.searchParams.set('tag', process.env.AFFILIATE_TAG);
    link = url.toString();
    console.log(`   tagged URL: ${link}`);
  } else {
    // 2b) Fallback: Amazon search page for the term
    const searchUrl = new URL('https://www.amazon.com/s');
    searchUrl.searchParams.set('k', partName);
    searchUrl.searchParams.set('tag', process.env.AFFILIATE_TAG);
    link = searchUrl.toString();
    console.warn(`⚠️ No direct product link; using search page: ${link}`);
  }

  return {
    part:  partName,
    title: top.title  || null,
    price: top.price  || null,
    link
  };
}
