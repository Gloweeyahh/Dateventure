const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const DV = require('../../web/core/index.js');
const { createApp } = require('../src/app');
const { classify, buildQuery, normalize } = require('../src/osm');
const { sameName } = require('../src/google');

const silent = { debug() {}, info() {}, warn() {}, error() {} };

// ---- Fixtures shaped like the real services' answers -------------------------------------------------
const OVERPASS = {
  elements: [
    { type: 'node', id: 101, lat: 51.5081, lon: -0.1281, tags: { name: 'Little Bean Café', amenity: 'cafe', 'addr:street': 'Old Street', 'addr:housenumber': '12', 'addr:suburb': 'Soho', opening_hours: 'Mo-Su 08:00-18:00' } },
    { type: 'way', id: 202, center: { lat: 51.5033, lon: -0.1195 }, tags: { name: 'Riverside Gardens', leisure: 'park', wikidata: 'Q1', wikimedia_commons: "File:Riverside Gardens, O'Neil's view.jpg" } },
    { type: 'node', id: 303, lat: 51.51, lon: -0.13, tags: { name: 'Pasta Place', amenity: 'restaurant' } },
    { type: 'node', id: 404, lat: 51.5, lon: -0.1, tags: { amenity: 'cafe' } },
    { type: 'node', id: 505, lat: 51.5081, lon: -0.1282, tags: { name: 'Little Bean Café', amenity: 'cafe' } },
    { type: 'node', id: 606, lat: 51.52, lon: -0.14, tags: { name: '<img src=x onerror=alert(1)> Spot', amenity: 'restaurant' } },
    { type: 'node', id: 707, lat: 51.5, lon: -0.11, tags: { name: 'Hardware Shop', shop: 'hardware' } }
  ]
};
const NOMINATIM_SEARCH = [
  { lat: '9.0765', lon: '7.3986', display_name: 'Abuja, FCT, Nigeria', address: { county: 'Municipal Area Council', state: 'Federal Capital Territory', country: 'Nigeria', country_code: 'ng' } },
  { lat: '9.0765', lon: '7.3986', display_name: 'dup', address: { county: 'Municipal Area Council', state: 'Federal Capital Territory', country: 'Nigeria', country_code: 'ng' } }
];
const GOOGLE_SEARCH = {
  places: [
    { id: 'ChIJwrong', displayName: { text: 'Something Else Entirely' }, location: { latitude: 51.5081, longitude: -0.1281 }, photos: [{ name: 'places/ChIJwrong/photos/AAA' }] },
    { id: 'ChIJright', displayName: { text: 'Little Bean Cafe' }, location: { latitude: 51.5082, longitude: -0.1281 },
      photos: [{ name: 'places/ChIJright/photos/P1', authorAttributions: [{ displayName: 'Ada', uri: 'https://maps.google.com/contrib/1' }] }, { name: 'places/ChIJright/photos/P2' }] }
  ]
};

function makeFetch(counter, overrides) {
  return async (url, init) => {
    counter.n = (counter.n || 0) + 1;
    counter.urls = (counter.urls || []).concat(url);
    const o = overrides || {};
    const res = (status, body) => ({ ok: status < 400, status: status, json: async () => body });
    if (url.indexOf('overpass') !== -1) return o.overpass ? o.overpass(url, init) : res(200, OVERPASS);
    if (url.indexOf('/search?') !== -1 && url.indexOf('nominatim') !== -1) return res(200, NOMINATIM_SEARCH);
    if (url.indexOf('/reverse?') !== -1) return res(200, { display_name: 'x', address: { suburb: 'Wuse', county: 'Municipal Area Council', state: 'Federal Capital Territory', country: 'Nigeria', country_code: 'ng' } });
    if (url.indexOf('places:searchText') !== -1) return res(200, GOOGLE_SEARCH);
    if (url.indexOf('/media?') !== -1) return res(200, { photoUri: 'https://lh3.googleusercontent.com/abc' + counter.n });
    return res(404, {});
  };
}

