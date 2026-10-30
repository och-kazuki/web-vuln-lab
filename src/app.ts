import { readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { createDatabase, type LabDatabase } from './db.js';
import { renderDisclaimer, renderHome, renderNotFound } from './home.js';
import { ROADMAP, type Lab } from './lab.js';
import { sqlInjectionLab } from '../labs/01-sql-injection/index.js';

export const labs: readonly Lab[] = [sqlInjectionLab];

const SECURITY_HEADERS: readonly (readonly [string, string])[] = [
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'no-referrer'],
  ['X-Frame-Options', 'DENY'],
  [
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  ],
  ['Cache-Control', 'no-store'],
  ['X-Robots-Tag', 'noindex, nofollow'],
];

export function createApp(db: LabDatabase = createDatabase()): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    for (const [name, value] of SECURITY_HEADERS) {
      c.header(name, value);
    }
    await next();
  });

  app.get('/', (c) => c.html(renderHome(labs, ROADMAP)));
  app.get('/disclaimer', (c) => {
    const text = readFileSync(new URL('../DISCLAIMER.md', import.meta.url), 'utf8');
    return c.html(renderDisclaimer(text));
  });

  for (const lab of labs) {
    lab.register(app, db);
  }

  app.notFound((c) => c.html(renderNotFound(), 404));
  return app;
}
