# 01 SQLインジェクション

ログイン画面と商品検索を題材に、文字列連結で組み立てたSQLと、プレースホルダで値を渡したSQLの違いを見ます。データはすべて架空です。`alice` と `bob`、商品名、パスワードは学習用の固定値で、実在の人やサービスの情報ではありません。

このラボの画面以外、とくに許可のない他者のシステムでは試さないでください。

## 1. SQLインジェクションとは

SQLは、データベースへの命令文です。アプリは利用者の入力を受け取り、「このユーザー名とパスワードの行はあるか」「この言葉を含む商品はどれか」をSQLで問い合わせます。

SQLインジェクションは、その入力の中にSQLの文法を混ぜ、アプリが用意した命令とは別の命令としてデータベースに解釈させてしまう問題です。氏名欄に名前だけを書く想定の用紙へ、「ここまでの条件は無視して、名簿の全員を合格にせよ」と書き足すのに似ています。アプリがその文を命令の一部としてそのまま貼ると、書き足した部分まで命令になります。

このラボで見るのは、よく知られた次の二つです。

- ログインの認証回避。条件を常に成り立つ形へ変えて、パスワードを知らなくても行が返る。
- 検索欄からの抽出。`UNION` で、商品テーブル向けの問い合わせに利用者テーブルの列をくっつける。

起きうる被害は、非公開データの閲覧、認証の回避、データの改ざんや削除です。このラボの脆弱版は閲覧と認証回避だけを観察できるようにしてあり、削除用の入力例は置いていません。

## 2. なぜ起こるのか

データベースは、完成したSQLの文字列を受け取ります。引用符で囲まれた部分は「値」、その外側は「命令」です。値の中に引用符を入れる入力が、命令側の引用符を途中で閉じてしまうと、続きが命令として読まれます。

脆弱なログインは、利用者の文字列をそのままSQLへ埋め込んでいます。

```typescript
export function buildVulnerableLoginSql(username: string, password: string): string {
  return `SELECT id, username, role FROM users WHERE username = '${username}' AND password = '${password}'`;
}
```

問題は `username` と `password` を、SQLの引用符の内側へ連結していることです。入力に `'` が含まれると、プログラムが置いた引用符と入力の引用符の区別がつきません。データベースから見ると、どれもただのSQLです。

脆弱な検索も同じ構造です。違うのは、埋め込み先が `LIKE` の文字列だという点だけです。

```typescript
export function buildVulnerableSearchSql(keyword: string): string {
  return `SELECT id, name, description, price FROM products WHERE name LIKE '%${keyword}%'`;
}
```

`%` は「前後に何が来てもよい」というLIKEの書き方です。その中へ検索語を連結しているため、検索語の `'` で文字列を閉じ、後ろに別の命令を続けられます。

安全版は、命令の形と値を分けて渡します。SQL本文に入力は連結しません。

```typescript
export const SECURE_LOGIN_SQL =
  'SELECT id, username, role FROM users WHERE username = ? AND password = ?';

const user = toLoginUser(db.prepare(SECURE_LOGIN_SQL).get(username, password));
```

```typescript
export const SECURE_SEARCH_SQL =
  'SELECT id, name, description, price FROM products WHERE name LIKE ?';

const rows = db.prepare(SECURE_SEARCH_SQL).all(`%${keyword}%`).map(toSearchRow);
```

検索の `` `%${keyword}%` `` は、SQL文への連結ではありません。アプリのメモリ上で「前後に `%` を付けた一つの値」を作り、`?` の位置へデータとして渡しています。`?` の個数とSQLの形は、入力が何であっても変わりません。

実装は [queries.ts](queries.ts) にあります。

## 3. 試してみよう

起動方法はリポジトリ直下の README を見てください。`pnpm start` のあと、ブラウザでは <http://127.0.0.1:3000> です。

デモ用のアカウントは次のとおりです。パスワードは学習用の平文です。

| ユーザー名 | パスワード | メール | ロール |
| --- | --- | --- | --- |
| alice | pass-alice-demo | alice@example.com | user |
| bob | pass-bob-demo | bob@example.com | user |

