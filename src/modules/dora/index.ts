import { readFileSync } from 'fs';
import { sendMessage } from 'kektg';
import { Message } from 'telegram-typings';
import rand from '../../lib/rand';

const lyrics = readFileSync('./static/dorafool.txt', { encoding: 'utf8', flag: 'r' }).split('\n');
const clips = readFileSync('./static/doraclips.txt', { encoding: 'utf8', flag: 'r' }).split('\n');

function lyric(msg: Message) {
  sendMessage(lyrics[rand(0, lyrics.length)], msg);
}

function clip(msg: Message) {
  sendMessage(clips[rand(0, clips.length)], msg);
}

export default { lyric, clip };
