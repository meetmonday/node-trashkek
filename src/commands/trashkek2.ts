import { format, link, bold, code } from "gramio";
import { markdownToFormattable } from "@gramio/format/markdown";
import { firstImgSrc, htmlCleaner } from "@/helpers/tbGarbageParser";
import string2emoji from "@/helpers/string2emoji";
import timeAgo from "@/helpers/timeAgo";

import type { BotType } from "..";
import type { Comment, CommentsResponse } from "@/types/trashkek";
import type { MusorboxComment, MusorboxCommentsResponse, MusorboxTopicResponse } from "@/types/musorbox";

const TRASHBOX_DOMAINS = ['trashbox.ru', 'redspecial.ru'];
const MUSORBOX_DOMAINS = ['nasralbox.randomshit.icu', 'kek.mtmnd.ru'];
const ACCEPTED_DOMAINS = [...TRASHBOX_DOMAINS, ...MUSORBOX_DOMAINS];

type CommentLike = {
  login: string;
  posted: number | string;
  content: string;
  votes: number;
};

async function parseUrl(url: string): Promise<{ topicId: number; commentId: number; host: string; topicTitle: string | null; }> {
  const u: URL = new URL(url);
  const pathParts: Array<string> = u.pathname.split("/").filter(Boolean);
  const host: string = u.host;

  let topicId: number = 0;
  let topicTitle: string | null = null;
  let commentId: number = parseInt(u.hash.split("_")[2] ?? "0", 10);

  if (pathParts.length < 2 || commentId === 0 || !ACCEPTED_DOMAINS.includes(host)) {
    throw new Error("Некорректная ссылка");
  }

  if (pathParts[0] === 'topics') {
    topicId = parseInt(pathParts[1]!, 10);
  }
  else if (pathParts[0] === 'link' && TRASHBOX_DOMAINS.includes(host)) {
    if (!/^[a-zA-Z0-9_-]+$/.test(pathParts[1]!)) {
      throw new Error("Некорректная ссылка");
    }
    const res = await fetch(`https://${host}/api_topics/${pathParts[1]}`);
    if (!res.ok) throw new Error('Апи топиков: ошибка');
    const data = await res.text();
    topicId = parseInt(/<trashTopicId>(\d+)<\/trashTopicId>/.exec(data)?.[1] ?? "0", 10);
    topicTitle = extractRssTitle(data);
  }

  if (topicId === 0) {
    throw new Error("Некорректная ссылка или топик не найден");
  }

  return {
    topicId,
    commentId,
    host,
    topicTitle
  }
}

async function fetchComment(host: string, topicId: number, commentId: number): Promise<CommentLike | null> {
  if (MUSORBOX_DOMAINS.includes(host)) {
    const res = await fetch(`https://${host}/api/topics/${topicId}/comments`);
    if (!res.ok) throw new Error('Апи каментов: ошибка');
    const data = await res.json() as MusorboxCommentsResponse;
    const found: MusorboxComment | undefined = data.items.find((c: MusorboxComment) => c.id === commentId);
    if (!found) return null;
    return {
      login: found.authorUsername,
      posted: new Date(found.createdAt).getTime() / 1000,
      content: found.body,
      votes: found.votesUp - found.votesDown,
    };
  }

  const res = await fetch(`https://${host}/api_noauth.php?action=comments&topic_id=${topicId}`);
  if (!res.ok) throw new Error('Апи каментов: ошибка');
  const data = await res.json() as CommentsResponse;
  const found: Comment | undefined = data.comments.find((c: Comment) => parseInt(c.comm_id, 10) === commentId);
  if (!found) return null;
  return {
    login: found.login,
    posted: found.posted,
    content: found.content,
    votes: parseInt(found.votes, 10),
  };
}

function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
    laquo: '«', raquo: '»', mdash: '—', ndash: '–', hellip: '…',
    copy: '©', reg: '®', trade: '™', deg: '°', plusmn: '±',
    times: '×', divide: '÷', middot: '·', bull: '•', sect: '§',
    para: '¶', euro: '€', pound: '£', yen: '¥', cent: '¢',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', sbquo: '‚', bdquo: '„',
    frac12: '½', frac14: '¼', frac34: '¾', sup2: '²', sup3: '³',
    micro: 'µ', larr: '←', rarr: '→', harr: '↔', shy: '\u00ad',
  };
  // отбрасываем невалидные кодовые точки (иначе fromCodePoint бросает RangeError)
  const codePoint = (code: number): string =>
    code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';

  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => codePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => codePoint(parseInt(dec, 10)))
    .replace(/&([a-z][a-z0-9]*);/gi, (match, name: string) => named[name.toLowerCase()] ?? match);
}

function extractRssTitle(rss: string): string | null {
  const title = /<item>[\s\S]*?<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(rss)?.[1];
  return title ? decodeHtmlEntities(title) : null;
}

async function fetchTopicTitle(host: string, topicId: number): Promise<string | null> {
  if (MUSORBOX_DOMAINS.includes(host)) {
    const res = await fetch(`https://${host}/api/topics/${topicId}`);
    if (!res.ok) throw new Error('Апи топиков: ошибка');
    const data = await res.json() as MusorboxTopicResponse;
    return data.topic?.title ?? null;
  }

  const apiRes = await fetch(`https://${host}/api_topics/${topicId}`);
  if (apiRes.ok) {
    const title = extractRssTitle(await apiRes.text());
    if (title) return title;
  }

  const pageRes = await fetch(`https://${host}/topics/${topicId}`);
  if (!pageRes.ok) return null;
  const html = await pageRes.text();
  const match = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i.exec(html)
    ?? /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i.exec(html);
  return match ? decodeHtmlEntities(match[1]!) : null;
}

async function main(ctx: any): Promise<void> {
  const url = ctx.text;
  let topicId: number;
  let commentId: number;
  let host: string;
  let prefetchedTitle: string | null;
  try {
    const result = await parseUrl(url);
    topicId = result.topicId;
    commentId = result.commentId;
    host = result.host;
    prefetchedTitle = result.topicTitle;
  } 
  catch (err) {
    if (err instanceof Error) {
      ctx.reply(err.message);
    }
    return;
  }

  let comment: CommentLike | null;
  try {
    comment = await fetchComment(host, topicId, commentId);
  }
  catch (err) {
    if (err instanceof Error) {
      ctx.reply(err.message);
    }
    return;
  }

  if (!comment) {
    ctx.reply("Комментарий не найден");
    return;
  }

  const baseUrl = `https://${host}`;

  let topicTitle = prefetchedTitle;
  if (!topicTitle) {
    try {
      topicTitle = await fetchTopicTitle(host, topicId);
    }
    catch {
      // не удалось получить заголовок топика — оставляем запасной текст
    }
  }
  topicTitle = topicTitle || "Ссылка на комментарий";

  ctx.send(format`
    ${string2emoji(comment.login)} ${bold(comment.login)}, ${timeAgo(comment.posted, true)} назад ${comment.votes !== 0 ? `(${comment.votes})` : ''}
    ${markdownToFormattable(htmlCleaner(comment.content, baseUrl))}

    ${link(topicTitle, url)}`,

    {
      link_preview_options: {
        is_disabled: firstImgSrc(comment.content, baseUrl) === null
      }
    }
  );


  ctx.delete();
}

export default (bot: BotType) =>
  bot.hears(/#div_comment_/, (context) => main(context));