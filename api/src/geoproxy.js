// Search for places and look up "where am I" using OpenStreetMap's Nominatim service.
// Their rules: identify yourself with a User-Agent, at most 1 request per second, cache results.
const DV = require('../../web/core/index.js');

function createGeoProxy(opts) {
  const fetchImpl = opts.fetch, log = opts.log;
  const cache = new Map();
  let chain = Promise.resolve();
  let lastCall = 0;

  function throttled(fn) {
    const run = chain.then(async () => {
      const wait = Math.max(0, lastCall + (opts.minGapMs === undefined ? 1100 : opts.minGapMs) - Date.now());
      if (wait) await new Promise((r) => setTimeout(r, wait));
      lastCall = Date.now();
      return fn();
    });
    chain = run.catch(() => {});
    return run;
  }

  async function call(path, cacheKey) {
    const hit = cache.get(cacheKey);
    if (hit && hit.exp > Date.now()) return hit.data;
    const data = await throttled(async () => {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 12000);
      try {
        const r = await fetchImpl(opts.baseUrl + path, { signal: ctl.signal, headers: { 'User-Agent': opts.userAgent, Accept: 'application/json' } });
        if (!r.ok) throw new Error('Nominatim ' + r.status);
        return await r.json();
      } finally { clearTimeout(timer); }
    });
    cache.set(cacheKey, { data: data, exp: Date.now() + 24 * 3600 * 1000 });
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    return data;
  }

  return {
    async search(q) {
      q = DV.util.clean(String(q || ''), 80);
      if (q.length < 2) return [];
      const data = await call('/search?format=jsonv2&addressdetails=1&limit=6&accept-language=en&q=' + encodeURIComponent(q), 's:' + DV.util.norm(q));
      const out = [], seen = {};
      (Array.isArray(data) ? data : []).forEach((r) => {
        const p = DV.geo.mapNominatim(r);
        if (p && !seen[p.label]) { seen[p.label] = true; out.push(p); }
      });
      return out;
    },
    async reverse(lat, lon) {
      const la = Math.round(lat * 1000) / 1000, lo = Math.round(lon * 1000) / 1000;
      const data = await call('/reverse?format=jsonv2&addressdetails=1&zoom=14&accept-language=en&lat=' + la + '&lon=' + lo, 'r:' + la + ',' + lo);
      if (!data || data.error) return null;
      return DV.geo.mapNominatim(Object.assign({}, data, { lat: String(la), lon: String(lo) }));
    }
  };
}
module.exports = { createGeoProxy };
