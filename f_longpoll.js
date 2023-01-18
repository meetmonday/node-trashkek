// реально взял код отсюда https://learn.javascript.ru/long-polling
// работает и похуй

import bot from "./bot";

let offset = 0;

async function subscribe() {
  let response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getUpdates?timeout=10&offset=${offset}`);
  if (response.status == 502) {
    // Статус 502 - это таймаут соединения;
    // возможен, когда соединение ожидало слишком долго
    // и сервер (или промежуточный прокси) закрыл его
    // давайте восстановим связь
    await subscribe();
  } else if (response.status != 200) {
    // Какая-то ошибка, покажем её
    console.log(response.statusText);
    // Подключимся снова через секунду.
    await new Promise(resolve => setTimeout(resolve, 1000));
    await subscribe();
  } else {
    // Получим и покажем сообщение
    let message = await response.json();
    if(message.result.length) {
      offset = message.result[message.result.length-1].update_id+1;
      bot(message.result[0].message)
    }
    // И снова вызовем subscribe() для получения следующего сообщения
    await subscribe();
  }
}

subscribe();