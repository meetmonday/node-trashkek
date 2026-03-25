import axios from 'axios';

// Create a reusable axios instance with optimized defaults
const apiClient = axios.create({
  baseURL: 'https://www.tikwm.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Downloads TikTok video information using tikwm API.
 * @param {string} url - The TikTok video URL.
 * @returns {Promise<Object>} Promise resolving to the API response data.
 */
async function dl(url) {
  const response = await apiClient.post('/api/', { url, hd: 1 });
  return response.data;
}

export default dl;
