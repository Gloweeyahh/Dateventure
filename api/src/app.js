// The Dateventure API. No framework: plain Node, so there is nothing to break on install.
const DV = require('../../web/core/index.js');
const { createLimiter } = require('./ratelimit');
const { createSigner } = require('./sign');
const { createDiscoverer } = require('./osm');
const { createPhotoService } = require('./google');
const { createGeoProxy } = require('./geoproxy');
const { createLogger } = require('./log');
const crypto = require('crypto');

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;
const VERSION = '1.0.0';

function createApp(cfg) {
  const env = cfg.env || {};
  const store = cfg.store;
  const fetchImpl = cfg.fetch || globalThis.fetch;
  const log = cfg.log || createLogger(env.LOG_LEVEL);
  const now = cfg.now || (() => new Date());
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const secret = env.SIGNING_SECRET || crypto.randomBytes(32).toString('hex');
  if (!env.SIGNING_SECRET) log.warn('no_signing_secret', { note: 'Set SIGNING_SECRET, or venue links stop working after every restart.' });
  const signer = createSigner(secret);
  const ua = 'Dateventure/' + VERSION + ' (' + (env.CONTACT_EMAIL || 'set CONTACT_EMAIL in your environment') + ')';

  const discoverer = createDiscoverer({
    fetch: fetchImpl, signer: signer, log: log, userAgent: ua,
    urls: String(env.OVERPASS_URLS || 'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter').split(',').map((s) => s.trim()).filter(Boolean)
  });
  const legacyCap = parseInt(env.PHOTO_MONTHLY_CAP || '0', 10) || 0;   // old single setting, still understood
  const photos = createPhotoService({
    key: env.GOOGLE_PLACES_API_KEY || '', fetch: fetchImpl, store: store, log: log, now: now,
    caps: {
      search: parseInt(env.GOOGLE_SEARCH_MONTHLY_CAP || '0', 10) || legacyCap || 4500,
      media: parseInt(env.GOOGLE_PHOTO_MONTHLY_CAP || '0', 10) || legacyCap || 900
    },
    cardsOn: String(env.GOOGLE_CARD_PHOTOS || 'true').toLowerCase() !== 'false',
    cardShare: parseFloat(env.GOOGLE_CARD_PHOTO_SHARE || '0.5')
  });
  const geo = createGeoProxy({ fetch: fetchImpl, log: log, userAgent: ua, baseUrl: env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org', minGapMs: cfg.geoGapMs });

  const limits = {
    create: createLimiter({ windowMs: 3600e3, max: 12 }), respond: createLimiter({ windowMs: 3600e3, max: 60 }),
    read: createLimiter({ windowMs: 60e3, max: 120 }), discover: createLimiter({ windowMs: 60e3, max: 20 }),
    geo: createLimiter({ windowMs: 60e3, max: 30 }), photos: createLimiter({ windowMs: 60e3, max: 90 }),
    city: createLimiter({ windowMs: 3600e3, max: 10 }), other: createLimiter({ windowMs: 60e3, max: 300 })
  };

  function ipOf(req) {
    if (env.TRUST_PROXY !== 'false') {
      const xff = req.headers['x-forwarded-for'];
      if (xff) return String(xff).split(',')[0].trim();
    }
    return (req.socket && req.socket.remoteAddress) || 'unknown';
  }

  function send(res, status, body, extra) {
    const text = JSON.stringify(body);
    res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, res._cors || {}, extra || {}));
    res.end(text);
  }

  function readBody(req, max) {
    return new Promise((resolve, reject) => {
      const declared = parseInt(req.headers['content-length'] || '0', 10);
      let size = 0, tooBig = declared > max;
      const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > max) tooBig = true;
        if (size > 1e6) { req.destroy(); return; }   // someone is sending far too much: hang up
        if (!tooBig) chunks.push(c);
      });
      req.on('end', () => {
        if (tooBig) return reject(new DV.DvError('too_big', 413, 'That request is too large.'));
        if (!chunks.length) return resolve({});
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { reject(new DV.DvError('bad_json', 400, 'The request was not valid JSON.')); }
      });
      req.on('error', reject);
    });
  }

  function num(v, lo, hi) {
    const n = Number(v);
    return isFinite(n) && n >= lo && n <= hi ? n : null;
  }

  const routes = [];
  function route(method, pattern, limiter, handler) { routes.push({ method: method, re: pattern, limiter: limiter, handler: handler }); }

  route('GET', /^\/$/, 'other', async () => ({ status: 200, body: { name: 'Dateventure API', ok: true, version: VERSION } }));

  route('GET', /^\/api\/health$/, 'other', async () => {
    let storeOk = false, usage = null;
    try { storeOk = await store.ping(); } catch (e) { log.error('store_ping_failed', { error: String(e && e.message) }); }
    if (storeOk && env.GOOGLE_PLACES_API_KEY) { try { usage = await photos.usage(); } catch (e) { /* ignore */ } }
    return {
      status: storeOk ? 200 : 503,
      body: {
        ok: storeOk, version: VERSION, time: now().toISOString(), store: store.kind, storeOk: storeOk,
        venueSearch: 'openstreetmap', googlePhotos: !!env.GOOGLE_PLACES_API_KEY, googleUsage: usage, signingSecretSet: !!env.SIGNING_SECRET,
        corsOrigins: allowed.length ? allowed : 'none set (browser calls from other sites will be blocked)'
      }
    };
  });

  route('POST', /^\/api\/invites$/, 'create', async (ctx) => {
    const r = await DV.invites.create(store, ctx.body, now(), { verifyItem: signer.verify });
    const doc = r.doc;
    log.info('invite_created', { rid: ctx.rid, deduped: r.deduped, item: doc.item.id, status: doc.status });
    return { status: r.deduped ? 200 : 201, body: { token: doc.token, manageToken: doc.manageToken, invite: DV.invites.publicView(doc), deduped: r.deduped } };
  });

  route('GET', /^\/api\/invites\/([^/]+)$/, 'read', async (ctx) => {
    if (!TOKEN_RE.test(ctx.params[0])) throw new DV.DvError('not_found', 404, 'We could not find that invitation.');
    const doc = await DV.invites.open(store, ctx.params[0], now());
    return { status: 200, body: { invite: DV.invites.publicView(doc) } };
  });

  route('POST', /^\/api\/invites\/([^/]+)\/respond$/, 'respond', async (ctx) => {
    if (!TOKEN_RE.test(ctx.params[0])) throw new DV.DvError('not_found', 404, 'We could not find that invitation.');
    const r = await DV.invites.respond(store, ctx.params[0], ctx.body && ctx.body.response, now());
    log.info('invite_response', { rid: ctx.rid, status: r.doc.status, changed: r.changed });
    return { status: 200, body: { invite: DV.invites.publicView(r.doc), changed: r.changed, conflict: !!r.conflict } };
  });

  route('GET', /^\/api\/manage\/([^/]+)$/, 'read', async (ctx) => {
    if (!TOKEN_RE.test(ctx.params[0])) throw new DV.DvError('not_found', 404, 'We could not find that invitation.');
    const doc = await DV.invites.manage(store, ctx.params[0]);
    return { status: 200, body: { invite: DV.invites.manageView(doc) } };
  });

  route('GET', /^\/api\/geo\/search$/, 'geo', async (ctx) => {
    try { return { status: 200, body: { places: await geo.search(ctx.query.get('q')) } }; }
    catch (e) { log.warn('geo_search_failed', { error: String(e && e.message) }); throw new DV.DvError('geo_unavailable', 502, 'Place search is busy. Try again in a moment.'); }
  });

  route('GET', /^\/api\/geo\/reverse$/, 'geo', async (ctx) => {
    const lat = num(ctx.query.get('lat'), -90, 90), lon = num(ctx.query.get('lon'), -180, 180);
    if (lat === null || lon === null) throw new DV.DvError('bad_location', 400, 'That location is not valid.');
    try { return { status: 200, body: { place: await geo.reverse(lat, lon) } }; }
    catch (e) { log.warn('geo_reverse_failed', { error: String(e && e.message) }); throw new DV.DvError('geo_unavailable', 502, 'Place lookup is busy. Try again in a moment.'); }
  });

  route('POST', /^\/api\/discover$/, 'discover', async (ctx) => {
    const b = ctx.body || {};
    const lat = num(b.lat, -90, 90), lon = num(b.lon, -180, 180);
    if (lat === null || lon === null) throw new DV.DvError('bad_location', 400, 'Please choose a place first.');
    const ids = [].concat(Array.isArray(b.mine) ? b.mine : [], Array.isArray(b.partner) ? b.partner : []).slice(0, 60);
    const interests = ids.filter((x, i) => typeof x === 'string' && DV.interests.byId[x] && ids.indexOf(x) === i);
    if (!interests.length) throw new DV.DvError('no_interests', 400, 'Pick at least one interest for each of you.');
    try {
      const r = await discoverer.search({ lat: lat, lon: lon, interests: interests });
      log.info('discover', { rid: ctx.rid, found: r.venues.length, radiusKm: r.meta.radiusKm, cached: r.meta.cached });
      return { status: 200, body: r };
    } catch (e) {
      log.error('discover_failed', { rid: ctx.rid, error: String(e && e.message) });
      throw new DV.DvError('venue_search_unavailable', 502, 'The venue search is busy right now. Try again in a minute.');
    }
  });

  route('GET', /^\/api\/photos$/, 'photos', async (ctx) => {
    const name = DV.util.clean(ctx.query.get('name') || '', 120);
    const lat = num(ctx.query.get('lat'), -90, 90), lon = num(ctx.query.get('lon'), -180, 180);
    if (!name || lat === null || lon === null) throw new DV.DvError('bad_request', 400, 'Missing name or location.');
    const purpose = ['card', 'detail', 'invite'].indexOf(ctx.query.get('purpose')) !== -1 ? ctx.query.get('purpose') : 'detail';
    const max = ctx.query.get('max') === '1' ? 1 : 2;
    try { return { status: 200, body: await photos.photosFor({ name: name, lat: lat, lon: lon, max: max, purpose: purpose }) }; }
    catch (e) { log.warn('photos_failed', { error: String(e && e.message) }); return { status: 200, body: { photos: [], reason: 'error' } }; }
  });

  route('POST', /^\/api\/city-requests$/, 'city', async (ctx) => {
    const label = DV.util.clean((ctx.body && ctx.body.label) || '', 100);
    if (!label) throw new DV.DvError('bad_request', 400, 'Tell us which place you mean.');
    await store.insertCityRequest({ label: label, at: now().toISOString() });
    return { status: 201, body: { ok: true } };
  });

  async function handle(req, res) {
    const rid = crypto.randomBytes(4).toString('hex');
    const started = Date.now();
    const origin = req.headers.origin;
    res._cors = {};
    if (origin && (allowed.indexOf('*') !== -1 || allowed.indexOf(origin) !== -1)) {
      res._cors = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' };
    }
    if (req.method === 'OPTIONS') { res.writeHead(204, res._cors); return res.end(); }
    let u;
    try { u = new URL(req.url, 'http://localhost'); } catch (e) { return send(res, 400, { error: { code: 'bad_url', message: 'Bad URL.' } }); }
    try {
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = r.re.exec(u.pathname);
        if (!m) continue;
        const rl = limits[r.limiter].check(r.limiter + ':' + ipOf(req));
        if (!rl.ok) return send(res, 429, { error: { code: 'slow_down', message: 'Too many requests. Please wait a moment and try again.' } }, { 'Retry-After': String(rl.retryAfterSec) });
        const body = req.method === 'POST' ? await readBody(req, 20000) : {};
        const out = await r.handler({ rid: rid, body: body, params: m.slice(1), query: u.searchParams });
        log.debug('request', { rid: rid, method: req.method, path: u.pathname, status: out.status, ms: Date.now() - started });
        return send(res, out.status, out.body);
      }
      return send(res, 404, { error: { code: 'not_found', message: 'That address does not exist.' } });
    } catch (e) {
      if (e && e.code && e.status) {
        log.info('request_rejected', { rid: rid, path: u.pathname, code: e.code });
        return send(res, e.status, { error: { code: e.code, message: e.message } });
      }
      log.error('unhandled_error', { rid: rid, path: u.pathname, error: String(e && e.stack || e) });
      return send(res, 500, { error: { code: 'server_error', message: 'Something went wrong on our side. Please try again.', requestId: rid } });
    }
  }

  return { handle: handle, signer: signer, store: store };
}

module.exports = { createApp, VERSION };
