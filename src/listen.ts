/** 未指定のときはループバックだけを待ち受ける。コンテナでは HOST=0.0.0.0 を明示する。 */
export function resolveListenHost(env: Record<string, string | undefined>): string {
  const host = env.HOST?.trim();
  if (host === undefined || host.length === 0) {
    return '127.0.0.1';
  }
  return host;
}

/** 待受を起動ログの1行にする。0.0.0.0 はブラウザのURLではないので、開く先を別に書く。 */
export function formatListenLog(host: string, port: number): string {
  if (host === '0.0.0.0') {
    return `web-vuln-lab: コンテナ内で ${host}:${port} を待受中。ブラウザでは http://127.0.0.1:${port} を開いてください`;
  }
  return `web-vuln-lab: http://${host}:${port}`;
}

export function resolveListenPort(env: Record<string, string | undefined>): number {
  const raw = env.PORT?.trim();
  if (raw === undefined || raw.length === 0) {
    return 3000;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535');
  }
  return port;
}
