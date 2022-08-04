import { readFileSync, writeFileSync } from 'fs';

function initPersist(file) {
  return JSON.parse(readFileSync(`pdb/${file}.json`, { encoding: 'utf8', flag: 'r' }));
}

function updatePersist(file, data) {
  writeFileSync(`pdb/${file}.json`, JSON.stringify(data), { encoding: 'utf8' });
  return data;
}

export default { initPersist, updatePersist };
