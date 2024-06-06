import OpenAI from "openai";
import { Markup } from "telegraf";
import { button } from "telegraf/markup";

const prompt = `
Ты - система рекомендаций, которая рекомендует теги для поиска изображений
Твоя задача - Составить 3 строки с уже существующими тегами, которые обязательно заинтересуют пользователя
Не нужно придумывать несуществующие теги
Правила:
1. НИ В КОЕМ СЛУЧАЕ НЕ ИСКАЖАТЬ ТЕГИ
2. Не убирать _ между ними, разделять каждый тег пробелом
3. Не нумеровать строки
4. В каждой строке - не более 3 тегов, никак иначе

При нарушении этих правил предусмотрена система штрафов в зависимости от серьезности нарушения.

Вот список тегов:

`

const hentaiSuggestions = (ctx, tags, requestTags = '') => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const joinedTags = Array.from(new Set(tags.flat()))
  const jestFilter = joinedTags.filter(word => !joinedTags.some(otherWord => otherWord !== word && otherWord.includes(word))  );
  
  const message = { content: prompt + JSON.stringify(jestFilter), role: "system" }
  openai.chat.completions.create({
    messages: [message],
    model: "gpt-3.5-turbo",
  }).then((res) => {
    const req = res.choices[0].message.content.split('\n').filter(item => item !== '').map((e, i) => { return `${i+1}. ${e}` })
    const buttons = req.map((_,i) => button.callback(i+1, `henSug-${i}`))
    ctx.sendMessage(`Рекомендации по ${requestTags}\n${req.join('\n')}`, Markup.inlineKeyboard([
      buttons
    ])
  );

  }).catch(() => { });
}

export default hentaiSuggestions;
