const lrand = require('lodash/random');
const dbm = require('../lib/dbManager');
const tgf = require('../lib/tgFormat');
const Factory = require('./metaFactory');

const Users = dbm.ldb('meta/users');
const Items = dbm.ldb('meta/items');
const Money = dbm.ldb('meta/money');
const Conf = dbm.ldb('meta/config');

function UserBalance(name) {
  return {
    amount: Users[name].money[0].amount, title: Money[Users[name].money[0].type].title,
  };
}

function isMetaUser(name) {
  return name in Users;
}

function ConfMod(param, value) {
  Conf[param] = value;
  dbm.sdb('meta/config', Conf);
}

function middleUnregistered([out, msg]) {
  out('Вы не зарегистрированы\n/metajoin для регистрации', msg);
}

function main(cmd, [msg, out]) {
  const argv = msg.text.replace(cmd, '');
  const name = msg.from.username;

  if (cmd === '/metajoin') {
    if (name in Users) {
      out('Вы уже в говноед', msg); return;
    }
    const rseed = [lrand(0, Conf.moneyCount - 1), lrand(0, Conf.itemsCount - 1)];
    Users[name] = Factory.User(Conf, Money, rseed);
    ConfMod('usersCount', Conf.usersCount + 1);
    const balance = UserBalance(name);

    const answ = `Вы зарегистрировались в криптометаблокчейн вселенной
В честь этого вы получаете: ${tgf.bold(balance.title)} в количестве ${balance.amount}
А также ${tgf.bold(Items[rseed[1]].title)} стоимостью ${Items[rseed[1]].value.amount * Users[name].inventory[0].quality} ${Money[Items[rseed[1]].value.currency].title}`;
    out(answ, msg);
    console.log(argv);

    dbm.sdb('meta/users', Users);
  }

  if (cmd === '/metaexit') {
    delete Users[name];
    dbm.sdb('meta/users', Users);
    console.log(`${name} выпилился из бд`);
  }

  if (cmd === '/metame') {
    if (!isMetaUser(name)) { middleUnregistered([out, msg]); return; }
    const balance = UserBalance(name);
    const res = `Ваш баланс: ${balance.amount} ${balance.title}
В вашем инвентаре: ${Users[name].inventory.length} вещей`;

    out(res, msg);
  }
}

module.exports = { main };
