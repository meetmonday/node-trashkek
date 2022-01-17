const _ = require('lodash/random');
const dbm = require('../lib/dbManager');
const h = require('./hentai');

const dbName = 'bratan';
const db = dbm.ldb(dbName);

function main(cmd, [msg, out]) {
  if (cmd === '/bruhjoin') {
    if (msg.from.username in db.players) {
      out('Вы уже в игре', msg); return;
    }

    db.players[msg.from.username] = 0;
    db.playerCount += 1;
    out('Теперь вы можете стать братаном', msg);
    dbm.sdb(dbName, db);
  }

  if (cmd === '/bruhspin') {
    const d = new Date();
    if (db.lastPlayed === d.getDay()) {
      out(`Братан дня уже был определен: ${db.lastBruh}`, msg); return;
    }

    const bruhoftheday = Object.keys(db.players)[_(db.playerCount - 1)];
    out(`Братан дня: @${bruhoftheday}`, msg);
    db.players[bruhoftheday] += 1;
    db.lastPlayed = d.getDay();
    db.lastBruh = bruhoftheday;
    dbm.sdb(dbName, db);
  }

  if (cmd === '/bruhtop') {
    // let res = 'Топ братанов:\n';
    h.hehentai([msg, out], `\`\`\`${JSON.stringify(db.players)}\`\`\``);
  }

  if (cmd === '/bruhme') {
    out(`Вы были братаном ${db.players[msg.from.username]} раз`, msg);
  }
}

module.exports = { main };