商品は「学習用ノート」「ダミーマグカップ」「架空のキーボード」です。`example.com` は説明用に予約されたドメインで、実在のメールボックスではありません。

### 3.1 ログインの認証回避

1. <http://127.0.0.1:3000/vulnerable/sql-injection/login> を開く。
2. ユーザー名に次を入れ、パスワードは `anything` など何でもよいので入れる。

   ```text
   ' OR '1'='1' --
   ```

3. ログイン成功と、ユーザー `alice`、見出し「実行されたSQL（学習用デバッグ）」を確認する。
4. 同じ入力を <http://127.0.0.1:3000/secure/sql-injection/login> で試す。ログイン失敗になり、SQLは表示されない。
5. 比較のため、脆弱版と安全版の両方で `alice` / `pass-alice-demo` ならログイン成功、`alice` と誤ったパスワードならログイン失敗になることも見る。

curl では次のとおりです。

```bash
curl -s -i -X POST http://127.0.0.1:3000/vulnerable/sql-injection/login \
  --data-urlencode "username=' OR '1'='1' --" \
  --data-urlencode "password=anything"
```

```bash
curl -s -i -X POST http://127.0.0.1:3000/secure/sql-injection/login \
  --data-urlencode "username=' OR '1'='1' --" \
  --data-urlencode "password=anything"
```

```bash
curl -s -i -X POST http://127.0.0.1:3000/secure/sql-injection/login \
  --data-urlencode "username=alice" \
  --data-urlencode "password=pass-alice-demo"
```

### 3.2 検索からのデータ抽出

1. <http://127.0.0.1:3000/vulnerable/sql-injection/search> を開く。
2. キーワードに次を入れる。

   ```text
   ' AND 1=0 UNION SELECT id, username, password, email FROM users --
   ```

3. 商品ではなく、`alice` と `bob` のユーザー名、ダミーパスワード、メールアドレスが表に出ることを確認する。デバッグ欄に、実行されたSQLも出ます。
4. 同じ文字列を <http://127.0.0.1:3000/secure/sql-injection/search> で検索する。該当する商品はなく、パスワードやメールアドレスは出ません。
5. 両方の検索で `ノート` を試す。どちらも「学習用ノート」だけが見つかります。

```bash
curl -s -G http://127.0.0.1:3000/vulnerable/sql-injection/search \
  --data-urlencode "q=' AND 1=0 UNION SELECT id, username, password, email FROM users --"
```

```bash
curl -s -G http://127.0.0.1:3000/secure/sql-injection/search \
  --data-urlencode "q=' AND 1=0 UNION SELECT id, username, password, email FROM users --"
```

```bash
curl -s -G http://127.0.0.1:3000/secure/sql-injection/search \
  --data-urlencode "q=ノート"
```

列数が合わない `UNION` は、脆弱版ではエラーになり、そのSQLとデータベースのメッセージをデバッグ欄に出します。安全版は、失敗しても固定の「検索に失敗しました。」だけで、SQLも内部メッセージも出しません。

## 4. 何が起きたのか

### ログイン

ユーザー名 `' OR '1'='1' --`、パスワード `anything` のとき、脆弱版が実行するSQLは次です。

```sql
SELECT id, username, role FROM users WHERE username = '' OR '1'='1' --' AND password = 'anything'
```

読み方は次のとおりです。

- 最初の `'` が、プログラムの置いたユーザー名用の引用符をすぐに閉じます。ユーザー名は空文字です。
- `OR '1'='1'` が条件に足されます。`'1'='1'` は常に真なので、ユーザー名が空でも行は残ります。
- `--` から行末まではSQLのコメントです。パスワードとの比較は、実行されません。

条件を満たす行が全部返ります。画面は id の小さい `alice` をログインユーザーとして表示します。パスワードは見られていません。

安全版がデータベースへ渡す命令の形は、常に次のままです。

```sql
SELECT id, username, role FROM users WHERE username = ? AND password = ?
```

`?` に入る値は、引用符や `OR` を含んでいてもデータのままです。ユーザー名が `' OR '1'='1' --` という文字列の行は存在しないので、ログインは失敗します。

### 検索

キーワードが次のときの脆弱版のSQLです。

```text
' AND 1=0 UNION SELECT id, username, password, email FROM users --
```

