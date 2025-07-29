import { GoogleSearch } from 'serpapi';
const serp = new GoogleSearch(process.env.SERPAPI_KEY);

export async function searchProduct(partName) {
  const json = await serp.json({
    engine:  'amazon',
    q:       partName,
    country: 'US'
  });
  const top = json.shopping_results?.[0] || {};
  if (!top.link) {
    return { part: partName, error: 'No result found' };
  }
  const url = new URL(top.link);
  url.searchParams.set('tag', process.env.AFFILIATE_TAG);
  return {
    part:  partName,
    title: top.title,
    price: top.price,
    link:  url.toString()
  };
}
