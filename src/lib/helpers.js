const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);

const bold = (text, html = false) => (html ? `<b>${text}</b>` : `*${text}*`);
const link = (text, url, html = false) => (html ? `<a href='${url}'>${text}</a>` : `[${text}](${url})`);
const code = (text, html = false) => (html ? `<code>${text}</code>` : `\`\`\`${text}\`\`\``);

export {
  bold, link, code, rand,
};
