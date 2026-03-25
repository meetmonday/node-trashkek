import axios from 'axios';
import striptags from 'striptags';

import { bold, link } from '#lib/helpers.js';

// Create a reusable axios instance with optimized defaults
const apiClient = axios.create({
  timeout: 10000,
});

/**
 * Parses a URL and extracts topic ID, comment ID, and title.
 * @param {string} url - The URL to parse.
 * @returns {Promise<Object>} Object containing topic_id, comment_id, full URL, title, and host.
 */
async function parseUrl(url) {
  let title = '#';
  const u = new URL(url);
  const path = u.pathname.split('/');
  let [topicId] = path;
  topicId = path[2];
  const [, commentId] = u.hash.split('_');

  const { data } = await apiClient.get(`https://${u.host}/api_topics/${topicId}`);
  topicId = data.match(/<trashTopicId>([0-9]*)/)[1];
  title = Array.from(data.matchAll(/<!\[CDATA\[(.*?)\]\]>/g))[1][1];

  return {
    topic_id: topicId,
    comment_id: commentId,
    full: url,
    title,
    host: u.host,
  };
}

/**
 * Fetches comments for a given topic from the Trashbox API.
 * @param {number} topicId - The topic ID.
 * @param {string} host - The host domain.
 * @returns {Promise<Array>} Array of comments.
 */
async function grabComments(topicId, host) {
  const response = await apiClient.get(
    `https://${host}/api_noauth.php?action=comments&topic_id=${topicId}`,
  );
  return response.data.comments;
}

/**
 * Finds a comment by its ID.
 * @param {Array} comments - Array of comment objects.
 * @param {number|string} id - Comment ID to find.
 * @returns {Object|undefined} The matching comment or undefined.
 */
function grabCommentById(comments, id) {
  return comments.find((e) => e.comm_id === id);
}

/**
 * Converts a timestamp to human-readable "time ago" format.
 * @param {number} ts - Unix timestamp in seconds.
 * @returns {string|null} Time ago string or null if in future.
 */
function timeAgo(ts) {
  const timeUnits = [
    ['сек.', 1],
    ['мин.', 60],
    ['ч.', 3600],
    ['дн.', 86400],
  ];

  const diff = Math.floor(Date.now() / 1000 - ts);
  let result = null;

  timeUnits.forEach(([unit, seconds]) => {
    if (diff / seconds >= 1) {
      result = `${Math.floor(diff / seconds)} ${unit}`;
    }
  });

  return result;
}

/**
 * Converts text to an emoji based on character code sum.
 * @param {string} text - Input text.
 * @returns {string} Emoji character.
 */
function t2e(text) {
  const emojis = ['🌚', '💬', '🏳️‍🌈', '🙂', '🤡', '💩', '🐔', '😂', '♿️', '👹'];
  const sum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return emojis[sum % 10];
}

/**
 * Replaces <img> tags with links to images.
 * @param {string} htmlString - HTML string to process.
 * @param {string} host - Host domain for image URLs.
 * @returns {{html: string, images: boolean}} Processed HTML and images flag.
 */
function replaceImgWithLink(htmlString, host) {
  let hasImages = false;
  const newHtmlString = htmlString.replace(/<img([^>]*)>/gi, (match, p1) => {
    const srcMatch = p1.match(/src=(["'])(.*?)\1/);
    const src = srcMatch ? srcMatch[2] : '';
    hasImages = true;
    return `<a href="https://${host}${src}">🖼 Пикча</a>`;
  });
  return { html: newHtmlString, images: hasImages };
}

/**
 * Processes HTML content by cleaning and formatting.
 * @param {string} data - HTML string to process.
 * @returns {string} Cleaned text.
 */
function cook(data) {
  return striptags(
    data.replaceAll('<br/>   ', '\n').replaceAll('<li>', '- ').replaceAll('</li>', '\n'),
    ['b', 'i', 'u', 'strike', 'a', 'img'],
  );
}

/**
 * Builds formatted message from comment and link data.
 * @param {Object} comment - Comment object.
 * @param {Object} linkData - Link data object.
 * @returns {string} Formatted message.
 */
function buildResult(comment, linkData) {
  const votes = parseInt(comment.votes, 10) !== 0 ? `(${comment.votes})` : '';
  return `${t2e(comment.login)} ${bold(comment.login, true)}, ${timeAgo(comment.posted)} назад ${votes}\n${cook(comment.content)}\n\n📜 ${link(linkData.title, linkData.full, true)}`;
}

/**
 * Main handler for trashbox comment links.
 * @param {Object} ctx - Telegraf context object.
 */
const main = async (ctx) => {
  try {
    const linkData = await parseUrl(ctx.update.message.text);
    const comments = await grabComments(linkData.topic_id, linkData.host);
    const comment = grabCommentById(comments, linkData.comment_id);
    const formattedMessage = buildResult(comment, linkData);
    const result = replaceImgWithLink(formattedMessage, linkData.host);

    await ctx.sendMessage(result.html, {
      link_preview_options: { is_disabled: !result.images },
      parse_mode: 'html',
    });
    await ctx.deleteMessage();
  } catch (error) {
    console.error('Trashkek handler error:', error);
  }
};

export default main;
