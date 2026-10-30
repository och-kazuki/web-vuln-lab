export const sqlInjectionMeta = {
  id: 'sql-injection',
  title: '01 SQLインジェクション',
  summary:
    'ログインの認証回避と、商品検索からの UNION による抽出を、文字列連結とプレースホルダで比較します。',
  path: '/labs/sql-injection',
  routes: {
    vulnerableLogin: '/vulnerable/sql-injection/login',
    secureLogin: '/secure/sql-injection/login',
    vulnerableSearch: '/vulnerable/sql-injection/search',
    secureSearch: '/secure/sql-injection/search',
  },
} as const;
