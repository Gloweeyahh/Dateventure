/* Dateventure web: talks to the API (live mode) or to a store inside this browser (test mode). */
(function (g) {
  var DV = (g.DV = g.DV || {});
  var cfg = g.DV_CONFIG || {};
  var live = !!cfg.API_BASE && !cfg.FORCE_LOCAL;
  var base = String(cfg.API_BASE || '').replace(/\/+$/, '');
  // Test mode keeps invitations in this browser. We re-read them every time, so a planner tab and a
  // recipient tab open side by side always see each other's changes.
  function localStore() {
    return DV.createMemoryStore({
      initial: DV.localStorageJSON.read(DV.localStorageJSON.LOCAL, null),
      persist: function (snap) { DV.localStorageJSON.write(DV.localStorageJSON.LOCAL, snap); }
    });
  }

  var photoState = { off: false, noCards: false }, photoCache = {};

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Calls the API. If the server is waking up (free hosting sleeps), wait and retry politely.
  function request(method, path, body, opts) {
    opts = opts || {};
    var delays = opts.noRetry ? [0] : [0, 2500, 5000, 8000, 12000, 15000, 20000];
    var attempt = 0, wakingShown = false;
    function once() {
      var ctl = new AbortController();
      var timer = setTimeout(function () { ctl.abort(); }, 25000);
      return fetch(base + path, {
        method: method, signal: ctl.signal, headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      }).then(function (r) {
        clearTimeout(timer);
        return r.json().catch(function () { return {}; }).then(function (json) { return { status: r.status, json: json }; });
      }).catch(function (e) { clearTimeout(timer); var err = new Error('network'); err.network = true; err.cause = e; throw err; });
    }
    function run() {
      return sleep(delays[attempt]).then(once).then(function (res) {
        if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < delays.length - 1) { attempt++; return wake().then(run); }
        if (res.status >= 400) {
          var e = new Error((res.json.error && res.json.error.message) || 'Something went wrong.');
          e.code = res.json.error && res.json.error.code; e.status = res.status; throw e;
        }
        return res.json;
      }, function (err) {
        if (err.network && attempt < delays.length - 1) { attempt++; return wake().then(run); }
        var e = new Error('We could not reach the server. Check your connection and try again.');
        e.code = 'offline'; throw e;
      });
    }
    function wake() {
      if (!wakingShown && opts.onWaiting !== false) { wakingShown = true; DV.ui.toast('Waking up the server. This can take up to a minute the first time.'); }
      return Promise.resolve();
    }
    return run();
  }

  function localCall(fn) {
    return Promise.resolve().then(fn).catch(function (e) { throw e; });
  }

  DV.api = {
    live: live,
    mode: live ? 'live' : 'local',

    // Quietly wake the server as soon as the site opens, so it's ready by the time it's needed.
    warm: function () { if (live) request('GET', '/api/health', null, { noRetry: true, onWaiting: false }).catch(function () {}); },
    health: function () { return live ? request('GET', '/api/health', null, { noRetry: true }) : Promise.resolve({ ok: true, store: 'browser' }); },

    geoSearch: function (q) {
      var localHits = DV.geo.searchLocal(q, 5);
      if (!live || q.length < 3) return Promise.resolve(localHits);
      return request('GET', '/api/geo/search?q=' + encodeURIComponent(q), null, { noRetry: true, onWaiting: false })
        .then(function (r) {
          var seen = {}, out = [];
          localHits.concat(r.places || []).forEach(function (p) { if (!seen[p.label]) { seen[p.label] = 1; out.push(p); } });
          return out.slice(0, 7);
        }).catch(function () { return localHits; });
    },
    geoReverse: function (lat, lon) {
      if (live) return request('GET', '/api/geo/reverse?lat=' + lat + '&lon=' + lon, null, { noRetry: true }).then(function (r) { return r.place; });
      var best = null, bestKm = 80;
      DV.data.cities.forEach(function (c) {
        var d = DV.util.haversineKm(lat, lon, c.lat, c.lon);
        if (d < bestKm) { best = c; bestKm = d; }
      });
      return Promise.resolve(best ? DV.geo.finish(best) : null);
    },

    discover: function (o) {
      if (!live) return Promise.resolve({ venues: [], meta: { local: true } });
      return request('POST', '/api/discover', { lat: o.place.lat, lon: o.place.lon, mine: o.mine, partner: o.partner });
    },
    // Real Google photos of a venue (only when the API has a Google key). purpose: 'card' | 'detail' | 'invite'.
    // Remembered for 10 minutes so the same venue is never fetched twice in a row (saves your free allowance).
    photos: function (item, purpose, max) {
      var none = Promise.resolve({ photos: [] });
      if (!live || item.source !== 'osm' || typeof item.lat !== 'number' || photoState.off) return none;
      purpose = purpose || 'detail';
      if (purpose === 'card' && photoState.noCards) return none;
      max = purpose === 'card' ? 1 : (max || 2);
      var key = item.id + '|' + max, hit = photoCache[key];
      if (hit && hit.exp > Date.now()) return hit.p;
      var p = request('GET', '/api/photos?name=' + encodeURIComponent(item.name) + '&lat=' + item.lat + '&lon=' + item.lon + '&purpose=' + purpose + '&max=' + max, null, { noRetry: true, onWaiting: false })
        .then(function (r) {
          if (r.reason === 'no_key' || r.reason === 'monthly_cap') photoState.off = true;
          if (r.reason === 'card_budget' || r.reason === 'cards_disabled') photoState.noCards = true;
          if (!r.photos || !r.photos.length) delete photoCache[key];
          return r;
        }).catch(function () { delete photoCache[key]; return { photos: [] }; });
      photoCache[key] = { p: p, exp: Date.now() + 600000 };
      return p;
    },

    createInvite: function (payload) {
      if (live) return request('POST', '/api/invites', payload);
      return localCall(function () {
        return DV.invites.create(localStore(), payload, new Date(), { verifyItem: function () { return false; } }).then(function (r) {
          return { token: r.doc.token, manageToken: r.doc.manageToken, invite: DV.invites.publicView(r.doc), deduped: r.deduped };
        });
      });
    },
    getInvite: function (token) {
      if (live) return request('GET', '/api/invites/' + encodeURIComponent(token));
      return localCall(function () { return DV.invites.open(localStore(), token, new Date()).then(function (d) { return { invite: DV.invites.publicView(d) }; }); });
    },
    respond: function (token, response) {
      if (live) return request('POST', '/api/invites/' + encodeURIComponent(token) + '/respond', { response: response });
      return localCall(function () {
        return DV.invites.respond(localStore(), token, response, new Date()).then(function (r) {
          return { invite: DV.invites.publicView(r.doc), changed: r.changed, conflict: !!r.conflict };
        });
      });
    },
    getManage: function (mt) {
      if (live) return request('GET', '/api/manage/' + encodeURIComponent(mt));
      return localCall(function () { return DV.invites.manage(localStore(), mt).then(function (d) { return { invite: DV.invites.manageView(d) }; }); });
    },
    requestCity: function (label) {
      if (live) return request('POST', '/api/city-requests', { label: label }, { noRetry: true });
      return Promise.resolve({ ok: true });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
