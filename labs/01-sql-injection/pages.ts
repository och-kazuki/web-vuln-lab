import { escapeHtml, layout } from '../../src/html.js';
import { DUMMY_PRODUCTS, DUMMY_USERS } from '../../src/db.js';
import type { LoginUser, SearchRow } from './queries.js';
import { sqlInjectionMeta } from './meta.js';

export type LabMode = 'vulnerable' | 'secure';

interface LoginView {
  mode: LabMode;
  username?: string;
  level?: 'success' | 'failure' | 'error';
  message?: string;
  detail?: string;
  user?: LoginUser;
  sql?: string | null;
  error?: string | null;
}

interface SearchView {
  mode: LabMode;
  keyword: string;
  level?: 'success' | 'error';
  message?: string;
  rows?: SearchRow[];
  sql?: string | null;
  error?: string | null;
}

function badge(mode: LabMode): string {
  if (mode === 'vulnerable') {
    return '<span class="badge badge-vuln">脆弱版</span>';
  }
  return '<span class="badge badge-safe">安全版</span>';
}

function comparisonLinks(): string {
  const { routes } = sqlInjectionMeta;
  return `<p class="links">
  <a href="${routes.vulnerableLogin}">脆弱なログイン</a>
  <a href="${routes.secureLogin}">安全なログイン</a>
  <a href="${routes.vulnerableSearch}">脆弱な検索</a>
  <a href="${routes.secureSearch}">安全な検索</a>
</p>`;
}

function sqlDebug(sql: string | null | undefined, error: string | null | undefined): string {
  if (sql === undefined || sql === null) {
    return '';
  }
  const errorBlock =
    error === undefined || error === null || error.length === 0
      ? ''
      : `<p class="ng">データベースのメッセージ</p><pre>${escapeHtml(error)}</pre>`;
  return `<h2>実行されたSQL（学習用デバッグ）</h2>
<p>脆弱版だけが、実際に組み立てたSQLを表示します。安全版はSQLも内部エラーも画面に出しません。</p>
<pre>${escapeHtml(sql)}</pre>
${errorBlock}`;
}

export function renderLabIndex(): string {
  const accounts = DUMMY_USERS.map(
    (user) => `<li><code>${escapeHtml(user.username)}</code> / <code>${escapeHtml(user.password)}</code>（${escapeHtml(user.role)}）</li>`,
  ).join('\n');
  const products = DUMMY_PRODUCTS.map(
    (product) => `<li>${escapeHtml(product.name)}（${product.price}円）</li>`,
  ).join('\n');

  return layout(
    sqlInjectionMeta.title,
    `<h1>${escapeHtml(sqlInjectionMeta.title)}</h1>
<p>${escapeHtml(sqlInjectionMeta.summary)}</p>
${comparisonLinks()}
<div class="card">
  <h2>デモ用のアカウント</h2>
  <p>パスワードは学習用の固定ダミー値で、平文のまま入っています。実在の認証情報ではありません。</p>
  <ul>
${accounts}
  </ul>
  <h2>デモ用の商品</h2>
  <ul>
${products}
  </ul>
</div>
<p>手順と解説は <code>labs/01-sql-injection/README.md</code> にあります。</p>`,
  );
}

