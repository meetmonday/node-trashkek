export default function string2emoji(text: string): string {
  const emojis = ['🌚', '💬', '🏳️‍🌈', '🙂', '🤡', '💩', '🐔', '😂', '♿️', '👹'];
  const bytes = text.split('').map((e) => e.charCodeAt(0));
  const sum = bytes.reduce((x, y) => x + y);
  return emojis[sum % 10] || '❓';
}