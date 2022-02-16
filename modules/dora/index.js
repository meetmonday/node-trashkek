const { readFileSync } = require('fs');
const { sendMessage } = require('kektg');
const { rand } = require('../../lib/rand');

const lyrics = readFileSync('modules/dora/dorafool.txt', { encoding: 'utf8', flag: 'r' }).split('\n');
const clips = readFileSync('modules/dora/doraclips.txt', { encoding: 'utf8', flag: 'r' }).split('\n');

function main(msg) {
  sendMessage(lyrics[rand(0, lyrics.length)], msg);
}

function clip(msg) {
  sendMessage(clips[rand(0, clips.length)], msg);
}

module.exports = { main, clip };