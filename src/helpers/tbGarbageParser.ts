import { NodeHtmlMarkdown } from "node-html-markdown";

const ALLOWED_TAGS = new Set([
  'b', 'strong', 'i', 'em', 'u', 's', 'del', 'strike',
  'code', 'pre', 'blockquote', 'a',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'br', 'img'
]);

export function htmlCleaner(html: string): string {
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;

  html = html.replace(tagRegex, (match, tagName: string) => {
    return ALLOWED_TAGS.has(tagName.toLowerCase()) ? match : '';
  });

  html = html.replace(/<img\s+[^>]*src="(\/files\/[^"]+)"[^>]*>/gi, (match, src) => {
    const fullUrl = `https://trashbox.ru${src}`;
    return `<img src="${fullUrl}" alt="🖼 Пикча">`;
  });

  return NodeHtmlMarkdown.translate(html);
}

export function firstImgSrc(html: string): string | null {
  const imgTagRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/i;
  const match = imgTagRegex.exec(html);
  if (match) {
    const src = match[1];
    return src!.startsWith('/files/') ? `https://trashbox.ru${src}` : src!;
  }
  return null;

}