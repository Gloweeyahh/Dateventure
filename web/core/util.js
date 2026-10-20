/* Dateventure core: small helpers shared by the website and the API.
   Works in the browser (window.DV) and in Node (globalThis.DV). */
(function (g) {
  var DV = (g.DV = g.DV || {});

  function randomToken(bytes) {
    bytes = bytes || 18;
    var arr = new Uint8Array(bytes);
    g.crypto.getRandomValues(arr);
    var s = '';
    for (var i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
    var b64 = typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Trim, collapse spaces, drop control characters and angle brackets, cap length.
  function clean(value, max) {
    if (typeof value !== 'string') return '';
    var out = value.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim();
    return max && out.length > max ? out.slice(0, max).trim() : out;
  }

  // Small deterministic number from a string (so wording is stable per venue).
  function hash(str) {
    var h = 2166136261;
    str = String(str);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function norm(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function groupThousands(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Round to 1, 2 or 5 times a power of ten (used for slider ranges).
  function niceRound(x) {
    if (!(x > 0)) return 0;
    var p = Math.pow(10, Math.floor(Math.log10(x)));
    var m = x / p;
    var step = m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10;
    return step * p;
  }

  // Round to 2 significant figures (used for price estimates).
  function round2sf(x) {
    if (!(x > 0)) return 0;
    var p = Math.pow(10, Math.floor(Math.log10(x)) - 1);
    return Math.round(x / p) * p;
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var toRad = function (d) { return (d * Math.PI) / 180; };
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  DV.util = {
    randomToken: randomToken, clean: clean, hash: hash, norm: norm,
    groupThousands: groupThousands, niceRound: niceRound, round2sf: round2sf,
    haversineKm: haversineKm
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DV.util;
})(typeof window !== 'undefined' ? window : globalThis);
