import type { Context, Hono } from 'hono';
import type { LabDatabase } from '../../src/db.js';
import type { Lab } from '../../src/lab.js';
import { sqlInjectionMeta } from './meta.js';
import { renderLabIndex, renderLogin, renderSearch, type LabMode } from './pages.js';
import {
  loginSecure,
  loginVulnerable,
  searchSecure,
  searchVulnerable,
  type LoginOutcome,
  type SearchOutcome,
} from './queries.js';

async function readCredentials(c: Context): Promise<{ username: string; password: string }> {
  const body = await c.req.parseBody();
  return {
    username: typeof body.username === 'string' ? body.username : '',
    password: typeof body.password === 'string' ? body.password : '',
  };
}

function registerLogin(app: Hono, db: LabDatabase, mode: LabMode): void {
  const path =
    mode === 'vulnerable'
      ? sqlInjectionMeta.routes.vulnerableLogin
      : sqlInjectionMeta.routes.secureLogin;

  app.get(path, (c) => c.html(renderLogin({ mode })));
  app.post(path, async (c) => {
    const { username, password } = await readCredentials(c);
    if (username.length === 0 || password.length === 0) {
      return c.html(
        renderLogin({
          mode,
          username,
          level: 'error',
          message: 'ユーザー名とパスワードを入力してください。',
        }),
        400,
      );
    }

    const outcome: LoginOutcome =
      mode === 'vulnerable'
        ? loginVulnerable(db, username, password)
        : loginSecure(db, username, password);

    if (outcome.ok) {
      return c.html(
        renderLogin({
          mode,
          username,
          level: 'success',
          message: 'ログイン成功',
          user: outcome.user,
          sql: outcome.sql,
        }),
      );
    }

    if (outcome.reason === 'error') {
      return c.html(
        renderLogin({
          mode,
          username,
          level: 'error',
          message:
            mode === 'vulnerable'
              ? 'SQLの実行に失敗しました。'
              : 'ログイン処理に失敗しました。',
          sql: outcome.sql,
          error: mode === 'vulnerable' ? outcome.error : null,
        }),
        500,
      );
    }

    return c.html(
      renderLogin({
        mode,
        username,
        level: 'failure',
        message: 'ログイン失敗',
        detail: 'ユーザー名またはパスワードが正しくありません。',
        sql: outcome.sql,
      }),
      401,
    );
  });
}

function registerSearch(app: Hono, db: LabDatabase, mode: LabMode): void {
  const path =
    mode === 'vulnerable'
      ? sqlInjectionMeta.routes.vulnerableSearch
      : sqlInjectionMeta.routes.secureSearch;

  app.get(path, (c) => {
    const keyword = c.req.query('q');
    if (keyword === undefined) {
      return c.html(renderSearch({ mode, keyword: '' }));
    }
    if (keyword.length === 0) {
      return c.html(
        renderSearch({
          mode,
          keyword,
          level: 'error',
          message: 'キーワードを入力してください。',
        }),
        400,
      );
    }

    const outcome: SearchOutcome =
      mode === 'vulnerable' ? searchVulnerable(db, keyword) : searchSecure(db, keyword);

    if (!outcome.ok) {
      return c.html(
        renderSearch({
          mode,
          keyword,
          level: 'error',
          message: mode === 'vulnerable' ? 'SQLの実行に失敗しました。' : '検索に失敗しました。',
          sql: outcome.sql,
          error: mode === 'vulnerable' ? outcome.error : null,
        }),
        500,
      );
    }

    return c.html(
      renderSearch({
        mode,
        keyword,
        level: 'success',
        message: outcome.rows.length === 0 ? '該当する商品はありません。' : `${outcome.rows.length}件見つかりました。`,
        rows: outcome.rows,
        sql: outcome.sql,
      }),
    );
  });
}

export const sqlInjectionLab: Lab = {
  id: sqlInjectionMeta.id,
  title: sqlInjectionMeta.title,
  summary: sqlInjectionMeta.summary,
  path: sqlInjectionMeta.path,
  register(app, db) {
    app.get(sqlInjectionMeta.path, (c) => c.html(renderLabIndex()));
    registerLogin(app, db, 'vulnerable');
    registerLogin(app, db, 'secure');
    registerSearch(app, db, 'vulnerable');
    registerSearch(app, db, 'secure');
  },
};
