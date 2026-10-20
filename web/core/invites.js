/* Dateventure core: invitations.
   Rules that matter:
   - The invite is built from OUR directory (by id), never from text the browser sends. Nobody can
     put their own words or links into someone else's "date".
   - Two secret links: `token` is the recipient's link, `manageToken` is the planner's status link.
   - Answers are safe to repeat: pressing Accept twice (or refreshing) never makes two records.
   - Status: ready -> opened -> accepted | declined. A decline can later become an accept, never the reverse. */
(function (g) {
  var DV = (g.DV = g.DV || {});

  function DvError(code, status, message) {
    var e = new Error(message || code);
    e.code = code; e.status = status || 400;
    return e;
  }

  function validateCreate(input, now, ctx) {
    ctx = ctx || {};
    var U = DV.util;
    input = input || {};
    var plannerName = U.clean(input.plannerName, 40);
    var recipientName = U.clean(input.recipientName, 40);
    if (!plannerName) throw DvError('bad_planner_name', 400, 'Please add your name.');
    if (!recipientName) throw DvError('bad_recipient_name', 400, 'Please add the name of the person you are inviting.');
    var item = null;
    if (input.item && typeof input.item === 'object') {
      // A live venue found by our own server. It must carry our server's signature.
      var live = DV.items.sanitizeLive(input.item);
      if (!live || typeof ctx.verifyItem !== 'function' || !ctx.verifyItem(live, String(input.itemSig || ''))) {
        throw DvError('bad_venue', 400, 'We could not confirm that venue. Please pick it again from the results.');
      }
      item = live;
    } else if (typeof input.itemId === 'string') {
      item = DV.engine.getItem(input.itemId);
    }
    if (!item) throw DvError('unknown_date', 400, 'That date idea does not exist.');

    var amount = Number(input.budget && input.budget.amount);
    var currency = input.budget && input.budget.currency;
    if (!isFinite(amount) || amount < 0 || amount > 1e9) throw DvError('bad_budget', 400, 'The budget is not a valid amount.');
    if (!DV.currencies.info(currency)) throw DvError('bad_currency', 400, 'That currency is not supported.');

    var region = null;
    if (input.regionId) region = DV.engine.regionById(String(input.regionId));

    var message = U.clean(input.message || '', 160);

    var proposedDate = '';
    if (input.proposedDate) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(input.proposedDate));
      var d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
      var valid = d && d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
      var t = now.getTime();
      if (!valid || d.getTime() < t - 2 * 86400000 || d.getTime() > t + 730 * 86400000) {
        throw DvError('bad_date', 400, 'Please pick a day within the next two years.');
      }
      proposedDate = String(input.proposedDate);
    }

    var cid = '';
    if (input.clientRequestId !== undefined && input.clientRequestId !== null && input.clientRequestId !== '') {
      if (!/^[A-Za-z0-9_-]{8,64}$/.test(String(input.clientRequestId))) throw DvError('bad_request_id', 400, 'Bad request id.');
      cid = String(input.clientRequestId);
    }

    return {
      plannerName: plannerName, recipientName: recipientName, item: item, region: region,
      budget: { amount: amount, currency: currency }, message: message, proposedDate: proposedDate,
      trailerUsed: !!input.trailerUsed, clientRequestId: cid,
      cc: /^[A-Za-z]{2}$/.test(String(input.cc || '')) ? String(input.cc).toUpperCase() : ''
    };
  }

  function snapshotItem(item) {
    return {
      id: item.id, kind: item.kind, name: item.name, area: item.area || null, address: item.address || null,
      category: item.category, vibe: (item.vibe || []).slice(), band: item.band, tags: (item.tags || []).slice(),
      art: item.art, bestTime: item.bestTime, hook: item.hook, notes: item.notes || '', verified: !!item.verified,
      placeQuery: item.placeQuery || null, placeId: item.placeId || null, city: item.city || null,
      photos: (item.photos || []).map(function (p) { return { src: p.src, credit: p.credit || '', link: p.link || '' }; }),
      lat: typeof item.lat === 'number' ? item.lat : null, lon: typeof item.lon === 'number' ? item.lon : null,
      source: item.source || (item.kind === 'venue' ? 'sample' : 'idea'), bandGuess: !!item.bandGuess,
      hoursText: item.hoursText || '', osmUrl: item.osmUrl || null
    };
  }

  function publicView(doc) {
    return {
      token: doc.token, plannerName: doc.plannerName, recipientName: doc.recipientName, item: doc.item,
      plan: doc.plan, est: doc.est, message: doc.message, proposedDate: doc.proposedDate,
      trailerUsed: doc.trailerUsed, status: doc.status, createdAt: doc.createdAt, openedAt: doc.openedAt,
      respondedAt: doc.respondedAt, response: doc.response
    };
  }

  function manageView(doc) {
    var v = publicView(doc);
    v.manageToken = doc.manageToken;
    return v;
  }

  function create(store, input, now, ctx) {
    now = now || new Date();
    var v;
    try { v = validateCreate(input, now, ctx); } catch (e) { return Promise.reject(e); }
    var start = v.clientRequestId ? store.findByClientRequestId(v.clientRequestId) : Promise.resolve(null);
    return start.then(function (existing) {
      if (existing) return { doc: existing, deduped: true };
      var range = DV.engine.rangeFor(v.item, v.budget.currency, v.region, v.cc);
      var doc = {
        token: DV.util.randomToken(24), manageToken: DV.util.randomToken(24),
        plannerName: v.plannerName, recipientName: v.recipientName, item: snapshotItem(v.item),
        plan: DV.engine.buildPlan(v.item),
        est: { lo: range.lo, hi: range.hi, currency: range.currency, band: range.band },
        budget: v.budget, message: v.message, proposedDate: v.proposedDate, trailerUsed: v.trailerUsed,
        status: 'ready', createdAt: now.toISOString(), openedAt: null, respondedAt: null, response: null,
        clientRequestId: v.clientRequestId || null
      };
      return store.insertInvite(doc).then(function (saved) { return { doc: saved, deduped: false }; });
    });
  }

  // The recipient opened their link. First open moves ready -> opened.
  function open(store, token, now) {
    now = now || new Date();
    return store.findByToken(token).then(function (doc) {
      if (!doc) throw DvError('not_found', 404, 'We could not find that invitation.');
      if (doc.status !== 'ready') return doc;
      return store.transition(token, ['ready'], { status: 'opened', openedAt: now.toISOString() }).then(function (u) {
        return u || store.findByToken(token);
      });
    });
  }

  function respond(store, token, response, now) {
    now = now || new Date();
    if (response !== 'accept' && response !== 'decline') {
      return Promise.reject(DvError('bad_response', 400, 'Response must be accept or decline.'));
    }
    return store.findByToken(token).then(function (doc) {
      if (!doc) throw DvError('not_found', 404, 'We could not find that invitation.');
      if (response === 'accept' && doc.status === 'accepted') return { doc: doc, changed: false };
      if (response === 'decline' && doc.status === 'declined') return { doc: doc, changed: false };
      if (response === 'decline' && doc.status === 'accepted') return { doc: doc, changed: false, conflict: true };
      var from = response === 'accept' ? ['ready', 'opened', 'declined'] : ['ready', 'opened'];
      var patch = {
        status: response === 'accept' ? 'accepted' : 'declined', response: response,
        respondedAt: now.toISOString(), openedAt: doc.openedAt || now.toISOString()
      };
      return store.transition(token, from, patch).then(function (u) {
        if (u) return { doc: u, changed: true };
        return store.findByToken(token).then(function (cur) { return { doc: cur, changed: false }; });
      });
    });
  }

  function manage(store, manageToken) {
    return store.findByManageToken(manageToken).then(function (doc) {
      if (!doc) throw DvError('not_found', 404, 'We could not find that invitation.');
      return doc;
    });
  }

  DV.DvError = DvError;
  DV.invites = {
    create: create, open: open, respond: respond, manage: manage, publicView: publicView, manageView: manageView,
    validateCreate: validateCreate
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DV.invites;
})(typeof window !== 'undefined' ? window : globalThis);
