> **警告: 意図的に脆弱なアプリケーションです。**
>
> - ローカル専用です。インターネットや、自分の管理外のネットワークに公開しないでください。
> - 許可のない他者のシステムに、ここにある手法を試さないでください。入力例は、自分で起動したこのラボにだけ使います。
> - 教育目的に限ります。悪用は禁止です。
> - 作者は、この教材の使用によって生じた損害について責任を負いません。詳細は [DISCLAIMER.md](DISCLAIMER.md) を読んでください。

# web-vuln-lab

脆弱なコードと安全なコードを並べて、Web脆弱性がどこで生まれ、何を直せば止まるのかを観察する学習用ラボです。画面もデータも、すべて架空の教材です。

## 概要

サーバーは [Hono](https://hono.dev/) で動き、データは起動のたびにメモリ上の SQLite へ入れ直します。ラボは次の対で追加していきます。

- `/vulnerable/...` 意図的に脆弱な実装
- `/secure/...` 同じ機能の安全な実装

今回入っているのは共通基盤と、SQLインジェクションのラボだけです。

## 前提

どちらか一方で起動できます。

- Node.js 22（LTS）。バージョンは [`.nvmrc`](.nvmrc) と [`.node-version`](.node-version) で 22 に固定しています。
- pnpm 10.33.4。`package.json` の `packageManager` と同じです。npm と yarn は使いません。
- または Docker（Docker Compose v2）

pnpm が無い場合:

```bash
corepack enable
corepack prepare pnpm@10.33.4 --activate
```

## 起動方法

### pnpm

```bash
pnpm install
pnpm start
```

ブラウザで <http://127.0.0.1:3000> を開きます。開発中にファイル変更を反映したいときは `pnpm dev` です。

待受の初期値は `127.0.0.1` です。`HOST` を空のままにしてください。`0.0.0.0` にはしません。

### Docker

```bash
docker compose up --build
```

ホストから見るURLは同じく <http://127.0.0.1:3000> です。コンテナの中ではポート転送を受けるために `0.0.0.0` で待ち受けます。公開側は `compose.yaml` の `127.0.0.1:3000:3000` なので、ホストの外からは届きません。

## ラボ一覧とロードマップ

| 状態 | ラボ | 場所 |
| --- | --- | --- |
| 利用できる | 01 SQLインジェクション | [labs/01-sql-injection/README.md](labs/01-sql-injection/README.md) |
| 予定 | 02 クロスサイトスクリプティング（XSS） | 別PRで `labs/02-xss` を追加 |
| 予定 | 03 クロスサイトリクエストフォージェリ（CSRF） | 別PRで `labs/03-csrf` を追加 |
| 予定 | そのほかの OWASP Top 10 | 項目ごとに別PRで追加 |

XSS と CSRF のルートは、このリポジトリにはまだありません。

## ディレクトリ構成

```text
src/                         共通サーバー、待受、DB初期化、トップページ
labs/01-sql-injection/       このラボのルート、SQL、説明、テスト
labs/02-xss/                 次回以降に追加する想定
labs/03-csrf/                次回以降に追加する想定
compose.yaml                 ループバックだけへ公開する compose
Dockerfile
.github/workflows/ci.yml     install、型チェック、テスト
```

新しいラボは `labs/` にディレクトリを足し、`src/app.ts` の `labs` 配列へ登録するとトップページから辿れます。

## テスト

```bash
pnpm typecheck
pnpm test
```

CI（pull request と `main` への push）でも、同じ順に `pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm test` を実行します。

脆弱版では教材用の攻撃入力が成功し、安全版では同じ入力が失敗することをテストしています。正しいダミー資格情報でのログインと、普通の商品検索も確認します。

## ライセンス

[MIT License](LICENSE)（Copyright (c) 2026 Kazuki Ochiai）です。教育目的に限る旨と、悪用の禁止、作者が責任を負わない旨は [DISCLAIMER.md](DISCLAIMER.md) にあります。