export function renderLogin(view: LoginView): string {
  const action =
    view.mode === 'vulnerable'
      ? sqlInjectionMeta.routes.vulnerableLogin
      : sqlInjectionMeta.routes.secureLogin;
  const counterpart =
    view.mode === 'vulnerable'
      ? `<a href="${sqlInjectionMeta.routes.secureLogin}">同じ入力を安全版で試す</a>`
      : `<a href="${sqlInjectionMeta.routes.vulnerableLogin}">同じ入力を脆弱版で試す</a>`;
  const result = renderLoginResult(view);
  const hashing =
    view.mode === 'secure'
      ? `<p>この安全版が止めているのは、SQLの形と値の混線です。パスワード照合そのものは、学習用に平文のダミー値同士で行っています。実運用では平文を保存せず、Argon2id や bcrypt などのハッシュと照合します。ハッシュ化は漏えい時の被害を下げますが、SQLインジェクションの根本対策はプレースホルダです。</p>`
      : '';

  return layout(
    view.mode === 'vulnerable' ? '脆弱なログイン' : '安全なログイン',
    `<h1>ログイン ${badge(view.mode)}</h1>
${comparisonLinks()}
<p>${counterpart}</p>
${hashing}
<form method="post" action="${action}">
  <label for="username">ユーザー名</label>
  <input id="username" name="username" type="text" value="${escapeHtml(view.username ?? '')}" autocomplete="off">
  <label for="password">パスワード</label>
  <input id="password" name="password" type="password" autocomplete="off">
  <button type="submit">ログイン</button>
</form>
${result}
${view.mode === 'vulnerable' ? sqlDebug(view.sql, view.error) : ''}`,
  );
}

function renderLoginResult(view: LoginView): string {
  if (view.message === undefined) {
    return '';
  }
  if (view.level === 'success' && view.user !== undefined) {
    return `<div class="card">
  <p class="ok">${escapeHtml(view.message)}</p>
  <p>ユーザー: ${escapeHtml(view.user.username)}（role: ${escapeHtml(view.user.role)}）</p>
</div>`;
  }
  const detail = view.detail === undefined ? '' : `<p>${escapeHtml(view.detail)}</p>`;
  const className = view.level === 'failure' || view.level === 'error' ? 'ng' : 'ok';
  return `<div class="card"><p class="${className}">${escapeHtml(view.message)}</p>${detail}</div>`;
}

export function renderSearch(view: SearchView): string {
  const action =
    view.mode === 'vulnerable'
      ? sqlInjectionMeta.routes.vulnerableSearch
      : sqlInjectionMeta.routes.secureSearch;
  const counterpart =
    view.mode === 'vulnerable'
      ? `<a href="${sqlInjectionMeta.routes.secureSearch}">同じ入力を安全版で試す</a>`
      : `<a href="${sqlInjectionMeta.routes.vulnerableSearch}">同じ入力を脆弱版で試す</a>`;
  const message =
    view.message === undefined
      ? ''
      : `<p class="${view.level === 'error' ? 'ng' : 'ok'}">${escapeHtml(view.message)}</p>`;
  const table = renderRows(view.rows, view.mode);

  return layout(
    view.mode === 'vulnerable' ? '脆弱な商品検索' : '安全な商品検索',
    `<h1>商品検索 ${badge(view.mode)}</h1>
${comparisonLinks()}
<p>${counterpart}</p>
<p>商品名の一部を入力します。脆弱版は入力をSQLへ連結し、安全版は同じ文字列をプレースホルダの値として渡します。</p>
<form method="get" action="${action}">
  <label for="q">キーワード</label>
  <input id="q" name="q" type="text" value="${escapeHtml(view.keyword)}" autocomplete="off">
  <button type="submit">検索</button>
</form>
<div class="card">
  ${message}
  ${table}
</div>
${view.mode === 'vulnerable' ? sqlDebug(view.sql, view.error) : ''}`,
  );
}

function renderRows(rows: SearchRow[] | undefined, mode: LabMode): string {
  if (rows === undefined) {
    return '';
  }
  if (rows.length === 0) {
    return '';
  }
  const body = rows
    .map(
      (row) => `<tr>
  <td>${escapeHtml(row.id)}</td>
  <td>${escapeHtml(row.name)}</td>
  <td>${escapeHtml(row.description)}</td>
  <td>${escapeHtml(row.price)}</td>
</tr>`,
    )
    .join('\n');
  return `<table>
  <thead>
    <tr><th>id</th><th>name</th><th>description</th><th>price</th></tr>
  </thead>
  <tbody>
${body}
  </tbody>
</table>
${
  mode === 'vulnerable'
    ? '<p>列はクエリの並びです。UNION で別テーブルを読むと、users の username / password / email が name / description / price の位置に入ります。</p>'
    : ''
}`;
}
