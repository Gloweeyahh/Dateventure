// Checks our MongoDB store logic against a stand-in for the driver (the real driver is installed on Render).
const test = require('node:test');
const assert = require('node:assert/strict');
const DV = require('../../web/core/index.js');
const { createMongoStore } = require('../src/store-mongo');

function fakeDriver(returnShape) {
  const colls = {};
  function coll(name) {
    if (colls[name]) return colls[name];
    const rows = [];
    const match = (doc, f) => Object.keys(f).every((k) => {
      const v = f[k];
      if (v && typeof v === 'object' && '$in' in v) return v.$in.includes(doc[k]);
      return doc[k] === v;
    });
    colls[name] = {
      rows,
      async createIndex() { return 'ok'; },
      async insertOne(doc) {
        const uniq = ['token', 'manageToken', '_id'].filter((k) => doc[k] !== undefined);
        if (rows.some((r) => uniq.some((k) => r[k] === doc[k]))) { const e = new Error('E11000 duplicate key'); e.code = 11000; throw e; }
        rows.push(Object.assign({ _id: 'id' + rows.length }, doc));
        return { acknowledged: true };
      },
      async findOne(f) { return rows.find((r) => match(r, f)) || null; },
      async findOneAndUpdate(f, upd, o) {
        let r = rows.find((x) => match(x, f));
        if (!r && o && o.upsert) { r = Object.assign({}, f); rows.push(r); }
        if (!r) return returnShape === 'wrapped' ? { value: null } : null;
        if (upd.$set) Object.assign(r, upd.$set);
        if (upd.$inc) Object.keys(upd.$inc).forEach((k) => { r[k] = (r[k] || 0) + upd.$inc[k]; });
        return returnShape === 'wrapped' ? { value: r } : r;
      }
    };
    return colls[name];
  }
  class MongoClient {
    constructor(uri) { this.uri = uri; }
    async connect() { return this; }
    db() { return { collection: coll, command: async () => ({ ok: 1 }) }; }
    async close() {}
  }
  return { MongoClient };
}

for (const shape of ['direct', 'wrapped']) {
  test('mongo store (' + shape + ' driver results): full invite lifecycle, no duplicates, no _id leaks', async () => {
    const store = await createMongoStore({ uri: 'mongodb://fake', driver: fakeDriver(shape) });
    assert.equal(store.kind, 'mongo');
    assert.equal(await store.ping(), true);
    const input = { plannerName: 'A', recipientName: 'B', itemId: 'idea-board-games', budget: { amount: 10, currency: 'USD' }, clientRequestId: 'client-req-1234' };
    const a = await DV.invites.create(store, input);
    const b = await DV.invites.create(store, input);
    assert.equal(b.deduped, true);
    assert.equal(a.doc.token, b.doc.token);
    const o = await DV.invites.open(store, a.doc.token);
    assert.equal(o.status, 'opened');
    assert.equal(o._id, undefined);
    const r1 = await DV.invites.respond(store, a.doc.token, 'accept');
    assert.equal(r1.changed, true);
    const r2 = await DV.invites.respond(store, a.doc.token, 'accept');
    assert.equal(r2.changed, false);
    assert.equal((await DV.invites.manage(store, a.doc.manageToken)).status, 'accepted');
    assert.equal(await store.incr('x'), 1);
    assert.equal(await store.incr('x'), 2);
    assert.equal(await store.transition('nope', ['ready'], { status: 'x' }), null);
    await assert.rejects(() => store.insertInvite(Object.assign({}, a.doc)), (e) => e.code === 'duplicate');
  });
}
