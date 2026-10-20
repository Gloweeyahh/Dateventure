// Simple in-memory limiter: "at most `max` requests per `windowMs` for this key".
function createLimiter(opts) {
  const hits = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, 60000);
  if (timer.unref) timer.unref();
  return {
    check(key, now) {
      now = now || Date.now();
      let h = hits.get(key);
      if (!h || h.reset <= now) { h = { n: 0, reset: now + opts.windowMs }; hits.set(key, h); }
      h.n += 1;
      return { ok: h.n <= opts.max, retryAfterSec: Math.max(1, Math.ceil((h.reset - now) / 1000)) };
    }
  };
}
module.exports = { createLimiter };
