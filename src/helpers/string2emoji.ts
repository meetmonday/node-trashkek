/**
 * Converts a string to an emoji based on the sum of its character codes.
 * @param {string} text - The input string to convert.
 * @returns {string} An emoji corresponding to the input string.
 */

export default function string2emoji(text: string): string {
  const emojis = ['🌚', '💬', '🏳️‍🌈', '🙂', '🤡', '💩', '🐔', '😂', '♿️', '👹'];
  const bytes = text.split('').map((e) => e.charCodeAt(0));
  const sum = bytes.reduce((x, y) => x + y);
  return emojis[sum % 10] || '❓';
}