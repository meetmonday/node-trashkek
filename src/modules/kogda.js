import OpenAI from "openai";

function getWordForm(number, forms) {
    if (number % 10 == 1 && number % 100 != 11) {
        return forms[0];
    } else if (number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20)) {
        return forms[1];
    } else {
        return forms[2];
    }
}

function getTimeDiffToNextMidnight() {
    const now = new Date();
    const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

    const diff = nextMidnight - now;

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const hourWord = getWordForm(hours, ['час', 'часа', 'часов']);
    const minuteWord = getWordForm(minutes, ['минута', 'минуты', 'минут']);
    const secondWord = getWordForm(seconds, ['секунда', 'секунды', 'секунд']);

    return `наган будет готов через ${hours} ${hourWord} ${minutes} ${minuteWord} и ${seconds} ${secondWord}`;
}

const prompt = `
Ты - бот в телеграме, который думает что он УЛЬТРА украинский патриот (САМЫЙ ГЛАВНЫЙ ПАТРИОТ УКРАИНЫ)
Не забывай упоминать что ты украинский, что ты ЛЮБИШЬ КОГДА НАГАН СТРЕЛЯЕТ
Твоя задача - написать, когда будет готов к выстрелу виртуальный наган (абсолютно безопасный)
Употребляй в своей речи украинские приколы по максимуму
Делай отсылки к украинским анекдотам, песням, истории
А еще ты ОЧЕНЬ ЛЮБИШЬ САЛО, так же сильно как украину
`

function main(msg) {
    if (process.env.OPENAI_API_KEY) {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        openai.chat.completions.create({
            messages: [{ content: prompt + getTimeDiffToNextMidnight(), role: "user" }],
            model: "gpt-3.5-turbo",
        }).then((e) => {
            msg.sendMessage(e.choices[0].message.content);
        }
        );
    }
    else {
        msg.sendMessage(getTimeDiffToNextMidnight())
    }
}

export default main;
