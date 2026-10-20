const test = require('node:test');
const assert = require('node:assert/strict');
const DV = require('../../web/core/index.js');

const NOW = new Date('2026-10-11T12:00:00Z');

test('currencies: formatting, country mapping, slider scale, conversion', () => {
  assert.equal(DV.currencies.format(15000, 'NGN'), '₦15,000');
  assert.equal(DV.currencies.format(1234567, 'USD'), '$1,234,567');
  assert.equal(DV.currencies.forCountry('NG'), 'NGN');
  assert.equal(DV.currencies.forCountry('gb'), 'GBP');
  assert.equal(DV.currencies.forCountry('FR'), 'EUR');
  assert.equal(DV.currencies.forCountry('ZZ'), 'USD');
  const s = DV.currencies.budgetScale('NGN');
  assert.ok(s.min < s.def && s.def < s.max);
  const gbp = DV.currencies.budgetScale('GBP');
  assert.ok(gbp.min >= 1 && gbp.max > gbp.def && gbp.step >= 1);
  assert.equal(DV.currencies.convert(100, 'USD', 'USD'), 100);
  assert.ok(DV.currencies.convert(1, 'USD', 'NGN') > 1000);
  DV.currencies.list().forEach((c) => {
    const sc = DV.currencies.budgetScale(c.code);
    assert.ok(sc.min > 0 && sc.max > sc.min && sc.step > 0, 'bad scale for ' + c.code);
  });
});

test('interests: add-your-own matcher', () => {
  assert.equal(DV.interests.matchCustom('Sushi'), 'restaurants');
  assert.equal(DV.interests.matchCustom('jazz bars'), 'live-music');
  assert.equal(DV.interests.matchCustom('Bowling'), 'bowling');
  assert.equal(DV.interests.matchCustom('xyzzy'), null);
  assert.equal(DV.interests.matchCustom(''), null);
});

test('data: every venue and idea is well formed', () => {
  const all = DV.data.venues.concat(DV.data.ideas);
  const ids = new Set();
  all.forEach((x) => {
    assert.ok(!ids.has(x.id), 'duplicate id ' + x.id);
    ids.add(x.id);
    assert.ok(DV.items.BANDS.includes(x.band), x.id + ' band');
    assert.ok(DV.items.ARTS.includes(x.art), x.id + ' art');
    assert.ok(x.tags.length > 0, x.id + ' tags');
    x.tags.forEach((t) => assert.ok(DV.interests.byId[t], x.id + ' unknown tag ' + t));
    assert.ok(['morning', 'afternoon', 'evening'].includes(x.bestTime), x.id + ' bestTime');
    assert.ok(x.hook && x.hook.length > 5, x.id + ' hook');
    (x.photos || []).forEach((p) => assert.ok(p.src && p.credit, x.id + ' photo needs credit'));
  });
  DV.data.venues.forEach((v) => {
    assert.ok(DV.data.regions.some((r) => r.id === v.city), v.id + ' region');
    assert.equal(v.verified, false, v.id + ' must start unverified');
  });
});

test('engine: budget is a hard rule', () => {
  const res = DV.engine.recommend({
    regionId: 'abuja', currency: 'NGN', budget: 20000, useSample: true,
    mine: ['restaurants', 'live-music', 'nature'], partner: ['desserts', 'live-music', 'art']
  });
  assert.ok(res.items.length > 0);
  res.items.forEach((it) => {
    assert.notEqual(it.band, 'premium', it.name + ' should not appear at 20,000');
    assert.ok(it.estLow <= 20000, it.name + ' min estimate above budget');
  });
});

test('engine: zero budget only returns free things', () => {
  const res = DV.engine.recommend({
    regionId: 'abuja', currency: 'NGN', budget: 0, useSample: true,
    mine: ['nature', 'picnics', 'quiet'], partner: ['nature', 'photography']
  });
  assert.ok(res.items.length > 0);
  res.items.forEach((it) => assert.equal(it.fit, 'free'));
});

