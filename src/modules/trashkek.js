/* eslint-disable prefer-destructuring */
import axios from 'axios';
import striptags from 'striptags';

import { bold, link } from '#lib/helpers';

async function parseUrl(url) {
  let title = '#';
  const u = new URL(url);
  const path = u.pathname.split('/');
  let topicId = path[2];
  const commentId = u.hash.split('_')[2];

  // if (path[1] === 'link') {
  const { data } = await axios.get(`https://trashbox.ru/api_topics/${topicId}`);
  topicId = data.match(/<trashTopicId>([0-9]*)/)[1];
  title = Array.from(data.matchAll(/<!\[CDATA\[(.*?)\]\]>/g))[1][1];
  // console.log(title);
  // }

  return {
    topic_id: topicId,
    comment_id: commentId,
    full: url,
    title,
  };
}

async function grabComments(topicId) {
  const e = await axios.get(`https://trashbox.ru/api_noauth.php?action=comments&topic_id=${topicId}`);
  return e.data.comments;
}

function grabCommentById(c, id) {
  return c.filter((e) => e.comm_id === id)[0];
}

function timeAgo(ts) {
  let fin = null;
  const times = [
    ['сек.', 1],
    ['мин.', 60],
    ['ч.', 3600],
    ['дн.', 86400],
  ];
  const diff = Math.floor(Date.now() / 1000 - ts);
  times.forEach((el) => {
    if (diff / el[1] > 1) fin = `${Math.floor(diff / el[1])} ${el[0]}`;
  });

  return fin;
}

function t2e(text) {
  const emojis = ['🌚', '💬', '🏳️‍🌈', '🙂', '🤡', '💩', '🐔', '😂', '♿️', '👹'];
  const bytes = text.split('').map((e) => e.charCodeAt(0));
  const sum = bytes.reduce((x, y) => x + y);
  return emojis[sum % 10];
}

function replaceImgWithLink(htmlString) {
  let images = false;
  const newHtmlString = htmlString.replace(/<img([^>]*)>/gi, (match, p1) => {
    const srcMatch = p1.match(/src=(["'])(.*?)\1/);
    const src = srcMatch ? srcMatch[2] : '';
    images = true;
    return `<a href="https://trashbox.ru${src}">🖼 Пикча</a>`;
  });
  return { html: newHtmlString, images };
}

function cook(data) {
  const fin = striptags(
    data
      .replaceAll('<br/>   ', '\n')
      .replaceAll('<li>', '- ')
      .replaceAll('</li>', '\n'),
    ['b', 'i', 'u', 'strike', 'a', 'img'],
  );
  return fin;
}

function buildResult(d, ld) {
  return `${t2e(d.login)} ${bold(d.login, true)}, ${timeAgo(d.posted)} назад ${parseInt(d.votes, 10) !== 0 ? `(${d.votes})` : ''}\n${cook(d.content)}\n\n📜 ${link(ld.title, ld.full, true)}`;
}

const main = async (ctx) => {
  const linkData = await parseUrl(ctx.update.message.text);
  const comments = await grabComments(linkData.topic_id);
  const comment = grabCommentById(comments, linkData.comment_id);
  const midresult = buildResult(comment, linkData);
  const result = replaceImgWithLink(midresult);
  ctx.sendMessage(result.html, { link_preview_options: { is_disabled: !result.images }, parse_mode: 'html' });
  ctx.deleteMessage();
};

export default main;
