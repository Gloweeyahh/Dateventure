/* Dateventure web: the illustrated scenes.
   Every scene is drawn with code (no image files), in the Dateventure palette. A scene can be
   drawn still (thumbnails) or animated by passing a time t in seconds (the trailer).
   These are illustrations, never photos: the app never passes them off as the real place. */
(function (g) {
  var DV = (g.DV = g.DV || {});

  var C = {
    cream: '#FFF6E9', blush: '#F8D3DC', blushDeep: '#F2B5C6', plum: '#2A1620', plum2: '#4A2634', lav: '#DCCBF5',
    lavDeep: '#B79BE8', butter: '#FBE6A0', butterDeep: '#F5C95C', rose: '#E11D48', teal: '#2F6F73', leaf: '#6FA287',
    leafDeep: '#3F7A62', night: '#2A1230', ink: '#2A1330'
  };

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function sky(c, w, h, stops, to) {
    var gr = c.createLinearGradient(0, 0, 0, to || h);
    stops.forEach(function (s, i) { gr.addColorStop(i / (stops.length - 1), s); });
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
  }

  function glowCircle(c, x, y, r, col, glow) {
    var gr = c.createRadialGradient(x, y, r * 0.2, x, y, r * (glow || 2.4));
    gr.addColorStop(0, col);
    gr.addColorStop(0.35, col);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr;
    c.beginPath(); c.arc(x, y, r * (glow || 2.4), 0, 6.2832); c.fill();
    c.fillStyle = col;
    c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill();
  }

  function hill(c, w, h, baseY, amp, col, seed, drift) {
    var r = rng(seed), p1 = r() * 6, p2 = r() * 6;
    c.fillStyle = col;
    c.beginPath(); c.moveTo(0, h);
    for (var x = 0; x <= w; x += 6) {
      var y = baseY + Math.sin(x / w * 3.2 + p1 + drift) * amp + Math.sin(x / w * 7 + p2) * amp * 0.35;
      c.lineTo(x, y);
    }
    c.lineTo(w, h); c.closePath(); c.fill();
  }

  function buildings(c, w, h, baseY, col, seed, t, litCol) {
    var r = rng(seed), x = -10;
    while (x < w) {
      var bw = w * (0.05 + r() * 0.07), bh = h * (0.12 + r() * 0.3);
      c.fillStyle = col;
      c.fillRect(x, baseY - bh, bw, bh + h);
      for (var wy = baseY - bh + 8; wy < baseY - 6; wy += 13) {
        for (var wx = x + 5; wx < x + bw - 5; wx += 10) {
          var on = r() > 0.45;
          if (on) {
            var tw = 0.6 + 0.4 * Math.sin(t * 1.5 + wx * 0.7 + wy);
            c.fillStyle = litCol; c.globalAlpha = 0.45 + 0.4 * tw;
            c.fillRect(wx, wy, 4, 6); c.globalAlpha = 1;
          }
        }
      }
      x += bw + 3;
    }
  }

  function stars(c, w, h, t, seed, n, maxY) {
    var r = rng(seed);
    for (var i = 0; i < n; i++) {
      var x = r() * w, y = r() * maxY, s = 0.6 + r() * 1.6;
      c.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t * 1.2 + i));
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(x, y, s, 0, 6.2832); c.fill();
    }
    c.globalAlpha = 1;
  }

  function stringLights(c, w, y, sag, n, t, cols) {
    c.strokeStyle = 'rgba(42,19,48,.55)'; c.lineWidth = 1.5;
    c.beginPath();
    for (var i = 0; i <= 40; i++) {
      var x = (i / 40) * w, yy = y + Math.sin((i / 40) * Math.PI) * sag;
      if (i === 0) c.moveTo(x, yy); else c.lineTo(x, yy);
    }
    c.stroke();
    for (var k = 1; k < n; k++) {
      var f = k / n, bx = f * w, by = y + Math.sin(f * Math.PI) * sag + 5;
      var col = cols[k % cols.length];
      var pulse = 0.65 + 0.35 * Math.sin(t * 2.2 + k * 1.7);
      c.globalAlpha = 0.28 * pulse; c.fillStyle = col;
      c.beginPath(); c.arc(bx, by, 11, 0, 6.2832); c.fill();
      c.globalAlpha = 1;
      c.fillStyle = col;
      c.beginPath(); c.arc(bx, by, 3.6, 0, 6.2832); c.fill();
    }
  }

  function bokeh(c, w, h, t, seed, n, cols) {
    var r = rng(seed);
    for (var i = 0; i < n; i++) {
      var x = r() * w, y = r() * h, rad = 10 + r() * 38, ph = r() * 6;
      c.globalAlpha = 0.10 + 0.10 * Math.sin(t * 0.8 + ph);
      c.fillStyle = cols[i % cols.length];
      c.beginPath(); c.arc(x + Math.sin(t * 0.3 + ph) * 8, y + Math.cos(t * 0.25 + ph) * 6, rad, 0, 6.2832); c.fill();
    }
    c.globalAlpha = 1;
  }

  function heartPath(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y + s * 0.35);
    c.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.55, y - s * 1.0, x, y - s * 0.4);
    c.bezierCurveTo(x + s * 0.55, y - s * 1.0, x + s, y - s * 0.4, x, y + s * 0.35);
    c.closePath();
  }

  function hearts(c, w, h, t, seed, n, col) {
    var r = rng(seed);
    for (var i = 0; i < n; i++) {
      var x0 = r() * w, sp = 18 + r() * 28, s = 7 + r() * 12, ph = r() * 40;
      var y = h - ((t * sp + ph * 20) % (h + 40)) + 20;
      var x = x0 + Math.sin(t * 1.1 + ph) * 14;
      c.globalAlpha = Math.max(0, Math.min(0.85, (y / h) * 1.1));
      c.fillStyle = col || C.rose;
      heartPath(c, x, y, s); c.fill();
    }
    c.globalAlpha = 1;
  }

  function figure(c, x, y, s, body, hair, lean) {
    // a simple seated person seen from behind: shoulders, head, hair
    c.save(); c.translate(x, y); c.rotate(lean || 0);
    c.fillStyle = body;
    c.beginPath(); c.ellipse(0, 0, s * 0.9, s * 1.15, 0, Math.PI, 0); c.lineTo(s * 0.9, s * 0.9); c.lineTo(-s * 0.9, s * 0.9); c.closePath(); c.fill();
    c.fillStyle = hair;
    c.beginPath(); c.arc(0, -s * 1.5, s * 0.62, 0, 6.2832); c.fill();
    c.restore();
  }

  function couple(c, x, y, s, t) {
    var sway = Math.sin(t * 0.7) * 0.02;
    figure(c, x - s * 0.62, y, s, C.plum2, C.plum, 0.1 + sway);
    figure(c, x + s * 0.62, y, s, C.rose, '#7A3B2E', -0.1 - sway);
    c.strokeStyle = C.butterDeep; c.lineWidth = Math.max(2, s * 0.09); c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - s * 0.15, y - s * 0.55); c.quadraticCurveTo(x, y - s * 0.3, x + s * 0.2, y - s * 0.55); c.stroke();
  }

  function tree(c, x, y, s, col, trunk) {
    c.fillStyle = trunk || C.plum2; c.fillRect(x - s * 0.06, y - s * 0.5, s * 0.12, s * 0.5);
    c.fillStyle = col;
    [[x, y - s * 0.75, s * 0.42], [x - s * 0.28, y - s * 0.55, s * 0.3], [x + s * 0.3, y - s * 0.55, s * 0.3]].forEach(function (k) {
      c.beginPath(); c.arc(k[0], k[1], k[2], 0, 6.2832); c.fill();
    });
  }

  function flame(c, x, y, t, s) {
    var f = 1 + Math.sin(t * 9 + x) * 0.12;
    glowCircle(c, x, y - s * 0.4, s * 0.5, 'rgba(255,214,120,.5)', 3);
    c.fillStyle = '#FFD36B';
    c.beginPath(); c.ellipse(x, y - s * 0.4, s * 0.22, s * 0.5 * f, 0, 0, 6.2832); c.fill();
  }

  function glass(c, x, y, s, col) {
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2;
    c.fillStyle = col;
    c.beginPath(); c.moveTo(x - s * 0.5, y - s); c.lineTo(x + s * 0.5, y - s); c.lineTo(x + s * 0.28, y - s * 0.25); c.quadraticCurveTo(x, y - s * 0.05, x - s * 0.28, y - s * 0.25); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x, y - s * 0.15); c.lineTo(x, y); c.moveTo(x - s * 0.3, y); c.lineTo(x + s * 0.3, y); c.stroke();
  }

  function note(c, x, y, s, col) {
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.14);
    c.beginPath(); c.ellipse(x, y, s * 0.42, s * 0.3, -0.4, 0, 6.2832); c.fill();
    c.beginPath(); c.moveTo(x + s * 0.34, y - s * 0.05); c.lineTo(x + s * 0.34, y - s * 1.2); c.quadraticCurveTo(x + s * 0.8, y - s * 1.0, x + s * 0.7, y - s * 0.6); c.stroke();
  }

  function floatNotes(c, w, h, t, seed, n, col) {
    var r = rng(seed);
    for (var i = 0; i < n; i++) {
      var x0 = r() * w, sp = 14 + r() * 18, ph = r() * 50;
      var y = h * 0.8 - ((t * sp + ph * 12) % (h * 0.75));
      c.globalAlpha = Math.max(0, Math.min(0.9, y / (h * 0.8)));
      note(c, x0 + Math.sin(t + ph) * 12, y, 12 + r() * 10, col);
    }
    c.globalAlpha = 1;
  }

  // ---- the scenes ---------------------------------------------------------------------------------------
  var SCENES = {
    garden: function (c, w, h, t) {
      sky(c, w, h, ['#FBD6C9', '#F9E4B8', '#FFF1D6']);
      glowCircle(c, w * 0.72, h * 0.34, w * 0.1, '#FFE08A', 2.8);
      hill(c, w, h, h * 0.55, h * 0.04, C.lav, 11, t * 0.05);
      hill(c, w, h, h * 0.63, h * 0.035, C.leaf, 12, t * 0.04);
      tree(c, w * 0.14, h * 0.7, h * 0.34, C.leafDeep); tree(c, w * 0.88, h * 0.68, h * 0.28, C.leafDeep);
      hill(c, w, h, h * 0.74, h * 0.02, C.leafDeep, 13, 0);
      c.fillStyle = C.blushDeep; c.beginPath(); c.moveTo(w * 0.22, h * 0.84); c.lineTo(w * 0.78, h * 0.84); c.lineTo(w * 0.86, h * 0.97); c.lineTo(w * 0.14, h * 0.97); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)';
      for (var i = 0; i < 6; i++) c.fillRect(w * (0.2 + i * 0.1), h * 0.84, w * 0.05, h * 0.13);
      couple(c, w * 0.5, h * 0.84, h * 0.07, t);
      stringLights(c, w, h * 0.1, h * 0.06, 12, t, [C.butterDeep, C.blushDeep, C.lavDeep]);
      hearts(c, w, h, t, 5, 5, C.rose);
    },
    lake: function (c, w, h, t) {
      sky(c, w, h, ['#B79BE8', '#F2B5C6', '#FBD9A8'], h * 0.58);
      glowCircle(c, w * 0.5, h * 0.5, w * 0.11, '#FFD98A', 2.6);
      hill(c, w, h, h * 0.52, h * 0.03, '#8C74C4', 21, t * 0.03);
      var wy = h * 0.58;
      var gr = c.createLinearGradient(0, wy, 0, h); gr.addColorStop(0, '#E9A9C0'); gr.addColorStop(1, '#6C4C8F');
      c.fillStyle = gr; c.fillRect(0, wy, w, h - wy);
      for (var i = 0; i < 9; i++) {
        var yy = wy + 8 + i * (h - wy) / 10, ww = w * (0.1 + 0.28 * (1 - i / 10));
        c.fillStyle = 'rgba(255,224,150,' + (0.5 - i * 0.04) + ')';
        c.fillRect(w * 0.5 - ww / 2 + Math.sin(t * 1.6 + i) * 6, yy, ww, 3);
      }
      c.fillStyle = C.plum; c.beginPath(); c.moveTo(w * 0.15, wy + h * 0.08); c.quadraticCurveTo(w * 0.22, wy + h * 0.13, w * 0.31, wy + h * 0.08); c.lineTo(w * 0.29, wy + h * 0.065); c.lineTo(w * 0.17, wy + h * 0.065); c.closePath(); c.fill();
      c.fillRect(w * 0.23, wy + h * 0.02, 2.5, h * 0.045);
      couple(c, w * 0.72, h * 0.93, h * 0.06, t);
      tree(c, w * 0.93, h * 0.92, h * 0.3, '#3A2A5C');
      hearts(c, w, h, t, 9, 4, C.rose);
    },
    skyline: function (c, w, h, t) {
      sky(c, w, h, ['#2A1A4A', '#6B3A7D', '#E58AA5', '#FBC7A0']);
      stars(c, w, h, t, 31, 40, h * 0.4);
      glowCircle(c, w * 0.78, h * 0.28, w * 0.05, '#FFF3C9', 3);
      buildings(c, w, h, h * 0.78, '#4A2559', 41, t, '#FFD98A');
      buildings(c, w, h, h * 0.86, '#2E1638', 42, t + 3, '#F8D3DC');
      c.fillStyle = C.plum; c.fillRect(0, h * 0.9, w, h * 0.1);
      stringLights(c, w, h * 0.74, h * 0.05, 14, t, [C.butter, C.blush, C.lav]);
      couple(c, w * 0.42, h * 0.93, h * 0.06, t);
      hearts(c, w, h, t, 3, 5, C.blush);
    },
    table: function (c, w, h, t) {
      sky(c, w, h, ['#3B1B3F', '#5A2A55', '#7A3B58']);
      bokeh(c, w, h, t, 51, 16, [C.butter, C.blushDeep, C.lav]);
      stringLights(c, w, h * 0.12, h * 0.05, 10, t, [C.butter, C.blush]);
      var ty = h * 0.72;
      c.fillStyle = '#2A1230'; c.beginPath(); c.ellipse(w * 0.5, ty, w * 0.42, h * 0.07, 0, 0, 6.2832); c.fill();
      c.fillStyle = '#8A4A62'; c.beginPath(); c.ellipse(w * 0.5, ty - 4, w * 0.42, h * 0.065, 0, 0, 6.2832); c.fill();
      c.fillStyle = '#FFF6E9'; c.beginPath(); c.ellipse(w * 0.3, ty - 4, w * 0.1, h * 0.028, 0, 0, 6.2832); c.fill();
      c.beginPath(); c.ellipse(w * 0.7, ty - 4, w * 0.1, h * 0.028, 0, 0, 6.2832); c.fill();
      glass(c, w * 0.42, ty - 6, h * 0.07, 'rgba(212,84,122,.7)'); glass(c, w * 0.58, ty - 6, h * 0.07, 'rgba(251,230,160,.7)');
      c.fillStyle = '#FFF6E9'; c.fillRect(w * 0.495, ty - h * 0.13, w * 0.012, h * 0.12);
      flame(c, w * 0.5, ty - h * 0.13, t, h * 0.06);
      hearts(c, w, h, t, 8, 5, C.blushDeep);
    },
    music: function (c, w, h, t) {
      sky(c, w, h, ['#1E0E26', '#3B1B3F', '#5A2A55']);
      var cols = [C.blushDeep, C.butterDeep, C.lavDeep];
      for (var i = 0; i < 3; i++) {
        var sx = w * (0.2 + i * 0.3) + Math.sin(t * 0.9 + i * 2) * w * 0.05;
        var gr = c.createLinearGradient(sx, 0, sx, h);
        gr.addColorStop(0, cols[i].replace(')', ')')); gr.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = 0.28; c.fillStyle = cols[i];
        c.beginPath(); c.moveTo(sx - 6, 0); c.lineTo(sx + 6, 0); c.lineTo(sx + w * 0.16, h * 0.85); c.lineTo(sx - w * 0.16, h * 0.85); c.closePath(); c.fill();
        c.globalAlpha = 1;
      }
      c.fillStyle = '#120818'; c.fillRect(0, h * 0.82, w, h * 0.18);
      c.fillStyle = C.plum2; c.fillRect(w * 0.12, h * 0.78, w * 0.76, h * 0.05);
      figure(c, w * 0.38, h * 0.78, h * 0.05, '#120818', '#120818', 0);
      figure(c, w * 0.62, h * 0.78, h * 0.05, '#120818', '#120818', 0);
      floatNotes(c, w, h, t, 61, 7, C.butter);
      hearts(c, w, h, t, 7, 3, C.rose);
    },
    dessert: function (c, w, h, t) {
      sky(c, w, h, ['#FBD6DF', '#FDE7E0', '#FFF1D6']);
      bokeh(c, w, h, t, 71, 10, ['#fff', C.butter, C.blushDeep]);
      c.fillStyle = '#FFF6E9'; c.fillRect(0, h * 0.78, w, h * 0.22);
      c.fillStyle = C.blushDeep; c.fillRect(0, h * 0.78, w, 5);
      var cx = w * 0.5, base = h * 0.78;
      c.fillStyle = '#E9B48E'; c.beginPath(); c.moveTo(cx - w * 0.2, base); c.lineTo(cx + w * 0.2, base); c.lineTo(cx + w * 0.17, base - h * 0.1); c.lineTo(cx - w * 0.17, base - h * 0.1); c.closePath(); c.fill();
      c.fillStyle = '#FFF6E9'; c.fillRect(cx - w * 0.17, base - h * 0.15, w * 0.34, h * 0.05);
      c.fillStyle = C.rose; c.fillRect(cx - w * 0.17, base - h * 0.2, w * 0.34, h * 0.05);
      c.fillStyle = '#FFF6E9'; c.beginPath(); c.ellipse(cx, base - h * 0.2, w * 0.17, h * 0.02, 0, 0, 6.2832); c.fill();
      c.fillStyle = C.rose; c.beginPath(); c.arc(cx, base - h * 0.235, w * 0.03, 0, 6.2832); c.fill();
      c.strokeStyle = '#6FA287'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, base - h * 0.265); c.quadraticCurveTo(cx + 6, base - h * 0.3, cx + 14, base - h * 0.29); c.stroke();
      c.fillStyle = '#FFF6E9'; c.strokeStyle = C.plum; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(w * 0.1, base - h * 0.08); c.lineTo(w * 0.22, base - h * 0.08); c.lineTo(w * 0.2, base); c.lineTo(w * 0.12, base); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.arc(w * 0.225, base - h * 0.05, h * 0.025, -1.4, 1.4); c.stroke();
      for (var s = 0; s < 3; s++) {
        c.globalAlpha = 0.5 - ((t * 0.5 + s * 0.33) % 1) * 0.5; c.strokeStyle = C.plum2; c.lineWidth = 2.5;
        var sy = base - h * 0.1 - ((t * 20 + s * 18) % 46);
        c.beginPath(); c.moveTo(w * 0.16 + s * 7, sy); c.quadraticCurveTo(w * 0.16 + s * 7 + 6, sy - 10, w * 0.16 + s * 7, sy - 20); c.stroke();
      }
      c.globalAlpha = 1;
      hearts(c, w, h, t, 4, 5, C.rose);
    },
    arcade: function (c, w, h, t) {
      sky(c, w, h, ['#1A1040', '#3B1B5F', '#6B2B7D']);
      stars(c, w, h, t, 81, 24, h * 0.5);
      var cols = ['#FF5C93', '#5CE1E6', '#FBE66B', '#B79BE8'];
      for (var i = 0; i < 4; i++) {
        var x = w * (0.08 + i * 0.22), y = h * 0.35, cw = w * 0.18, ch = h * 0.55;
        c.fillStyle = '#26104A'; c.fillRect(x, y, cw, ch);
        c.strokeStyle = cols[i]; c.lineWidth = 3; c.strokeRect(x, y, cw, ch);
        c.globalAlpha = 0.65 + 0.3 * Math.sin(t * 3 + i * 1.3);
        c.fillStyle = cols[i]; c.fillRect(x + cw * 0.12, y + ch * 0.1, cw * 0.76, ch * 0.3);
        c.globalAlpha = 1;
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(x + cw * 0.3, y + ch * 0.62, cw * 0.06, 0, 6.2832); c.arc(x + cw * 0.7, y + ch * 0.62, cw * 0.06, 0, 6.2832); c.fill();
        c.fillRect(x + cw * 0.45, y + ch * 0.7, cw * 0.1, ch * 0.12);
      }
      c.fillStyle = '#120818'; c.fillRect(0, h * 0.9, w, h * 0.1);
      hearts(c, w, h, t, 2, 4, '#FF5C93');
    },
    studio: function (c, w, h, t) {
      sky(c, w, h, ['#FFF1D6', '#FBE3D2', '#F8D3DC']);
      var frames = [['#B79BE8', 0.08, 0.12, 0.2, 0.22], ['#F2B5C6', 0.34, 0.08, 0.16, 0.3], ['#FBE6A0', 0.56, 0.14, 0.22, 0.18], ['#6FA287', 0.82, 0.1, 0.12, 0.26]];
      frames.forEach(function (f) {
        c.fillStyle = C.plum; c.fillRect(w * f[1] - 4, h * f[2] - 4, w * f[3] + 8, h * f[4] + 8);
        c.fillStyle = f[0]; c.fillRect(w * f[1], h * f[2], w * f[3], h * f[4]);
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(w * f[1] + w * f[3] * 0.65, h * f[2] + h * f[4] * 0.35, w * f[3] * 0.18, 0, 6.2832); c.fill();
      });
      c.fillStyle = '#E8C9A8'; c.fillRect(0, h * 0.78, w, h * 0.22);
      var cx = w * 0.5, wy = h * 0.8;
      c.fillStyle = C.plum2; c.beginPath(); c.ellipse(cx, wy + h * 0.06, w * 0.2, h * 0.035, 0, 0, 6.2832); c.fill();
      c.fillStyle = '#C97B5A';
      var wob = Math.sin(t * 2) * 3;
      c.beginPath(); c.moveTo(cx - w * 0.07, wy + h * 0.04); c.bezierCurveTo(cx - w * 0.14 + wob, wy - h * 0.06, cx - w * 0.05 - wob, wy - h * 0.14, cx - w * 0.04, wy - h * 0.2);
      c.lineTo(cx + w * 0.04, wy - h * 0.2); c.bezierCurveTo(cx + w * 0.05 + wob, wy - h * 0.14, cx + w * 0.14 - wob, wy - h * 0.06, cx + w * 0.07, wy + h * 0.04); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3;
      for (var i = 1; i < 5; i++) { c.beginPath(); c.moveTo(cx - w * 0.07, wy - h * 0.04 * i + 8); c.quadraticCurveTo(cx, wy - h * 0.04 * i + 14, cx + w * 0.07, wy - h * 0.04 * i + 8); c.stroke(); }
      hearts(c, w, h, t, 6, 4, C.rose);
    },
    market: function (c, w, h, t) {
      sky(c, w, h, ['#FDE7C8', '#FBD6C9', '#F8D3DC']);
      var flags = [C.rose, C.butterDeep, C.lavDeep, C.leaf];
      c.strokeStyle = C.plum; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, h * 0.1); c.quadraticCurveTo(w * 0.5, h * 0.2, w, h * 0.1); c.stroke();
      for (var f = 1; f < 14; f++) {
        var fx = (f / 14) * w, fy = h * 0.1 + Math.sin((f / 14) * Math.PI) * h * 0.05, sw = Math.sin(t * 2 + f) * 2;
        c.fillStyle = flags[f % 4]; c.beginPath(); c.moveTo(fx - 9, fy); c.lineTo(fx + 9, fy); c.lineTo(fx + sw, fy + 20); c.closePath(); c.fill();
      }
      for (var s = 0; s < 3; s++) {
        var sx = w * (0.05 + s * 0.31), sw2 = w * 0.28, sy = h * 0.42;
        for (var st = 0; st < 7; st++) { c.fillStyle = st % 2 ? '#FFF6E9' : flags[s % 4]; c.fillRect(sx + st * sw2 / 7, sy, sw2 / 7 + 1, h * 0.08); }
        c.fillStyle = C.plum2; c.fillRect(sx + 4, sy + h * 0.08, 4, h * 0.3); c.fillRect(sx + sw2 - 8, sy + h * 0.08, 4, h * 0.3);
        c.fillStyle = '#E8C9A8'; c.fillRect(sx, h * 0.68, sw2, h * 0.08);
        for (var b = 0; b < 4; b++) { c.fillStyle = flags[(b + s) % 4]; c.beginPath(); c.arc(sx + sw2 * (0.15 + b * 0.23), h * 0.67, h * 0.03, 0, 6.2832); c.fill(); }
      }
      c.fillStyle = '#E8C9A8'; c.fillRect(0, h * 0.86, w, h * 0.14);
      couple(c, w * 0.5, h * 0.95, h * 0.05, t);
      hearts(c, w, h, t, 12, 4, C.rose);
    },
    cinema: function (c, w, h, t) {
      sky(c, w, h, ['#1E0E26', '#2E1638', '#3B1B3F']);
      var flick = 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 3);
      var gr = c.createLinearGradient(0, h * 0.15, 0, h * 0.5); gr.addColorStop(0, '#FFE9D6'); gr.addColorStop(1, '#F2B5C6');
      c.globalAlpha = flick; c.fillStyle = gr; c.fillRect(w * 0.1, h * 0.15, w * 0.8, h * 0.34); c.globalAlpha = 1;
      c.strokeStyle = C.butterDeep; c.lineWidth = 4; c.strokeRect(w * 0.1, h * 0.15, w * 0.8, h * 0.34);
      glowCircle(c, w * 0.5, h * 0.32, w * 0.07, 'rgba(255,255,255,.5)', 3);
      for (var row = 0; row < 3; row++) {
        for (var s = 0; s < 6; s++) {
          var x = w * (0.1 + s * 0.14) + row * 8, y = h * (0.66 + row * 0.11);
          c.fillStyle = row % 2 ? '#6B2B5F' : '#8A3B6F'; c.beginPath(); c.roundRect ? c.roundRect(x, y, w * 0.1, h * 0.08, 8) : c.rect(x, y, w * 0.1, h * 0.08); c.fill();
        }
      }
      couple(c, w * 0.5, h * 0.9, h * 0.05, t);
      hearts(c, w, h, t, 14, 3, C.blushDeep);
    }
  };

  function draw(c, w, h, key, t) {
    var fn = SCENES[key] || SCENES.table;
    c.save();
    fn(c, w, h, t || 0);
    c.restore();
  }

  // A <canvas> element with a still scene, for thumbnails.
  function canvas(key, w, h, t) {
    var el = document.createElement('canvas');
    el.width = w; el.height = h;
    el.className = 'scene';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'Illustration, not a photo of the place');
    draw(el.getContext('2d'), w, h, key, t === undefined ? 2.4 : t);
    return el;
  }

  DV.art = { draw: draw, canvas: canvas, keys: Object.keys(SCENES), colors: C, heartPath: heartPath, rng: rng };
})(typeof window !== 'undefined' ? window : globalThis);
