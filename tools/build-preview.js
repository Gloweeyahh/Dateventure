// Builds ONE self-contained file (dist/dateventure-preview.html) that shows the whole app with
// sample data. Handy for a quick look, for sharing a demo, or for testing. Run: npm run preview
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const web = path.join(root, 'web');
let html = fs.readFileSync(path.join(web, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
  const css = fs.readFileSync(path.join(web, href), 'utf8');
  return '<style>\n' + css + '\n</style>';
});
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  let js = fs.readFileSync(path.join(web, src), 'utf8').replace(/<\/script/gi, '<\\/script');
  if (src === 'config.js') {
    js += '\nwindow.DV_CONFIG.FORCE_LOCAL = true;\nwindow.DV_CONFIG.SHOW_SAMPLE_VENUES = true;\nwindow.DV_CONFIG.PHOTOS = { hero: "", steps: {} };   // the preview cannot load outside pictures\n';
  }
  return '<script>\n' + js + '\n</script>';
});
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'dateventure-preview.html');
fs.writeFileSync(out, html);
console.log('Wrote', out, Math.round(fs.statSync(out).size / 1024) + ' KB');
