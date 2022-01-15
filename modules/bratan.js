const _ = require('lodash/random');
const dbm = require('./dbm');
const h = require('./hentai');

const db = 'bratan';
const br = dbm.ldb(db);

function init(text, [msg, out]) {
  if (text.includes('/bruhjoin')) {
    if (msg.from.username in br.players) {
      out('Вы уже в игре', msg);
    } else {
      br.players[msg.from.username] = 0;
      br.playerCount += 1;
      out('Теперь вы можете стать братаном', msg);
      dbm.sdb(db, br);
    }
  }

  if (text.includes('/bruhspin')) {
    const d = new Date();
    if (br.lastPlayed !== d.getDay()) {
      const bruhoftheday = Object.keys(br.players)[_(br.playerCount - 1)];
      out(`Братан дня: @${bruhoftheday}`, msg);
      br.players[bruhoftheday] += 1;
      br.lastPlayed = d.getDay();
      br.lastBruh = bruhoftheday;
      dbm.sdb(db, br);
    } else {
      out(`Братан дня уже был определен: ${br.lastBruh}`, msg);
    }
  }

  if (text.includes('/bruhtop')) {
    // let res = 'Топ братанов:\n';
    h.hehentai([msg, out], `\`\`\`${JSON.stringify(br.players)}\`\`\``);
  }

  if (text.includes('/bruhme')) {
    out(`Вы были братаном ${br.players[msg.from.username]} раз`, msg);
  }
}

module.exports = { init };
