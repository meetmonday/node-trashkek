const fs = require('fs');

function ldb(name) {
  const data = fs.readFileSync(`db/${name}.json`);
  const obj = JSON.parse(data);
  return obj;
}

function sdb(name, data) {
  fs.writeFileSync(`db/${name}.json`, JSON.stringify(data));
}

module.exports = { ldb, sdb };
