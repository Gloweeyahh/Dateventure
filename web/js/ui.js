/* Dateventure web: tiny UI helpers (no libraries). */
(function (g) {
  var DV = (g.DV = g.DV || {});
  var NS = 'http://www.w3.org/2000/svg';

  // h('div', {class:'x', onclick: fn}, 'text', childNode, [more])  -> element. Text is always escaped.
  function h(tag, attrs) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'html') throw new Error('html attribute is not allowed');
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }

  var ICONS = {
    heart: 'M12 21s-7.5-4.6-9.6-9.2C.8 8.2 3 4.5 6.6 4.5c2 0 3.5 1 5.4 3 1.9-2 3.4-3 5.4-3 3.6 0 5.8 3.700 4.200 7.300C19.500 16.400 12 21 12 21z',
    back: 'M15 5l-7 7 7 7',
    pin: 'M12 21s-6.500-6.100-6.500-11A6.500 6.500 0 0 1 18.500 10c0 4.900-6.500 11-6.500 11zM12 12.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z',
    copy: 'M9 9h10v11H9zM5 15V4h10',
    share: 'M12 3v12M7 8l5-5 5 5M5 14v6h14v-6',
    download: 'M12 3v12M7 10l5 5 5-5M5 20h14',
    play: 'M7 4l13 8-13 8z',
    pause: 'M7 4h4v16H7zM13 4h4v16h-4z',
    sound: 'M4 9v6h4l5 4V5L8 9zM16 8a5 5 0 0 1 0 8',
    mute: 'M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6',
    close: 'M6 6l12 12M18 6L6 18',
    check: 'M5 12.500l4.500 4.500L19 7.500',
    spark: 'M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM19 16l.8 2.200L22 19l-2.200.8L19 22l-.8-2.200L16 19l2.200-.8z',
    cal: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
    locate: 'M12 3v4M12 17v4M3 12h4M17 12h4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    arrowleft: 'M19 12H5M11 6l-6 6 6 6',
    cup: 'M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 3v2M11 3v2M14 3v2',
    utensils: 'M6 3v6a2 2 0 0 0 4 0V3M8 3v18M18 3c-2.500 2-3.500 5-3.500 8.500H18V21',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    refresh: 'M20 5v5h-5M4 19v-5h5M5.500 10A7 7 0 0 1 18.500 8l1.500 2M18.500 14A7 7 0 0 1 5.500 16L4 14',
    wallet: 'M4 7h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 7l12-3v3M16 13h2',
    link: 'M10 14a4 4 0 0 0 5.600 0l3-3a4 4 0 0 0-5.600-5.600l-1 1M14 10a4 4 0 0 0-5.600 0l-3 3a4 4 0 0 0 5.600 5.600l1-1',
    mail: 'M3 6h18v12H3zM3 7l9 7 9-7',
    plus: 'M12 5v14M5 12h14'
  };
  function icon(name, size) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', size || 20);
    svg.setAttribute('height', size || 20);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'icon icon-' + name);
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', ICONS[name] || '');
    p.setAttribute('fill', name === 'heart' || name === 'play' || name === 'pause' ? 'currentColor' : 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '2');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p);
    return svg;
  }

  var toastTimer;
  function toast(msg, kind) {
    var host = document.getElementById('toasts');
    if (!host) return;
    host.textContent = '';
    var t = h('div', { class: 'toast ' + (kind || ''), role: 'status' }, msg);
    host.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, kind === 'error' ? 7000 : 3500);
  }

  // Disable a button while an action runs, so a double tap can never submit twice.
  function busy(btn, fn) {
    if (btn.disabled) return Promise.resolve();
    var label = btn.textContent;
    btn.disabled = true;
    btn.classList.add('is-busy');
    // If fn resolves to 'keep' (we are navigating away), the button stays off so a late second tap does nothing.
    return Promise.resolve().then(fn).then(function (r) {
      if (r === 'keep') return;
      btn.disabled = false; btn.classList.remove('is-busy'); btn.textContent = label;
    }, function (e) {
      btn.disabled = false; btn.classList.remove('is-busy'); btn.textContent = label;
      throw e;
    });
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return '';
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  }
  function fmtStamp(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }

  function money(item) {
    var C = DV.currencies;
    if (item.fit === 'free' || (item.estHigh === 0 && item.estLow === 0)) return 'Free or close to it';
    return 'About ' + C.format(item.estLow, item.currency) + ' to ' + C.format(item.estHigh, item.currency) + ' for two';
  }

  // Short price for a card: "₦3,000–15,000 for two" (it is always an estimate).
  function moneyShort(item) {
    var C = DV.currencies;
    if (item.fit === 'free' || (item.estHigh === 0 && item.estLow === 0)) return 'Free or close to it';
    return C.format(item.estLow, item.currency) + '–' + DV.util.groupThousands(item.estHigh) + ' for two';
  }
  // "Plot 72, Aminu Kano Crescent, Wuse 2" + area "Wuse 2" should read once, not twice.
  function whereLine(item) {
    var parts = [], addr = item.address || '', area = item.area || '';
    if (addr) parts.push(addr);
    if (area && addr.toLowerCase().indexOf(area.toLowerCase()) === -1) parts.push(area);
    return parts.join(', ');
  }
  var CATEGORY = { food: 'Restaurant', cafe: 'Café', outdoors: 'Outdoors', play: 'Games & play', music: 'Music & nights out', culture: 'Culture', creative: 'Creative', wellness: 'Wellness', idea: 'Idea for anywhere' };
  function categoryLabel(item) { return CATEGORY[item.category] || 'Date idea'; }

  function log() {
    if (!(g.DV_CONFIG && g.DV_CONFIG.DEBUG)) return;
    var a = ['[Dateventure]'].concat([].slice.call(arguments));
    console.log.apply(console, a);
  }

  DV.ui = { h: h, icon: icon, toast: toast, busy: busy, fmtDate: fmtDate, fmtStamp: fmtStamp, money: money, moneyShort: moneyShort, whereLine: whereLine, categoryLabel: categoryLabel, log: log };
})(typeof window !== 'undefined' ? window : globalThis);
