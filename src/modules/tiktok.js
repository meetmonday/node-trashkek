import dl from '#lib/ttdl.js';
import { sendAudioFromUrl } from '#lib/tomp3.js';

const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Fetches data from a URL with size limit check.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<Buffer>} The fetched data as a buffer.
 * @throws {Error} If fetch fails or file is too large.
 */
async function fetchToBuffer(url) {
  const res = await fetch(url, { timeout: 7000 });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  const len = res.headers.get('content-length');
  if (len && Number(len) > MAX_BYTES) throw new Error('File too large');
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

/**
 * Handles TikTok video/image download and sends to user.
 * @param {Object} ctx - Telegraf context object.
 */
async function main(ctx) {
  const url = ctx.update.message.text;

  try {
    const { data } = await dl(url);
    const caption = `👨‍🦰${data.author.nickname}\n❤️${data.digg_count} 👁${data.play_count}\n${data.title}`;

    if (data.images) {
      // Handle slideshow (images)
      const audioUrl = data.play;

      const buffers = await Promise.all(
        data.images.map(async (imageUrl) => {
          const buf = await fetchToBuffer(imageUrl);
          return { buffer: buf, url: imageUrl };
        }),
      );

      const mediaGroup = buffers.map((b, idx) => ({
        type: 'photo',
        media: { source: b.buffer },
        caption: idx === 0 ? caption : undefined,
      }));

      await ctx.replyWithChatAction('upload_photo');
      await ctx.sendMediaGroup(mediaGroup);

      await sendAudioFromUrl(ctx, audioUrl, 'audio.mp3', {
        performer: data.music_info.author,
        title: data.music_info.title,
      });
    } else {
      // Handle single video
      await ctx.sendVideo(
        { source: await fetchToBuffer(data.play) },
        { caption },
      );
    }
  } catch (e) {
    console.error('TikTok handler error:', e);
  }
}

export default main;
