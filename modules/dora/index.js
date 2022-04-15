import { readFileSync } from 'fs';
import { sendMessage } from '../../lib/tgApi';
import rand from '../../lib/rand';

const lyrics = readFileSync('modules/dora/dorafool.txt', { encoding: 'utf8', flag: 'r' }).split('\n');
const clips = readFileSync('modules/dora/doraclips.txt', { encoding: 'utf8', flag: 'r' }).split('\n');

function lyric(chat) {
  sendMessage(lyrics[rand(0, lyrics.length)], chat);
}

function clip(chat) {
  sendMessage(clips[rand(0, clips.length)], chat);
}

export default { lyric, clip };
