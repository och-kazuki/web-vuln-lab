import Database from 'better-sqlite3';

export type LabDatabase = Database.Database;

export interface DummyUser {
  id: number;
  username: string;
  password: string;
  email: string;
  role: string;
}

export interface DummyProduct {
  id: number;
  name: string;
  description: string;
  price: number;
}

/** 架空の学習用データ。example.com は文書用に予約されたドメイン。 */
export const DUMMY_USERS: readonly DummyUser[] = [
  {
    id: 1,
    username: 'alice',
    password: 'pass-alice-demo',
    email: 'alice@example.com',
    role: 'user',
  },
  {
    id: 2,
    username: 'bob',
    password: 'pass-bob-demo',
    email: 'bob@example.com',
    role: 'user',
  },
];

export const DUMMY_PRODUCTS: readonly DummyProduct[] = [
  {
    id: 1,
    name: '学習用ノート',
    description: 'ラボ用の架空のノート',
    price: 500,
  },
  {
    id: 2,
    name: 'ダミーマグカップ',
    description: '存在しない店舗のマグカップ',
    price: 800,
  },
  {
    id: 3,
    name: '架空のキーボード',
    description: '学習データ用のキーボード',
    price: 3200,
  },
];

const SCHEMA = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL
);
`;

/** プロセス内のメモリDBを作り、起動のたびに同じダミーデータで埋める。 */
export function createDatabase(): LabDatabase {
  const db = new Database(':memory:');
  db.exec(SCHEMA);

  const insertUser = db.prepare(
    'INSERT INTO users (id, username, password, email, role) VALUES (@id, @username, @password, @email, @role)',
  );
  const insertProduct = db.prepare(
    'INSERT INTO products (id, name, description, price) VALUES (@id, @name, @description, @price)',
  );

  const seed = db.transaction(() => {
    for (const user of DUMMY_USERS) {
      insertUser.run(user);
    }
    for (const product of DUMMY_PRODUCTS) {
      insertProduct.run(product);
    }
  });
  seed();

  return db;
}
