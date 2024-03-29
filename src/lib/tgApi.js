/* eslint-disable camelcase */
import axios from 'axios';

const tgAPI = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

function sendMessage(text, { chat }, { disablePreview, htmlParseMode } = {}, callback = () => { }) {
  axios.post(`${tgAPI}/sendMessage`, {
    text,
    chat_id: chat.id,
    parse_mode: htmlParseMode ? 'HTML' : 'Markdown',
    disable_web_page_preview: disablePreview || false,
  }).then(({ data }) => callback(data)).catch((err) => { console.log(err); });
}

function deleteMessage({ chat, message_id }) {
  axios.post(`${tgAPI}/deleteMessage`, {
    chat_id: chat.id,
    message_id,
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
  }).catch((e) => {
    sendMessage("Пашок, што за `" + e.response.data.description + "`.\nУрыл: " + video, { chat: chat })
  });
}

function sendDocument({ chat }, { document, caption } = {}) {
  axios.post(`${tgAPI}/sendDocument`, {
    chat_id: chat.id,
    document,
    caption,
  });
}

function answerInlineQuery(id, results) {
  axios.post(`${tgAPI}/answerInlineQuery`, {
    inline_query_id: id,
    results,
  });
}

export {
  sendMessage, deleteMessage, sendVideo, sendPhoto, sendDocument, answerInlineQuery,
};
