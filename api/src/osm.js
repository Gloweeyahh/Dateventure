// Worldwide venue discovery using OpenStreetMap data (free, no key, can be stored with credit).
// Overpass is the public search service for OpenStreetMap.
const DV = require('../../web/core/index.js');

// Which map tags answer each interest.
const FILTERS = {
  restaurants: ['"amenity"="restaurant"'],
  'street-food': ['"amenity"~"^(fast_food|food_court)$"'],
  cafes: ['"amenity"="cafe"'],
  desserts: ['"amenity"="ice_cream"', '"shop"~"^(pastry|confectionery|chocolate|bakery)$"', '"amenity"="cafe"'],
  cocktails: ['"amenity"~"^(bar|pub|nightclub)$"'],
  cooking: ['"amenity"="cooking_school"'],
  nature: ['"leisure"~"^(park|garden|nature_reserve)$"'],
  picnics: ['"leisure"="picnic_site"', '"tourism"="picnic_site"', '"leisure"="park"'],
  sunsets: ['"tourism"="viewpoint"'],
  water: ['"natural"~"^(beach|water)$"', '"leisure"~"^(marina|beach_resort|water_park|swimming_area)$"'],
  hiking: ['"leisure"="nature_reserve"', '"leisure"="park"'],
  'outdoor-games': ['"leisure"="miniature_golf"', '"tourism"="theme_park"'],
  art: ['"tourism"="gallery"', '"amenity"="arts_centre"'],
  pottery: ['"craft"="pottery"'],
  photography: ['"tourism"="viewpoint"', '"tourism"="attraction"'],
  workshops: ['"amenity"="arts_centre"', '"craft"="pottery"'],
  arcade: ['"leisure"="amusement_arcade"', '"tourism"="theme_park"'],
  bowling: ['"leisure"="bowling_alley"'],
  movies: ['"amenity"="cinema"'],
  'live-music': ['"amenity"="music_venue"', '"amenity"~"^(bar|pub)$"]["live_music"="yes"'],
  comedy: ['"amenity"="theatre"', '"amenity"="comedy_club"'],
  karaoke: ['"amenity"="karaoke_box"'],
  dancing: ['"amenity"="nightclub"'],
  'board-games': ['"shop"="games"', '"amenity"="cafe"]["board_game"~"."'],
  spa: ['"leisure"~"^(spa|sauna)$"', '"amenity"="spa"', '"shop"="massage"'],
  quiet: ['"amenity"="cafe"', '"amenity"="library"'],
  museums: ['"tourism"="museum"'],
  markets: ['"amenity"="marketplace"'],
  bookstores: ['"shop"="books"'],
  'local-culture': ['"tourism"="attraction"', '"amenity"="theatre"', '"amenity"="arts_centre"', '"historic"~"^(monument|memorial|castle|ruins|archaeological_site|building)$"']
};

