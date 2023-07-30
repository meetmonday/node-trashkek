import { sendMessage } from '#lib/tgApi';
import fs from 'fs';

// Читаем файл с фразами
let phrases = [];
try {
  const data = fs.readFileSync('phrases.json');
  phrases = JSON.parse(data);
} catch (err) {
  console.error(err);
}

// Функция для сохранения фраз в файл
function savePhrases() {
  fs.writeFile('phrases.json', JSON.stringify(phrases), (err) => {
    if (err) throw err;
  });
}

// Функция для обработки команды /shiza
function shiz(msg) {
  // Выбираем случайную фразу и отправляем ее пользователю
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  sendMessage(randomPhrase, msg);
};

// Функция для обработки команды /shiza add
function shizad(msg) {
  // Получаем фразу из аргументов команды
  const phrase = msg.message.reply_to_message.text;
  // Добавляем фразу в массив и сохраняем в файл
  phrases.push(phrase);
  savePhrases();
  sendMessage('Фраза добавлена в базу данных', msg);
};

const shizaRouter = (msg, args) => (args ? shizad(args, msg) : shiz(msg));

export default shizaRouter;