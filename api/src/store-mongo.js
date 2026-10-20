// MongoDB store (use a free MongoDB Atlas cluster). Same methods as the in-memory store.

function strip(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

async function createMongoStore(opts) {
  const { MongoClient } = opts.driver || require('mongodb');
  const client = new MongoClient(opts.uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(opts.dbName || 'dateventure');
  const invites = db.collection('invites');
  const counters = db.collection('counters');
  const cityRequests = db.collection('cityRequests');
  await invites.createIndex({ token: 1 }, { unique: true });
  await invites.createIndex({ manageToken: 1 }, { unique: true });
  await invites.createIndex({ clientRequestId: 1 }, { unique: true, partialFilterExpression: { clientRequestId: { $type: 'string' } } });

  return {
    kind: 'mongo',
    async insertInvite(doc) {
      try {
        await invites.insertOne(Object.assign({}, doc));
        return doc;
      } catch (e) {
        if (e && e.code === 11000) { const err = new Error('duplicate'); err.code = 'duplicate'; throw err; }
        throw e;
      }
    },
    async findByToken(token) { return strip(await invites.findOne({ token: token })); },
    async findByManageToken(mt) { return strip(await invites.findOne({ manageToken: mt })); },
    async findByClientRequestId(id) { return strip(await invites.findOne({ clientRequestId: id })); },
    async transition(token, from, patch) {
      const r = await invites.findOneAndUpdate({ token: token, status: { $in: from } }, { $set: patch }, { returnDocument: 'after' });
      return strip(r && r.value !== undefined ? r.value : r);
    },
    async peek(key) { const d = await counters.findOne({ _id: key }); return d ? d.n : 0; },
    async incr(key) {
      const r = await counters.findOneAndUpdate({ _id: key }, { $inc: { n: 1 } }, { upsert: true, returnDocument: 'after' });
      const doc = r && r.value !== undefined ? r.value : r;
      return doc ? doc.n : 1;
    },
    async insertCityRequest(doc) { await cityRequests.insertOne(Object.assign({}, doc)); return true; },
    async ping() { await db.command({ ping: 1 }); return true; },
    async close() { await client.close(); }
  };
}
module.exports = { createMongoStore };
