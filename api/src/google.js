// Optional: real photos of a venue from Google Maps, fetched live when someone looks at it.
// We never store these photos or Google's text. Needs GOOGLE_PLACES_API_KEY.
//
// Google bills two things separately, each with its own free monthly allowance:
//   1. the place search that finds the photos  (Text Search Pro: 5,000 free a month)
//   2. each photo download                      (Place Details Photos: 1,000 free a month)
// We count both in the database and stop BEFORE the free allowances run out (caps below),
// so a busy day can never turn into a bill. After the cap, the site shows drawn scenes instead.
const DV = require('../../web/core/index.js');

function tokens(s) {
  return DV.util.norm(s).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 1);
}
function sameName(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.length || !B.length) return false;
  const shared = A.filter((w) => B.indexOf(w) !== -1).length;
  return shared / Math.min(A.length, B.length) >= 0.6;
}

function month(now) {
  const d = now || new Date();
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
}
const searchKey = (now) => 'google:search:' + month(now);
const mediaKey = (now) => 'google:media:' + month(now);

function createPhotoService(opts) {
  const key = opts.key, fetchImpl = opts.fetch, store = opts.store, log = opts.log;
  const caps = opts.caps || { search: 4500, media: 900 };
  const cardShare = opts.cardShare === undefined ? 0.5 : opts.cardShare;      // cards may use at most this share of the photo cap
  const cardsOn = opts.cardsOn !== false;
  const now = opts.now || (() => new Date());

  async function photosFor(o) {
    if (!key) return { photos: [], reason: 'no_key' };
    const purpose = o.purpose || 'detail';
    if (purpose === 'card') {
      if (!cardsOn) return { photos: [], reason: 'cards_disabled' };
      // keep part of the allowance for the venue page and invitations, which matter more
      if ((await store.peek(mediaKey(now()))) >= Math.floor(caps.media * cardShare)) return { photos: [], reason: 'card_budget' };
    }
    if ((await store.incr(searchKey(now()))) > caps.search) return { photos: [], reason: 'monthly_cap' };

    const body = {
      textQuery: o.name, maxResultCount: 3, languageCode: 'en',
      locationBias: { circle: { center: { latitude: o.lat, longitude: o.lon }, radius: 300 } }
    };
    const r = await fetchImpl('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.photos'
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      log.warn('google_search_failed', { status: r.status });
      return { photos: [], reason: 'google_error' };
    }
    const json = await r.json();
    const places = (json && json.places) || [];
    const match = places.find((p) => {
      const nm = p.displayName && p.displayName.text;
      const loc = p.location;
      if (!nm || !loc) return false;
      return sameName(nm, o.name) && DV.util.haversineKm(o.lat, o.lon, loc.latitude, loc.longitude) <= 0.35;
    });
    if (!match || !match.photos || !match.photos.length) return { photos: [], reason: 'no_match' };

    const out = [];
    let capped = false;
    for (const ph of match.photos.slice(0, Math.max(1, Math.min(2, o.max || 2)))) {
      if (!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(ph.name || '')) continue;
      if ((await store.incr(mediaKey(now()))) > caps.media) { capped = true; break; }
      const m = await fetchImpl('https://places.googleapis.com/v1/' + ph.name + '/media?maxWidthPx=900&skipHttpRedirect=true', {
        headers: { 'X-Goog-Api-Key': key }
      });
      if (!m.ok) { log.warn('google_photo_failed', { status: m.status }); continue; }
      const mj = await m.json();
      if (!mj || typeof mj.photoUri !== 'string' || !/^https:\/\//.test(mj.photoUri)) continue;
      out.push({
        url: mj.photoUri,
        attributions: (ph.authorAttributions || []).slice(0, 2).map((a) => ({
          name: DV.util.clean(a.displayName || '', 80), uri: /^https:\/\//.test(a.uri || '') ? a.uri : ''
        }))
      });
    }
    if (!out.length && capped) return { photos: [], reason: 'monthly_cap' };
    return {
      photos: out, provider: 'google',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(o.name) + '&query_place_id=' + encodeURIComponent(match.id)
    };
  }

  async function usage() {
    return {
      month: month(now()), searchCalls: await store.peek(searchKey(now())), photoCalls: await store.peek(mediaKey(now())),
      searchCap: caps.search, photoCap: caps.media, cardPhotos: cardsOn, cardShare: cardShare
    };
  }

  return { photosFor: photosFor, usage: usage };
}

module.exports = { createPhotoService, sameName, searchKey, mediaKey };
