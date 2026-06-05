// Blog system placeholder. Real implementation pending.
// All functions return safe defaults so other code can compile.

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  content?: string;
}

export function getAllPosts(): BlogPost[] {
  return [];
}

export function getPostBySlug(slug: string): BlogPost | null {
  return null;
}

export function getAllSlugs(): string[] {
  return [];
}

export function markdownToHtml(md: string): string {
  return md;
}