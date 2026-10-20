/* Dateventure core: location helpers.
   A "place" always looks like { label, name, cc, lat, lon, currency, regionId }.
   currency comes from the country, so Abuja gives NGN and London gives GBP. */
(function (g) {
  var DV = (g.DV = g.DV || {});

  var BAD_NAME = /municipal area council|local government|\blga\b|district council|metropolitan/i;
  var ORDER = ['neighbourhood', 'suburb', 'quarter', 'city_district', 'city', 'town', 'village', 'municipality',
    'state_district', 'county', 'state'];

  function cap(s) { return s.replace(/\b[a-z]/g, function (m) { return m.toUpperCase(); }); }

  function countryName(cc) {
    var list = DV.data.cities;
    for (var i = 0; i < list.length; i++) if (list[i].cc === cc) return list[i].country;
    return cc;
  }

  function finish(base) {
    var cur = DV.currencies.forCountry(base.cc);
    var place = {
      label: base.label, name: base.name || base.label.split(',')[0], cc: base.cc,
      lat: typeof base.lat === 'number' ? Math.round(base.lat * 10000) / 10000 : null,
      lon: typeof base.lon === 'number' ? Math.round(base.lon * 10000) / 10000 : null,
      currency: cur, regionId: null
    };
    var region = DV.engine.regionForPlace(place);
    place.regionId = region ? region.id : null;
    return place;
  }

  // Built-in search: instant, works offline.
  function searchLocal(q, limit) {
    var t = DV.util.norm(q);
    limit = limit || 6;
    if (t.length < 2) return [];
    var out = [], seen = {};
    DV.data.cities.forEach(function (c) {
      var n = DV.util.norm(c.name);
      var rank = n.indexOf(t) === 0 ? 0 : n.indexOf(t) > 0 ? 1 : -1;
      if (rank >= 0) out.push({ rank: rank, place: finish(c) });
    });
    // Neighbourhood names we know about (e.g. "Maitama" -> Maitama, Abuja, Nigeria).
    DV.data.regions.forEach(function (r) {
      (r.aliases || []).forEach(function (a) {
        if (a === DV.util.norm(r.name) || a.length < 4) return;
        if (a.indexOf(t) === 0) {
          var label = cap(a) + ', ' + r.name + ', ' + countryName(r.country);
          out.push({ rank: 0.5, place: finish({ label: label, name: cap(a), cc: r.country, lat: r.lat, lon: r.lon }) });
        }
      });
    });
    out.sort(function (a, b) { return a.rank - b.rank || a.place.label.localeCompare(b.place.label); });
    return out.map(function (x) { return x.place; }).filter(function (p) {
      if (seen[p.label]) return false;
      seen[p.label] = true;
      return true;
    }).slice(0, limit);
  }

  function labelFromAddress(addr, displayName) {
    addr = addr || {};
    var country = addr.country || '';
    var state = addr.state || '';
    var main = '', i, v;
    for (i = 0; i < ORDER.length; i++) {
      v = addr[ORDER[i]];
      if (v && !BAD_NAME.test(v)) { main = v; break; }
    }
    var city = addr.city || addr.town || addr.village || '';
    if (BAD_NAME.test(city)) city = '';
    // Abuja is the capital of the "Federal Capital Territory", and OpenStreetMap often only says that.
    if (/federal capital territory/i.test(state) && !city) city = 'Abuja';
    if (/federal capital territory/i.test(main)) main = 'Abuja';
    var parts = [];
    if (main) parts.push(main);
    if (city && city !== main) parts.push(city);
    if (!parts.length && state && !BAD_NAME.test(state)) parts.push(state);
    if (country) parts.push(country);
    if (parts.length) return parts.join(', ');
    return String(displayName || '').split(',').slice(0, 3).join(',').trim();
  }

  // Turn one OpenStreetMap (Nominatim) result into a place. Returns null if unusable.
  function mapNominatim(r) {
    if (!r) return null;
    var lat = parseFloat(r.lat), lon = parseFloat(r.lon);
    var addr = r.address || {};
    var cc = String(addr.country_code || '').toUpperCase();
    var label = labelFromAddress(addr, r.display_name);
    if (!label || !cc || isNaN(lat) || isNaN(lon)) return null;
    return finish({ label: label, cc: cc, lat: lat, lon: lon });
  }

  function placeFromCity(name) {
    var list = searchLocal(name, 1);
    return list[0] || null;
  }

  DV.geo = {
    searchLocal: searchLocal, labelFromAddress: labelFromAddress, mapNominatim: mapNominatim,
    placeFromCity: placeFromCity, finish: finish
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DV.geo;
})(typeof window !== 'undefined' ? window : globalThis);
