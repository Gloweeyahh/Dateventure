/* Dateventure web: screens, part 1 (shell with the cinematic hero, and the five planning steps). */
(function (g) {
  var DV = (g.DV = g.DV || {});
  var h = DV.ui.h, icon = DV.ui.icon, S = DV.state;
  var cfg = g.DV_CONFIG || {};
  var cleanups = [];

  function onLeave(fn) { cleanups.push(fn); }
  function runCleanups() { while (cleanups.length) { try { cleanups.pop()(); } catch (e) { /* ignore */ } } }
  function reduceMotion() { return g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  // Called once when the route changes. Cleanups registered while a screen is being built
  // (timers, trailer players) must survive until we LEAVE that screen, not be run by mount().
  function beginRoute() { runCleanups(); }

  function mount(node, title) {
    var app = document.getElementById('app');
    app.textContent = '';
    app.appendChild(node);
    document.title = title ? title + ' · Dateventure' : 'Dateventure';
    g.scrollTo(0, 0);
    var focus = app.querySelector('[data-focus]');
    if (focus) { focus.setAttribute('tabindex', '-1'); try { focus.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }

  function go(hash) { if (g.location.hash === hash) DV.router.render(); else g.location.hash = hash; }

  // ---- hero ------------------------------------------------------------------------------------------
  function heroBackground() {
    var cv = DV.art.canvas('skyline', 720, 420, 3);
    cv.className = 'hero-bg';
    cv.setAttribute('aria-hidden', 'true'); cv.removeAttribute('role'); cv.removeAttribute('aria-label');
    var parts = [cv];
    var url = cfg.PHOTOS && cfg.PHOTOS.hero;
    if (url) {
      var img = h('img', { class: 'hero-photo', alt: '', referrerpolicy: 'no-referrer', decoding: 'async' });
      img.addEventListener('error', function () { img.remove(); });
      img.src = url;
      parts.push(img);
    }
    return parts;
  }

  function modeNote() {
    if (cfg.FORCE_LOCAL) return h('p', { class: 'hero-note' }, 'Preview: invitations stay in this browser, and venues are a small Abuja sample plus ideas for anywhere. The live site searches real places worldwide.');
    if (!DV.api.live) return h('p', { class: 'hero-note' }, 'Test mode: not connected to the server yet. Invitation links only work on this device and venue search is off. Add your server address in config.js.');
    return null;
  }

  function hero(kind, o) {
    o = o || {};
    var mine = DV.book.list();
    var top = h('div', { class: 'hero-top' },
      h('button', { class: 'brand', type: 'button', 'aria-label': 'Dateventure home', onclick: function () { go('#/'); } }, icon('heart', 16), 'Dateventure'),
      mine.length && !o.hideMine ? h('a', { class: 'toplink', href: '#/mine' }, 'My invitations') : null);
    var body;
    if (kind === 'invite') {
      body = [h('span', { class: 'invite-badge' }, icon('mail', 14), 'An invitation for ' + o.recipient),
        h('h1', { 'data-focus': true, style: 'margin-top:14px' }, o.planner + ' planned a date ', h('em', null, 'just for you.'))];
    } else {
      body = [h('p', { class: 'eyebrow' }, 'Two tastes · one perfect date'),
        h('h1', null, 'Mix what you love ', h('em', null, 'with what they love.')),
        h('p', { class: 'lead' }, "Tell us a little, we'll blend it into a date you can preview, share, and get a yes to.")];
    }
    return h('header', { class: 'hero' + (kind === 'invite' ? ' dim' : '') }, heroBackground(), h('div', { class: 'hero-scrim' }),
      h('div', { class: 'hero-in' }, top, body, modeNote()));
  }

  function footer() {
    return h('footer', { class: 'footer' }, 'Venue data ',
      h('a', { href: 'https://www.openstreetmap.org/copyright', target: '_blank', rel: 'noopener' }, '© OpenStreetMap contributors'),
      '. Prices are estimates.');
  }

  // page({hero:'plan'|'invite', recipient, planner, wide}, ...sheet content)
  function page(o) {
    var kids = [].slice.call(arguments, 1);
    return h('div', { class: 'stage' },
      hero(o.hero || 'plan', o),
      h('main', { class: 'wrap' + (o.wide ? ' wide' : '') }, h('div', { class: 'sheet' }, kids), footer()));
  }

  function btn(label, o) {
    o = o || {};
    return h('button', { class: 'btn ' + (o.kind || '') + (o.small ? ' small' : ''), type: 'button', disabled: o.disabled, onclick: o.onclick, 'aria-label': o.aria },
      o.icon ? icon(o.icon, 18) : null, label, o.after ? icon(o.after, 18) : null);
  }
  function backBtn(hash, label) {
    return h('button', { class: 'linkbtn', type: 'button', onclick: function () { go(hash); } }, icon('arrowleft', 16), label || 'Back');
  }
  function stepHead(step, back) {
    return [
      h('div', { class: 'stephead' }, h('span', null, 'Step ' + step + ' of 5'), back ? backBtn(back) : null),
      h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 5, 'aria-valuenow': step, 'aria-label': 'Step ' + step + ' of 5' }, h('i', { style: 'width:' + step * 20 + '%' }))
    ];
  }
  function chip(label, o) {
    o = o || {};
    var b = h('button', { class: 'chip', type: 'button', 'aria-pressed': o.on ? 'true' : 'false', onclick: function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      o.onToggle(on);
    } }, icon('check', 15), label);
    return b;
  }
  function notebox(text) { return h('div', { class: 'notebox' }, text); }

  // ---- step 1: name (this is also the first screen) --------------------------------------------------
  function step1(o) {
    o = o || {};
    var input = h('input', { class: 'input', id: 'name', type: 'text', maxlength: 40, autocomplete: 'given-name', placeholder: 'e.g. Alex', value: S.get().name || '' });
    function next() {
      var v = DV.util.clean(input.value, 40);
      if (!v) { DV.ui.toast('Please tell us your name first.', 'error'); input.focus(); return; }
      S.set({ name: v }); go('#/plan/2');
    }
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') next(); });
    mount(page({ hero: 'plan' }, stepHead(1, null),
      h('div', null, h('h2', { class: 't', 'data-focus': !o.landing }, "First up, who's planning?"), h('p', { class: 'sub' }, 'Your name goes on the invite.')),
      h('div', { class: 'field' }, h('label', { for: 'name' }, 'Your name'), input),
      btn('Continue', { after: 'arrow', onclick: next })), o.landing ? '' : 'Your name');
    if (o.landing) DV.api.warm();
  }

  // ---- step 2: place + currency ----------------------------------------------------------------------
  function step2() {
    var input = h('input', { class: 'input', id: 'place', type: 'text', maxlength: 80, autocomplete: 'off', placeholder: 'e.g. Shoreditch, London', 'aria-describedby': 'place-hint' });
    var list = h('ul', { class: 'suggest', role: 'listbox', hidden: true });
    var chosen = h('div', null);
    var money = h('div', { class: 'moneyrow' });
    var cont = btn('Continue', { after: 'arrow', onclick: next, disabled: !S.get().place });
    var timer, seq = 0;

    function paintChosen() {
      var p = S.get().place;
      chosen.textContent = ''; money.textContent = '';
      cont.disabled = !p;
      if (!p) return;
      chosen.appendChild(h('div', { class: 'placechip' }, icon('pin', 16), h('span', null, p.label)));
      var sel = h('select', { class: 'select', id: 'currency', 'aria-label': 'Currency' }, DV.currencies.list().map(function (c) {
        return h('option', { value: c.code, selected: c.code === S.get().currency }, c.code + '  ' + c.symbol.trim() + '  ' + c.name);
      }));
      sel.addEventListener('change', function () { changeCurrency(sel.value); });
      money.appendChild(h('label', { class: 'lbl', for: 'currency' }, 'Prices in'));
      money.appendChild(sel);
      money.appendChild(h('p', { class: 'fine' }, 'Chosen from the country (' + (p.cc || '?') + '). Change it if you spend in something else.'));
    }
    function changeCurrency(code) {
      S.set({ currency: code, budget: DV.currencies.budgetScale(code).def });
      paintChosen();
    }
    function choose(p) {
      var scale = DV.currencies.budgetScale(p.currency);
      var keep = S.get().currency === p.currency && S.get().budget;
      S.set({ place: p, currency: p.currency, budget: keep ? S.get().budget : scale.def });
      input.value = ''; list.hidden = true; list.textContent = '';
      paintChosen();
      cont.focus();
    }
    function showSuggestions(places, q) {
      list.textContent = '';
      if (!places.length) list.appendChild(h('li', { class: 'empty' }, 'No match for "' + q + '". Try the nearest big city.'));
      places.forEach(function (p) {
        list.appendChild(h('li', { role: 'option' }, h('button', { type: 'button', class: 'suggest-btn', onclick: function () { choose(p); } },
          icon('pin', 16), h('span', null, p.label), h('small', null, p.currency))));
      });
      list.hidden = false;
    }
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = DV.util.clean(input.value, 80);
      if (q.length < 2) { list.hidden = true; return; }
      var my = ++seq;
      timer = setTimeout(function () {
        DV.api.geoSearch(q).then(function (places) { if (my === seq) showSuggestions(places, q); });
      }, 300);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var first = list.querySelector('.suggest-btn'); if (first) first.click(); }
    });
    var locBtn = btn('Use my current location', { kind: 'soft', icon: 'locate', onclick: function () {
      if (!g.navigator.geolocation) { DV.ui.toast('Your browser cannot share its location. Type your city instead.', 'error'); return; }
      DV.ui.busy(locBtn, function () {
        return new Promise(function (resolve) {
          g.navigator.geolocation.getCurrentPosition(function (pos) {
            DV.api.geoReverse(pos.coords.latitude, pos.coords.longitude).then(function (p) {
              if (p) choose(p); else DV.ui.toast('We could not name that spot. Type your city instead.', 'error');
            }).catch(function () { DV.ui.toast('We could not look up your location. Type your city instead.', 'error'); }).then(resolve);
          }, function () { DV.ui.toast('No problem. Just type your city or neighbourhood.', 'error'); resolve(); }, { timeout: 12000, maximumAge: 600000 });
        });
      });
    } });
    function next() {
      if (!S.get().place) { DV.ui.toast('Choose a place from the list first.', 'error'); return; }
      go('#/plan/3');
    }
    paintChosen();
    mount(page({ hero: 'plan' }, stepHead(2, '#/plan/1'),
      h('div', null, h('h2', { class: 't', 'data-focus': true }, S.get().name ? "Where's the date, " + S.get().name + '?' : "Where's the date?"),
        h('p', { class: 'sub', id: 'place-hint' }, 'Use your location or type any city or neighbourhood in the world.')),
      locBtn,
      h('div', { class: 'field' }, h('label', { for: 'place' }, 'City or neighbourhood'), h('div', { class: 'iwrap' }, icon('pin', 18), input), list),
      chosen, money, cont), 'Place');
  }

  // ---- step 3: budget --------------------------------------------------------------------------------
  function step3() {
    var st = S.get();
    if (!st.place) { go('#/plan/2'); return; }
    var cur = st.currency || 'USD';
    var info = DV.currencies.info(cur);
    var scale = DV.currencies.budgetScale(cur);
    var region = DV.engine.regionForPlace(st.place);
    var value = st.budget === null || st.budget === undefined ? scale.def : st.budget;
    var sym = info.symbol.trim() || cur;
    var C = DV.currencies, U = DV.util;

    function band(b) { return DV.engine.rangeFor({ kind: 'idea', band: b }, cur, region, st.place.cc); }
    var low = band('low'), mod = band('moderate'), pre = band('premium');
    var tiers = [
      { sign: sym, title: 'Sweet & Simple', sub: 'Under ~' + C.format(low.hi, cur) + ' for two', amount: Math.round(low.hi) },
      { sign: sym + sym, title: 'Sweet Spot', sub: '~' + C.format(mod.lo, cur) + '–' + U.groupThousands(mod.hi) + ' for two', amount: Math.round(mod.hi) },
      { sign: sym + sym + sym, title: 'Special Splurge', sub: C.format(pre.lo, cur) + '+ for two', amount: Math.round(pre.hi) }
    ];

    var num = h('input', { class: 'input amount', id: 'amount', type: 'text', inputmode: 'numeric', autocomplete: 'off', value: String(Math.round(value)), 'aria-describedby': 'amount-help' });
    var echo = h('p', { class: 'fine', id: 'amount-help' });
    var cont = btn('Continue', { after: 'arrow', onclick: next });
    var optEls = [];

    function parse(txt) { var n = Number(String(txt).replace(/[^0-9.]/g, '')); return isFinite(n) ? n : NaN; }
    function paint() {
      var v = parse(num.value);
      echo.textContent = isNaN(v) ? 'Type a number, for example ' + C.format(scale.def, cur) + '.'
        : v === 0 ? 'We will only suggest free ideas.' : 'Up to ' + C.format(v, cur) + ' for the two of you. We will not suggest anything above it.';
      cont.disabled = isNaN(v) || v < 0 || v > 1e9;
      optEls.forEach(function (el, i) { el.setAttribute('aria-pressed', !isNaN(v) && v === tiers[i].amount ? 'true' : 'false'); });
    }
    num.addEventListener('input', paint);
    num.addEventListener('keydown', function (e) { if (e.key === 'Enter') next(); });
    tiers.forEach(function (t) {
      var el = h('button', { class: 'opt', type: 'button', onclick: function () { num.value = String(t.amount); paint(); } },
        h('div', { class: 'ico', 'aria-hidden': 'true' }, t.sign), h('div', null, h('b', null, t.title), h('span', null, t.sub)));
      optEls.push(el);
    });
    function next() {
      var v = parse(num.value);
      if (isNaN(v) || v < 0) { DV.ui.toast('Please enter a budget, even if it is 0.', 'error'); return; }
      S.set({ budget: v }); go('#/plan/4');
    }
    paint();
    mount(page({ hero: 'plan' }, stepHead(3, '#/plan/2'),
      h('div', null, h('h2', { class: 't', 'data-focus': true }, "What's the budget?"), h('p', { class: 'sub' }, 'Total for the two of you. Pick a tier or type your own amount.')),
      h('div', { class: 'opts' }, optEls),
      h('div', { class: 'field' }, h('label', { for: 'amount' }, 'Or type your exact amount (' + cur + ')'),
        h('div', { class: 'iwrap' }, h('span', { class: 'prefix', 'aria-hidden': 'true' }, sym), num), echo),
      h('p', { class: 'fine' }, 'Prices in ' + info.name + '. Tiers are rough guides for ' + (region ? region.name : 'your area') + ', not quotes. ',
        h('button', { class: 'linkbtn', type: 'button', style: 'font-size:13px;color:#BE123C', onclick: function () { go('#/plan/2'); } }, 'Change currency'),
        ' · ', h('button', { class: 'linkbtn', type: 'button', style: 'font-size:13px;color:#BE123C', onclick: function () { num.value = '0'; paint(); } }, 'Free ideas only')),
      cont), 'Budget');
  }

  // ---- steps 4 and 5: interests ----------------------------------------------------------------------
  function interestsStep(who) {
    var key = who === 'me' ? 'mine' : 'partner';
    var sel = (S.get()[key] || []).slice();
    var cont = who === 'me' ? btn('', { after: 'arrow', onclick: next }) : btn('Mix our date ideas', { kind: 'grad', icon: 'spark', onclick: next });
    function paintBtn() {
      cont.disabled = !sel.length;
      if (who === 'me') { cont.textContent = ''; cont.appendChild(document.createTextNode(sel.length ? 'Continue · ' + sel.length + ' picked' : 'Pick at least one')); cont.appendChild(icon('arrow', 18)); }
    }
    function toggle(id, on) {
      var i = sel.indexOf(id);
      if (on && i === -1) sel.push(id);
      if (!on && i !== -1) sel.splice(i, 1);
      var o = {}; o[key] = sel.slice(); S.set(o);
      paintBtn();
    }
    var chips = h('div', { class: 'chips' }, DV.interests.list.map(function (i) {
      return chip(i.label, { on: sel.indexOf(i.id) !== -1, onToggle: function (on) { toggle(i.id, on); } });
    }));
    var own = h('input', { class: 'input', type: 'text', maxlength: 40, placeholder: 'Add your own…', 'aria-label': 'Add your own interest' });
    var ownBtn = btn('Add', { kind: 'outline', icon: 'plus', onclick: addOwn });
    function addOwn() {
      var v = DV.util.clean(own.value, 40);
      if (!v) return;
      var id = DV.interests.matchCustom(v);
      if (!id) { DV.ui.toast('We do not have "' + v + '" yet. Try a word like music, coffee, walks or games.', 'error'); return; }
      if (sel.indexOf(id) === -1) toggle(id, true);
      own.value = '';
      DV.router.render();
    }
    own.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addOwn(); } });
    function next() {
      if (!sel.length) return;
      go(who === 'me' ? '#/plan/5' : '#/results');
    }
    paintBtn();
    var title = who === 'me' ? [h('span', null, 'Things '), h('em', null, 'you'), h('span', null, ' love')] : [h('span', null, 'Things '), h('em', null, 'your partner'), h('span', null, ' loves')];
    var sub = who === 'me' ? 'Pick as many as you like.' : "We'll find where your worlds overlap. Think about what they would pick, not what you would.";
    mount(page({ hero: 'plan' }, stepHead(who === 'me' ? 4 : 5, who === 'me' ? '#/plan/3' : '#/plan/4'),
      h('div', null, h('h2', { class: 't', 'data-focus': true }, title), h('p', { class: 'sub' }, sub)),
      chips, h('div', { class: 'own' }, own, ownBtn), cont), who === 'me' ? 'Your loves' : 'Their loves');
  }

  DV.screens = DV.screens || {};
  Object.assign(DV.screens, {
    landing: function () { step1({ landing: true }); }, step1: step1, step2: step2, step3: step3,
    step4: function () { interestsStep('me'); }, step5: function () { interestsStep('partner'); }
  });
  DV.shell = { beginRoute: beginRoute, mount: mount, go: go, page: page, btn: btn, backBtn: backBtn, notebox: notebox, onLeave: onLeave, chip: chip, reduceMotion: reduceMotion, stepHead: stepHead };
})(typeof window !== 'undefined' ? window : globalThis);
