// 마크다운 블로그 — Frontmatter 파싱 + 본문 로드
// 의존성 없이 작동 (운영 시 gray-matter, remark 추가 권장)

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export interface BlogPost {
  slug: string;
  title: string;
  description?: string;
  publishedAt: string; // YYYY-MM-DD
  channel?: string;
  targetKeywords?: string[];
  bodyMarkdown: string;
}

const CONTENT_DIR = "content/blog";

/** 프론트매터를 매우 간단히 파싱 (의존성 없는 미니 구현) */
function parseFrontmatter(raw: string): { meta: Record<string, any>; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { meta: {}, body: raw };
  const fmRaw = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, "");
  const meta: Record<string, any> = {};
  for (const line of fmRaw.split("\n")) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, key, val] = m;
    let v: any = val.trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (v.startsWith("[") && v.endsWith("]")) {
      v = v.slice(1, -1).split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    }
    meta[key] = v;
  }
  return { meta, body };
}

export async function listPosts(): Promise<BlogPost[]> {
  let files: string[] = [];
  try {
    files = await readdir(join(process.cwd(), CONTENT_DIR));
  } catch {
    return [];
  }
  const mdFiles = files.filter((f) => f.endsWith(".md"));
  const posts: BlogPost[] = [];
  for (const f of mdFiles) {
    const raw = await readFile(join(process.cwd(), CONTENT_DIR, f), "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    posts.push({
      slug: meta.slug ?? f.replace(/\.md$/, ""),
      title: meta.title ?? f,
      description: meta.description,
      publishedAt: meta.publish ?? "2026-01-01",
      channel: meta.channel,
      targetKeywords: meta.target_keywords ?? [],
      bodyMarkdown: body,
    });
  }
  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await listPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

/** 매우 간단한 마크다운 → HTML 변환 (제목·문단·코드·리스트·테이블·강조).
 *  운영 시엔 marked / remark 사용을 권장합니다. */
export function markdownToHtml(md: string): string {
  let html = md;

  // 코드 블록 (3 백틱)
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre class="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs overflow-x-auto"><code>${escapeHtml(code)}</code></pre>`;
  });

  // 헤딩
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-medium mt-6 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-medium mt-8 mb-3">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-semibold mt-2 mb-4">$1</h1>');

  // 테이블 (간단 |)
  html = html.replace(/(\n\|.+\|\n\|[-:| ]+\|\n(?:\|.+\|\n?)+)/g, (block) => {
    const lines = block.trim().split("\n");
    const head = lines[0].split("|").slice(1, -1).map((c) => c.trim());
    const rows = lines.slice(2).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
    const th = head.map((c) => `<th class="border border-gray-200 px-2 py-1 text-left font-medium">${c}</th>`).join("");
    const trs = rows
      .map((r) => `<tr>${r.map((c) => `<td class="border border-gray-200 px-2 py-1">${c}</td>`).join("")}</tr>`)
      .join("");
    return `\n<table class="text-sm w-full my-4 border-collapse"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>\n`;
  });

  // 리스트
  html = html.replace(/(^- .+(\n- .+)*)/gm, (block) => {
    const items = block.split("\n").map((l) => `<li class="ml-4">${l.replace(/^- /, "")}</li>`).join("");
    return `<ul class="list-disc list-inside my-3 space-y-1">${items}</ul>`;
  });
  html = html.replace(/(^\d+\. .+(\n\d+\. .+)*)/gm, (block) => {
    const items = block.split("\n").map((l) => `<li class="ml-4">${l.replace(/^\d+\. /, "")}</li>`).join("");
    return `<ol class="list-decimal list-inside my-3 space-y-1">${items}</ol>`;
  });

  // 강조
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-[13px]">$1</code>');

  // 문단 (빈 줄로 구분)
  html = html
    .split(/\n{2,}/)
    .map((para) => {
      if (para.match(/^<(h\d|ul|ol|pre|table|blockquote)/)) return para;
      return `<p class="leading-relaxed my-3">${para.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
