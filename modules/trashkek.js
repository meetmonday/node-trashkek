linkParser = (urls) => {
  if(!urls) return [];

  urls.forEach(el => {
    res.append(parse_url(el))
  });
}


parse_url = (url) => {
  const u = URL(url);
  path = u.split('/');
  topicId = $path[2];

  if(path[1] === 'link') {
    const axios = require('axios').default;
    axios.get(`https://trashbox.ru/api_topics/${topicId}`).then(e=>{
      topicId = e.data.match(/<trashTopicId>([0-9]*)/)
    })
  }

  commentId = path.hash.split('_')[2]
  
  return {
    topic_id: topicId,
    comment_id: commentId,
    full: url
  }
}





grabComments = (topicId) => {
  const axios = require('axios').default;
  axios.get(`https://trashbox.ru/api_noauth.php?action=comments&topic_id=${topicId}`).then(e=>{
    return e.data.comments
  })
}