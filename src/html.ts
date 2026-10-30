export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(title)} | web-vuln-lab</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: system-ui, sans-serif; line-height: 1.6; background: #f4f6f8; color: #1c1e21; }
    header, main { max-width: 52rem; margin: 0 auto; padding: 1.25rem; }
    header { padding-bottom: 0; }
    h1 { font-size: 1.7rem; line-height: 1.3; margin-bottom: 0.4rem; }
    h2 { font-size: 1.15rem; margin-top: 1.4rem; }
    a { color: #0b57d0; }
    nav a { margin-right: 0.9rem; }
    .warning { background: #fff4f4; border: 2px solid #b42318; color: #7a1212; padding: 0.9rem 1rem; border-radius: 8px; }
    .warning strong { display: block; margin-bottom: 0.25rem; }
    .card { background: #fff; border: 1px solid #d9dee7; border-radius: 8px; padding: 1rem 1.1rem; margin: 1rem 0; }
    label { display: block; margin-top: 0.75rem; font-weight: 650; }
    input[type="text"], input[type="password"] { width: 100%; max-width: 36rem; box-sizing: border-box; padding: 0.45rem 0.55rem; }
    button { display: block; margin-top: 0.9rem; padding: 0.4rem 0.85rem; }
    pre { overflow: auto; background: #111827; color: #e5e7eb; padding: 0.8rem; border-radius: 6px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d9dee7; padding: 0.35rem 0.5rem; text-align: left; vertical-align: top; }
    .ok { color: #067647; font-weight: 700; }
    .ng { color: #b42318; font-weight: 700; }
    .badge { display: inline-block; padding: 0.05rem 0.5rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
    .badge-vuln { background: #fee4e2; color: #912018; }
    .badge-safe { background: #dcfae6; color: #085d3a; }
    .links a { margin-right: 0.9rem; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/">トップ</a>
      <a href="/labs/sql-injection">SQLインジェクション</a>
    </nav>
    <p class="warning">
      <strong>意図的に脆弱な学習用アプリです。</strong>
      ローカル専用です。インターネットに公開しないでください。許可のない他者のシステムで試さないでください。教育目的に限り、悪用は禁止です。
    </p>
  </header>
  <main>
${body}
  </main>
</body>
</html>`;
}
