import axios from 'axios';

/**
 * Downloads TikTok video information using tikwm API.
 * @param {string} url - The TikTok video URL.
 * @returns {Promise<Object>} Promise resolving to the API response data.
 */
async function dl(url) {
  const response = await axios.post('https://www.tikwm.com/api/', { url, hd: 1 });
  return response.data;
}

export default dl;
