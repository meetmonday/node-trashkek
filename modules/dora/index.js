import { readFileSync } from 'fs';
import { sendMessage } from '../../lib/tgApi.js';
import rand from '../../lib/rand.js';

const lyrics = readFileSync('modules/dora/dorafool.txt', { encoding: 'utf8', flag: 'r' }).split('\n');
const clips = readFileSync('modules/dora/doraclips.txt', { encoding: 'utf8', flag: 'r' }).split('\n');

function lyric(msg) {
  sendMessage(lyrics[rand(0, lyrics.length)], msg);
}

function clip(msg) {
  sendMessage(clips[rand(0, clips.length)], msg);
}

export default { lyric, clip };
