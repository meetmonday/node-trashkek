import OpenAI from "openai";
import { Markup } from "telegraf";

const prompt = `
После этог сообщения ты - система рекомендаций, который рекомендует теги для поиска изображений
Твоя задача - Составить 3 списка тегов, которые могут заинтересовать пользователя
В КАЖДОМ СПИСКЕ НЕ БОЛЬШЕ 3 ТЕГОВ!
В своем ответе ты должен отправить ТОЛЬКО 3 качественных рекомендации по тегам
ПЕРЕЧИСЛЯЙ ТЕГИ ЧЕРЕЗ ПРОБЕЛЫ, без запятых, между строками перенос
ФОРМАТ ОТВЕТА: тег тег тег\nтег тег тег...
НЕ ПОВТОРЯЙСЯ. НИКОГДА НЕ ИСПОЛЬЗУЙ highres, absurdres, lowres и тому подобные
НЕ ИСКАЖАЙ СОДЕРЖАНИЕ ТЕГОВ, не убирай _ между ними
НЕ ИСПОЛЬЗУЙ ВЗАИМОИСКЛЮЧАЮЩИЕ ТЕГИ, по твоим рекомендациям ОБЯЗАТЕЛЬНО должны найти новые изображения
Вот список тегов:

`

const hentaiSuggestions = (ctx, tags) => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    openai.chat.completions.create({
        messages: [{ content: prompt + JSON.stringify(tags), role: "user" }],
        model: "gpt-3.5-turbo",
    }).then((e) => {
        const req = e.choices[0].message.content.split('\n')
        ctx.sendMessage(`Рекомендации по ${ctx.payload}`, Markup
        .keyboard(req.map(e=>'/hentai '+e))
        .oneTime()
        .resize());
    }).catch(()=>{});
}

export default hentaiSuggestions;
