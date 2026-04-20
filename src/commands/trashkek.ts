import striptags from 'striptags';
import { htmlToFormattable } from "@gramio/format/html";

import { format, bold, link } from 'gramio';

/**
 * Parses a given URL and extracts topic ID, comment ID, and title.
 *
 * @param {string} url - The URL to parse.
 * @returns {Promise<Object>} An object containing the topic ID, comment ID, full URL, and title.
 * @returns {string} return.topic_id - The extracted topic ID.
 * @returns {string} return.comment_id - The extracted comment ID.
 * @returns {string} return.full - The full URL.
 * @returns {string} return.title - The extracted title.
 */
async function parseUrl(url) {
  let title = "Топик";
  const u = new URL(url);
  const path = u.pathname.split('/');
  let topicId = path[2];
  const commentId = u.hash.split('_')[2];

  if (path[1] === 'link') {
    const res = await fetch(`https://${u.host}/api_topics/${topicId}`);
    if (!res.ok) throw new Error(`Апи топиков: ЛИКВИДИРОВАНО: ${res.status}`);
    const data = await res.text();
    topicId = data.match(/<trashTopicId>([0-9]*)/)[1];
  }

  return {
    topicId,
    commentId,
    url,
    title,
    host: u.host
  };
}

/**
 * Fetches comments for a given topic from the Trashbox API.
 *
 * @param {number} topicId - The ID of the topic to fetch comments for.
 * @returns {Promise<Array>} A promise that resolves to an array of comments.
 */
async function grabComments(topicId, host) {
  const res = await fetch(`https://${host}/api_noauth.php?action=comments&topic_id=${topicId}`);
  if (!res.ok) throw new Error(`Апи каментов: ЛИКВИДИРОВАНО: ${res.status}`);

  const data = await res.json();
  return data.comments;
}

/**
 * Retrieves a comment object from an array of comments by its ID.
 *
 * @param {Array} c - The array of comment objects.
 * @param {number|string} id - The ID of the comment to retrieve.
 * @returns {Object|undefined} The comment object with the matching ID, or undefined if not found.
 */
function grabCommentById(c, id) {
  return c.filter((e) => e.comm_id === id)[0];
}

/**
 * Converts a timestamp to a human-readable "time ago" format.
 *
 * @param {number} ts - The timestamp in seconds.
 * @returns {string|null} A string representing the time elapsed since the timestamp in the largest possible unit (seconds, minutes, hours, or days), or null if the timestamp is in the future.
 */
function timeAgo(ts) {
  let fin = null;
  const times = [
    ['сек.', 1],
    ['мин.', 60],
    ['ч.', 3600],
    ['дн.', 86400],
  ];
  const diff = Math.floor(Date.now() / 1000 - ts);
  times.forEach((el) => {
    if (diff / el[1] > 1) fin = `${Math.floor(diff / el[1])} ${el[0]}`;
  });

  return fin;
}

/**
 * Converts a given text to an emoji based on the sum of its character codes.
 *
 * @param {string} text - The input text to be converted to an emoji.
 * @returns {string} - An emoji corresponding to the sum of the character codes of the input text.
 */
function text2emoji(text) {
  const emojis = ['🌚', '💬', '🏳️‍🌈', '🙂', '🤡', '💩', '🐔', '😂', '♿️', '👹'];
  const bytes = text.split('').map((e) => e.charCodeAt(0));
  const sum = bytes.reduce((x, y) => x + y);
  return emojis[sum % 10];
}

/**
 * Builds a formatted result string based on the provided data.
 *
 * @param {Object} d - The data object containing details about the post.
 * @param {string} d.login - The login name of the user.
 * @param {string} d.posted - The timestamp of when the post was made.
 * @param {string} d.votes - The number of votes the post has received.
 * @param {string} d.content - The content of the post.
 * @param {Object} ld - The link data object containing details about the link.
 * @param {string} ld.title - The title of the link.
 * @param {string} ld.full - The full URL of the link.
 * @returns {string} The formatted result string.
 */
function buildResult(d, ld) {
  return format`
    ${text2emoji(d.login)} ${bold(d.login)}, ${timeAgo(d.posted)} назад ${parseInt(d.votes, 10) !== 0 ? `(${d.votes})` : ''}\n
    ${htmlToFormattable(d.content)}\n\n📜 
    ${link(ld.title, ld.url)}
  `;
}

/**
 * Main function to process a message context.
 * 
 * @param {Object} ctx - The context object containing the update message.
 * @param {Object} ctx.update - The update object.
 * @param {Object} ctx.update.message - The message object.
 * @param {string} ctx.update.message.text - The text of the message.
 * 
 * @returns {Promise<void>} - A promise that resolves when the function is complete.
 */
const main = (ctx) => {
  const linkData = parseUrl(ctx.text);
  const comments = grabComments(linkData.topicId, linkData.host);
  const comment = grabCommentById(comments, linkData.commentId);
  ctx.send(buildResult(comment, linkData));
  ctx.delete();
};

export default (bot: BotType) =>
    bot.hears(/#div_comment_/, (context) => main(context));