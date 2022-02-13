const { readFileSync } = require('fs');
const { rand } = require('../../lib/rand');

const lyrics = readFileSync('modules/dora/dorafool.txt', { encoding: 'utf8', flag: 'r' }).split('\n');
const clips = readFileSync('modules/dora/doraclips.txt', { encoding: 'utf8', flag: 'r' }).split('\n');

function main([msg, out]) {
  out(lyrics[rand(0, lyrics.length)], msg, false, true);
}

function clip([msg, out]) {
  out(clips[rand(0, clips.length)], msg, true, true);
}

module.exports = { main, clip };
