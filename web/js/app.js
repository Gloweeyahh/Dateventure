/* Dateventure web: starts the app. */
(function (g) {
  var DV = (g.DV = g.DV || {});

  function boot() {
    var ok = g.fetch && g.Promise && document.createElement('canvas').getContext;
    if (!ok) {
      document.getElementById('app').textContent = 'Your browser is too old for Dateventure. Please update it or try another one.';
      return;
    }
    if (/[?&]debug=1/.test(g.location.search)) g.DV_CONFIG.DEBUG = true;
    DV.ui.log('starting in', DV.api.mode, 'mode');
    g.addEventListener('hashchange', DV.router.render);
    g.addEventListener('unhandledrejection', function (e) { console.error('Unhandled', e.reason); DV.ui.toast('Something went wrong. Please try again.', 'error'); });
    DV.router.render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