async function boot(opts) {
  opts = opts || {};
  const counter = {};
  const store = DV.createMemoryStore();
  const app = createApp({
    env: Object.assign({ SIGNING_SECRET: 'test-secret-test-secret', ALLOWED_ORIGINS: 'https://dateventure.test', TRUST_PROXY: 'false' }, opts.env || {}),
    store: store, fetch: makeFetch(counter, opts.overrides), log: silent, now: () => new Date('2026-10-11T12:00:00Z'), geoGapMs: 0
  });
  const server = http.createServer(app.handle);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  async function call(method, path, body, headers) {
    const r = await fetch(base + path, { method: method, headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}), body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
    let json = null;
    try { json = await r.json(); } catch (e) { /* empty */ }
    return { status: r.status, json: json, headers: r.headers };
  }
  return { call: call, close: () => new Promise((r) => { server.close(r); server.closeAllConnections(); }), counter: counter, store: store, app: app };
}

const invite = (extra) => Object.assign({ plannerName: 'Gloria', recipientName: 'Mimi', itemId: 'idea-board-games', budget: { amount: 5000, currency: 'NGN' } }, extra || {});

test('health reports ok and what is configured', async () => {
  const s = await boot();
  const r = await s.call('GET', '/api/health');
  assert.equal(r.status, 200);
  assert.equal(r.json.ok, true);
  assert.equal(r.json.store, 'memory');
  assert.equal(r.json.googlePhotos, false);
  assert.equal(r.json.signingSecretSet, true);
  await s.close();
});

test('full invite flow over HTTP, with safe repeats', async () => {
  const s = await boot();
  const c = await s.call('POST', '/api/invites', invite({ clientRequestId: 'abcdefgh1234' }));
  assert.equal(c.status, 201);
  const { token, manageToken } = c.json;
  assert.ok(token && manageToken && token !== manageToken);
  assert.equal(c.json.invite.budget, undefined);

  const again = await s.call('POST', '/api/invites', invite({ clientRequestId: 'abcdefgh1234' }));
  assert.equal(again.status, 200);
  assert.equal(again.json.token, token);

  const g = await s.call('GET', '/api/invites/' + token);
  assert.equal(g.status, 200);
  assert.equal(g.json.invite.status, 'opened');
  assert.equal(g.json.invite.manageToken, undefined);

  const m0 = await s.call('GET', '/api/manage/' + manageToken);
  assert.equal(m0.json.invite.status, 'opened');

  const a1 = await s.call('POST', '/api/invites/' + token + '/respond', { response: 'accept' });
  assert.equal(a1.json.changed, true);
  const a2 = await s.call('POST', '/api/invites/' + token + '/respond', { response: 'accept' });
  assert.equal(a2.json.changed, false);
  assert.equal(a2.json.invite.respondedAt, a1.json.invite.respondedAt);
  const d = await s.call('POST', '/api/invites/' + token + '/respond', { response: 'decline' });
  assert.equal(d.json.invite.status, 'accepted');
  assert.equal(d.json.conflict, true);

  const m1 = await s.call('GET', '/api/manage/' + manageToken);
  assert.equal(m1.json.invite.status, 'accepted');
  await s.close();
});

test('errors are clear and safe', async () => {
  const s = await boot();
  let r = await s.call('POST', '/api/invites', invite({ plannerName: '' }));
  assert.equal(r.status, 400); assert.equal(r.json.error.code, 'bad_planner_name');
  r = await s.call('GET', '/api/invites/doesnotexist1234567890');
  assert.equal(r.status, 404);
  r = await s.call('GET', '/api/invites/short');
  assert.equal(r.status, 404);
  r = await s.call('GET', '/api/manage/' + 'x'.repeat(30));
  assert.equal(r.status, 404);
  r = await s.call('POST', '/api/invites', '{not json');
  assert.equal(r.status, 400); assert.equal(r.json.error.code, 'bad_json');
  r = await s.call('POST', '/api/invites', 'x'.repeat(30000));
  assert.equal(r.status, 413); assert.equal(r.json.error.code, 'too_big');
  r = await s.call('GET', '/nope');
  assert.equal(r.status, 404);
  r = await s.call('POST', '/api/discover', { lat: 999, lon: 1, mine: ['cafes'], partner: ['cafes'] });
  assert.equal(r.json.error.code, 'bad_location');
  r = await s.call('POST', '/api/discover', { lat: 1, lon: 1, mine: [], partner: ['not-real'] });
  assert.equal(r.json.error.code, 'no_interests');
  await s.close();
});

