/* Dateventure core: cleaning up venue data that came from outside (OpenStreetMap etc.).
   Anything that ends up inside an invitation goes through sanitizeLive() first, so strange
   or malicious text in a map listing can never reach the person opening the invite. */
(function (g) {
  var DV = (g.DV = g.DV || {});

  var ARTS = ['garden', 'lake', 'skyline', 'table', 'music', 'dessert', 'arcade', 'studio', 'market', 'cinema'];
  var CATEGORIES = ['outdoors', 'food', 'cafe', 'play', 'music', 'culture', 'creative', 'wellness'];
  var BANDS = ['free', 'low', 'moderate', 'premium'];
  var TIMES = ['morning', 'afternoon', 'evening'];
  var ID_RE = /^osm:(node|way|relation)\/\d{1,14}$/;
  var COMMONS_RE = /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/[A-Za-z0-9%._()\-~]{1,200}(\?width=\d{2,4})?$/;
  var COMMONS_PAGE_RE = /^https:\/\/commons\.wikimedia\.org\/wiki\/File:[A-Za-z0-9%._()\-~]{1,200}$/;

  function num(v, lo, hi) {
    var n = Number(v);
    return isFinite(n) && n >= lo && n <= hi ? Math.round(n * 1e5) / 1e5 : null;
  }

  // Returns a safe, tidy copy of a live (OpenStreetMap) venue, or null if it is not acceptable.
  function sanitizeLive(raw) {
    var U = DV.util;
    if (!raw || typeof raw !== 'object') return null;
    if (typeof raw.id !== 'string' || !ID_RE.test(raw.id)) return null;
    var name = U.clean(raw.name, 120);
    var lat = num(raw.lat, -90, 90), lon = num(raw.lon, -180, 180);
    if (!name || lat === null || lon === null) return null;
    var tags = [];
    (Array.isArray(raw.tags) ? raw.tags : []).forEach(function (t) {
      if (DV.interests.byId[t] && tags.indexOf(t) === -1 && tags.length < 12) tags.push(t);
    });
    var photos = [];
    (Array.isArray(raw.photos) ? raw.photos : []).slice(0, 2).forEach(function (p) {
      if (p && COMMONS_RE.test(String(p.src))) {
        var link = COMMONS_PAGE_RE.test(String(p.link)) ? String(p.link) : '';
        photos.push({ src: String(p.src), credit: U.clean(p.credit || '', 120), link: link });
      }
    });
    var out = {
      id: raw.id, kind: 'venue', name: name, area: U.clean(raw.area || '', 80) || null,
      address: U.clean(raw.address || '', 160) || null, lat: lat, lon: lon,
      category: CATEGORIES.indexOf(raw.category) !== -1 ? raw.category : 'food',
      tags: tags,
      band: BANDS.indexOf(raw.band) !== -1 ? raw.band : 'moderate', bandGuess: raw.bandGuess !== false,
      art: ARTS.indexOf(raw.art) !== -1 ? raw.art : 'table',
      bestTime: TIMES.indexOf(raw.bestTime) !== -1 ? raw.bestTime : 'evening',
      vibe: (Array.isArray(raw.vibe) ? raw.vibe : []).slice(0, 3).map(function (v) { return U.clean(String(v), 24); }).filter(Boolean),
      hook: U.clean(raw.hook || '', 160) || 'spend some unhurried time together',
      hoursText: U.clean(raw.hoursText || '', 120), notable: !!raw.notable,
      source: 'osm', osmUrl: 'https://www.openstreetmap.org/' + raw.id.slice(4), photos: photos,
      notes: 'Listed on OpenStreetMap. Opening hours and prices can be out of date, so check before you go.',
      verified: false
    };
    if (!out.tags.length) return null;
    return out;
  }

  DV.items = { sanitizeLive: sanitizeLive, ARTS: ARTS, CATEGORIES: CATEGORIES, BANDS: BANDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = DV.items;
})(typeof window !== 'undefined' ? window : globalThis);
