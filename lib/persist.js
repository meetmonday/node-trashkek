import { readFileSync, writeFileSync } from 'fs';

class Persist {
  #dbname;
  #path;

  constructor(path, name) {
    this.data = JSON.parse(readFileSync(`${path}/${name}.json`, { encoding: 'utf8', flag: 'r' }));
    this.#dbname = name;
    this.#path = path;
  }

  get() {
    return this.data;
  }

  set(data) {
    writeFileSync(`${this.#path}/${this.#dbname}.json`, JSON.stringify(data), { encoding: 'utf8' });
  }

  len() {
    return this.data.length;
  }
}

export default Persist;
