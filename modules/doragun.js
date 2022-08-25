import PDB from '../lib/persist';
import { sendMessage } from '../lib/tgApi';

const DB = new PDB('pdb/', 'doragun');

function pickChat(chatId) {
  let res = {};
  if (chatId in DB.data) res = DB.data[chatId];
  else {
    DB.data[chatId] = {
      lastGame: 0,
      curGame: {
        created: 0,
        joined: [],
        players: 0,
      },
      winners: [],
    };

    DB.set(DB.data);
    res = DB.data;
  }

  return res;
}

function updateChat(chatId, data) {
  DB.set(DB.data[chatId] = data);
}

function createGame(pick, uid, username) {
  const res = pick;
  res.curGame.created = new Date().getTime();
  res.curGame.joined.push([uid, username]);
  res.curGame.players += 1;
  return res;
}

function newGame(msg) {
  let d = pickChat(msg.chat.id);
  updateChat(msg.chat.id, createGame(d, msg.from.id, msg.from.username))
  sendMessage('Готовы к жоскому кьютроку?\nЕсли да то /dorajoin', msg);
}

function joinGame(msg) {

}

function joinedList(msg) {

}

export default { newGame, joinGame, joinedList };
