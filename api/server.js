// Starts the Dateventure API. Run with:  node api/server.js
const http = require('http');
const { createApp } = require('./src/app');
const { createLogger } = require('./src/log');

async function main() {
  const env = process.env;
  const log = createLogger(env.LOG_LEVEL);
  let store;
  if (env.MONGODB_URI) {
    const { createMongoStore } = require('./src/store-mongo');
    store = await createMongoStore({ uri: env.MONGODB_URI, dbName: env.MONGODB_DB || 'dateventure' });
    log.info('store_ready', { kind: 'mongo' });
  } else {
    store = require('../web/core/index.js').createMemoryStore();
    log.warn('store_memory', { note: 'No MONGODB_URI set. Invites are kept in memory and VANISH when the server restarts or sleeps.' });
  }
  const app = createApp({ env: env, store: store, log: log });
  const server = http.createServer(app.handle);
  server.requestTimeout = 40000;
  const port = parseInt(env.PORT || '3000', 10);
  server.listen(port, '0.0.0.0', () => log.info('listening', { port: port }));
  const stop = () => { log.info('shutting_down'); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 5000).unref(); };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}

main().catch((e) => { console.error('Could not start:', e); process.exit(1); });