test('engine: needs both people to match, one-sided items rank below', () => {
  const res = DV.engine.recommend({
    regionId: null, currency: 'USD', budget: 80, cc: 'US',
    mine: ['bowling', 'picnics', 'sunsets'], partner: ['picnics', 'sunsets', 'cooking']
  });
  const top = res.items[0];
  assert.ok(top.sharedYou.length > 0 && top.sharedPartner.length > 0, 'top result should suit both');
  const lop = res.items.findIndex((i) => i.lopsided);
  const bothIdx = res.items.map((i, n) => (i.lopsided ? -1 : n)).filter((n) => n >= 0);
  if (lop >= 0) assert.ok(lop > Math.max.apply(null, bothIdx), 'lopsided must come after two-sided items');
});

test('engine: explanations name the actual picks and differ between results', () => {
  const res = DV.engine.recommend({
    regionId: null, currency: 'GBP', budget: 100, cc: 'GB',
    mine: ['picnics', 'photography', 'markets', 'desserts'], partner: ['sunsets', 'street-food', 'cafes', 'quiet']
  });
  const texts = res.items.map((i) => i.why.text);
  assert.equal(new Set(texts).size, texts.length, 'wording should not repeat');
  res.items.forEach((i) => {
    assert.ok(i.why.forYou || i.why.forPartner);
    assert.match(i.why.cost, /Free|Estimated/);
  });
});

test('engine: variety, ideas for places with no venue list', () => {
  const res = DV.engine.recommend({
    regionId: null, currency: 'NGN', budget: 25000, cc: 'NG', mine: ['cafes', 'desserts', 'nature'], partner: ['cafes', 'desserts', 'quiet']
  });
  assert.equal(res.meta.venueCount, 0);
  assert.ok(res.items.every((i) => i.kind === 'idea'));
  assert.equal(res.meta.hasVenueDirectory, false);
});

test('engine: live venues are ranked and carry through source and signature fields', () => {
  const live = [{
    id: 'osm:node/1', kind: 'venue', name: 'Test Cafe', area: 'Centre', address: '1 Main St', lat: 51.5, lon: -0.1,
    category: 'cafe', tags: ['cafes', 'desserts'], band: 'low', bandGuess: true, art: 'dessert', bestTime: 'afternoon',
    vibe: ['Cosy'], hook: 'share a slice and a long chat', source: 'osm', sig: 'abc', distanceKm: 1.2, photos: []
  }];
  const res = DV.engine.recommend({
    regionId: null, currency: 'GBP', budget: 40, cc: 'GB', venues: live, mine: ['cafes'], partner: ['desserts']
  });
  const v = res.items.find((i) => i.id === 'osm:node/1');
  assert.ok(v, 'live venue should be recommended');
  assert.equal(v.sig, 'abc');
  assert.equal(v.source, 'osm');
  assert.equal(v.bandGuess, true);
});

test('engine: Remix shows different results, then starts over when it runs out', () => {
  const base = { regionId: 'abuja', currency: 'NGN', budget: 60000, useSample: true, cc: 'NG',
    mine: ['restaurants', 'live-music', 'nature', 'cafes'], partner: ['desserts', 'live-music', 'art', 'cafes'] };
  const first = DV.engine.recommend(base);
  const ids1 = first.items.map((i) => i.id);
  const second = DV.engine.recommend(Object.assign({}, base, { exclude: ids1 }));
  assert.ok(second.items.length > 0);
  second.items.forEach((i) => assert.ok(!ids1.includes(i.id), i.id + ' was shown before'));
  const everything = DV.engine.recommend(Object.assign({}, base, { limit: 500 })).items.map((i) => i.id);
  const restarted = DV.engine.recommend(Object.assign({}, base, { exclude: everything }));
  assert.equal(restarted.meta.restarted, true);
  assert.ok(restarted.items.length >= 3);
});

test('engine: plan has times and never invents extra facts', () => {
  const item = DV.engine.getItem('idea-sunset-picnic');
  const plan = DV.engine.buildPlan(item);
  assert.ok(plan.length >= 3);
  plan.forEach((s) => assert.match(s.time, /^\d{1,2}:\d{2} (am|pm)$/));
});

