/* Dateventure web: the "It's a date!" acceptance card (a 1080 x 1350 picture to save or share). */
(function (g) {
  var DV = (g.DV = g.DV || {});
  var W = 1080, H = 1350;

  function render(spec) {
    var D = DV.draw;
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var c = canvas.getContext('2d');

    var bg = c.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#FFE4E6'); bg.addColorStop(0.5, '#FFF1E6'); bg.addColorStop(1, '#FDE68A');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);

    // the card
    c.save();
    c.shadowColor = 'rgba(225,29,72,.35)'; c.shadowBlur = 60; c.shadowOffsetY = 24;
    var cg = c.createLinearGradient(0, 60, 0, 1290);
    cg.addColorStop(0, '#FFFFFF'); cg.addColorStop(1, '#FDEADB');
    c.fillStyle = cg; D.rr(c, 60, 60, 960, 1230, 56); c.fill();
    c.restore();
    c.strokeStyle = '#FECDD3'; c.lineWidth = 3; D.rr(c, 60, 60, 960, 1230, 56); c.stroke();

    // gradient picture panel with floating hearts
    c.save();
    D.rr(c, 110, 110, 860, 600, 38); c.clip();
    var pg = c.createLinearGradient(110, 110, 970, 710);
    pg.addColorStop(0, '#8B1233'); pg.addColorStop(0.55, '#E11D48'); pg.addColorStop(1, '#D97706');
    c.fillStyle = pg; c.fillRect(110, 110, 860, 600);
    var r = DV.art.rng(11);
    for (var i = 0; i < 16; i++) {
      c.globalAlpha = 0.12 + r() * 0.3; c.fillStyle = '#fff';
      DV.art.heartPath(c, 130 + r() * 820, 140 + r() * 540, 14 + r() * 36); c.fill();
    }
    c.globalAlpha = 1;
    c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 40; c.shadowOffsetY = 12;
    c.fillStyle = 'rgba(255,255,255,.96)'; DV.art.heartPath(c, 540, 470, 150); c.fill();
    c.restore();

    // stamp
    c.save(); c.translate(836, 700); c.rotate(-0.22);
    c.fillStyle = '#1C1917'; c.beginPath(); c.arc(0, 0, 104, 0, 6.2832); c.fill();
    c.strokeStyle = '#FDA4AF'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 90, 0, 6.2832); c.stroke();
    c.fillStyle = '#FAF7F2'; c.textAlign = 'center'; c.font = '800 34px ' + D.SANS; c.fillText('ACCEPTED', 0, 6);
    c.fillStyle = '#FB7185'; c.font = '700 20px ' + D.SANS; c.fillText('RSVP', 0, 38);
    c.restore();

    // words
    var x = 140, y = 800;
    c.textAlign = 'left';
    c.fillStyle = '#BE123C'; c.font = '700 28px ' + D.SANS;
    c.fillText('D A T E   C O N F I R M E D', x, y);
    c.fillStyle = '#1C1917'; c.font = '700 104px ' + D.SERIF; y += 108;
    c.fillText("It's a date!", x, y);
    c.fillStyle = '#E11D48'; c.font = 'italic 600 58px ' + D.SERIF; y += 70;
    c.fillText(spec.recipientName + ' & ' + spec.plannerName, x, y);
    c.fillStyle = '#1C1917'; c.font = '700 40px ' + D.SANS; y += 74;
    D.wrap(c, spec.item.name, 800).slice(0, 2).forEach(function (ln) { c.fillText(ln, x, y); y += 50; });
    c.fillStyle = '#57534E'; c.font = '500 28px ' + D.SANS;
    var where = DV.ui.whereLine(spec.item);
    if (where) { D.wrap(c, where, 800).slice(0, 1).forEach(function (ln) { c.fillText(ln, x, y); y += 40; }); }
    var when = spec.proposedDate ? DV.ui.fmtDate(spec.proposedDate) + (spec.plan && spec.plan[0] ? ' at ' + spec.plan[0].time : '') : (spec.plan && spec.plan[0] ? 'Starts ' + spec.plan[0].time : '');
    c.fillText(when, x, y);

    c.setLineDash([10, 10]); c.strokeStyle = 'rgba(190,18,60,.3)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, 1222); c.lineTo(940, 1222); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#57534E'; c.font = '600 26px ' + D.SANS; c.fillText('Planned with Dateventure', x, 1262);
    c.fillStyle = '#E11D48'; DV.art.heartPath(c, 925, 1252, 15); c.fill();
    return canvas;
  }

  function toBlob(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('Could not make the picture.')); }, 'image/png');
    });
  }
  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }
  function share(blob, filename, text) {
    var file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: text, title: 'It\'s a date!' });
    download(blob, filename);
    return Promise.resolve('downloaded');
  }

  DV.card = { render: render, toBlob: toBlob, download: download, share: share, W: W, H: H };
})(typeof window !== 'undefined' ? window : globalThis);
