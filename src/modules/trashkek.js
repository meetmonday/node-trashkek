/* eslint-disable prefer-destructuring */
import axios from 'axios';
import striptags from 'striptags';

import { bold, link } from '#lib/helpers';

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
  let title = '#';
  const u = new URL(url);
  const path = u.pathname.split('/');
  let topicId = path[2];
  const commentId = u.hash.split('_')[2];

  // if (path[1] === 'link') {
  const { data } = await axios.get(`https://trashbox.ru/api_topics/${topicId}`);
  topicId = data.match(/<trashTopicId>([0-9]*)/)[1];
  title = Array.from(data.matchAll(/<!\[CDATA\[(.*?)\]\]>/g))[1][1];
  // console.log(title);
  // }

  return {
    topic_id: topicId,
    comment_id: commentId,
    full: url,
    title,
  };
}

/**
 * Fetches comments for a given topic from the Trashbox API.
 *
 * @param {number} topicId - The ID of the topic to fetch comments for.
 * @returns {Promise<Array>} A promise that resolves to an array of comments.
 */
async function grabComments(topicId) {
  const e = await axios.get(`https://trashbox.ru/api_noauth.php?action=comments&topic_id=${topicId}`);
  return e.data.comments;
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
function t2e(text) {
  const emojis = ['🌚', '💬', '🏳️‍🌈', '🙂', '🤡', '💩', '🐔', '😂', '♿️', '👹'];
  const bytes = text.split('').map((e) => e.charCodeAt(0));
  const sum = bytes.reduce((x, y) => x + y);
  return emojis[sum % 10];
}

/**
 * Replaces all <img> tags in the given HTML string with <a> tags linking to the image source.
 *
 * @param {string} htmlString - The HTML string containing <img> tags to be replaced.
 * @returns {{html: string, images: boolean}} An object containing the modified HTML string and a boolean indicating if any images were found.
 */
function replaceImgWithLink(htmlString) {
  let images = false;
  const newHtmlString = htmlString.replace(/<img([^>]*)>/gi, (match, p1) => {
    const srcMatch = p1.match(/src=(["'])(.*?)\1/);
    const src = srcMatch ? srcMatch[2] : '';
    images = true;
    return `<a href="https://trashbox.ru${src}">🖼 Пикча</a>`;
  });
  return { html: newHtmlString, images };
}

/**
 * Processes the input HTML string by removing certain tags and replacing specific HTML elements with plain text equivalents.
 *
 * @param {string} data - The input HTML string to be processed.
 * @returns {string} - The processed string with specified HTML tags removed and replacements made.
 */
function cook(data) {
  const fin = striptags(
    data
      .replaceAll('<br/>   ', '\n')
      .replaceAll('<li>', '- ')
      .replaceAll('</li>', '\n'),
    ['b', 'i', 'u', 'strike', 'a', 'img'],
  );
  return fin;
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
  return `${t2e(d.login)} ${bold(d.login, true)}, ${timeAgo(d.posted)} назад ${parseInt(d.votes, 10) !== 0 ? `(${d.votes})` : ''}\n${cook(d.content)}\n\n📜 ${link(ld.title, ld.full, true)}`;
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
const main = async (ctx) => {
  const linkData = await parseUrl(ctx.update.message.text);
  const comments = await grabComments(linkData.topic_id);
  const comment = grabCommentById(comments, linkData.comment_id);
  const midresult = buildResult(comment, linkData);
  const result = replaceImgWithLink(midresult);
  ctx.sendMessage(result.html, { link_preview_options: { is_disabled: !result.images }, parse_mode: 'html' });
  ctx.deleteMessage();
};

export default main;
