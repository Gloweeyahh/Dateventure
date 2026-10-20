/* Dateventure web: screens, part 3 (the invitation the partner opens, planner status, router). */
(function (g) {
  var DV = (g.DV = g.DV || {});
  var h = DV.ui.h, icon = DV.ui.icon, S = DV.state, sh = DV.shell, H = function () { return DV.helpers; };

  function statusText(inv) {
    if (inv.status === 'accepted') return { label: 'Accepted', note: inv.recipientName + ' said yes!', cls: 'ok' };
    if (inv.status === 'declined') return { label: 'Not this time', note: inv.recipientName + ' said not this time. That is okay.', cls: 'soft' };
    if (inv.status === 'opened') return { label: 'Opened', note: inv.recipientName + ' has opened it and has not answered yet.', cls: 'warn' };
    return { label: 'Waiting', note: 'Not opened yet.', cls: 'warn' };
  }

  function burst() {
    if (sh.reduceMotion()) return;
    var host = h('div', { class: 'burst-host', 'aria-hidden': 'true' });
    for (var i = 0; i < 16; i++) {
      host.appendChild(h('span', { class: 'burst', style: 'left:' + Math.round(Math.random() * 100) + '%;animation-delay:' + (Math.random() * 0.6).toFixed(2) + 's' }, icon('heart', 14 + Math.round(Math.random() * 16))));
    }
    document.body.appendChild(host);
    setTimeout(function () { host.remove(); }, 3200);
  }

  function acceptedCard(inv, viewer) {
    var canvas = DV.card.render({ plannerName: inv.plannerName, recipientName: inv.recipientName, item: inv.item, proposedDate: inv.proposedDate, plan: inv.plan });
    canvas.className = 'card-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Acceptance card: ' + inv.recipientName + ' and ' + inv.plannerName + ' have a date at ' + inv.item.name);
    var dlBtn = sh.btn('Download', { kind: 'outline', icon: 'download', onclick: function () {
      DV.card.toBlob(canvas).then(function (b) { DV.card.download(b, 'its-a-date.png'); });
    } });
    var shBtn = sh.btn(viewer === 'recipient' ? 'Send to ' + inv.plannerName : 'Share', { icon: 'share', onclick: function () {
      DV.card.toBlob(canvas).then(function (b) { return DV.card.share(b, 'its-a-date.png', "It's a date!"); }).then(function (r) {
        if (r === 'downloaded') DV.ui.toast('Saved to your device. Share it from there.');
      }, function () { /* cancelled */ });
    } });
    return h('div', { class: 'cardbox' }, canvas, h('div', { class: 'row' }, dlBtn, shBtn));
  }

  function dateBlock(inv) {
    var it = inv.item;
    var when = inv.proposedDate ? DV.ui.fmtDate(inv.proposedDate) + (inv.plan && inv.plan[0] ? ' at ' + inv.plan[0].time : '') : '';
    var est = inv.est.hi === 0 ? 'Free or close to it' : DV.currencies.format(inv.est.lo, inv.est.currency) + '–' + DV.util.groupThousands(inv.est.hi) + ' for two';
    var slot = h('div', { class: 'trailer-slot' });
    if (inv.trailerUsed) {
      slot.appendChild(sh.btn('Watch the preview', { icon: 'play', kind: 'outline', onclick: function () {
        slot.textContent = '';
        var pl = H().trailerPlayer(it, inv.plan, { planner: inv.plannerName, recipient: inv.recipientName });
        slot.appendChild(pl.el);
        pl.ctrl.play();
      } }));
    }
    var gallery = h('div', { class: 'gallery' }), attrib = h('p', { class: 'fine' });
    if ((it.photos || []).length) gallery.appendChild(H().media(it, 720, 400));
    if (it.source === 'osm') {
      DV.api.photos(it, 'invite', 2).then(function (r) {
        if (!r.photos || !r.photos.length || !gallery.isConnected) return;
        gallery.textContent = '';
        r.photos.forEach(function (p) { gallery.appendChild(H().media(it, 720, 400, [p])); });
        attrib.textContent = 'Photos from Google Maps' + (r.photos[0].attributions && r.photos[0].attributions[0] ? ', by ' + r.photos[0].attributions.map(function (a) { return a.name; }).filter(Boolean).join(', ') : '') + '.';
      });
    }
    var notes = [];
    if (it.hoursText) notes.push(h('li', null, it.hoursText + '.'));
    notes.push(h('li', null, 'Prices are estimates. Check opening times before you go.'));
    notes.push(h('li', null, 'The pictures on each step are mood images, not photos of this place.'));
    return h('div', { class: 'stack', style: 'gap:16px' },
      h('div', null, h('p', { class: 'cap' }, 'The plan'), h('h2', { class: 't', style: 'margin-top:4px' }, it.name),
        h('p', { class: 'where', style: 'margin-top:8px' }, icon('pin', 16), DV.ui.whereLine(it) || 'Wherever you like')),
      h('div', { class: 'tagrow' }, h('span', { class: 'pricepill' }, icon('wallet', 14), est), when ? h('span', { class: 'tag good' }, icon('cal', 13), '\u00a0' + when) : null,
        h('span', { class: 'tag rose' }, DV.ui.categoryLabel(it))),
      inv.message ? h('blockquote', { class: 'quote note' }, inv.message, h('footer', null, '— ' + inv.plannerName)) : null,
      gallery, attrib,
      slot, H().timeline(it, inv.plan),
      h('ul', { class: 'notes' }, notes),
      it.kind === 'venue' ? h('a', { class: 'btn outline small inline', style: 'align-self:flex-start', href: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([it.name, it.address || it.area].filter(Boolean).join(', ')), target: '_blank', rel: 'noopener' }, icon('pin', 16), 'Open in Google Maps') : null);
  }

  function inviteScreen(token) {
    sh.mount(sh.page({ hero: 'plan' }, h('div', { class: 'loading' }, h('h2', { class: 't', 'data-focus': true }, 'Opening your invitation…'))), 'Invitation');
    DV.api.getInvite(token).then(function (r) { paintInvite(token, r.invite, true); }, function (e) {
      if (e.status === 404 || e.code === 'not_found') DV.router.notFound();
      else errorPage(e, function () { DV.router.render(); });
    });
  }

  function paintInvite(token, inv, first) {
    var seenKey = 'dv.seen.' + token, seen = false;
    try { seen = !!g.sessionStorage.getItem(seenKey); } catch (e) { /* ignore */ }
    var waiting = inv.status === 'ready' || inv.status === 'opened';
    var needsEnvelope = first && waiting && !seen && !sh.reduceMotion();

    function respond(kind, btn) {
      DV.ui.busy(btn, function () {
        return DV.api.respond(token, kind).then(function (r) {
          if (r.conflict) DV.ui.toast('You already said yes, so this date is on!');
          if (kind === 'accept' && r.invite.status === 'accepted') burst();
          paintInvite(token, r.invite, false);
        }, function (e) { DV.ui.toast(e.message || 'Could not save your answer. Please try again.', 'error'); });
      });
    }

    var body = [];
    if (inv.status === 'accepted') {
      body.push(h('div', null, h('p', { class: 'cap green' }, 'You said yes ♥'),
        h('h2', { class: 't', 'data-focus': true, style: 'margin-top:6px' }, "It's a date with " + inv.plannerName + '!', h('span', { class: 'hearts', 'aria-hidden': 'true' }, icon('heart', 22), icon('heart', 18))),
        h('p', { class: 'sub' }, 'Here is your accepted picture. Send it to ' + inv.plannerName + ' so they know.')),
        acceptedCard(inv, 'recipient'));
    } else if (inv.status === 'declined') {
      var yes = h('button', { class: 'linkbtn', type: 'button', onclick: function () { respond('accept', yes); } }, 'Changed your mind? Accept instead');
      body.push(h('div', { class: 'heartbadge', 'aria-hidden': 'true' }, icon('heart', 30)),
        h('div', null, h('h2', { class: 't', 'data-focus': true }, 'Maybe next time'), h('p', { class: 'sub' }, 'No worries at all. There is always another adventure waiting.')), yes);
    }
    body.push(dateBlock(inv));
    var bar = null;
    if (waiting) {
      var no = sh.btn('Decline', { kind: 'onDark', icon: 'close', onclick: function () { respond('decline', no); } });
      var ok = sh.btn('Accept date', { icon: 'heart', onclick: function () { respond('accept', ok); } });
      bar = h('div', { class: 'answerbar' }, no, ok);
    }
    var node = sh.page.apply(null, [{ hero: 'invite', recipient: inv.recipientName, planner: inv.plannerName, hideMine: true }].concat(body, [bar ? h('div', { class: 'bar-space' }) : null]));
    if (bar) node.appendChild(bar);

    if (needsEnvelope) {
      try { g.sessionStorage.setItem(seenKey, '1'); } catch (e) { /* ignore */ }
      var overlay = h('div', { class: 'envelope-stage', role: 'dialog', 'aria-label': 'You have an invitation' },
        h('button', { class: 'envelope', type: 'button', 'aria-label': 'Open your invitation' },
          h('span', { class: 'env-back' }), h('span', { class: 'letter' }, h('span', null, 'For ' + inv.recipientName), icon('heart', 22)),
          h('span', { class: 'env-front' }), h('span', { class: 'env-flap' }), h('span', { class: 'env-seal' }, icon('heart', 16))),
        h('p', { class: 'tap' }, 'Tap to open'));
      overlay.querySelector('.envelope').addEventListener('click', function () {
        overlay.classList.add('open');
        setTimeout(function () { overlay.classList.add('gone'); setTimeout(function () { overlay.remove(); }, 500); }, 1100);
      });
      sh.mount(node, 'An invitation for you');
      document.body.appendChild(overlay);
      sh.onLeave(function () { overlay.remove(); });
    } else {
      sh.mount(node, inv.status === 'accepted' ? "It's a date!" : 'An invitation for you');
    }
  }

  // ---- planner status --------------------------------------------------------------------------------
  function statusScreen(mt) {
    sh.mount(sh.page({ hero: 'plan' }, h('div', { class: 'loading' }, h('h2', { class: 't', 'data-focus': true }, 'Checking…'))), 'Status');
    var timer = null;
    function load(initial) {
      return DV.api.getManage(mt).then(function (r) { paintStatus(mt, r.invite); }, function (e) {
        if (e.status === 404 || e.code === 'not_found') DV.router.notFound();
        else if (initial) errorPage(e, function () { DV.router.render(); });
        else DV.ui.toast('Could not refresh. We will try again.', 'error');
      });
    }
    load(true).then(function () {
      timer = setInterval(function () { if (!g.document.hidden) load(false); }, 15000);
      sh.onLeave(function () { clearInterval(timer); });
    });
  }

  function paintStatus(mt, inv) {
    var s = statusText(inv);
    var link = H().inviteLink(inv.token);
    var rows = [
      ['Created', DV.ui.fmtStamp(inv.createdAt)],
      ['Opened', inv.openedAt ? DV.ui.fmtStamp(inv.openedAt) : 'Not yet'],
      ['Answered', inv.respondedAt ? DV.ui.fmtStamp(inv.respondedAt) : 'Waiting']
    ];
    sh.mount(sh.page({ hero: 'plan' },
      h('div', null, sh.backBtn('#/mine', 'My invitations')),
      h('div', null, h('p', { class: 'cap' }, 'Your date with ' + inv.recipientName), h('h2', { class: 't', 'data-focus': true, style: 'margin-top:4px' }, inv.item.name)),
      h('div', { class: 'statusbox ' + s.cls, role: 'status' }, inv.status === 'accepted' ? icon('heart', 22) : null, h('div', null, h('b', null, s.label + (inv.status === 'accepted' ? ' ♥' : '')), h('span', null, s.note))),
      h('ul', { class: 'stamps' }, rows.map(function (r) { return h('li', null, h('span', null, r[0]), h('b', null, r[1])); })),
      inv.status === 'accepted' ? acceptedCard(inv, 'planner') : null,
      inv.status === 'declined' ? h('p', { class: 'sub' }, 'It is okay. Timing is everything. When you are ready, plan another adventure.') : null,
      h('div', { class: 'stack' },
        sh.btn('Copy link for ' + inv.recipientName, { kind: 'outline', icon: 'link', onclick: function () { H().copyText(link).then(function () { DV.ui.toast('Link copied.'); }); } }),
        sh.btn('Refresh', { kind: 'outline', icon: 'refresh', onclick: function () { DV.router.render(); } }),
        sh.btn('Plan another date', { onclick: function () { S.reset(); sh.go('#/plan/1'); } }))), 'Status');
  }

  function mine() {
    var list = DV.book.list();
    var holder = h('ul', { class: 'mylist' });
    list.forEach(function (e) {
      var pill = h('span', { class: 'pill' }, 'Checking');
      holder.appendChild(h('li', null, h('a', { href: '#/s/' + e.manageToken }, h('b', null, e.recipientName), h('span', null, e.itemName)), pill));
      DV.api.getManage(e.manageToken).then(function (r) {
        var s = statusText(r.invite); pill.textContent = s.label; pill.className = 'pill ' + (s.cls === 'warn' ? '' : s.cls);
      }, function () { pill.textContent = 'Not found'; pill.className = 'pill soft'; });
    });
    sh.mount(sh.page({ hero: 'plan', hideMine: true },
      h('div', null, sh.backBtn('#/', 'Back')),
      h('div', null, h('h2', { class: 't', 'data-focus': true }, 'My invitations'), h('p', { class: 'sub' }, 'The dates you have sent, and how they were answered.')),
      list.length ? holder : h('p', { class: 'sub' }, 'Nothing yet. Plan a date and send your first invitation.'),
      sh.btn('Plan a date', { onclick: function () { sh.go('#/plan/1'); } })), 'My invitations');
  }

  // ---- errors ----------------------------------------------------------------------------------------
  function debugInfo(e, extra) {
    var route = String(g.location.hash || '#/').replace(/(#\/(?:i|s|sent)\/)[^/?#]+/, '$1<hidden>');
    return JSON.stringify({ app: 'Dateventure', mode: DV.api ? DV.api.mode : '?', route: route, time: new Date().toISOString(), message: e && e.message, code: e && e.code, status: e && e.status, stack: e && e.stack ? String(e.stack).split('\n').slice(0, 4).join(' | ') : '', agent: g.navigator.userAgent, extra: extra || null }, null, 1);
  }
  function errorPage(e, retry) {
    var info = debugInfo(e);
    sh.mount(sh.page({ hero: 'plan' },
      h('div', null, h('h2', { class: 't', 'data-focus': true }, 'That did not work'), h('p', { class: 'sub' }, (e && e.message) || 'Something went wrong.')),
      h('div', { class: 'stack' },
        retry ? sh.btn('Try again', { onclick: retry }) : null,
        sh.btn('Copy debug info', { kind: 'outline', onclick: function () { H().copyText(info).then(function () { DV.ui.toast('Copied. Paste it when you ask for help.'); }); } }))), 'Problem');
  }
  function notFound() {
    sh.mount(sh.page({ hero: 'plan' },
      h('div', null, h('h2', { class: 't', 'data-focus': true }, 'We cannot find that page'),
        h('p', { class: 'sub' }, 'The link may be mistyped, or the invitation may have been removed. If someone sent you a link, ask them to send it again.')),
      sh.btn('Go to the start', { onclick: function () { sh.go('#/'); } })), 'Not found');
  }

  // ---- router ----------------------------------------------------------------------------------------
  function render() {
    var parts = String(g.location.hash || '#/').replace(/^#\/?/, '').split('?')[0].split('/');
    var a = parts[0] || '', b = parts[1];
    var Sc = DV.screens;
    sh.beginRoute();
    try {
      DV.ui.log('route', g.location.hash);
      if (a === '') return Sc.landing();
      if (a === 'plan') { var n = parseInt(b, 10); return ({ 1: Sc.step1, 2: Sc.step2, 3: Sc.step3, 4: Sc.step4, 5: Sc.step5 }[n] || Sc.step1)(); }
      if (a === 'results') return Sc.results();
      if (a === 'date') return Sc.detail();
      if (a === 'trailer') return Sc.trailer();
      if (a === 'invite') return Sc.inviteForm();
      if (a === 'sent' && b) return Sc.sent(b);
      if (a === 'i' && b) return inviteScreen(b);
      if (a === 's' && b) return statusScreen(b);
      if (a === 'mine') return mine();
      return notFound();
    } catch (e) {
      console.error(e);
      errorPage(e, function () { g.location.hash = '#/'; });
    }
  }

  DV.router = { render: render, notFound: notFound, errorPage: errorPage, debugInfo: debugInfo };
})(typeof window !== 'undefined' ? window : globalThis);
