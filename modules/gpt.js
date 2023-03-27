import axios from "axios";
import { sendMessage } from '../lib/tgApi';

function main(msg, args) {
  axios.post('https://www.t3nsor.tech/api/chat', {
    "model":{"id":"gpt-3.5-turbo","name":"Default (GPT-3.5)"},"messages":[{"role":"user","content":args}],"key":"","prompt":"You are a helpful assistant"
  }).then(e=>{
    sendMessage(e.data, msg)
  })
}


export default main;