import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { createApp } from './app.js';
import { formatListenLog, resolveListenHost, resolveListenPort } from './listen.js';

describe('公開範囲', () => {
  test('HOST 未指定の待受は 127.0.0.1 である', () => {
    expect(resolveListenHost({})).toBe('127.0.0.1');
    expect(resolveListenHost({ HOST: '   ' })).toBe('127.0.0.1');
    expect(resolveListenPort({})).toBe(3000);
  });

  test('コンテナ向けの HOST は明示したときだけ使う', () => {
    expect(resolveListenHost({ HOST: '0.0.0.0' })).toBe('0.0.0.0');
  });

  test('0.0.0.0 の起動ログはブラウザで開くURLを案内する', () => {
    expect(formatListenLog('0.0.0.0', 3000)).toBe(
      'web-vuln-lab: コンテナ内で 0.0.0.0:3000 を待受中。ブラウザでは http://127.0.0.1:3000 を開いてください',
    );
    expect(formatListenLog('127.0.0.1', 3000)).toBe('web-vuln-lab: http://127.0.0.1:3000');
  });

  test('compose のポート公開はホストのループバックに限る', () => {
    // イメージの /app/compose.yaml はリポジトリの同じファイル。コンテナ内の pnpm test でもこの確認が走る。
    const compose = readFileSync(new URL('../compose.yaml', import.meta.url), 'utf8');
    expect(compose).toContain('127.0.0.1:3000:3000');
    expect(compose).not.toContain('"3000:3000"');
    expect(compose).not.toContain('"0.0.0.0:3000:3000"');
  });

  test('トップページに警告とラボへのリンクがある', async () => {
    const app = createApp();
    const response = await app.request('/');
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(body).toContain('意図的に脆弱な学習用アプリです。');
    expect(body).toContain('許可のない他者のシステムで試さないでください。');
    expect(body).toContain('href="/labs/sql-injection"');
    expect(body).toContain('クロスサイトスクリプティング（XSS）');
    expect(body).toContain('クロスサイトリクエストフォージェリ（CSRF）');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
  });
});
