import { getJson } from 'serpapi';

export async function searchProduct(partName) {
  const json = await getJson({
    engine: 'amazon',
    api_key: process.env.SERPAPI_KEY,
    q: partName,
    country: 'US'
  });
  …
}
