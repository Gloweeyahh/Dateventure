#!/usr/bin/env node
// Checks a DEPLOYED api end to end. Run:  npm run smoke -- https://your-api.onrender.com [https://your-site.netlify.app]
// Prints PASS/FAIL for each step, and exits with an error if anything failed.
const base = (process.argv[2] || '').replace(/\/+$/, '');
const origin = process.argv[3] || '';
if (!base) { console.log('Usage: npm run smoke -- https://your-api.onrender.com [https://your-site.netlify.app]'); process.exit(2); }
let failed = 0;
const ok = (c, m, extra) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (extra ? '  ' + extra : '')); if (!c) failed++; };

async function call(method, path, body, headers) {
  const started = Date.now();
  const r = await fetch(base + path, { method, headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}), body: body ? JSON.stringify(body) : undefined });
  let json = {}; try { json = await r.json(); } catch (e) { /* empty */ }
  return { status: r.status, json, ms: Date.now() - started, headers: r.headers };
}

(async () => {
  console.log('Checking ' + base + ' (the first call can take up to a minute if the server was asleep)\n');
  let r = await call('GET', '/api/health');
  const hz = r.json;
  ok(r.status === 200 && r.json.ok, 'server is up and the database answers', JSON.stringify({ store: r.json.store, ms: r.ms }));
  ok(r.json.store === 'mongo', 'invitations are saved in MongoDB (not in memory)', r.json.store === 'mongo' ? '' : 'Set MONGODB_URI on Render, or invitations will vanish when the server sleeps');
  ok(r.json.signingSecretSet === true, 'SIGNING_SECRET is set');
  console.log('     Google photos: ' + (r.json.googlePhotos ? 'on' : 'off (optional)') + ' | CORS: ' + JSON.stringify(r.json.corsOrigins));

  if (origin) {
    r = await call('OPTIONS', '/api/invites', null, { Origin: origin });
    ok(r.headers.get('access-control-allow-origin') === origin, 'your website address is allowed to call the API (CORS)',
      r.headers.get('access-control-allow-origin') ? '' : 'Add ' + origin + ' to ALLOWED_ORIGINS on Render');
  }

  const req = { plannerName: 'Smoke', recipientName: 'Test', itemId: 'idea-board-games', budget: { amount: 100, currency: 'USD' }, clientRequestId: 'smoke-' + Date.now() };
  r = await call('POST', '/api/invites', req);
  ok(r.status === 201 && r.json.token, 'can create an invitation', 'HTTP ' + r.status);
  const token = r.json.token, mt = r.json.manageToken;
  r = await call('POST', '/api/invites', req);
  ok(r.status === 200 && r.json.deduped === true, 'sending the same request twice does not make a second invitation');
  r = await call('GET', '/api/invites/' + token);
  ok(r.status === 200 && r.json.invite.status === 'opened', 'recipient link opens and marks it opened');
  r = await call('POST', '/api/invites/' + token + '/respond', { response: 'accept' });
  ok(r.json.invite && r.json.invite.status === 'accepted', 'accepting works');
  r = await call('POST', '/api/invites/' + token + '/respond', { response: 'accept' });
  ok(r.json.changed === false, 'accepting twice is harmless');
  r = await call('GET', '/api/manage/' + mt);
  ok(r.json.invite && r.json.invite.status === 'accepted', 'the planner status page sees the answer');
  r = await call('POST', '/api/invites', Object.assign({}, req, { plannerName: '', clientRequestId: 'smoke-bad-' + Date.now() }));
  ok(r.status === 400, 'bad input is refused politely', 'HTTP ' + r.status);

  for (const [name, lat, lon] of [['London', 51.5074, -0.1278], ['Abuja', 9.0765, 7.3986], ['New York', 40.7128, -74.006]]) {
    r = await call('POST', '/api/discover', { lat, lon, mine: ['restaurants', 'cafes', 'nature'], partner: ['desserts', 'cafes', 'live-music'] });
    const n = r.json.venues ? r.json.venues.length : 0;
    ok(r.status === 200 && n > 0, 'finds real venues near ' + name,
      n + ' found within ' + (r.json.meta && r.json.meta.radiusKm) + ' km, ' + r.ms + ' ms' + (r.status !== 200 ? ' (HTTP ' + r.status + ': ' + (r.json.error && r.json.error.message) + ')' : ''));
  }
  if (hz.googlePhotos) {
    r = await call('GET', '/api/photos?name=Eiffel%20Tower&lat=48.8584&lon=2.2945&purpose=card&max=1');
    const n = r.json.photos ? r.json.photos.length : 0;
    ok(n > 0, 'Google photos work (test: Eiffel Tower)', n ? 'credited: ' + JSON.stringify((r.json.photos[0].attributions || []).map((a) => a.name)) : 'reason: ' + (r.json.reason || 'unknown') + '. See docs/TROUBLESHOOTING.md');
    if (hz.googleUsage) console.log('     Google usage this month: ' + hz.googleUsage.searchCalls + '/' + hz.googleUsage.searchCap + ' searches, ' + hz.googleUsage.photoCalls + '/' + hz.googleUsage.photoCap + ' photo downloads');
  }
  r = await call('GET', '/api/geo/search?q=Lagos');
  ok(r.status === 200 && r.json.places && r.json.places.length > 0, 'place search works', r.json.places && r.json.places[0] ? r.json.places[0].label + ' -> ' + r.json.places[0].currency : '');
  console.log(failed ? '\n' + failed + ' check(s) failed. Read the notes above, fix, and run it again.' : '\nAll good. Your API is ready.');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.log('FAIL could not reach the server: ' + e.message); process.exit(1); });
