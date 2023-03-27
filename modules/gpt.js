import axios from "axios";
import { sendMessage } from '../lib/tgApi';

let chatContext = {};
let userContext = {};

function gptCommand(msg, args) {
  const ctxid = msg.from.id;

  if (args === 'CLEAR_CTX') {
    chatContext[ctxid] = [];
    sendMessage('ПАМЯТЬ ПОЛЬЗОВАТЕЛЯ ОЧИЩЕНА', msg); return false;
  }
  if (!userContext[ctxid]) userContext[ctxid] = [];

  userContext[ctxid].push({
    content: args,
    role: "user"
  })
  axios.post('https://www.t3nsor.tech/api/chat', {
    "model": { "id": "gpt-3.5-turbo", "name": "Default (GPT-3.5)" }, "messages": userContext[ctxid], "key": "", "prompt": "You are a helpful assistant"
  }).then(e => {
    sendMessage(e.data, msg)
    userContext[ctxid].push({ content: e.data, role: 'assistant' });
  })
}

function gptcCommand(msg, args) {
  const ctxid = msg.chat.id;
  if (args === 'CLEAR_CTX') {
    chatContext[ctxid] = [];
    sendMessage('ПАМЯТЬ ЧЯТА ОЧИЩЕНА', msg); return false;
  }

  if (!chatContext[ctxid]) chatContext[ctxid] = [];

  chatContext[ctxid].push({
    content: args,
    role: "user"
  })
  axios.post('https://www.t3nsor.tech/api/chat', {
    "model": { "id": "gpt-3.5-turbo", "name": "Default (GPT-3.5)" }, "messages": chatContext[ctxid], "key": "", "prompt": "You are a helpful assistant"
  }).then(e => {
    sendMessage(e.data, msg)
    chatContext[ctxid].push({ content: e.data, role: 'assistant' });
  })
}

export { gptCommand, gptcCommand };