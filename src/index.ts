import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { createDatabase } from './db.js';
import { resolveListenHost, resolveListenPort } from './listen.js';

const host = resolveListenHost(process.env);
const port = resolveListenPort(process.env);
const app = createApp(createDatabase());

serve({ fetch: app.fetch, hostname: host, port }, (info) => {
  console.log(`web-vuln-lab: http://${host}:${info.port}`);
});
