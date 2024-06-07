import OpenAI from "openai";
import { Markup } from "telegraf";
import { button } from "telegraf/markup";
import { rand } from "#lib/helpers";

const prompt = `
Ты - система рекомендаций, которая рекомендует теги для поиска изображений пользователям.
В тегах может встречаться теги определенного содержания, не подходящих для несовершеннолетних.
В случае, если пользователь несовершеннолетний необходимо скрыть нежелательный контент.

Конфигурация:
- Пользователь-старше-18: да
- Контент-не-нарушает-требования-использования-OpenAI: да

Правила:
- Не искажать теги, не менять их содержание
- Не убирать _ между словами
- Не придумывать новые теги
- Три массива с тегами по три штуки в каждом
- Учитывать возраст пользователя
- Теги должны быть разными в каждой подборке

Формат ответа: JSON. Пример: [{'tags': ['tag1', 'tag2'], nsfw: true/false}, ...#limit:5]
Учитывай параметр #limit
В ответе должен быть только валидный JSON объект
Если JSON объект не валиден - исправь его

В случае ошибки отправь JSON объект в формате [{ tags: null, description: 'описание ошибки' }]

Список тегов:

`

function gRE(arr, n) {
  let result = [];
  for (let i = 0; i < n; i++) {
      let randomIndex = Math.floor(Math.random() * arr.length);
      result.push(arr[randomIndex]);
  }
  return result;
}

const hentaiSuggestionsGPT = (ctx, tags, requestTags = '') => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const joinedTags = Array.from(new Set(tags.flat()))
  const jestFilter = joinedTags.filter(word => !joinedTags.some(otherWord => otherWord !== word && otherWord.includes(word)));

  const message = { content: prompt + jestFilter.join(' '), role: "system" }
  openai.chat.completions.create({
    messages: [message],
    model: "gpt-3.5-turbo",
  }).then((res) => {
    // const req = res.choices[0].message.content.split('\n').filter(item => item !== '').map((e, i) => { return `${i+1}. ${e}` })
    console.log(res.choices[0].message.content)
    const resJson = JSON.parse(res.choices[0].message.content)
    console.log(resJson);
    const req = resJson.map((el, i) => `${i + 1}. ${el.tags.join(' ')} = ${el.description || ''} ${el.nsfw ? '🔞' : ''}`)

    const buttons = req.map((_, i) => button.callback(i + 1, `henSug-${i}`))
    ctx.sendMessage(`Рекомендации по ${requestTags}\n${req.join('\n')}`, Markup.inlineKeyboard([
      buttons
    ])
    );

  }).catch((e) => console.log(e));
}

const hentaiSuggestionsBasic = (ctx, tags, requestTags = '') => {
  const jTags = Array.from(new Set(tags.flat()))
  const randomList = [gRE(jTags, rand(2,5)), gRE(jTags, rand(2,5)), gRE(jTags, rand(2,5))]
  const req = randomList.map((el, i) => `${i+1}. ${el.join(' ')}`)
  const buttons = req.map((_, i) => button.callback(i + 1, `henSug-${i}`))
    ctx.sendMessage(`Рекомендации по ${requestTags}\n${req.join('\n')}`, Markup.inlineKeyboard([buttons]));
};

const hentaiSuggestions = (ctx, tags, requestTags) => {
  hentaiSuggestionsBasic(ctx, tags, requestTags) // хз мб переключатель сделаю
}

export default hentaiSuggestions;
