import { NodeHtmlMarkdown } from "node-html-markdown";

const ALLOWED_TAGS = new Set([
  'b', 'strong', 'i', 'em', 'u', 's', 'del', 'strike',
  'code', 'pre', 'blockquote', 'a',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'br', 'img'
]);

export function htmlCleaner(html: string, baseUrl: string = 'https://trashbox.ru'): string {
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;

  html = html.replace(tagRegex, (match, tagName: string) => {
    return ALLOWED_TAGS.has(tagName.toLowerCase()) ? match : '';
  });

  html = html.replace(/<img\s+[^>]*src="(\/[^"]+)"[^>]*>/gi, (match, src) => {
    const fullUrl = `${baseUrl}${src}`;
    return `<img src="${fullUrl}" alt="🖼 Пикча">`;
  });

  return NodeHtmlMarkdown.translate(html);
}

export function firstImgSrc(html: string, baseUrl: string = 'https://trashbox.ru'): string | null {
  const imgTagRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/i;
  const match = imgTagRegex.exec(html);
  if (match) {
    const src = match[1];
    return src!.startsWith('/') ? `${baseUrl}${src}` : src!;
  }
  return null;

}