test('geo: tidy labels, no "Municipal Area Council", currency from country', () => {
  assert.equal(
    DV.geo.labelFromAddress({ county: 'Municipal Area Council', state: 'Federal Capital Territory', country: 'Nigeria' }),
    'Abuja, Nigeria'
  );
  assert.equal(
    DV.geo.labelFromAddress({ suburb: 'Wuse', county: 'Municipal Area Council', state: 'Federal Capital Territory', country: 'Nigeria' }),
    'Wuse, Abuja, Nigeria'
  );
  const p = DV.geo.mapNominatim({ lat: '51.5074', lon: '-0.1278', display_name: 'London, UK', address: { city: 'London', country: 'United Kingdom', country_code: 'gb' } });
  assert.equal(p.currency, 'GBP');
  assert.equal(p.label, 'London, United Kingdom');
  assert.equal(DV.geo.mapNominatim({ lat: 'x', lon: '1', address: {} }), null);
  const local = DV.geo.searchLocal('maitama');
  assert.ok(local.length && local[0].currency === 'NGN' && local[0].regionId === 'abuja');
  assert.equal(DV.geo.searchLocal('lon')[0].name, 'London');
  assert.deepEqual(DV.geo.searchLocal('a'), []);
});

test('items.sanitizeLive: accepts good data, strips danger, rejects bad ids and photos', () => {
  const good = {
    id: 'osm:node/42', name: 'Café <script>alert(1)</script> Luna', lat: 6.5, lon: 3.4, category: 'cafe',
    tags: ['cafes', 'not-a-real-tag'], band: 'low', art: 'dessert', bestTime: 'afternoon', hook: 'sip slowly',
    photos: [
      { src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cafe_Luna.jpg?width=900', credit: 'Photo: Someone' },
      { src: 'https://evil.example.com/x.jpg', credit: 'bad' },
      { src: 'javascript:alert(1)', credit: 'worse' }
    ]
  };
  const out = DV.items.sanitizeLive(good);
  assert.ok(out);
  assert.ok(!/[<>]/.test(out.name));
  assert.deepEqual(out.tags, ['cafes']);
  assert.equal(out.photos.length, 1);
  assert.equal(DV.items.sanitizeLive(Object.assign({}, good, { id: 'osm:node/abc' })), null);
  assert.equal(DV.items.sanitizeLive(Object.assign({}, good, { id: 'x' })), null);
  assert.equal(DV.items.sanitizeLive(Object.assign({}, good, { tags: ['nope'] })), null);
  assert.equal(DV.items.sanitizeLive(Object.assign({}, good, { lat: 999 })), null);
  assert.equal(DV.items.sanitizeLive(null), null);
});

function baseInput(extra) {
  return Object.assign({
    plannerName: 'Gloria', recipientName: 'Mimi', itemId: 'idea-sunset-picnic',
    budget: { amount: 20000, currency: 'NGN' }, message: 'Wear comfy shoes', proposedDate: '2026-11-01', trailerUsed: true
  }, extra || {});
}

test('invites: full lifecycle ready -> opened -> accepted, idempotent', async () => {
  const store = DV.createMemoryStore();
  const { doc } = await DV.invites.create(store, baseInput(), NOW);
  assert.equal(doc.status, 'ready');
  assert.ok(doc.token.length >= 30 && doc.manageToken.length >= 30 && doc.token !== doc.manageToken);
  assert.equal(doc.item.name, 'Sunset picnic');
  const pub = DV.invites.publicView(doc);
  assert.equal(pub.manageToken, undefined);
  assert.equal(pub.budget, undefined, 'budget amount must stay private');

  const opened = await DV.invites.open(store, doc.token, NOW);
  assert.equal(opened.status, 'opened');
  assert.ok(opened.openedAt);

  const a1 = await DV.invites.respond(store, doc.token, 'accept', NOW);
  assert.equal(a1.changed, true);
  assert.equal(a1.doc.status, 'accepted');
  const a2 = await DV.invites.respond(store, doc.token, 'accept', new Date(NOW.getTime() + 5000));
  assert.equal(a2.changed, false);
  assert.equal(a2.doc.respondedAt, a1.doc.respondedAt, 'second press must not change the timestamp');

  const d = await DV.invites.respond(store, doc.token, 'decline', NOW);
  assert.equal(d.changed, false);
  assert.equal(d.conflict, true);
  assert.equal(d.doc.status, 'accepted');

  const m = await DV.invites.manage(store, doc.manageToken);
  assert.equal(m.status, 'accepted');
});

test('invites: decline can later become accept, opening never downgrades', async () => {
  const store = DV.createMemoryStore();
  const { doc } = await DV.invites.create(store, baseInput(), NOW);
  const d1 = await DV.invites.respond(store, doc.token, 'decline', NOW);
  assert.equal(d1.doc.status, 'declined');
  const d2 = await DV.invites.respond(store, doc.token, 'decline', NOW);
  assert.equal(d2.changed, false);
  const reopened = await DV.invites.open(store, doc.token, NOW);
  assert.equal(reopened.status, 'declined');
  const a = await DV.invites.respond(store, doc.token, 'accept', NOW);
  assert.equal(a.doc.status, 'accepted');
});

test('invites: validation rejects bad input with clear codes', async () => {
  const store = DV.createMemoryStore();
  const bad = async (patch, code) => {
    await assert.rejects(() => DV.invites.create(store, baseInput(patch), NOW), (e) => e.code === code && e.status === 400);
  };
  await bad({ plannerName: '   ' }, 'bad_planner_name');
  await bad({ recipientName: '' }, 'bad_recipient_name');
  await bad({ itemId: 'made-up-place' }, 'unknown_date');
  await bad({ budget: { amount: -5, currency: 'NGN' } }, 'bad_budget');
  await bad({ budget: { amount: 'lots', currency: 'NGN' } }, 'bad_budget');
  await bad({ budget: { amount: 10, currency: 'XXX' } }, 'bad_currency');
  await bad({ proposedDate: '2026-02-31' }, 'bad_date');
  await bad({ proposedDate: '2035-01-01' }, 'bad_date');
  await bad({ clientRequestId: 'short' }, 'bad_request_id');
  await assert.rejects(() => DV.invites.respond(store, 'nope', 'accept', NOW), (e) => e.code === 'not_found' && e.status === 404);
  const { doc } = await DV.invites.create(store, baseInput(), NOW);
  await assert.rejects(() => DV.invites.respond(store, doc.token, 'maybe', NOW), (e) => e.code === 'bad_response');
});

test('invites: names and messages are cleaned', async () => {
  const store = DV.createMemoryStore();
  const { doc } = await DV.invites.create(store, baseInput({ plannerName: '  <b>Glo</b>\n\nria  ', message: 'x'.repeat(500) }), NOW);
  assert.ok(!/[<>]/.test(doc.plannerName));
  assert.ok(doc.message.length <= 160);
});

test('invites: same request id twice makes one invite', async () => {
  const store = DV.createMemoryStore();
  const a = await DV.invites.create(store, baseInput({ clientRequestId: 'req-12345678' }), NOW);
  const b = await DV.invites.create(store, baseInput({ clientRequestId: 'req-12345678' }), NOW);
  assert.equal(b.deduped, true);
  assert.equal(a.doc.token, b.doc.token);
  assert.equal(Object.keys(store._dump().invites).length, 1);
});

test('invites: live venues need a valid server signature', async () => {
  const store = DV.createMemoryStore();
  const raw = {
    id: 'osm:way/99', name: 'Lakeside Walk', lat: 9.07, lon: 7.39, category: 'outdoors', tags: ['nature', 'sunsets'],
    band: 'free', art: 'lake', bestTime: 'evening', hook: 'stroll the shore', photos: []
  };
  const verifyYes = (item, sig) => sig === 'good-sig' && item.name === 'Lakeside Walk';
  const ok = await DV.invites.create(store, baseInput({ itemId: undefined, item: raw, itemSig: 'good-sig' }), NOW, { verifyItem: verifyYes });
  assert.equal(ok.doc.item.name, 'Lakeside Walk');
  assert.equal(ok.doc.item.source, 'osm');
  await assert.rejects(
    () => DV.invites.create(store, baseInput({ itemId: undefined, item: raw, itemSig: 'forged' }), NOW, { verifyItem: verifyYes }),
    (e) => e.code === 'bad_venue'
  );
  await assert.rejects(
    () => DV.invites.create(store, baseInput({ itemId: undefined, item: Object.assign({}, raw, { name: 'Evil' }), itemSig: 'good-sig' }), NOW, { verifyItem: verifyYes }),
    (e) => e.code === 'bad_venue'
  );
  await assert.rejects(
    () => DV.invites.create(store, baseInput({ itemId: undefined, item: raw, itemSig: 'good-sig' }), NOW),
    (e) => e.code === 'bad_venue'
  );
});
