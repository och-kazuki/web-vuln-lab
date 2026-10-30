import { escapeHtml, layout } from './html.js';
import type { Lab, RoadmapItem } from './lab.js';

export function renderHome(labs: readonly Lab[], roadmap: readonly RoadmapItem[]): string {
  const labItems = labs
    .map(
      (lab) =>
        `<li><a href="${escapeHtml(lab.path)}">${escapeHtml(lab.title)}</a><br>${escapeHtml(lab.summary)}</li>`,
    )
    .join('\n');
  const roadmapItems = roadmap
    .map((item) => `<li>${escapeHtml(item.title)}（${escapeHtml(item.note)}）</li>`)
    .join('\n');

  return layout(
    'トップ',
    `<h1>web-vuln-lab</h1>
<p>脆弱な実装と安全な実装を並べて、Web脆弱性の原因と直し方を観察するローカル専用のラボです。</p>
<div class="card">
  <h2>使えるラボ</h2>
  <ul>
${labItems}
  </ul>
  <h2>ロードマップ</h2>
  <ul>
${roadmapItems}
  </ul>
</div>
<p><a href="/disclaimer">免責事項</a></p>`,
  );
}

export function renderNotFound(): string {
  return layout(
    'ページが見つかりません',
    `<h1>ページが見つかりません</h1>
<p><a href="/">トップへ戻る</a></p>`,
  );
}

export function renderDisclaimer(text: string): string {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0 && !block.startsWith('#'))
    .map((block) => {
      const lines = block.split('\n');
      if (lines.every((line) => line.startsWith('- '))) {
        const items = lines.map((line) => `<li>${escapeHtml(line.slice(2))}</li>`).join('\n');
        return `<ul>\n${items}\n</ul>`;
      }
      return `<p>${escapeHtml(block)}</p>`;
    })
    .join('\n');

  return layout('免責事項', `<h1>免責事項</h1>\n${blocks}`);
}
