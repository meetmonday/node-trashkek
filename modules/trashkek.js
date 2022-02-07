const { get } = require('axios').default;
const TurndownService = require('turndown');

const tS = new TurndownService();

async function parseUrl(url) {
  const u = new URL(url);
  const path = u.pathname.split('/');
  let topicId = path[2];
  const commentId = u.hash.split('_')[2];

  if (path[1] === 'link') {
    const { data } = await get(`https://trashbox.ru/api_topics/${topicId}`);
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
  const e = await get(`https://trashbox.ru/api_noauth.php?action=comments&topic_id=${topicId}`);
  return e.data.comments;
}

function grabCommentById(c, id) {
  return c.filter((e) => e.comm_id === id)[0];
}

function timeAgo(ts) {
  const times = [['дн.', 86400], ['ч.', 3600], ['мин.', 60], ['сек.', 1]];
  const diff = Math.floor(Date.now() / 1000 - ts);
  // eslint-disable-next-line consistent-return
  times.forEach((el) => {
    if (diff / el[1] > 1) return `${Math.floor(diff / el[1])} ${el[0]}`;
  });
}

function text2Emoji(text) {
  const emojis = ['🌚', '💬', '🏳️‍🌈', '🙂', '🤡', '💩', '🐔', '😂', '♿️', '👹'];
  const bytes = text.split('').map((e) => e.charCodeAt(0));
  const sum = bytes.reduce((x, y) => x + y);
  return emojis[sum % 10];
}

function buildResult(d, ld) {
  return `${text2Emoji(d.login)} *${d.login}*, ${timeAgo(d.posted)} назад, [#️⃣](${ld.full}) (${d.votes})\n${tS.turndown(d.content)}`;
}

const main = async (link, modplus, [msg, out]) => {
  const linkData = await parseUrl(link);
  const comments = await grabComments(linkData.topic_id);
  const comment = grabCommentById(comments, linkData.comment_id);
  const result = buildResult(comment, linkData);
  out(result, msg, false, true);
};

module.exports = { main };
