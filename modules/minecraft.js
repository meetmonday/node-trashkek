import { sendDocument } from "../lib/tgApi";

function minecraft(message) {
    sendDocument(message, { document: "https://fs118.trashstorage.ru/files10/1618934_83caa3/ru.yandex.music_2022.04.1_24022201.apk", caption: "Вот тебе майнкрафт"})
}

export default minecraft;
