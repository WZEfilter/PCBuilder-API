import { getJson } from 'serpapi';

export async function searchProduct(partName) {
  const json    = await getJson({ engine: 'amazon', api_key: process.env.SERPAPI_KEY, q: partName, country: 'US' });
  const results = json.shopping_results || [];
  const top     = results.length > 0 ? results[0] : {};
  if (!top.link) return { part: partName, error: 'No result found' };

  const url = new URL(top.link);
  url.searchParams.set('tag', process.env.AFFILIATE_TAG);
  return { part: partName, title: top.title, price: top.price, link: url.toString() };
}