test('CORS: allowed site gets headers, others do not', async () => {
  const s = await boot();
  const ok = await s.call('GET', '/api/health', undefined, { Origin: 'https://dateventure.test' });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://dateventure.test');
  const no = await s.call('GET', '/api/health', undefined, { Origin: 'https://evil.test' });
  assert.equal(no.headers.get('access-control-allow-origin'), null);
  const pre = await s.call('OPTIONS', '/api/invites', undefined, { Origin: 'https://dateventure.test' });
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('access-control-allow-origin'), 'https://dateventure.test');
  await s.close();
});

test('rate limit: the 13th invite in an hour is refused politely', async () => {
  const s = await boot();
  let last;
  for (let i = 0; i < 13; i++) last = await s.call('POST', '/api/invites', invite());
  assert.equal(last.status, 429);
  assert.equal(last.json.error.code, 'slow_down');
  assert.ok(last.headers.get('retry-after'));
  await s.close();
});

test('discover: finds real-shaped venues anywhere, signs them, drops junk, caches', async () => {
  const s = await boot();
  const body = { lat: 51.5074, lon: -0.1278, mine: ['cafes', 'nature'], partner: ['cafes', 'desserts'] };
  const r = await s.call('POST', '/api/discover', body);
  assert.equal(r.status, 200);
  const names = r.json.venues.map((v) => v.name);
  assert.ok(names.includes('Little Bean Café'));
  assert.ok(names.includes('Riverside Gardens'));
  assert.equal(names.filter((n) => n === 'Little Bean Café').length, 1, 'duplicates merged');
  assert.ok(!names.some((n) => /Hardware|Pasta Place/.test(n)), 'unrequested categories dropped');
  assert.ok(!names.some((n) => /[<>]/.test(n)));
  r.json.venues.forEach((v) => {
    assert.match(v.id, /^osm:(node|way)\/\d+$/);
    assert.ok(v.sig && typeof v.distanceKm === 'number');
    assert.equal(v.source, 'osm');
  });
  const park = r.json.venues.find((v) => v.name === 'Riverside Gardens');
  assert.equal(park.photos.length, 1);
  assert.match(park.photos[0].src, /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
  const before = s.counter.n;
  const r2 = await s.call('POST', '/api/discover', body);
  assert.equal(r2.json.meta.cached, true);
  assert.equal(s.counter.n, before, 'second search must not hit the map service');
  await s.close();
});

test('discover -> recommend -> invite works end to end with a signed venue', async () => {
  const s = await boot();
  const d = await s.call('POST', '/api/discover', { lat: 51.5074, lon: -0.1278, mine: ['cafes'], partner: ['desserts'] });
  const rec = DV.engine.recommend({ regionId: null, currency: 'GBP', budget: 40, cc: 'GB', venues: d.json.venues, mine: ['cafes'], partner: ['desserts'] });
  const top = rec.items.find((i) => i.kind === 'venue');
  assert.ok(top, 'a live venue should be recommended');
  const raw = d.json.venues.find((v) => v.id === top.id);
  const ok = await s.call('POST', '/api/invites', invite({ itemId: undefined, item: raw, itemSig: raw.sig, budget: { amount: 40, currency: 'GBP' }, cc: 'GB' }));
  assert.equal(ok.status, 201);
  assert.equal(ok.json.invite.item.name, top.name);

  const forged = await s.call('POST', '/api/invites', invite({ itemId: undefined, item: Object.assign({}, raw, { name: 'Free money cafe' }), itemSig: raw.sig }));
  assert.equal(forged.status, 400);
  assert.equal(forged.json.error.code, 'bad_venue');
  const nosig = await s.call('POST', '/api/invites', invite({ itemId: undefined, item: raw, itemSig: '' }));
  assert.equal(nosig.status, 400);
  await s.close();
});

test('a notable park with a Wikimedia photo can also be invited to (signature covers every field)', async () => {
  const s = await boot();
  const d = await s.call('POST', '/api/discover', { lat: 51.5074, lon: -0.1278, mine: ['nature'], partner: ['picnics'] });
  const park = d.json.venues.find((v) => v.name === 'Riverside Gardens');
  assert.ok(park && park.notable === true && park.photos.length === 1);
  const rec = DV.engine.recommend({ regionId: null, currency: 'GBP', budget: 50, cc: 'GB', venues: d.json.venues, mine: ['nature'], partner: ['picnics'] });
  const item = rec.items.find((i) => i.id === park.id);
  // Using the engine's output (not the raw object) must also verify, in case a client does that.
  const viaEngine = await s.call('POST', '/api/invites', invite({ itemId: undefined, item: item, itemSig: park.sig, budget: { amount: 50, currency: 'GBP' } }));
  assert.equal(viaEngine.status, 201, JSON.stringify(viaEngine.json));
  const viaRaw = await s.call('POST', '/api/invites', invite({ itemId: undefined, item: park, itemSig: park.sig, budget: { amount: 50, currency: 'GBP' } }));
  assert.equal(viaRaw.status, 201);
  assert.equal(viaRaw.json.invite.item.photos.length, 1);
  await s.close();
});

test('discover: if the map service is down we say so kindly (and try the backup)', async () => {
  const s = await boot({ overrides: { overpass: async () => ({ ok: false, status: 504, json: async () => ({}) }) } });
  const r = await s.call('POST', '/api/discover', { lat: 1, lon: 1, mine: ['cafes'], partner: ['cafes'] });
  assert.equal(r.status, 502);
  assert.equal(r.json.error.code, 'venue_search_unavailable');
  assert.equal(s.counter.urls.filter((u) => /overpass/.test(u)).length, 2, 'tries both servers');
  await s.close();
});

test('geo: search and reverse give tidy labels and the right currency', async () => {
  const s = await boot();
  const r = await s.call('GET', '/api/geo/search?q=Abuja');
  assert.equal(r.status, 200);
  assert.equal(r.json.places.length, 1);
  assert.equal(r.json.places[0].label, 'Abuja, Nigeria');
  assert.equal(r.json.places[0].currency, 'NGN');
  const rev = await s.call('GET', '/api/geo/reverse?lat=9.07&lon=7.4');
  assert.equal(rev.json.place.label, 'Wuse, Abuja, Nigeria');
  assert.equal((await s.call('GET', '/api/geo/reverse?lat=abc&lon=7')).status, 400);
  assert.deepEqual((await s.call('GET', '/api/geo/search?q=a')).json.places, []);
  await s.close();
});

test('photos: off without a key; matches only the right place; respects the monthly cap', async () => {
  const none = await boot();
  const r0 = await none.call('GET', '/api/photos?name=Little%20Bean%20Caf%C3%A9&lat=51.5081&lon=-0.1281');
  assert.equal(r0.json.reason, 'no_key');
  await none.close();

  const s = await boot({ env: { GOOGLE_PLACES_API_KEY: 'k', PHOTO_MONTHLY_CAP: '3' } });
  const r = await s.call('GET', '/api/photos?name=Little%20Bean%20Caf%C3%A9&lat=51.5081&lon=-0.1281');
  assert.equal(r.json.provider, 'google');
  assert.equal(r.json.photos.length, 2);
  assert.equal(r.json.photos[0].attributions[0].name, 'Ada');
  assert.match(r.json.mapsUrl, /query_place_id=ChIJright/);
  const wrong = await s.call('GET', '/api/photos?name=Totally%20Different%20Bar&lat=51.5081&lon=-0.1281');
  assert.equal(wrong.json.reason, 'no_match');
  const far = await s.call('GET', '/api/photos?name=Little%20Bean%20Caf%C3%A9&lat=40&lon=-0.1281');
  assert.equal(far.json.reason, 'no_match');
  const capped = await s.call('GET', '/api/photos?name=Little%20Bean%20Caf%C3%A9&lat=51.5081&lon=-0.1281');
  assert.equal(capped.json.reason, 'monthly_cap');
  await s.close();
});

test('photos: card photos are cheaper, can be switched off, and leave budget for the venue page', async () => {
  const q = '/api/photos?name=Little%20Bean%20Caf%C3%A9&lat=51.5081&lon=-0.1281';
  const off = await boot({ env: { GOOGLE_PLACES_API_KEY: 'k', GOOGLE_CARD_PHOTOS: 'false' } });
  assert.equal((await off.call('GET', q + '&purpose=card&max=1')).json.reason, 'cards_disabled');
  assert.equal((await off.call('GET', q + '&purpose=detail')).json.photos.length, 2, 'venue page still works');
  await off.close();

  const s = await boot({ env: { GOOGLE_PLACES_API_KEY: 'k', GOOGLE_PHOTO_MONTHLY_CAP: '4', GOOGLE_CARD_PHOTO_SHARE: '0.5' } });
  const c1 = await s.call('GET', q + '&purpose=card&max=1');
  assert.equal(c1.json.photos.length, 1, 'a card asks for just one photo');
  const c2 = await s.call('GET', q + '&purpose=card&max=1');
  assert.equal(c2.json.photos.length, 1);
  const c3 = await s.call('GET', q + '&purpose=card&max=1');
  assert.equal(c3.json.reason, 'card_budget', 'cards stop at half of the photo allowance');
  const d = await s.call('GET', q + '&purpose=invite');
  assert.equal(d.json.photos.length, 2, 'the invitation can still use the rest');
  const h = await s.call('GET', '/api/health');
  assert.equal(h.json.googleUsage.photoCalls, 4);
  assert.equal(h.json.googleUsage.searchCalls, 3, 'the refused card call must not cost a search');
  assert.equal(h.json.googleUsage.photoCap, 4);
  await s.close();

  const t = await boot({ env: { GOOGLE_PLACES_API_KEY: 'k', GOOGLE_PHOTO_MONTHLY_CAP: '1' } });
  const one = await t.call('GET', q);
  assert.equal(one.json.photos.length, 1, 'photo allowance reached halfway: returns what it can');
  const none = await t.call('GET', q);
  assert.equal(none.json.reason, 'monthly_cap');
  await t.close();
});

test('city requests are recorded', async () => {
  const s = await boot();
  const r = await s.call('POST', '/api/city-requests', { label: 'Kigali, Rwanda' });
  assert.equal(r.status, 201);
  assert.equal(s.store._dump().cityRequests.length, 1);
  assert.equal((await s.call('POST', '/api/city-requests', { label: '' })).status, 400);
  await s.close();
});

test('osm helpers: classification, query building and name matching', () => {
  const c = classify({ amenity: 'bar', live_music: 'yes', name: 'Comedy Cellar' });
  assert.ok(c.tags.includes('cocktails') && c.tags.includes('live-music') && c.tags.includes('comedy'));
  assert.equal(classify({ leisure: 'park', fee: 'yes' }).band, 'low');
  assert.equal(classify({ leisure: 'park' }).band, 'free');
  assert.equal(classify({ shop: 'hardware' }), null);
  const q = buildQuery(['cafes', 'bowling'], 1.5, 2.5, 8000);
  assert.match(q, /\[out:json\]/);
  assert.match(q, /"amenity"="cafe"/);
  assert.match(q, /around:8000,1.5,2.5/);
  assert.equal(buildQuery(['unknown'], 1, 1, 1000), null);
  assert.equal(normalize({ type: 'node', id: 1, lat: 1, lon: 1, tags: { amenity: 'cafe' } }, { lat: 1, lon: 1 }, ['cafes']), null);
  assert.ok(sameName('Little Bean Café', 'Little Bean Cafe'));
  assert.ok(!sameName('Little Bean Café', 'Burger Shack'));
});
