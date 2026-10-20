/* Dateventure web: remembers your answers while you plan (so a refresh doesn't lose them). */
(function (g) {
  var DV = (g.DV = g.DV || {});
  var KEY = 'dv.state.v1', BOOK = 'dv.invites.v1', LOCAL = 'dv.localstore.v1';
  var mem = {};

  function read(key, fallback) {
    try {
      var raw = g.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return mem[key] !== undefined ? mem[key] : fallback; }
  }
  function write(key, value) {
    mem[key] = value;
    try { g.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: keep in memory */ }
  }

  function fresh() {
    return { name: '', place: null, currency: '', budget: null, mine: [], partner: [], extraMine: [], extraPartner: [], selected: null, trailerUsed: false };
  }
  var state = Object.assign(fresh(), read(KEY, {}));

  DV.state = {
    get: function () { return state; },
    set: function (patch) { Object.assign(state, patch); write(KEY, state); },
    reset: function () { var keep = state.name; state = fresh(); state.name = keep; write(KEY, state); }
  };

  DV.book = {
    list: function () { return read(BOOK, []); },
    add: function (entry) {
      var l = read(BOOK, []).filter(function (e) { return e.manageToken !== entry.manageToken; });
      l.unshift(entry);
      write(BOOK, l.slice(0, 30));
    }
  };

  DV.localStorageJSON = { read: read, write: write, LOCAL: LOCAL };
})(typeof window !== 'undefined' ? window : globalThis);
