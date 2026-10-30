/** 未指定のときはループバックだけを待ち受ける。コンテナでは HOST=0.0.0.0 を明示する。 */
export function resolveListenHost(env: Record<string, string | undefined>): string {
  const host = env.HOST?.trim();
  if (host === undefined || host.length === 0) {
    return '127.0.0.1';
  }
  return host;
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
