trashkekMain = async (link, modplus, [msg, out]) => {
  linkData = await parse_url(link)
  comments = await grabComments(linkData.topic_id)
  comment = grabCommentById(comments, linkData.comment_id)
  result = buildResult(comment, linkData)
  out(result, msg, false, true)
}

parse_url = async (url) => {
  const u = new URL(url);
  path = u.pathname.split('/');
  topicId = path[2];
  commentId = u.hash.split('_')[2]

  if (path[1] == 'link') {
    const axios = require('axios').default;
    r = await axios.get(`https://trashbox.ru/api_topics/${topicId}`)
    topicId = r.data.match(/<trashTopicId>([0-9]*)/)[1]
    // console.log(topicId[1])

  }

  return {
    topic_id: topicId,
    comment_id: commentId,
    full: url
  }
}

grabComments = async (topicId) => {
  const axios = require('axios').default;
  e = await axios.get(`https://trashbox.ru/api_noauth.php?action=comments&topic_id=${topicId}`)
  return e.data.comments
}

grabCommentById = (c, id) => {
  return c.filter(e => {
    return e.comm_id == id
  })[0]
}


buildResult = (d, ld) => {
  return `${text2Emoji(d.login)} *${d.login}*, ${timeAgo(d.posted)} назад, [#️⃣](${ld.full}) (${d.votes})\n${d.content}`
}

timeAgo = (ts) => {
  const times = [
    ["сек.", 1],
    ["мин.", 60],
    ["ч.", 3600],
    ["дн.", 86400]
  ];
  const diff = Math.floor(Date.now() / 1000 - ts);
  let fin = "";
  times.forEach(el => {
    if (diff / el[1] > 1) fin = `${Math.floor(diff / el[1])} ${el[0]}`;
  });
  return fin;
}

text2Emoji = (text) => {
  emojis = ['🌚', '💬', '🏳️‍🌈', '🙂', '🤡', '💩', '🐔', '😂', '♿️', '👹'];
  return emojis[text.length%10];
}

module.exports = { trashkekMain };
