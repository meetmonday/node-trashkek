const bold = (text) => `*${text}*`;
const link = (text, url) => `[${text}](${url})`;
const code = (text) => `\`\`\`${text}\`\`\``;

module.exports = { bold, link, code };