// Turn the map tags of one place into our fields. First matching rule is the "main" one.
const RULES = [
  { m: (t) => t.amenity === 'restaurant', tags: ['restaurants'], cat: 'food', art: 'table', band: 'moderate', time: 'evening', hook: 'share a few plates and take your time', vibe: ['Sit-down'] },
  { m: (t) => t.amenity === 'fast_food' || t.amenity === 'food_court', tags: ['street-food'], cat: 'food', art: 'market', band: 'low', time: 'evening', hook: 'grab something tasty and swap bites', vibe: ['Casual'] },
  { m: (t) => t.amenity === 'cafe', tags: ['cafes', 'quiet'], cat: 'cafe', art: 'dessert', band: 'low', time: 'afternoon', hook: 'settle in for a long catch-up over something warm', vibe: ['Cosy'] },
  { m: (t) => t.amenity === 'ice_cream' || /^(pastry|confectionery|chocolate|bakery)$/.test(t.shop || ''), tags: ['desserts'], cat: 'cafe', art: 'dessert', band: 'low', time: 'afternoon', hook: 'share something sweet and compare favourites', vibe: ['Sweet'] },
  { m: (t) => t.amenity === 'bar' || t.amenity === 'pub', tags: ['cocktails'], cat: 'music', art: 'music', band: 'moderate', time: 'evening', hook: 'sip something good and talk the night away', vibe: ['Social'] },
  { m: (t) => t.amenity === 'nightclub', tags: ['dancing', 'cocktails'], cat: 'music', art: 'music', band: 'moderate', time: 'evening', hook: 'dance until the night runs out', vibe: ['Lively'] },
  { m: (t) => t.amenity === 'music_venue' || ((t.amenity === 'bar' || t.amenity === 'pub') && t.live_music === 'yes'), tags: ['live-music'], cat: 'music', art: 'music', band: 'moderate', time: 'evening', hook: 'catch a live set together', vibe: ['Live'] },
  { m: (t) => t.amenity === 'cinema', tags: ['movies'], cat: 'play', art: 'cinema', band: 'low', time: 'evening', hook: 'pick a film and share the snacks', vibe: ['Easy'] },
  { m: (t) => t.amenity === 'theatre' || t.amenity === 'comedy_club', tags: ['local-culture', 'art'], cat: 'culture', art: 'studio', band: 'moderate', time: 'evening', hook: 'catch a performance and talk about it after', vibe: ['Cultural'] },
  { m: (t) => t.amenity === 'arts_centre', tags: ['art', 'workshops', 'local-culture'], cat: 'culture', art: 'studio', band: 'low', time: 'afternoon', hook: 'see what is on and talk it over', vibe: ['Creative'] },
  { m: (t) => t.tourism === 'gallery', tags: ['art'], cat: 'culture', art: 'studio', band: 'low', time: 'afternoon', hook: 'each pick a favourite piece and say why', vibe: ['Thoughtful'] },
  { m: (t) => t.tourism === 'museum', tags: ['museums', 'local-culture'], cat: 'culture', art: 'studio', band: 'low', time: 'afternoon', hook: 'wander the rooms and swap what surprised you', vibe: ['Curious'] },
  { m: (t) => t.tourism === 'viewpoint', tags: ['sunsets', 'photography', 'nature'], cat: 'outdoors', art: 'skyline', band: 'free', time: 'evening', hook: 'catch the view while the light changes', vibe: ['Scenic'] },
  { m: (t) => t.tourism === 'attraction' || !!t.historic, tags: ['local-culture', 'photography'], cat: 'culture', art: 'skyline', band: 'free', time: 'afternoon', hook: 'explore it together and take a photo to remember it', vibe: ['Sightseeing'] },
  { m: (t) => /^(park|garden|nature_reserve)$/.test(t.leisure || ''), tags: ['nature', 'picnics', 'quiet', 'photography', 'hiking'], cat: 'outdoors', art: 'garden', band: 'free', time: 'afternoon', hook: 'wander the paths and find a spot to sit', vibe: ['Green', 'Relaxed'] },
  { m: (t) => t.leisure === 'picnic_site' || t.tourism === 'picnic_site', tags: ['picnics', 'nature'], cat: 'outdoors', art: 'garden', band: 'free', time: 'afternoon', hook: 'spread a blanket and share snacks', vibe: ['Simple'] },
  { m: (t) => /^(beach|water)$/.test(t.natural || '') || /^(marina|beach_resort|water_park|swimming_area)$/.test(t.leisure || ''), tags: ['water', 'sunsets', 'photography'], cat: 'outdoors', art: 'lake', band: 'low', time: 'evening', hook: 'walk the water edge while the light turns golden', vibe: ['Breezy'] },
  { m: (t) => t.leisure === 'bowling_alley', tags: ['bowling'], cat: 'play', art: 'arcade', band: 'moderate', time: 'evening', hook: 'trade friendly trash talk over a few frames', vibe: ['Playful'] },
  { m: (t) => t.leisure === 'amusement_arcade', tags: ['arcade'], cat: 'play', art: 'arcade', band: 'low', time: 'evening', hook: 'challenge each other to a few games', vibe: ['Playful'] },
  { m: (t) => t.leisure === 'miniature_golf', tags: ['outdoor-games'], cat: 'play', art: 'garden', band: 'low', time: 'afternoon', hook: 'play a relaxed round and keep score', vibe: ['Playful'] },
  { m: (t) => t.tourism === 'theme_park', tags: ['arcade', 'outdoor-games'], cat: 'play', art: 'arcade', band: 'moderate', time: 'afternoon', hook: 'ride, play and laugh like kids for an afternoon', vibe: ['Lively'] },
  { m: (t) => t.amenity === 'karaoke_box', tags: ['karaoke'], cat: 'play', art: 'music', band: 'moderate', time: 'evening', hook: 'trade songs with no judging', vibe: ['Silly'] },
  { m: (t) => /^(spa|sauna)$/.test(t.leisure || '') || t.amenity === 'spa' || t.shop === 'massage', tags: ['spa', 'quiet'], cat: 'wellness', art: 'table', band: 'premium', time: 'afternoon', hook: 'slow right down together', vibe: ['Pampering'] },
  { m: (t) => t.shop === 'books', tags: ['bookstores', 'quiet'], cat: 'culture', art: 'studio', band: 'free', time: 'afternoon', hook: 'browse side by side and swap picks', vibe: ['Quiet'] },
  { m: (t) => t.shop === 'games', tags: ['board-games', 'arcade'], cat: 'play', art: 'table', band: 'low', time: 'afternoon', hook: 'find a game to try together', vibe: ['Playful'] },
  { m: (t) => t.amenity === 'library', tags: ['quiet', 'bookstores'], cat: 'culture', art: 'studio', band: 'free', time: 'afternoon', hook: 'spend an unhurried hour among the shelves', vibe: ['Quiet'] },
  { m: (t) => t.amenity === 'marketplace', tags: ['markets', 'street-food', 'local-culture', 'photography'], cat: 'culture', art: 'market', band: 'low', time: 'morning', hook: 'wander the stalls and buy one surprise for each other', vibe: ['Busy', 'Colourful'] },
  { m: (t) => t.craft === 'pottery', tags: ['pottery', 'workshops', 'art'], cat: 'creative', art: 'studio', band: 'moderate', time: 'afternoon', hook: 'make something with your hands and keep it', vibe: ['Hands-on'] },
  { m: (t) => t.amenity === 'cooking_school', tags: ['cooking', 'workshops'], cat: 'creative', art: 'table', band: 'moderate', time: 'evening', hook: 'learn a new dish together', vibe: ['Hands-on'] }
];

