const { readFileSync } = require('fs');
const { rand } = require('../../lib/rand');

const lyrics = readFileSync('modules/dora/dorafool.txt', { encoding: 'utf8', flag: 'r' }).split('\n');

function main([msg, out]) {
  out(lyrics[rand(0, lyrics.length)], msg, false, true);
}

module.exports = { main };
