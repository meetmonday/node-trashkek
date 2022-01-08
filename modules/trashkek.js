const axios = require('axios').default;
const TurndownService = require('turndown');

const tS = new TurndownService();

async function parseUrl(url) {
  const u = new URL(url);
  const path = u.pathname.split('/');
  let topicId = path[2];
  const commentId = u.hash.split('_')[2];

  if (path[1] === 'link') {
    const r = await axios.get(`https://trashbox.ru/api_topics/${topicId}`);
    // eslint-disable-next-line prefer-destructuring
    topicId = r.data.match(/<trashTopicId>([0-9]*)/)[1];
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
  const times = [
    ['сек.', 1],
    ['мин.', 60],
    ['ч.', 3600],
    ['дн.', 86400],
  ];
  const diff = Math.floor(Date.now() / 1000 - ts);
  let fin = '';
  times.forEach((el) => {
    if (diff / el[1] > 1) fin = `${Math.floor(diff / el[1])} ${el[0]}`;
  });
  return fin;
}

function text2Emoji(text) {
  const emojis = ['🌚', '💬', '🏳️‍🌈', '🙂', '🤡', '💩', '🐔', '😂', '♿️', '👹'];
  return emojis[text.length % 10];
}

function buildResult(d, ld) {
  return `${text2Emoji(d.login)} *${d.login}*, ${timeAgo(d.posted)} назад, [#](${ld.full}) (${d.votes})\n${tS.turndown(d.content)}`;
}

const trashkekMain = async (link, modplus, [msg, out]) => {
  const linkData = await parseUrl(link);
  const comments = await grabComments(linkData.topic_id);
  const comment = grabCommentById(comments, linkData.comment_id);
  const result = buildResult(comment, linkData);
  out(result, msg, false, true);
};

module.exports = { trashkekMain };
