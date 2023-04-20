import { readFileSync } from 'fs';
import { sendMessage } from '#lib/tgApi';
import { rand } from '#lib/helpers';

const lyrics = readFileSync('src/modules/dora/doralyrics.txt', { encoding: 'utf8', flag: 'r' }).split('\n');
const clips = readFileSync('src/modules/dora/doraclips.txt', { encoding: 'utf8', flag: 'r' }).split('\n');

const clip = (chat) => sendMessage(clips[rand(0, clips.length)], chat);

const lyric = (chat) => sendMessage(lyrics[rand(0, clips.length)], chat);

// пласехолдер, починю потом

export default { lyric, clip };
