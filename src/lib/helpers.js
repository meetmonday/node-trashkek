/**
 * Generates a random integer between min (inclusive) and max (exclusive).
 * @param {number} min - Minimum value (inclusive).
 * @param {number} max - Maximum value (exclusive).
 * @returns {number} Random integer.
 */
const rand = (min, max) => Math.floor(Math.random() * (max - min)) + min;

/**
 * Formats text as bold.
 * @param {string} text - Text to format.
 * @param {boolean} html - If true, returns HTML format; otherwise Markdown.
 * @returns {string} Formatted text.
 */
const bold = (text, html = false) => (html ? `<b>${text}</b>` : `*${text}*`);

/**
 * Creates a markdown/html link.
 * @param {string} text - Link text.
 * @param {string} url - Link URL.
 * @param {boolean} html - If true, returns HTML format; otherwise Markdown.
 * @returns {string} Formatted link.
 */
const link = (text, url, html = false) => (
  html ? `<a href='${url}'>${text}</a>` : `[${text}](${url})`
);

/**
 * Formats text as code block.
 * @param {string} text - Text to format.
 * @param {boolean} html - If true, returns HTML format; otherwise Markdown.
 * @returns {string} Formatted text.
 */
const code = (text, html = false) => (
  html ? `<code>${text}</code>` : `\`\`\`${text}\`\`\``
);

export {
  bold, link, code, rand,
};