function classify(t) {
  const hits = RULES.filter((r) => r.m(t));
  if (!hits.length) return null;
  const main = hits[0];
  const tags = [];
  hits.forEach((r) => r.tags.forEach((x) => { if (tags.indexOf(x) === -1) tags.push(x); }));
  if (t.live_music === 'yes' && tags.indexOf('live-music') === -1) tags.push('live-music');
  if (/comedy|stand.?up/i.test(t.name || '') && tags.indexOf('comedy') === -1) tags.push('comedy');
  if (/cake|dessert|pastr|bakery|ice.?cream|waffle/i.test((t.cuisine || '') + ' ' + (t.name || '')) && tags.indexOf('desserts') === -1) tags.push('desserts');
  let band = main.band;
  if (band === 'free' && (t.fee === 'yes' || t.charge)) band = 'low';
  if (band === 'low' && t.fee === 'no' && (main.cat === 'outdoors' || main.cat === 'culture')) band = 'free';
  return { tags, cat: main.cat, art: main.art, band, time: main.time, hook: main.hook, vibe: main.vibe };
}

function commonsPhoto(t) {
  const c = t.wikimedia_commons;
  if (typeof c !== 'string' || !/^File:/i.test(c)) return null;
  const file = c.replace(/^File:/i, '').trim().replace(/ /g, '_');
  if (!/\.(jpe?g|png|webp)$/i.test(file) || file.length > 160) return null;
  const enc = encodeURIComponent(file).replace(/[!'*]/g, (ch) => '%' + ch.charCodeAt(0).toString(16).toUpperCase());
  return {
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/' + enc + '?width=900',
    credit: 'Photo from Wikimedia Commons. Open the file page for the author and licence.',
    link: 'https://commons.wikimedia.org/wiki/File:' + enc
  };
}

function buildQuery(interests, lat, lon, radiusM) {
  const parts = [];
  const seen = {};
  interests.forEach((id) => (FILTERS[id] || []).forEach((f) => {
    if (seen[f]) return;
    seen[f] = true;
    parts.push('  nwr[' + f + ']["name"](around:' + radiusM + ',' + lat + ',' + lon + ');');
  }));
  if (!parts.length) return null;
  return '[out:json][timeout:25];\n(\n' + parts.join('\n') + '\n);\nout center tags 400;';
}

function normalize(el, origin, wanted) {
  const t = el.tags || {};
  const name = (t['name:en'] || t.name || '').trim();
  const lat = el.lat !== undefined ? el.lat : el.center && el.center.lat;
  const lon = el.lon !== undefined ? el.lon : el.center && el.center.lon;
  if (!name || typeof lat !== 'number' || typeof lon !== 'number') return null;
  const c = classify(t);
  if (!c) return null;
  const tags = c.tags.filter((x) => wanted.indexOf(x) !== -1);
  if (!tags.length) return null;
  const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  const area = t['addr:suburb'] || t['addr:neighbourhood'] || t['addr:district'] || t['addr:city'] || '';
  const address = [street, t['addr:suburb'] || t['addr:neighbourhood'], t['addr:city']].filter(Boolean).join(', ');
  const photo = commonsPhoto(t);
  const raw = {
    id: 'osm:' + el.type + '/' + el.id, name: name, area: area, address: address, lat: lat, lon: lon,
    category: c.cat, tags: c.tags, band: c.band, bandGuess: true, art: c.art, bestTime: c.time, vibe: c.vibe, hook: c.hook,
    hoursText: t.opening_hours ? 'Hours listed on the map: ' + t.opening_hours : '',
    notable: !!(t.wikidata || t.wikipedia), photos: photo ? [photo] : []
  };
  const safe = DV.items.sanitizeLive(raw);
  if (!safe) return null;
  const complete = (address ? 1 : 0) + (t.opening_hours ? 1 : 0) + (photo ? 1 : 0) + (safe.notable ? 1 : 0);
  return {
    item: safe, distanceKm: Math.round(DV.util.haversineKm(origin.lat, origin.lon, lat, lon) * 10) / 10,
    complete: complete, overlap: tags.length
  };
}

function createDiscoverer(opts) {
  const fetchImpl = opts.fetch;
  const signer = opts.signer;
  const log = opts.log;
  const urls = opts.urls;
  const cache = new Map();
  let active = 0;
  const waiters = [];

  function slot() {
    return new Promise((resolve) => {
      const go = () => { active += 1; resolve(); };
      if (active < 2) go(); else waiters.push(go);
    });
  }
  function release() {
    active -= 1;
    const next = waiters.shift();
    if (next) next();
  }

  async function overpass(query) {
    let lastErr;
    await slot();
    try {
      for (const url of urls) {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 28000);
        try {
          const r = await fetchImpl(url, {
            method: 'POST', signal: ctl.signal,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': opts.userAgent, Accept: 'application/json' },
            body: 'data=' + encodeURIComponent(query)
          });
          if (!r.ok) throw new Error('Overpass ' + r.status);
          const json = await r.json();
          if (!json || !Array.isArray(json.elements)) throw new Error('Overpass returned something unexpected');
          return json.elements;
        } catch (e) {
          lastErr = e;
          log.warn('overpass_failed', { url: url, error: String(e && e.message) });
        } finally { clearTimeout(timer); }
      }
    } finally { release(); }
    throw lastErr || new Error('Overpass unavailable');
  }

  async function search(o) {
    const lat = Math.round(o.lat * 1000) / 1000, lon = Math.round(o.lon * 1000) / 1000;
    const wanted = [];
    (o.interests || []).forEach((i) => { if (DV.interests.byId[i] && wanted.indexOf(i) === -1) wanted.push(i); });
    if (!wanted.length) return { venues: [], meta: { radiusKm: 0, total: 0 } };
    const radii = o.radiiKm || [8, 20, 40];
    let found = [], used = radii[0], cached = false;
    for (let i = 0; i < radii.length; i++) {
      used = radii[i];
      const q = buildQuery(wanted, lat, lon, used * 1000);
      if (!q) break;
      const key = used + '|' + lat + '|' + lon + '|' + wanted.slice().sort().join(',');
      const hit = cache.get(key);
      let els;
      if (hit && hit.exp > Date.now()) { els = hit.els; cached = true; }
      else { els = await overpass(q); cache.set(key, { els: els, exp: Date.now() + 3600 * 1000 }); if (cache.size > 200) cache.delete(cache.keys().next().value); }
      const seen = [];
      found = [];
      els.forEach((el) => {
        const n = normalize(el, { lat: lat, lon: lon }, wanted);
        if (!n) return;
        const dup = seen.some((s) => DV.util.norm(s.item.name) === DV.util.norm(n.item.name) && DV.util.haversineKm(s.item.lat, s.item.lon, n.item.lat, n.item.lon) < 0.15);
        if (dup) return;
        seen.push(n);
        found.push(n);
      });
      if (found.length >= 12) break;
    }
    found.sort((a, b) => b.overlap - a.overlap || b.complete - a.complete || a.distanceKm - b.distanceKm);
    const top = found.slice(0, o.limit || 60);
    const venues = top.map((n) => Object.assign({}, n.item, { distanceKm: n.distanceKm, sig: signer.sign(n.item) }));
    return { venues: venues, meta: { radiusKm: used, total: found.length, cached: cached, source: 'osm' } };
  }

  return { search: search, _buildQuery: buildQuery, _classify: classify };
}

module.exports = { createDiscoverer, buildQuery, classify, normalize, FILTERS };
