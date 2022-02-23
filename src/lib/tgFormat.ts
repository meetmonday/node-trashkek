const bold = (text: string) => `*${text}*`;
const link = (text: string, url: string) => `[${text}](${url})`;
const code = (text: string) => `\`\`\`${text}\`\`\``;

export { bold, link, code };
