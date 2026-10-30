import type { LabDatabase } from '../../src/db.js';

export const SECURE_LOGIN_SQL =
  'SELECT id, username, role FROM users WHERE username = ? AND password = ?';

export const SECURE_SEARCH_SQL =
  'SELECT id, name, description, price FROM products WHERE name LIKE ?';

export interface LoginUser {
  id: string;
  username: string;
  role: string;
}

export interface SearchRow {
  id: string;
  name: string;
  description: string;
  price: string;
}

export interface LoginSuccess {
  ok: true;
  user: LoginUser;
  sql: string | null;
}

export interface LoginFailure {
  ok: false;
  reason: 'invalid' | 'error';
  sql: string | null;
  error: string | null;
}

export type LoginOutcome = LoginSuccess | LoginFailure;

export interface SearchSuccess {
  ok: true;
  rows: SearchRow[];
  sql: string | null;
}

export interface SearchFailure {
  ok: false;
  sql: string | null;
  error: string | null;
}

export type SearchOutcome = SearchSuccess | SearchFailure;

/**
 * 意図的に脆弱なログインSQL。利用者入力をSQL文字列へ連結している。
 * 学習用であり、本番コードの見本ではない。
 */
export function buildVulnerableLoginSql(username: string, password: string): string {
  return `SELECT id, username, role FROM users WHERE username = '${username}' AND password = '${password}'`;
}

/** 意図的に脆弱な検索SQL。検索語を LIKE の文字列リテラルの中へ連結している。 */
export function buildVulnerableSearchSql(keyword: string): string {
  return `SELECT id, name, description, price FROM products WHERE name LIKE '%${keyword}%'`;
}

function text(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

function toLoginUser(row: unknown): LoginUser | null {
  if (typeof row !== 'object' || row === null) {
    return null;
  }
  const record = row as Record<string, unknown>;
  if (typeof record.username !== 'string' || record.username.length === 0) {
    return null;
  }
  return {
    id: text(record.id),
    username: record.username,
    role: text(record.role),
  };
}

function toSearchRow(row: unknown): SearchRow {
  const record = (typeof row === 'object' && row !== null ? row : {}) as Record<string, unknown>;
  return {
    id: text(record.id),
    name: text(record.name),
    description: text(record.description),
    price: text(record.price),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'SQLの実行に失敗しました';
}

export function loginVulnerable(db: LabDatabase, username: string, password: string): LoginOutcome {
  const sql = buildVulnerableLoginSql(username, password);
  try {
    const users = db
      .prepare(sql)
      .all()
      .map(toLoginUser)
      .filter((user): user is LoginUser => user !== null);
    users.sort((left, right) => Number(left.id) - Number(right.id));
    const user = users[0];
    if (user === undefined) {
      return { ok: false, reason: 'invalid', sql, error: null };
    }
    return { ok: true, user, sql };
  } catch (error) {
    return { ok: false, reason: 'error', sql, error: errorMessage(error) };
  }
}

export function loginSecure(db: LabDatabase, username: string, password: string): LoginOutcome {
  // 学習用の簡略化: ダミーパスワードは平文のまま照合する。
  // 実運用では平文を保存せず、Argon2id や bcrypt などのハッシュと照合する。
  // ハッシュ化は漏えい時の被害を下げる対策であり、SQLインジェクションの根本対策はプレースホルダである。
  try {
    const user = toLoginUser(db.prepare(SECURE_LOGIN_SQL).get(username, password));
    if (user === null) {
      return { ok: false, reason: 'invalid', sql: null, error: null };
    }
    return { ok: true, user, sql: null };
  } catch {
    return { ok: false, reason: 'error', sql: null, error: null };
  }
}

export function searchVulnerable(db: LabDatabase, keyword: string): SearchOutcome {
  const sql = buildVulnerableSearchSql(keyword);
  try {
    return { ok: true, rows: db.prepare(sql).all().map(toSearchRow), sql };
  } catch (error) {
    return { ok: false, sql, error: errorMessage(error) };
  }
}

export function searchSecure(db: LabDatabase, keyword: string): SearchOutcome {
  try {
    const rows = db.prepare(SECURE_SEARCH_SQL).all(`%${keyword}%`).map(toSearchRow);
    return { ok: true, rows, sql: null };
  } catch {
    return { ok: false, sql: null, error: null };
  }
}
