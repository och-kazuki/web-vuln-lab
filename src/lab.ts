import type { Hono } from 'hono';
import type { LabDatabase } from './db.js';

export interface Lab {
  id: string;
  title: string;
  summary: string;
  path: string;
  register: (app: Hono, db: LabDatabase) => void;
}

export interface RoadmapItem {
  title: string;
  note: string;
}

export const ROADMAP: readonly RoadmapItem[] = [
  {
    title: 'クロスサイトスクリプティング（XSS）',
    note: '別のPRで追加予定',
  },
  {
    title: 'クロスサイトリクエストフォージェリ（CSRF）',
    note: '別のPRで追加予定',
  },
  {
    title: 'そのほかの OWASP Top 10',
    note: '項目ごとに別のPRで追加予定',
  },
];
