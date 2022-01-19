const lrand = require('lodash/random');

function User(Conf, Money, [moneyCount, itemsCount]) {
  const randomMoney = moneyCount;
  const randomItem = itemsCount;

  return {
    id: Conf.usersCount + 1,
    score: 0.5,
    money: [
      {
        type: randomMoney,
        amount: lrand(100, 200) / Money[randomMoney].value,
      },
    ],
    inventory: [
      {
        id: randomItem,
        quality: lrand(1, true),
        owned: 1,
      },
    ],
  };
}

module.exports = { User };
