/* Dateventure web: screens, part 2 (results, date preview, trailer, who's the lucky one, invite ready). */
(function (g) {
  var DV = (g.DV = g.DV || {});
  var h = DV.ui.h, icon = DV.ui.icon, S = DV.state, sh = DV.shell;
  var cfg = g.DV_CONFIG || {};
  var cache = { key: null, data: null };

  function baseUrl() { return g.location.href.split('#')[0].split('?')[0]; }
  function inviteLink(token) { return baseUrl() + '#/i/' + token; }
  function statusLink(mt) { return baseUrl() + '#/s/' + mt; }

  function copyText(text) {
    if (g.navigator.clipboard && g.navigator.clipboard.writeText) {
      return g.navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    var ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;opacity:0;top:0' });
    ta.value = text; document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  // A real, credited photo of the venue (if we have one) or a hand-drawn scene. Never a fake photo.
  function media(item, w, hgt, extraPhotos) {
    var photos = (item.photos || []).concat(extraPhotos || []);
    var wrap = h('div', { class: 'media' });
    var art = DV.art.canvas(item.art, w, hgt);
    if (photos.length) {
      var p = photos[0];
      var img = h('img', { src: p.src || p.url, alt: 'Photo of ' + item.name, loading: 'lazy', referrerpolicy: 'no-referrer', decoding: 'async' });
      var credit = h('span', { class: 'credit' }, p.credit || (p.attributions && p.attributions[0] && 'Photo: ' + p.attributions[0].name + ' via Google Maps') || 'Photo');
      img.addEventListener('error', function () { img.replaceWith(art); credit.textContent = 'Illustration, not a photo'; });
      wrap.appendChild(img);
      wrap.appendChild(credit);
    } else {
      wrap.appendChild(art);
      wrap.appendChild(h('span', { class: 'credit' }, 'Illustration, not a photo'));
    }
    return wrap;
  }

  function sourceLabel(it) {
    if (it.kind === 'idea') return 'Idea that works anywhere';
    if (it.source === 'osm') return 'Real place · OpenStreetMap';
    return 'Sample listing for the preview';
  }

  // ---- the plan, as a timeline with little mood pictures --------------------------------------------
  var KIND_ICON = { meet: 'cup', activity: 'spark', food: 'utensils', finale: 'heart' };
  function stepPic(kind, item, idx) {
    var pic = h('div', { class: 'pic' });
    var arts = [item.art, (DV.trailer.ALT[item.art] || 'table'), item.art, (DV.trailer.ALT[DV.trailer.ALT[item.art]] || 'garden')];
    var art = DV.art.canvas(arts[idx % 4], 600, 224, 2 + idx);
    var url = cfg.PHOTOS && cfg.PHOTOS.steps && cfg.PHOTOS.steps[kind];
    if (url) {
      var img = h('img', { src: url, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer', decoding: 'async' });
      img.addEventListener('error', function () { img.replaceWith(art); mood.textContent = 'Illustration'; });
      pic.appendChild(img);
    } else pic.appendChild(art);
    var mood = h('span', { class: 'mood' }, url ? 'Mood photo' : 'Illustration');
    pic.appendChild(mood);
    return pic;
  }
  function timeline(item, plan) {
    var kinds = plan.length === 3 ? ['meet', 'activity', 'finale'] : ['meet', 'activity', 'food', 'finale'];
    return h('ol', { class: 'tl' }, plan.map(function (s, i) {
      var kind = kinds[i] || 'activity';
      var pic = stepPic(kind, item, i);
      pic.appendChild(h('span', { class: 'time' }, s.time));
      pic.appendChild(h('span', { class: 'stepno' }, 'Step ' + (i + 1)));
      return h('li', null, h('span', { class: 'node' }, icon(KIND_ICON[kind] || 'spark', 16)),
        h('div', { class: 'scard' }, pic, h('div', { class: 'sbody' }, h('h4', null, s.title), h('p', null, s.text))));
    }));
  }

  // ---- results ---------------------------------------------------------------------------------------
  function resultsKey(st) {
    return JSON.stringify([st.place && [st.place.lat, st.place.lon], st.currency, st.budget, st.mine, st.partner]);
  }
  function recOpts(st, venues, exclude) {
    var region = DV.engine.regionForPlace(st.place);
    return {
      regionId: region ? region.id : null, currency: st.currency, budget: st.budget, cc: st.place.cc,
      mine: st.mine, partner: st.partner, venues: venues, useSample: !!cfg.SHOW_SAMPLE_VENUES, limit: 6, exclude: exclude || []
    };
  }
  function loadResults(st, skipVenues) {
    var key = resultsKey(st) + (skipVenues ? 'x' : '');
    if (cache.key === key) return Promise.resolve(cache.data);
    var p = skipVenues ? Promise.resolve({ venues: [], meta: { skipped: true } }) : DV.api.discover({ place: st.place, mine: st.mine, partner: st.partner });
    return p.then(function (d) {
      var raw = {};
      d.venues.forEach(function (v) { raw[v.id] = v; });
      cache = { key: key, data: { res: DV.engine.recommend(recOpts(st, d.venues)), raw: raw, venues: d.venues, shown: [], meta: d.meta || {} } };
      return cache.data;
    });
  }

  function loading(st) {
    var a = DV.engine.phrases(st.mine, 1), b = DV.engine.phrases(st.partner, 1);
    return h('div', { class: 'loading', role: 'status' },
      h('div', { class: 'twohearts', 'aria-hidden': 'true' }, icon('heart', 56), icon('heart', 36)),
      h('h2', { class: 't', 'data-focus': true }, 'Blending your tastes…'),
      h('p', { class: 'sub' }, 'Mixing ' + a + ' with ' + b + ' around ' + st.place.name + '.'));
  }

  function results() {
    var st = S.get();
    if (!st.place || !st.mine.length || !st.partner.length) { sh.go('#/plan/1'); return; }
    sh.mount(sh.page({ hero: 'plan' }, loading(st)), 'Finding dates');
    loadResults(st, false).then(function (d) { paintResults(st, d); }, function (err) {
      DV.ui.log('discover failed', err);
      sh.mount(sh.page({ hero: 'plan' },
        h('h2', { class: 't', 'data-focus': true }, 'The venue search is taking a break'),
        h('p', { class: 'sub' }, err && err.message ? err.message : 'Something went wrong.'),
        h('div', { class: 'stack' },
          sh.btn('Try again', { onclick: function () { DV.router.render(); } }),
          sh.btn('Show ideas only', { kind: 'outline', onclick: function () { loadResults(st, true).then(function (d) { paintResults(st, d); }); } }))), 'Search problem');
    });
  }

  function card(it, index) {
    var fit = it.fit === 'free' ? 'Free' : it.fit === 'stretch' ? 'May stretch your budget' : 'Fits your budget';
    var where = [it.area, it.distanceKm !== null && it.distanceKm !== undefined ? it.distanceKm + ' km away' : ''].filter(Boolean).join(' · ');
    var slot = h('div', { class: 'cphoto' });
    if ((it.photos || []).length) slot.appendChild(media(it, 640, 360));
    return h('article', { class: 'dcard', 'data-id': it.id },
      slot,
      h('div', { class: 'dtop' }, h('span', { class: 'num' }, String(index + 1).padStart(2, '0')), h('span', { class: 'pricepill', title: 'An estimate for two people' }, DV.ui.moneyShort(it))),
      h('h3', { class: 'dname' }, it.name),
      where ? h('p', { class: 'where' }, icon('pin', 16), where) : null,
      h('div', { class: 'tagrow' },
        h('span', { class: 'tag rose' }, DV.ui.categoryLabel(it)),
        it.vibe && it.vibe.length ? h('span', { class: 'tag' }, it.vibe.join(', ')) : null,
        h('span', { class: 'tag ' + (it.fit === 'stretch' ? 'warn' : 'good') }, fit),
        it.lopsided ? h('span', { class: 'tag' }, it.lopsided === 'you' ? 'Leans towards you' : 'Leans towards them') : null),
      h('blockquote', { class: 'quote' }, it.why.text),
      h('p', { class: 'costline' }, it.why.cost + ' · ' + sourceLabel(it)),
      sh.btn('Pick this & preview the date', { kind: 'dark', icon: 'eye', onclick: function () { pick(it); } }));
  }

  function pick(it) {
    var raw = cache.data && cache.data.raw[it.id];
    S.set({ selected: it, selectedRaw: raw || null, trailerUsed: false, requestId: null });
    sh.go('#/date');
  }

  function paintResults(st, d) {
    var res = d.res, meta = res.meta;
    var notes = [];
    if (!DV.api.live && !cfg.FORCE_LOCAL) notes.push(sh.notebox('Venue search is off in test mode, so these are ideas that work anywhere. Connect the server to see real places near you.'));
    else if (cfg.FORCE_LOCAL && !meta.hasVenueDirectory) notes.push(sh.notebox('This preview only has sample venues for Abuja. The live site searches real places in any city. Here are ideas that work anywhere.'));
    else if (DV.api.live && res.items.length && meta.venueCount === 0) notes.push(sh.notebox('We could not find matching venues near ' + st.place.name + ' for these picks, so here are ideas that work anywhere. More interests or a bigger budget can help.'));
    if (meta.usedLopsided) notes.push(sh.notebox('Few places suit you both, so we added a couple that lean towards one of you. They are labelled.'));

    var body;
    if (!res.items.length) {
      body = h('div', { class: 'stack' },
        h('h3', { class: 'h3' }, 'Nothing fits yet'),
        h('p', { class: 'sub' }, 'Your budget is a firm limit, and nothing matched both of your picks inside it. Try a bigger budget or add an interest or two.'),
        sh.btn('Change budget', { onclick: function () { sh.go('#/plan/3'); } }), sh.btn('Change interests', { kind: 'outline', onclick: function () { sh.go('#/plan/4'); } }));
    } else {
      body = h('div', { class: 'cards' }, res.items.map(card));
    }
    // Real Google photos on the first few cards, fetched only when a card scrolls into view.
    function lazyCardPhotos() {
      if (!DV.api.live || !g.IntersectionObserver) return;
      var left = 4;
      var io = new g.IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          var it = res.items.filter(function (x) { return x.id === en.target.getAttribute('data-id'); })[0];
          var slot = en.target.querySelector('.cphoto');
          if (!it || !slot || slot.firstChild || it.source !== 'osm' || left <= 0) return;
          left -= 1;
          DV.api.photos(it, 'card', 1).then(function (r) {
            if (r.photos && r.photos.length && slot.isConnected && !slot.firstChild) slot.appendChild(media(it, 640, 360, [r.photos[0]]));
          });
        });
      }, { rootMargin: '150px' });
      [].forEach.call(document.querySelectorAll('.dcard[data-id]'), function (el) { io.observe(el); });
      sh.onLeave(function () { io.disconnect(); });
    }
    var remixBtn = res.items.length ? h('button', { class: 'remix', type: 'button', onclick: function () {
      d.shown = d.shown.concat(res.items.map(function (i) { return i.id; }));
      var next = DV.engine.recommend(recOpts(st, d.venues, d.shown));
      if (next.meta.restarted) { d.shown = []; DV.ui.toast("That was everything. Here are the best matches again."); }
      d.res = next;
      paintResults(st, d);
    } }, icon('refresh', 18), 'Remix') : null;
    var node = sh.page({ hero: 'plan', wide: true },
      h('div', { class: 'rhead' },
        h('div', null, h('p', { class: 'cap' }, st.place.label + ' · ' + DV.currencies.format(st.budget, st.currency)),
          h('h2', { class: 't', 'data-focus': true }, 'Your mixed date ideas')), remixBtn),
      notes, body,
      h('div', { class: 'center' },
        h('button', { class: 'linkbtn', type: 'button', onclick: function () { sh.go('#/plan/1'); } }, 'Edit preferences'), ' · ',
        h('button', { class: 'linkbtn', type: 'button', onclick: function () {
          DV.api.requestCity(st.place.label).then(function () { DV.ui.toast('Thanks. We have noted ' + st.place.name + '.'); }, function () { DV.ui.toast('Could not send that right now.', 'error'); });
        } }, 'Ask us to add ' + st.place.name)));
    sh.mount(node, 'Your dates');
    lazyCardPhotos();
  }

  // ---- date preview ----------------------------------------------------------------------------------
  function mapsLink(it) {
    var q = [it.name, it.address || it.area, S.get().place && S.get().place.name].filter(Boolean).join(', ');
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  }

  function detail() {
    var st = S.get(), it = st.selected;
    if (!it) { sh.go('#/results'); return; }
    var plan = DV.engine.buildPlan(it);
    var gallery = h('div', { class: 'gallery' });
    var attrib = h('p', { class: 'fine' });
    if ((it.photos || []).length) gallery.appendChild(media(it, 720, 400));
    if (it.source === 'osm') {
      DV.api.photos(it, 'detail', 2).then(function (r) {
        if (!r.photos || !r.photos.length || !gallery.isConnected) return;
        gallery.textContent = '';
        r.photos.forEach(function (p) { gallery.appendChild(media(it, 720, 400, [p])); });
        attrib.textContent = 'Photos from Google Maps' + (r.photos[0].attributions && r.photos[0].attributions[0] ? ', by ' + r.photos[0].attributions.map(function (a) { return a.name; }).filter(Boolean).join(', ') : '') + '.';
        if (r.mapsUrl) attrib.appendChild(h('a', { href: r.mapsUrl, target: '_blank', rel: 'noopener' }, ' See it on Google Maps'));
      });
    }
    var notes = [];
    if (it.notes) notes.push(h('li', null, it.notes));
    if (it.hoursText) notes.push(h('li', null, it.hoursText + '.'));
    if (it.bandGuess || it.kind === 'idea' || it.source === 'sample') notes.push(h('li', null, 'The price is an estimate for two people, not a quote.'));
    if (it.kind === 'idea') notes.push(h('li', null, 'This is an idea, not a business. You can do it anywhere you like.'));
    notes.push(h('li', null, 'The pictures on each step are mood images, not photos of this place.'));

    var links = [];
    if (it.kind === 'venue') {
      links.push(h('a', { class: 'btn outline small inline', href: mapsLink(it), target: '_blank', rel: 'noopener' }, icon('pin', 16), 'Open in Google Maps'));
      if (it.osmUrl) links.push(h('a', { class: 'btn outline small inline', href: it.osmUrl, target: '_blank', rel: 'noopener' }, 'View on OpenStreetMap'));
    }
    var embed = null;
    if (cfg.MAPS_EMBED_KEY && it.kind === 'venue') {
      embed = h('iframe', { class: 'mapembed', title: 'Map of ' + it.name, loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade', allowfullscreen: true,
        src: 'https://www.google.com/maps/embed/v1/place?key=' + encodeURIComponent(cfg.MAPS_EMBED_KEY) + '&q=' + encodeURIComponent([it.name, it.address || it.area, st.place && st.place.name].filter(Boolean).join(', ')) });
    }
    sh.mount(sh.page({ hero: 'plan' },
      h('div', null, sh.backBtn('#/results', 'All ideas')),
      h('div', null, h('p', { class: 'cap' }, 'Date preview'), h('h2', { class: 't', 'data-focus': true, style: 'margin-top:4px' }, it.name),
        h('p', { class: 'where', style: 'margin-top:8px' }, icon('pin', 16), DV.ui.whereLine(it) || (st.place && st.place.label))),
      h('div', { class: 'tagrow' }, h('span', { class: 'pricepill' }, icon('wallet', 14), DV.ui.moneyShort(it)),
        h('span', { class: 'tag rose' }, DV.ui.categoryLabel(it)), (it.vibe || []).length ? h('span', { class: 'tag' }, it.vibe.join(', ')) : null,
        h('span', { class: 'tag' }, sourceLabel(it))),
      gallery, attrib,
      h('blockquote', { class: 'quote' }, it.why.text), h('p', { class: 'costline' }, it.why.cost),
      timeline(it, plan),
      h('div', null, h('h3', { class: 'h3', style: 'margin-bottom:8px' }, 'Good to know'), h('ul', { class: 'notes' }, notes)),
      links.length ? h('div', { class: 'row' }, links) : null, embed,
      h('section', { class: 'darkcard' },
        h('h3', { class: 't' }, 'Love how this looks?'),
        h('p', null, 'Would you like to share this date preview with someone?'),
        h('button', { class: 'linkbtn', type: 'button', onclick: function () { sh.go('#/trailer'); } }, icon('play', 14), 'Watch the 15-second preview first'),
        h('div', { class: 'row' }, sh.btn('Yes, share it', { onclick: function () { sh.go('#/invite'); } }), sh.btn('Not yet', { kind: 'onDark', onclick: function () { sh.go('#/results'); } })))), it.name);
  }

  // ---- trailer ---------------------------------------------------------------------------------------
  function trailerPlayer(item, plan, names, opts) {
    opts = opts || {};
    var canvas = h('canvas', { class: 'phone-canvas', role: 'img', 'aria-label': 'A 15 second animated preview of the date. Illustrated, not real footage.' });
    var spec = DV.trailer.specFor(item, plan, names);
    var ctrl = DV.trailer.create(canvas, spec);
    var time = h('span', { class: 'ttime' }, '0:00 / 0:15');
    var playBtn = h('button', { class: 'iconbtn big', type: 'button', 'aria-label': 'Play preview' }, icon('play', 20));
    var muteBtn = h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Turn sound on', 'aria-pressed': 'false' }, icon('mute', 20));
    var seekBar = h('input', { type: 'range', class: 'slider', min: 0, max: 150, value: 0, 'aria-label': 'Preview position' });
    playBtn.addEventListener('click', function () {
      if (ctrl.isPlaying()) ctrl.pause(); else { ctrl.play(); if (opts.onPlay) opts.onPlay(); }
    });
    muteBtn.addEventListener('click', function () {
      ctrl.setMuted(!ctrl.isMuted());
      muteBtn.setAttribute('aria-pressed', ctrl.isMuted() ? 'false' : 'true');
      muteBtn.setAttribute('aria-label', ctrl.isMuted() ? 'Turn sound on' : 'Turn sound off');
      muteBtn.textContent = ''; muteBtn.appendChild(icon(ctrl.isMuted() ? 'mute' : 'sound', 20));
    });
    seekBar.addEventListener('input', function () { ctrl.seek(Number(seekBar.value) / 10); });
    ctrl.on('time', function (t) { seekBar.value = Math.round(t * 10); time.textContent = '0:' + String(Math.floor(t)).padStart(2, '0') + ' / 0:15'; });
    ctrl.on('state', function (p) { playBtn.textContent = ''; playBtn.appendChild(icon(p ? 'pause' : 'play', 20)); playBtn.setAttribute('aria-label', p ? 'Pause preview' : 'Play preview'); });
    if (g.document.fonts && g.document.fonts.ready) g.document.fonts.ready.then(function () { ctrl.seek(1.6); });
    else ctrl.seek(1.6);
    sh.onLeave(function () { ctrl.destroy(); });
    var el = h('div', { class: 'phone' }, h('div', { class: 'phone-screen' }, canvas),
      h('div', { class: 'controls' }, playBtn, seekBar, time, muteBtn));
    return { el: el, ctrl: ctrl, canvas: canvas };
  }

  function trailerScreen() {
    var st = S.get(), it = st.selected;
    if (!it) { sh.go('#/results'); return; }
    var plan = DV.engine.buildPlan(it);
    var player = trailerPlayer(it, plan, { planner: st.name }, { onPlay: function () { S.set({ trailerUsed: true }); } });
    var saveBtn = sh.btn('Save as video', { kind: 'outline', icon: 'download', onclick: function () {
      DV.ui.busy(saveBtn, function () {
        DV.ui.toast('Recording the 15 seconds now. Keep this page open.');
        saveBtn.textContent = 'Recording…';
        return player.ctrl.record().then(function (blob) {
          S.set({ trailerUsed: true });
          DV.card.download(blob, 'dateventure-preview.' + (/mp4/.test(blob.type) ? 'mp4' : 'webm'));
          DV.ui.toast('Saved. The video has no sound; add music in TikTok.');
        }, function (e) { DV.ui.toast(e.message, 'error'); });
      });
    } });
    sh.mount(sh.page({ hero: 'plan' },
      h('div', null, sh.backBtn('#/date', 'Back to preview')),
      h('div', null, h('p', { class: 'cap' }, 'Preview'), h('h2', { class: 't', 'data-focus': true, style: 'margin-top:4px' }, 'Your 15-second preview'),
        h('p', { class: 'sub' }, 'An animated, illustrated trailer of ' + it.name + '. It is not real footage of the place, and it says so on screen.')),
      player.el,
      h('div', { class: 'stack' },
        sh.btn('Continue to share', { after: 'arrow', onclick: function () { sh.go('#/invite'); } }),
        saveBtn,
        h('button', { class: 'linkbtn', type: 'button', style: 'align-self:center', onclick: function () { S.set({ trailerUsed: false }); sh.go('#/invite'); } }, 'Skip the preview'))), 'Preview');
  }

  // ---- who's the lucky one ---------------------------------------------------------------------------
  function newRequestId() { return 'r' + DV.util.randomToken(12); }

  function inviteForm() {
    var st = S.get(), it = st.selected;
    if (!it) { sh.go('#/results'); return; }
    var nameIn = h('input', { class: 'input', id: 'rname', type: 'text', maxlength: 40, autocomplete: 'off', placeholder: 'e.g. Jordan' });
    var dayIn = h('input', { class: 'input', id: 'rday', type: 'date' });
    var msgIn = h('textarea', { class: 'input', id: 'rmsg', rows: 3, maxlength: 160, placeholder: 'e.g. Wear comfy shoes. I have a surprise.' });
    var count = h('span', { class: 'fine' }, '0 / 160');
    msgIn.addEventListener('input', function () { count.textContent = msgIn.value.length + ' / 160'; });
    dayIn.setAttribute('min', new Date().toISOString().slice(0, 10));
    // One id per time the form is opened. If the same form is sent twice (double tap, slow network
    // retry), the server returns the same invitation instead of making a second one.
    S.set({ requestId: newRequestId() });
    var send = sh.btn('Share', { icon: 'share', onclick: submit });
    nameIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    function submit() {
      var rn = DV.util.clean(nameIn.value, 40);
      if (!rn) { DV.ui.toast('Add the name of the person you are inviting.', 'error'); nameIn.focus(); return; }
      var payload = {
        plannerName: st.name || 'Someone', recipientName: rn, regionId: (st.place && st.place.regionId) || undefined, cc: st.place && st.place.cc,
        budget: { amount: st.budget, currency: st.currency }, message: msgIn.value, proposedDate: dayIn.value || '',
        trailerUsed: !!S.get().trailerUsed, clientRequestId: S.get().requestId
      };
      if (it.source === 'osm') { payload.item = S.get().selectedRaw; payload.itemSig = S.get().selectedRaw && S.get().selectedRaw.sig; }
      else payload.itemId = it.id;
      DV.ui.busy(send, function () {
        return DV.api.createInvite(payload).then(function (r) {
          DV.book.add({ manageToken: r.manageToken, token: r.token, recipientName: rn, itemName: it.name, createdAt: new Date().toISOString() });
          sh.go('#/sent/' + r.manageToken);
          return 'keep';
        }, function (e) { DV.ui.toast(e.message || 'Could not create the invitation.', 'error'); });
      });
    }
    sh.mount(sh.page({ hero: 'plan' },
      h('div', null, sh.backBtn('#/date', 'Back to preview')),
      h('div', null, h('h2', { class: 't', 'data-focus': true }, "Who's the lucky one?"), h('p', { class: 'sub' }, "We'll personalise the invite for them. They do not need an account.")),
      h('div', { class: 'miniplan' }, media(it, 360, 220), h('div', null, h('b', null, it.name), h('p', { class: 'fine' }, DV.ui.moneyShort(it)))),
      h('div', { class: 'field' }, h('label', { for: 'rname' }, 'Their name'), nameIn),
      h('details', { class: 'more' }, h('summary', null, 'Add a day or a note (optional)'),
        h('div', { class: 'field' }, h('label', { for: 'rday' }, 'Which day?'), dayIn),
        h('div', { class: 'field' }, h('label', { for: 'rmsg' }, 'A little note'), msgIn, count)),
      send), 'Invitation');
  }

  // ---- invite ready ----------------------------------------------------------------------------------
  function sent(mt) {
    var entry = DV.book.list().filter(function (e) { return e.manageToken === mt; })[0];
    var p = entry ? Promise.resolve({ token: entry.token, recipientName: entry.recipientName }) :
      DV.api.getManage(mt).then(function (r) { return { token: r.invite.token, recipientName: r.invite.recipientName }; });
    sh.mount(sh.page({ hero: 'plan' }, h('div', { class: 'loading' }, h('h2', { class: 't', 'data-focus': true }, 'One moment…'))), 'Invitation');
    p.then(function (info) {
      var link = inviteLink(info.token), stat = statusLink(mt);
      var field = h('input', { class: 'mono', readonly: true, value: link, 'aria-label': 'Invitation link', onfocus: function (e) { e.target.select(); } });
      var copyBtn = sh.btn('Copy', { icon: 'copy', onclick: function () { copyText(link).then(function (ok) { DV.ui.toast(ok ? 'Link copied. Paste it into your chat.' : 'Press and hold the link to copy it.', ok ? '' : 'error'); }); } });
      var shareBtn = g.navigator.share ? sh.btn('Send via apps', { kind: 'outline', icon: 'share', onclick: function () {
        g.navigator.share({ title: 'A date for you', text: (S.get().name || 'Someone') + ' planned a date for you. Take a look:', url: link }).catch(function () {});
      } }) : null;
      sh.mount(sh.page({ hero: 'plan' },
        h('div', { class: 'heartbadge', 'aria-hidden': 'true' }, icon('heart', 30)),
        h('div', null, h('h2', { class: 't', 'data-focus': true }, 'Your invite for ' + info.recipientName + ' is ready'),
          h('p', { class: 'sub' }, 'Send this link. It opens straight to the date preview where they can accept or decline. Nothing has been sent or opened yet.')),
        h('div', { class: 'copybox' }, field, copyBtn), shareBtn,
        h('div', { class: 'infobox' }, 'Keep an eye on their answer: ', h('a', { href: stat }, 'track RSVP status'),
          h('div', { style: 'margin-top:6px' }, h('button', { class: 'linkbtn', type: 'button', style: 'color:#9F1239', onclick: function () { copyText(stat).then(function () { DV.ui.toast('Status link copied.'); }); } }, 'Copy my private status link'))),
        h('a', { class: 'btn outline', href: link }, 'Preview it as ' + info.recipientName),
        h('div', { class: 'center' }, h('button', { class: 'linkbtn', type: 'button', onclick: function () { S.reset(); sh.go('#/plan/1'); } }, 'Plan another date'))), 'Invite ready');
    }, function () { DV.router.notFound(); });
  }

  Object.assign(DV.screens, { results: results, detail: detail, trailer: trailerScreen, inviteForm: inviteForm, sent: sent });
  DV.helpers = { media: media, timeline: timeline, trailerPlayer: trailerPlayer, copyText: copyText, inviteLink: inviteLink, statusLink: statusLink, baseUrl: baseUrl };
})(typeof window !== 'undefined' ? window : globalThis);
