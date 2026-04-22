import { format, link, bold, code } from "gramio";
import { markdownToFormattable } from "@gramio/format/markdown";
import { firstImgSrc, htmlCleaner } from "@/helpers/tbGarbageParser";
import string2emoji from "@/helpers/string2emoji";
import timeAgo from "@/helpers/timeAgo";

import type { BotType } from "..";
import type { Comment, CommentsResponse } from "@/types/trashkek";

async function parseUrl(url: string): Promise<{ topicId: number; commentId: number; host: string; }> {
  const u: URL = new URL(url);
  const pathParts: Array<string> = u.pathname.split("/").filter(Boolean);
  const host: string = u.host;

  let topicId: number = 0;
  let commentId: number = parseInt(u.hash.split("_")[2] ?? "0", 10);

  if (pathParts.length < 2 || commentId === 0) {
    throw new Error("Некорректная ссылка");
  }

  if (pathParts[0] === 'topics') {
    topicId = parseInt(pathParts[1]!, 10);
  }
  else if (pathParts[0] === 'link') {
    const res = await fetch(`https://${host}/api_topics/${pathParts[1]}`);
    if (!res.ok) throw new Error(`Апи топиков: ЛИКВИДИРОВАНО: ${res.status}`);
    const data = await res.text();
    topicId = parseInt(/<trashTopicId>(\d+)<\/trashTopicId>/.exec(data)?.[1] ?? "0", 10);
  }

  return {
    topicId,
    commentId,
    host
  }
}


async function main(ctx: any): Promise<void> {
  const url = ctx.text;
  const { topicId, commentId, host } = await parseUrl(url);


  const res = await fetch(`https://${host}/api_noauth.php?action=comments&topic_id=${topicId}`);
  if (!res.ok) throw new Error(`Апи каментов: ЛИКВИДИРОВАНО: ${res.status}`);
  const data = await res.json() as CommentsResponse;
  const comment = data.comments.find((c: Comment) => parseInt(c.comm_id, 10) === commentId);
  if (!comment) {
    ctx.reply("Комментарий не найден");
    return;
  }

  ctx.send(format`
    ${string2emoji(comment.login)} ${bold(comment.login)}, ${timeAgo(comment.posted, true)} назад ${parseInt(comment.votes, 10) !== 0 ? `(${comment.votes})` : ''}
    ${markdownToFormattable(htmlCleaner(comment.content))}

    ${link("Ссылка на комментарий", url)}`,

    {
      link_preview_options: {
        is_disabled: firstImgSrc(comment.content) === null
      }
    }
  );


  ctx.delete();
}

export default (bot: BotType) =>
  bot.hears(/#div_comment_/, (context) => main(context));