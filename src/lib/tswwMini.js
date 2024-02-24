import axios from 'axios';

const INSTANCES = [
  "https://proxitok.pabloferreiro.es/",
    "https://proxitok.pussthecat.org/",
    "https://proxitok.esmailelbob.xyz/",
    "https://proxitok.privacydev.net/",
    "https://tok.artemislena.eu/",
    "https://tok.adminforge.de/",
    "https://tik.hostux.net/",
    "https://tt.vern.cc/",
    "https://cringe.whatever.social/",
    "https://proxitok.lunar.icu/",
    "https://proxitok.privacy.com.de/",
    "https://cringe.whateveritworks.org/",
    "https://cringe.seitan-ayoub.lol/",
    "https://proxitok.kyun.li/",
    "https://cringe.datura.network/",
    "https://tt.opnxng.com/",
    "https://proxitok.tinfoil-hat.net/",
    "https://tiktok.wpme.pl/",
    "https://proxitok.r4fo.com/",
    "https://proxitok.belloworld.it/",
    "https://tok.habedieeh.re/"
  ];

function tiktokDownload(url) {
  const path = url.match(/tiktok.com\/(.*)\//)[1];
  let currentInstanceIndex = 0;

  const tryNextInstance = () => {
    const INSTANCE = INSTANCES[currentInstanceIndex];

    return new Promise((resolve, reject) => {
      axios.get(`${INSTANCE}/@placeholder/video/${path}`).then((e) => {
        const links = e.data.match(/<a target="_blank" href=".*" /gi);
        resolve(decodeURIComponent(links[1].slice(25)));
      }).catch((e) => {
        if (currentInstanceIndex < INSTANCES.length - 1) {
          currentInstanceIndex++;
          resolve(tryNextInstance());
        } else {
          reject(e);
        }
      });
    });
  }

  return tryNextInstance();
}

export { tiktokDownload };
