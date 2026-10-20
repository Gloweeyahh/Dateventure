// Signs venue data so an invite can only contain venues that OUR server found.
const crypto = require('crypto');

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().filter((k) => value[k] !== undefined)
      .map((k) => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function createSigner(secret) {
  const sign = (item) => crypto.createHmac('sha256', secret).update(canonical(item)).digest('base64url');
  const verify = (item, sig) => {
    if (typeof sig !== 'string' || sig.length < 20) return false;
    const a = Buffer.from(sign(item));
    const b = Buffer.from(sig);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  };
  return { sign, verify };
}
module.exports = { createSigner, canonical };
