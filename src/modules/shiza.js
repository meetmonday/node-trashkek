const { sendMessagessage } = require('node-telegram-bot-api');
const fs = require('fs');

// Создаем бота и указываем токен
const bot = new TelegramBot('TOKEN', { polling: true });

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
bot.onText(/\/shiza/, (msg) => {
  // Выбираем случайную фразу и отправляем ее пользователю
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  bot.sendMessage(msg.chat.id, randomPhrase);
});

// Функция для обработки команды /shizaadd
bot.onText(/\/shizaadd (.+)/, (msg, match) => {
  // Получаем фразу из аргументов команды
  const phrase = match[1];
  // Добавляем фразу в массив и сохраняем в файл
  phrases.push(phrase);
  savePhrases();
  bot.sendMessage(msg.chat.id, 'Фраза добавлена в базу данных');
});
