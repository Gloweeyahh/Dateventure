/* Dateventure core: the recommendation engine.
   - Budget is a hard rule: anything whose estimated minimum is above the budget is dropped.
   - Compatibility looks at BOTH people. Something loved by one and ignored by the other ranks low.
   - Results are diversified so you don't get five restaurants in a row.
   - "Why it fits" sentences are written from the interests the two people actually picked.
   Nothing here talks to the internet, so it is fast, free and cannot invent venues. */
(function (g) {
  var DV = (g.DV = g.DV || {});

  var PHRASE = {
    restaurants: 'trying new restaurants', 'street-food': 'street food', cafes: 'cafés', desserts: 'desserts',
    cocktails: 'cocktails', cooking: 'cooking together', nature: 'time in nature', picnics: 'picnics',
    sunsets: 'sunsets', water: 'being by the water', hiking: 'walks', 'outdoor-games': 'outdoor games',
    art: 'art', pottery: 'making things by hand', photography: 'photography', workshops: 'DIY workshops',
    arcade: 'games', bowling: 'bowling', movies: 'movies', 'live-music': 'live music', comedy: 'comedy',
    karaoke: 'karaoke', dancing: 'dancing', 'board-games': 'board games', spa: 'pampering',
    quiet: 'low-key time', museums: 'museums', markets: 'markets', bookstores: 'bookstores',
    'local-culture': 'local culture'
  };

  var START_HOUR = { morning: 10, afternoon: 15, evening: 18.5 };

  function data() { return DV.data; }
  function allItems() { return data().venues.concat(data().ideas); }

  function getItem(id) {
    var all = allItems();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  function regionById(id) {
    var r = data().regions;
    for (var i = 0; i < r.length; i++) if (r[i].id === id) return r[i];
    return null;
  }

  // Which of our regions (if any) does this place belong to?
  function regionForPlace(place) {
    if (!place) return null;
    var regions = data().regions;
    var text = DV.util.norm(place.label || place.name || '');
    var i, j;
    for (i = 0; i < regions.length; i++) {
      var aliases = regions[i].aliases || [];
      for (j = 0; j < aliases.length; j++) {
        var re = new RegExp('(^|[^a-z])' + aliases[j] + '([^a-z]|$)');
        if (re.test(text)) return regions[i];
      }
    }
    if (typeof place.lat === 'number' && typeof place.lon === 'number') {
      for (i = 0; i < regions.length; i++) {
        if (DV.util.haversineKm(place.lat, place.lon, regions[i].lat, regions[i].lon) <= regions[i].radiusKm) return regions[i];
      }
    }
    return null;
  }

  // Price range for two people, in the user's currency. Always an estimate.
  function rangeFor(item, currency, userRegion, cc) {
    var C = DV.currencies;
    var band = item.band;
    var venueRegion = item.kind === 'venue' && item.city ? regionById(item.city) : userRegion;
    var lo, hi;
    if (venueRegion && venueRegion.bands && venueRegion.bands[band]) {
      lo = venueRegion.bands[band][0];
      hi = venueRegion.bands[band][1];
      if (venueRegion.currency !== currency) {
        lo = DV.util.round2sf(C.convert(lo, venueRegion.currency, currency));
        hi = DV.util.round2sf(C.convert(hi, venueRegion.currency, currency));
      }
    } else {
      var g2 = data().genericBandsUSD[band] || [0, 0];
      var f = C.ppp(cc);
      lo = DV.util.round2sf(C.convert(g2[0] * f, 'USD', currency));
      hi = DV.util.round2sf(C.convert(g2[1] * f, 'USD', currency));
    }
    return { lo: lo, hi: hi, band: band, currency: currency, estimate: true };
  }

  // 'free' | 'fits' | 'stretch' | null (null = too expensive, drop it)
  function fitFor(range, budget) {
    if (range.hi === 0) return 'free';
    var mid = (range.lo + range.hi) / 2;
    if (budget >= mid) return 'fits';
    if (budget >= range.lo) return 'stretch';
    return null;
  }

  function intersect(a, b) {
    return (a || []).filter(function (x) { return (b || []).indexOf(x) !== -1; });
  }

  function known(ids) {
    var out = [];
    (ids || []).forEach(function (id) {
      if (DV.interests.byId[id] && out.indexOf(id) === -1) out.push(id);
    });
    return out;
  }

  function phrases(ids, max) {
    var p = ids.slice(0, max || 2).map(function (id) { return PHRASE[id] || id; });
    if (p.length <= 1) return p.join('');
    return p.slice(0, -1).join(', ') + ' and ' + p[p.length - 1];
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function costSentence(item, range, fit, budget, currency) {
    var C = DV.currencies;
    if (fit === 'free') return 'Free, or close to it.';
    var est = C.format(range.lo, currency) + ' to ' + C.format(range.hi, currency);
    if (fit === 'stretch') return 'Estimated ' + est + ' for two, so it may stretch your ' + C.format(budget, currency) + ' budget.';
    return 'Estimated ' + est + ' for two, which fits your ' + C.format(budget, currency) + ' budget.';
  }

  function why(item, st) {
    var you = phrases(st.sharedYou, 2);
    var them = phrases(st.sharedPartner, 2);
    var both = phrases(st.sharedBoth, 2);
    var youOnly = st.sharedYou.filter(function (x) { return st.sharedBoth.indexOf(x) === -1; });
    var themOnly = st.sharedPartner.filter(function (x) { return st.sharedBoth.indexOf(x) === -1; });
    var n = DV.util.hash(item.id) % 3;
    var hook = item.hook ? cap(item.hook) : '';
    var lead, text;
    if (st.lopsided === 'you') {
      text = 'This one leans towards you: it matches your love of ' + you + ', but only lightly touches what your partner picked. ' + hook + '.';
    } else if (st.lopsided === 'partner') {
      text = 'This one leans towards your partner: it matches their love of ' + them + ', but only lightly touches your picks. ' + hook + '.';
    } else {
      if (st.sharedBoth.length) {
        lead = 'You both love ' + both;
        if (youOnly.length && themOnly.length) lead += ', and it adds your ' + phrases(youOnly, 1) + ' and their ' + phrases(themOnly, 1);
        else if (youOnly.length) lead += ', with a nod to your ' + phrases(youOnly, 1);
        else if (themOnly.length) lead += ', with a nod to their ' + phrases(themOnly, 1);
      } else {
        lead = 'You picked ' + you + '; your partner picked ' + them;
      }
      if (item.kind === 'idea') {
        text = [
          lead + '. ' + hook + '. It works in any city, so you can do it right where you are.',
          lead + '. ' + hook + ', anywhere you like, with no booking needed.',
          hook + '. ' + lead + '. It works wherever you are.'
        ][n];
      } else {
        text = [
          lead + '. ' + item.name + ' is where those meet: ' + item.hook + '.',
          lead + '. ' + hook + ' at ' + item.name + '.',
          hook + ' at ' + item.name + '. ' + lead + '.'
        ][n];
      }
    }
    return { text: text, forYou: you, forPartner: them };
  }

  function recommendCore(o) {
    o = o || {};
    var region = o.regionId ? regionById(o.regionId) : null;
    var mine = known(o.mine), partner = known(o.partner);
    var budget = Math.max(0, Number(o.budget) || 0);
    var currency = o.currency && DV.currencies.info(o.currency) ? o.currency : (region ? region.currency : 'USD');
    var limit = o.limit || 6;

    // Pool = live venues sent by the API + (optionally) our hand-made sample list + ideas that work anywhere.
    var pool = [];
    var live = Array.isArray(o.venues) ? o.venues : [];
    var seenNames = {};
    live.forEach(function (v) { seenNames[DV.util.norm(v.name)] = true; pool.push(v); });
    if (o.useSample && region) {
      data().venues.forEach(function (v) {
        if (v.city === region.id && !seenNames[DV.util.norm(v.name)]) pool.push(v);
      });
    }
    pool = pool.concat(data().ideas);

    var both = [], lopsided = [];
    pool.forEach(function (item) {
      if (o.exclude && o.exclude.indexOf(item.id) !== -1) return;   // "Remix": skip what was already shown
      var range = rangeFor(item, currency, region, o.cc);
      var fit = fitFor(range, budget);
      if (!fit) return;
      var sharedYou = intersect(item.tags, mine);
      var sharedPartner = intersect(item.tags, partner);
      if (!sharedYou.length && !sharedPartner.length) return;
      var a = Math.min(1, sharedYou.length / Math.max(1, Math.min(mine.length, 3)));
      var b = Math.min(1, sharedPartner.length / Math.max(1, Math.min(partner.length, 3)));
      var st = {
        item: item, range: range, fit: fit, sharedYou: sharedYou, sharedPartner: sharedPartner,
        sharedBoth: intersect(sharedYou, sharedPartner), lopsided: null
      };
      var score;
      if (a > 0 && b > 0) {
        score = (2 * a * b) / (a + b) + 0.25;
      } else {
        score = 0.12 * (a + b);
        st.lopsided = a > 0 ? 'you' : 'partner';
      }
      if (item.kind === 'venue') score += 0.06;
      if (typeof item.distanceKm === 'number') score -= Math.min(0.15, item.distanceKm * 0.012);
      if (item.notable) score += 0.03;
      if (fit === 'stretch') score -= 0.2;
      if (fit === 'fits' && (range.lo + range.hi) / 2 >= 0.35 * budget) score += 0.04;
      st.score = score;
      (st.lopsided ? lopsided : both).push(st);
    });

    function byScore(x, y) { return y.score - x.score || (x.item.id < y.item.id ? -1 : 1); }
    both.sort(byScore);
    lopsided.sort(byScore);

    // Pick with variety: same category / same scene art costs a little each time it repeats.
    var picked = [];
    var left = both.slice();
    while (picked.length < limit && left.length) {
      var best = -1, bestVal = -Infinity;
      for (var i = 0; i < left.length; i++) {
        var penalty = 0;
        for (var j = 0; j < picked.length; j++) {
          if (picked[j].item.category === left[i].item.category && left[i].item.category !== 'idea') penalty += 0.12;
          if (picked[j].item.art === left[i].item.art) penalty += 0.09;
        }
        var val = left[i].score - penalty;
        if (val > bestVal) { bestVal = val; best = i; }
      }
      picked.push(left.splice(best, 1)[0]);
    }
    var usedLopsided = false;
    if (picked.length < 3) {
      var extra = lopsided.slice(0, Math.min(2, 3 - picked.length));
      if (extra.length) usedLopsided = true;
      picked = picked.concat(extra);
    }

    var items = picked.map(function (st) {
      var it = st.item;
      var w = why(it, st);
      return {
        id: it.id, kind: it.kind, name: it.name, area: it.area || null, address: it.address || null,
        category: it.category, vibe: it.vibe || [], band: it.band, tags: it.tags, art: it.art,
        bestTime: it.bestTime, hook: it.hook, notes: it.notes || '', verified: !!it.verified,
        placeQuery: it.placeQuery || null, placeId: it.placeId || null, photos: it.photos || [],
        city: it.city || null, source: it.source || (it.kind === 'venue' ? 'sample' : 'idea'), sig: it.sig || null,
        lat: typeof it.lat === 'number' ? it.lat : null, lon: typeof it.lon === 'number' ? it.lon : null,
        distanceKm: typeof it.distanceKm === 'number' ? it.distanceKm : null, hoursText: it.hoursText || '',
        bandGuess: !!it.bandGuess, osmUrl: it.osmUrl || null, notable: !!it.notable, estLow: st.range.lo, estHigh: st.range.hi, currency: currency, fit: st.fit,
        sharedYou: st.sharedYou, sharedPartner: st.sharedPartner, sharedBoth: st.sharedBoth,
        lopsided: st.lopsided, score: Math.round(st.score * 100) / 100,
        why: { text: w.text, forYou: w.forYou, forPartner: w.forPartner, cost: costSentence(it, st.range, st.fit, budget, currency) }
      };
    });

    var venueCount = items.filter(function (x) { return x.kind === 'venue'; }).length;
    return {
      items: items,
      meta: {
        regionId: region ? region.id : null, regionName: region ? region.name : null, currency: currency,
        budget: budget, venueCount: venueCount, ideaCount: items.length - venueCount, usedLopsided: usedLopsided,
        hasVenueDirectory: !!region
      }
    };
  }

  // Same as above, but if "Remix" has used up the good options, start again from the best ones.
  function recommend(o) {
    var first = recommendCore(o);
    if (o && o.exclude && o.exclude.length && first.items.length < 3) {
      var again = recommendCore(Object.assign({}, o, { exclude: [] }));
      again.meta.restarted = true;
      return again;
    }
    return first;
  }

  function fmtTime(hours) {
    var h = Math.floor(hours) % 24;
    var m = Math.round((hours - Math.floor(hours)) * 60);
    var ap = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + (m < 10 ? '0' + m : m) + ' ' + ap;
  }

  var PLANS = {
    outdoors: [['Meet up', 'Meet at {name} and pick your spot.'], ['*', ''], ['Take a memory home', 'Take a photo together before you head off.'], ['Something small after', 'Finish with a cold drink or a snack nearby.']],
    food: [['Arrive and settle', 'Get to {name} and take a table.'], ['*', ''], ['Share something sweet', 'Order one dessert with two spoons.'], ['Walk it off', 'Take a slow stroll before you say goodnight.']],
    cafe: [['Find a table', 'Get to {name} and find a spot you both like.'], ['*', ''], ['Take something with you', 'Pick up a treat for the road.']],
    play: [['Warm up', 'Arrive at {name} and check what is on.'], ['*', ''], ['Winner picks', 'Loser buys the next snack or round.'], ['Cool down', 'Grab something to eat or drink to finish.']],
    music: [['Arrive early', 'Get to {name} early enough to find a good spot.'], ['*', ''], ['Request a favourite', 'Tell each other the song you hope to hear.'], ['Head home humming', 'End the night together, no rush.']],
    culture: [['Arrive', 'Meet at {name} and start wandering.'], ['*', ''], ['Talk it over', 'Pick your favourite thing and explain why.'], ['Treat yourselves', 'Finish with a coffee or a snack.']],
    wellness: [['Arrive and unwind', 'Get to {name} and switch your phones off.'], ['*', ''], ['Slow down after', 'Share a quiet tea or a gentle walk before you head home.']],
    idea: [['Plan it', 'Choose a spot and a time that suit you both.'], ['*', ''], ['Make it special', 'Add one small touch: a playlist, a blanket or a snack.'], ['Talk about it', 'Share your favourite moment before you finish.']]
  };
  var OFFSETS = [0, 0.75, 1.75, 2.5];

  // A simple, honest flow for the evening. Generic on purpose: we never invent venue details.
  function buildPlan(item) {
    var tpl = PLANS[item.category] || PLANS.idea;
    var start = START_HOUR[item.bestTime] || START_HOUR.evening;
    return tpl.map(function (row, i) {
      var title = row[0], text = row[1];
      if (title === '*') {
        title = item.kind === 'idea' ? item.name : 'The main part';
        text = cap(item.hook || 'enjoy the time together') + '.';
      }
      return { time: fmtTime(start + OFFSETS[i]), title: title, text: text.replace('{name}', item.name) };
    });
  }

  DV.engine = {
    recommend: recommend, getItem: getItem, regionById: regionById, regionForPlace: regionForPlace,
    rangeFor: rangeFor, fitFor: fitFor, buildPlan: buildPlan, phrases: phrases, allItems: allItems
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DV.engine;
})(typeof window !== 'undefined' ? window : globalThis);
