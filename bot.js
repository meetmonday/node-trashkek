const token = '703040807:AAFfR-tOYsc_C03pqmByj7Jft12dorrlStI';
const telega = `https://api.telegram.org/bot${token}`;

const tk = require('./mods/trashkek')


bot = (d) => {
  console.log(d)
  callback(d.text, d.chat.id)
}



callback = (text, cid) => {
  const axios = require('axios').default;
  axios.post(`${telega}/sendMessage`, {
    text: text,
    chat_id: cid
  }).catch(e=>{
    console.log(e)
  })
}

module.exports = { bot };