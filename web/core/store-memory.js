/* Dateventure core: an in-memory store with the same methods as the MongoDB store.
   Used by tests, by the "no server yet" local mode and by the preview.
   Pass persist(snapshot) to save to localStorage in the browser. */
(function (g) {
  var DV = (g.DV = g.DV || {});

  function clone(x) { return x === null || x === undefined ? x : JSON.parse(JSON.stringify(x)); }

  function createMemoryStore(opts) {
    opts = opts || {};
    var invites = {};      // token -> doc
    var counters = {};
    var cityRequests = [];

    if (opts.initial) {
      invites = clone(opts.initial.invites) || {};
      counters = clone(opts.initial.counters) || {};
      cityRequests = clone(opts.initial.cityRequests) || [];
    }

    function save() {
      if (typeof opts.persist === 'function') {
        try { opts.persist({ invites: invites, counters: counters, cityRequests: cityRequests }); } catch (e) { /* ignore */ }
      }
    }

    function find(pred) {
      var keys = Object.keys(invites);
      for (var i = 0; i < keys.length; i++) if (pred(invites[keys[i]])) return clone(invites[keys[i]]);
      return null;
    }

    return {
      kind: 'memory',
      insertInvite: function (doc) {
        if (invites[doc.token]) {
          var e = new Error('duplicate'); e.code = 'duplicate'; return Promise.reject(e);
        }
        invites[doc.token] = clone(doc);
        save();
        return Promise.resolve(clone(doc));
      },
      findByToken: function (token) { return Promise.resolve(invites[token] ? clone(invites[token]) : null); },
      findByManageToken: function (mt) { return Promise.resolve(find(function (d) { return d.manageToken === mt; })); },
      findByClientRequestId: function (id) {
        return Promise.resolve(find(function (d) { return d.clientRequestId && d.clientRequestId === id; }));
      },
      // Change an invite only if its current status is one of `from`. Returns the updated doc, or null.
      transition: function (token, from, patch) {
        var d = invites[token];
        if (!d || from.indexOf(d.status) === -1) return Promise.resolve(null);
        Object.keys(patch).forEach(function (k) { d[k] = patch[k]; });
        save();
        return Promise.resolve(clone(d));
      },
      peek: function (key) { return Promise.resolve(counters[key] || 0); },
      incr: function (key) {
        counters[key] = (counters[key] || 0) + 1;
        save();
        return Promise.resolve(counters[key]);
      },
      insertCityRequest: function (doc) {
        cityRequests.push(clone(doc));
        save();
        return Promise.resolve(true);
      },
      ping: function () { return Promise.resolve(true); },
      _dump: function () { return clone({ invites: invites, counters: counters, cityRequests: cityRequests }); }
    };
  }

  DV.createMemoryStore = createMemoryStore;
  if (typeof module !== 'undefined' && module.exports) module.exports = createMemoryStore;
})(typeof window !== 'undefined' ? window : globalThis);