```sql
SELECT id, name, description, price FROM products WHERE name LIKE '%' AND 1=0 UNION SELECT id, username, password, email FROM users --%'
```

- `'` が LIKE の文字列を閉じます。
- `AND 1=0` で、もともとの商品側の条件を不成立にします。商品行は結果から落ちます。
- `UNION SELECT` が、列数の同じ別の結果を後ろへ足します。`products` は4列なので、`users` からも4列を選んでいます。
- `id` は id、`username` は name、`password` は description、`email` は price の位置に表示されます。表の見出しは商品検索のままです。
- `--` が、プログラムが後ろに付けていた `%'` をコメントにします。

安全版では、この文字列全体が「商品名に含まれるか探す文字」です。そのような商品名はないので、結果は空です。`users` は読まれません。

このラボのSQLiteドライバは、`prepare` で一度に1文だけ実行します。セミコロンで別の文を続ける形は、ここでは再現しません。観察する対象は、認証回避と `UNION` による抽出です。

## 5. 対策

根本の対策は、SQLの形をプログラムで固定し、利用者入力はプレースホルダ（このコードでは `?`）の値として渡すことです。値はデータとして束ねられるので、引用符を閉じたり、`UNION` を命令として足したりできません。実装の差分は [queries.ts](queries.ts) の脆弱な組み立て関数と、`SECURE_LOGIN_SQL` / `SECURE_SEARCH_SQL` です。

プレースホルダの記号はデータベースによって違い、`?` のことも `$1` のこともあります。原理は同じで、命令の文字列と値を別々に送ることです。ライブラリが文字列連結のうえで引用符をエスケープする方式もありますが、エンジンや設定によっては抜けがあります。命令を先に確定するプレースホルダを選んでください。

このラボの安全版は、比較を分かりやすくするため、引用符を禁止する入力チェックでは攻撃を落としていません。`' OR '1'='1' --` もそのまま受け取り、それでもログインできないことを見てください。引用符を拒否するチェックだけに頼ると、チェックを通る別の書き方や、チェック漏れの経路が残ります。

そのうえで、実運用では次も重ねます。一つで全部は止まりません。

- 最小権限。商品検索に使うデータベースアカウントが、利用者テーブルやパスワードのハッシュを読めないようにする。このラボはプロセス内の一つの接続で全表を読むため、その分離はしていません。
- 入力検証。文字種、長さ、形式をアプリの要件として検査する。SQLインジェクションの代わりにはならず、想定外の値を早く拒否する層です。
- エラー表示。データベースのメッセージやSQLをブラウザへ出さない。脆弱版のデバッグ表示は学習のためだけで、本番の機能ではありません。詳細はサーバー側のログに残し、画面は「検索に失敗しました。」のような決まった文にします。
- パスワードの保存。このラボは両方の実装が同じ平文ダミー値を比較できるよう、平文のまま入れています。実運用では平文を保存せず、Argon2id、bcrypt、scrypt のような遅いハッシュと照合します。ハッシュ化は、データベースのコピーが流出したときの被害を下げます。SQLの組み立てを安全にする効果はないので、プレースホルダと両方必要です。
- LIKE の `%` と `_`。安全版でも、検索語に含まれる `%` は「任意の文字列」として商品名との照合に使われます。これはSQLインジェクションではなく、LIKEのワイルドカードです。必要ならアプリ側でそれらの文字をエスケープします。

画面に結果を出すときは、データがHTMLとして解釈されないようエスケープしています。これは別の脆弱性の話で、SQLの対策そのものではありません。

## 6. 参考資料

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [CWE-89: Improper Neutralization of Special Elements used in an SQL Command](https://cwe.mitre.org/data/definitions/89.html)
- [IPA「安全なウェブサイトの作り方」](https://www.ipa.go.jp/security/vuln/websecurity/index.html)
- [IPA「安全なウェブサイトの作り方」1.1 SQLインジェクション](https://www.ipa.go.jp/security/vuln/websecurity/sql.html)
- [IPA「安全なSQLの呼び出し方」](https://www.ipa.go.jp/security/vuln/websecurity/ug65p900000196e2-att/000017320.pdf)
