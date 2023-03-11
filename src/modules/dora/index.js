// import { readFileSync } from 'fs';
import { sendMessage } from '#lib/tgApi';
import { rand } from '#lib/helpers';

// const lyrics = readFileSync('#src/modules/dora/dorafool.txt', { encoding: 'utf8', flag: 'r' }).split('\n');
// const clips = readFileSync('#src/modules/dora/doraclips.txt', { encoding: 'utf8', flag: 'r' }).split('\n');

// const lyric = (chat) => sendMessage(lyrics[rand(0, lyrics.length)], chat);
// const clip = (chat) => sendMessage(clips[rand(0, clips.length)], chat);

const lyric = (chat) => sendMessage('в розработке.......', chat);
const clip = (chat) => lyric(chat);

// пласехолдер, починю потом

export default { lyric, clip };
