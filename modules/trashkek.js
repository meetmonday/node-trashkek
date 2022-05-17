import axios from 'axios';
import { sendMessage, deleteMessage } from '../lib/tgApi';

import { bold } from '../lib/tgFormat';

async function parseUrl(url) {
  const u = new URL(url);
  const path = u.pathname.split('/');
  let topicId = path[2];
  const commentId = u.hash.split('_')[2];

  if (path[1] === 'link') {
    const { data } = await axios.get(`https://trashbox.ru/api_topics/${topicId}`);
    // eslint-disable-next-line prefer-destructuring
    topicId = data.match(/<trashTopicId>([0-9]*)/)[1];
  }

  return {
    topic_id: topicId,
    comment_id: commentId,
    full: url,
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

function buildResult(d, ld) {
  return `${t2e(d.login)} ${bold(d.login)}, ${timeAgo(d.posted)} назад, [#️⃣](${ld.full}) (${d.votes})\n${d.content}`;
}

const main = async (msg) => {
  const linkData = await parseUrl(msg.text);
  const comments = await grabComments(linkData.topic_id);
  const comment = grabCommentById(comments, linkData.comment_id);
  const result = buildResult(comment, linkData);
  sendMessage(result, msg, { disablePreview: true });
  deleteMessage(msg);
};

export default main;
