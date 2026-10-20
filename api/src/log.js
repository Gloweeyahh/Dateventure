// Tiny JSON logger. One line per event, easy to read in the Render "Logs" tab.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
function createLogger(level) {
  const min = LEVELS[level] || LEVELS.info;
  function out(lvl, msg, extra) {
    if (LEVELS[lvl] < min) return;
    const line = JSON.stringify(Object.assign({ t: new Date().toISOString(), level: lvl, msg: msg }, extra || {}));
    (lvl === 'error' || lvl === 'warn' ? console.error : console.log)(line);
  }
  return {
    debug: (m, e) => out('debug', m, e), info: (m, e) => out('info', m, e),
    warn: (m, e) => out('warn', m, e), error: (m, e) => out('error', m, e)
  };
}
module.exports = { createLogger };
