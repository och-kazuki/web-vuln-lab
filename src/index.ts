import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { createDatabase } from './db.js';
import { formatListenLog, resolveListenHost, resolveListenPort } from './listen.js';

const host = resolveListenHost(process.env);
const port = resolveListenPort(process.env);
const app = createApp(createDatabase());

serve({ fetch: app.fetch, hostname: host, port }, (info) => {
  console.log(formatListenLog(host, info.port));
});
