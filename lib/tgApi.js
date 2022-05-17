import axios from 'axios';

const tgAPI = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

function sendMessage(text, { chat }, { disablePreview } = {}, callback = () => {}) {
  axios.post(`${tgAPI}/sendMessage`, {
    text,
    chat_id: chat.id,
    parse_mode: 'Markdown',
    disable_web_page_preview: disablePreview || false,
  }).then(({ data }) => callback(data)).catch((err) => { throw err.data; });
}

function deleteMessage({ chat, messageId }) {
  axios.post(`${tgAPI}/deleteMessage`, {
    chat_id: chat.id,
    message_id: messageId,
  }).catch((err) => { console.log(err); });
}

function sendPhoto({ chat }, { photo, caption } = {}) {
  axios.post(`${tgAPI}/sendPhoto`, {
    chat_id: chat.id,
    photo,
    caption,
    parse_mode: 'Markdown',
  });
}

function sendVideo({ chat }, { video, caption } = {}) {
  axios.post(`${tgAPI}/sendVideo`, {
    chat_id: chat.id,
    video,
    caption,
  });
}

function sendDocument({ chat }, { document, caption } = {}) {
  axios.post(`${tgAPI}/sendDocument`, {
    chat_id: chat.id,
    document,
    caption,
  });
}

export {
  sendMessage, deleteMessage, sendVideo, sendPhoto, sendDocument,
};
