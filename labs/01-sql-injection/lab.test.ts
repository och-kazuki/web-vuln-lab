import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createApp } from '../../src/app.js';
import { escapeHtml } from '../../src/html.js';
import { createDatabase, DUMMY_PRODUCTS, DUMMY_USERS, type LabDatabase } from '../../src/db.js';
import { sqlInjectionMeta } from './meta.js';
import { buildVulnerableLoginSql, buildVulnerableSearchSql } from './queries.js';
import type { Hono } from 'hono';

const LOGIN_BYPASS = "' OR '1'='1' --";
const UNION_EXTRACT = "' AND 1=0 UNION SELECT id, username, password, email FROM users --";

let db: LabDatabase;
let app: Hono;

beforeEach(() => {
  db = createDatabase();
  app = createApp(db);
});

afterEach(() => {
  db.close();
});

async function postLogin(path: string, username: string, password: string): Promise<Response> {
  return app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  });
}

function alice() {
  const user = DUMMY_USERS[0];
  if (user === undefined) {
    throw new Error('alice is missing from the seed data');
  }
  return user;
}

function bob() {
  const user = DUMMY_USERS[1];
  if (user === undefined) {
    throw new Error('bob is missing from the seed data');
  }
  return user;
}

describe('SQLインジェクション実験室', () => {
  test('脆弱なログインは引用符で認証を回避できる', async () => {
    const response = await postLogin(
      sqlInjectionMeta.routes.vulnerableLogin,
      LOGIN_BYPASS,
      'anything',
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('ログイン成功');
    expect(body).toContain(`ユーザー: ${alice().username}`);
    expect(body).toContain('実行されたSQL');
    expect(body).toContain(escapeHtml(buildVulnerableLoginSql(LOGIN_BYPASS, 'anything')));
  });

  test('安全なログインは同じ入力を認証失敗にする', async () => {
    const response = await postLogin(sqlInjectionMeta.routes.secureLogin, LOGIN_BYPASS, 'anything');
    const body = await response.text();

    expect(response.status).toBe(401);
    expect(body).toContain('ログイン失敗');
    expect(body).not.toContain('ログイン成功');
    expect(body).not.toContain('実行されたSQL');
    expect(body).not.toContain(alice().password);
  });

  test('正しいダミー資格情報では脆弱版も安全版もログインできる', async () => {
    for (const path of [
      sqlInjectionMeta.routes.vulnerableLogin,
      sqlInjectionMeta.routes.secureLogin,
    ]) {
      const response = await postLogin(path, alice().username, alice().password);
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(body).toContain('ログイン成功');
      expect(body).toContain(`ユーザー: ${alice().username}`);
    }
  });

  test('誤ったパスワードでは脆弱版もログインできない', async () => {
    const response = await postLogin(
      sqlInjectionMeta.routes.vulnerableLogin,
      alice().username,
      'wrong-password',
    );
    const body = await response.text();
    expect(response.status).toBe(401);
    expect(body).toContain('ログイン失敗');
  });

  test('脆弱な検索は UNION で users のダミー情報を返す', async () => {
    const response = await app.request(
      `${sqlInjectionMeta.routes.vulnerableSearch}?q=${encodeURIComponent(UNION_EXTRACT)}`,
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain(alice().username);
    expect(body).toContain(alice().password);
    expect(body).toContain(alice().email);
    expect(body).toContain(bob().username);
    expect(body).toContain(bob().password);
    expect(body).toContain(escapeHtml(buildVulnerableSearchSql(UNION_EXTRACT)));
  });

  test('安全な検索は同じ UNION 入力から利用者情報を返さない', async () => {
    const response = await app.request(
      `${sqlInjectionMeta.routes.secureSearch}?q=${encodeURIComponent(UNION_EXTRACT)}`,
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('該当する商品はありません。');
    expect(body).not.toContain(alice().password);
    expect(body).not.toContain(bob().password);
    expect(body).not.toContain(alice().email);
    expect(body).not.toContain('実行されたSQL');
  });

  test('普通の商品名検索は脆弱版と安全版の両方でヒットする', async () => {
    const product = DUMMY_PRODUCTS[0];
    if (product === undefined) {
      throw new Error('product seed is missing');
    }

    for (const path of [
      sqlInjectionMeta.routes.vulnerableSearch,
      sqlInjectionMeta.routes.secureSearch,
    ]) {
      const response = await app.request(
        `${path}?q=${encodeURIComponent('ノート')}`,
      );
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(body).toContain(product.name);
      expect(body).not.toContain(alice().password);
    }
  });

  test('脆弱な検索はセミコロンで続く別のSQL文を実行しない', async () => {
    const response = await app.request(
      `${sqlInjectionMeta.routes.vulnerableSearch}?q=${encodeURIComponent("'; DROP TABLE users; --")}`,
    );
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(body).toContain('SQLの実行に失敗しました。');
    expect(body).toContain('実行されたSQL');

    const login = await postLogin(
      sqlInjectionMeta.routes.vulnerableLogin,
      alice().username,
      alice().password,
    );
    expect(login.status).toBe(200);
    expect(await login.text()).toContain('ログイン成功');
  });

  test('検索結果へ出した入力は HTML として解釈されない', async () => {
    const marker = '<script>alert(1)</script>';
    const response = await app.request(
      `${sqlInjectionMeta.routes.vulnerableSearch}?q=${encodeURIComponent(marker)}`,
    );
    const body = await response.text();
    expect(body).not.toContain(marker);
    expect(body).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
