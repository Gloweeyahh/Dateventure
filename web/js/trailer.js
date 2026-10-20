/* Dateventure web: the 15-second animated trailer (vertical 9:16, made for phones and TikTok).
   It is an illustrated, animated preview of the date. It is NOT real footage and says so on screen.
   If a real, credited photo of the venue is available, it is used in the first scene. */
(function (g) {
  var DV = (g.DV = g.DV || {});
  var W = 540, H = 960, DURATION = 15;
  var BOUNDS = [0, 3.8, 7.6, 11.4, 15];
  var FADE = 0.6;
  var SERIF = '"Playfair Display", Georgia, serif', SANS = '"Plus Jakarta Sans", system-ui, sans-serif', MONO = '"IBM Plex Mono", ui-monospace, monospace';

  var ALT = { garden: 'lake', lake: 'skyline', skyline: 'table', table: 'dessert', music: 'skyline', dessert: 'table', arcade: 'music', studio: 'market', market: 'dessert', cinema: 'table' };

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function wrap(c, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], line = '';
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (c.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }
  DV.draw = { rr: rr, wrap: wrap, SERIF: SERIF, SANS: SANS, MONO: MONO };

  // Everything the trailer needs, from one date.
  function specFor(item, plan, names) {
    names = names || {};
    var steps = plan || [];
    var cap = function (s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; };
    var sub = [item.area, item.kind === 'idea' ? 'Works anywhere' : ''].filter(Boolean).join(' · ');
    return {
      title: item.name, sub: sub || 'A little adventure for two',
      planner: names.planner || '', recipient: names.recipient || '',
      scenes: [
        { art: item.art, small: names.planner ? names.planner + ' planned a date' : 'A date for two', big: item.name, text: sub || '' },
        { art: ALT[item.art] || 'table', small: steps[0] ? steps[0].time : '', big: steps[0] ? steps[0].title : 'Arrive', text: steps[0] ? steps[0].text : '' },
        { art: item.art, small: steps[1] ? steps[1].time : '', big: steps[1] ? steps[1].title : 'Enjoy', text: steps[1] ? cap(item.hook || steps[1].text) + '.' : '' },
        { art: ALT[ALT[item.art]] || 'garden', small: names.recipient ? 'For ' + names.recipient : 'Just for you', big: 'Want to come?', text: names.planner && names.recipient ? names.planner + ' + ' + names.recipient : '' }
      ],
      photoUrls: (item.photos || []).map(function (p) { return p.src; }).slice(0, 1),
      credit: (item.photos && item.photos[0] && item.photos[0].credit) ? 'Photo: Wikimedia Commons' : ''
    };
  }

  function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  function sceneIndex(t) {
    for (var i = 0; i < 4; i++) if (t < BOUNDS[i + 1]) return i;
    return 3;
  }

  var ART_H = 730; // the illustration sits above the caption band so the two never collide

  function drawScene(c, spec, i, t, photo) {
    var lt = t - BOUNDS[i], span = BOUNDS[i + 1] - BOUNDS[i];
    var zoom = 1 + 0.07 * (lt / span);
    c.save();
    if (i === 0 && photo) {
      c.translate(W / 2, H / 2); c.scale(zoom, zoom); c.translate(-W / 2, -H / 2);
      var r = Math.max(W / photo.width, H / photo.height);
      var pw = photo.width * r, ph = photo.height * r;
      c.drawImage(photo, (W - pw) / 2 - lt * 4, (H - ph) / 2, pw, ph);
      var tint = c.createLinearGradient(0, 0, 0, H); tint.addColorStop(0, 'rgba(28,25,23,.15)'); tint.addColorStop(1, 'rgba(28,25,23,.4)');
      c.fillStyle = tint; c.fillRect(0, 0, W, H);
    } else {
      c.beginPath(); c.rect(0, 0, W, ART_H); c.clip();
      c.translate(W / 2, ART_H / 2); c.scale(zoom, zoom); c.translate(-W / 2, -ART_H / 2);
      DV.art.draw(c, W, ART_H, spec.scenes[i].art, t + i * 3);
    }
    c.restore();
    if (!(i === 0 && photo)) {
      var band = c.createLinearGradient(0, ART_H - 40, 0, H);
      band.addColorStop(0, 'rgba(28,25,23,0)'); band.addColorStop(0.25, '#1C1917'); band.addColorStop(1, '#14181F');
      c.fillStyle = band; c.fillRect(0, ART_H - 40, W, H - ART_H + 40);
    }
  }

  function drawText(c, spec, i, t) {
    var sc = spec.scenes[i], lt = t - BOUNDS[i];
    var a = ease(lt / 0.55), rise = (1 - a) * 16;
    c.save();
    c.globalAlpha = a; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    var x = 40, y = H - 200 + rise;
    if (sc.small) { c.font = '700 22px ' + SANS; c.fillStyle = '#FDE68A'; c.fillText(sc.small, x, y); }
    c.font = '700 ' + (i === 3 ? 62 : 50) + 'px ' + SERIF; c.fillStyle = '#FFF6E9';
    var lines = wrap(c, sc.big, W - 80).slice(0, 3);
    lines.forEach(function (ln, k) { c.fillText(ln, x, y + 52 + k * 56); });
    if (sc.text) {
      c.font = '500 24px ' + SANS; c.fillStyle = 'rgba(255,246,233,.92)';
      wrap(c, sc.text, W - 80).slice(0, 3).forEach(function (ln, k) { c.fillText(ln, x, y + 52 + lines.length * 56 + 14 + k * 32); });
    }
    c.restore();
  }

  function drawFrame(c, spec, t, photo) {
    t = Math.max(0, Math.min(DURATION, t));
    c.globalAlpha = 1; c.fillStyle = '#1C1917'; c.fillRect(0, 0, W, H);   // clean slate every frame
    var i = sceneIndex(t);
    var lt = t - BOUNDS[i];
    if (i > 0 && lt < FADE) drawScene(c, spec, i - 1, BOUNDS[i] - 0.001, photo);
    c.globalAlpha = i > 0 ? ease(lt / FADE) : 1;
    drawScene(c, spec, i, t, photo);
    c.globalAlpha = 1;

    var top = c.createLinearGradient(0, 0, 0, 200); top.addColorStop(0, 'rgba(28,25,23,.66)'); top.addColorStop(1, 'rgba(28,25,23,0)');
    c.fillStyle = top; c.fillRect(0, 0, W, 200);
    var bot = c.createLinearGradient(0, H * 0.58, 0, H); bot.addColorStop(0, 'rgba(28,25,23,0)'); bot.addColorStop(1, 'rgba(28,25,23,.82)');
    c.fillStyle = bot; c.fillRect(0, H * 0.58, W, H * 0.42);

    c.fillStyle = 'rgba(255,255,255,.3)'; DV.draw.rr(c, 28, 22, W - 56, 5, 2.5); c.fill();
    c.fillStyle = '#FFF6E9'; DV.draw.rr(c, 28, 22, Math.max(5, (W - 56) * (t / DURATION)), 5, 2.5); c.fill();

    c.font = '700 26px ' + SANS; c.fillStyle = '#FAF7F2'; c.textAlign = 'left'; c.fillText('Dateventure', 58, 74);
    c.fillStyle = '#FB7185'; DV.art.heartPath(c, 38, 66, 11); c.fill();

    drawText(c, spec, i, t);

    c.font = '600 15px ' + SANS; c.fillStyle = 'rgba(255,246,233,.78)'; c.textAlign = 'center';
    c.fillText('Illustrated preview, not real footage' + (spec.credit && i === 0 ? '. ' + spec.credit : ''), W / 2, H - 26);
    c.textAlign = 'left';
  }

  // Soft, original, royalty-free background music made with the browser's own synth.
  function startMusic() {
    var AC = g.AudioContext || g.webkitAudioContext;
    if (!AC) return null;
    var ac = new AC(), master = ac.createGain();
    master.gain.value = 0.07; master.connect(ac.destination);
    var chords = [[261.63, 329.63, 392.0, 493.88], [220.0, 261.63, 329.63, 392.0], [174.61, 261.63, 329.63, 440.0], [196.0, 246.94, 293.66, 392.0]];
    var t0 = ac.currentTime + 0.05;
    for (var n = 0; n < 30; n++) {
      var chord = chords[Math.floor(n / 8) % 4], f = chord[n % 4] * (n % 8 > 3 ? 2 : 1);
      var o = ac.createOscillator(), gn = ac.createGain(), st = t0 + n * 0.5;
      o.type = 'triangle'; o.frequency.value = f;
      gn.gain.setValueAtTime(0, st); gn.gain.linearRampToValueAtTime(0.9, st + 0.03); gn.gain.exponentialRampToValueAtTime(0.001, st + 0.9);
      o.connect(gn); gn.connect(master); o.start(st); o.stop(st + 1);
    }
    return ac;
  }

  function create(canvas, spec, opts) {
    opts = opts || {};
    canvas.width = W; canvas.height = H;
    var c = canvas.getContext('2d');
    var t = 0, playing = false, last = 0, raf = 0, muted = true, ac = null, photo = null;
    var listeners = { time: [], end: [], state: [] };
    function emit(k, v) { listeners[k].forEach(function (fn) { fn(v); }); }

    (spec.photoUrls || []).forEach(function (u) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { photo = img; if (!playing) draw(); };
      img.onerror = function () { DV.ui.log('trailer photo failed to load'); };
      img.src = u;
    });

    function draw() { drawFrame(c, spec, t, photo); }
    function tick(now) {
      if (!playing) return;
      t += Math.min((now - last) / 1000, 0.1); last = now;
      if (t >= DURATION) { t = DURATION; draw(); emit('time', t); stop(true); return; }
      draw(); emit('time', t);
      raf = g.requestAnimationFrame(tick);
    }
    function stop(ended) {
      playing = false; g.cancelAnimationFrame(raf);
      if (ac) { try { ac.close(); } catch (e) { /* ignore */ } ac = null; }
      emit('state', false);
      if (ended) emit('end');
    }
    function play() {
      if (playing) return;
      if (t >= DURATION) t = 0;
      playing = true; last = g.performance.now();
      if (!muted) ac = startMusic();
      emit('state', true);
      raf = g.requestAnimationFrame(tick);
    }
    function pause() { if (playing) stop(false); }
    function seek(x) { t = Math.max(0, Math.min(DURATION, x)); draw(); emit('time', t); }

    function record() {
      return new Promise(function (resolve, reject) {
        if (!canvas.captureStream || !g.MediaRecorder) return reject(new Error('This browser cannot save video. Try Chrome or Safari, or screen-record the preview.'));
        var types = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
        var mime = ''; for (var i = 0; i < types.length; i++) { if (g.MediaRecorder.isTypeSupported(types[i])) { mime = types[i]; break; } }
        var rec, chunks = [];
        try { rec = new g.MediaRecorder(canvas.captureStream(30), mime ? { mimeType: mime, videoBitsPerSecond: 2500000 } : undefined); }
        catch (e) { return reject(new Error('This browser cannot save video. Try screen-recording instead.')); }
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onerror = function () { reject(new Error('Saving the video failed.')); };
        rec.onstop = function () { resolve(new Blob(chunks, { type: rec.mimeType || 'video/webm' })); };
        stop(false); t = 0; draw();
        rec.start(250);
        var wasMuted = muted; muted = true;
        var done = function () { listeners.end.splice(listeners.end.indexOf(done), 1); muted = wasMuted; setTimeout(function () { rec.stop(); }, 250); };
        listeners.end.push(done);
        play();
      });
    }

    draw();
    return {
      play: play, pause: pause, seek: seek, record: record, duration: DURATION, draw: draw,
      isPlaying: function () { return playing; }, time: function () { return t; },
      setMuted: function (m) { muted = !!m; if (muted && ac) { try { ac.close(); } catch (e) { /* ignore */ } ac = null; } else if (!muted && playing && !ac) ac = startMusic(); },
      isMuted: function () { return muted; },
      on: function (k, fn) { listeners[k].push(fn); },
      destroy: function () { stop(false); listeners = { time: [], end: [], state: [] }; }
    };
  }

  DV.trailer = { create: create, specFor: specFor, drawFrame: drawFrame, DURATION: DURATION, W: W, H: H, ALT: ALT };
})(typeof window !== 'undefined' ? window : globalThis);
