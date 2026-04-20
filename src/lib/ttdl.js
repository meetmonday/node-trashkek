
/**
 * TODO: УДАЛИТЬ
 * Downloads TikTok video information using tikwm API.
 * @param {string} url - The TikTok video URL.
 * @returns {Promise<Object>} Promise resolving to the API response data.
 */
async function dl(url) {
  const response = await fetch('https://www.tikwm.com/api/', 
      { method: 'POST', body: JSON.stringify({url, hd: 1}) }
    );
  const data = await response.json();
  return data;
}

export default dl;
