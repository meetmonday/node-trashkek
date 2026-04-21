import type { BotType } from '..';
import { MediaUpload, MediaInput } from 'gramio';
import { sendAudioFromUrl } from '@/helpers/tomp3.ts';
import type { TikTokApiResponse } from '@/types/tiktok';

/**
 * Handles TikTok video/image download and sends to user.
 * @param {any} ctx - Context object.
 */
async function main(ctx: any) {
  const url = ctx.text;

  const response = await fetch('https://www.tikwm.com/api/',
    { method: 'POST', body: JSON.stringify({ url, hd: 1 }) }
  );
  if (response.status !== 200) {
    await ctx.reply('Failed to fetch TikTok data');
    return;
  }

  const { data } = await response.json() as TikTokApiResponse;

  const caption = `👨‍🦰${data.author.nickname}\n❤️${data.digg_count} 👁${data.play_count}\n${data.title}`;

  if (data.images) {
    ctx.sendChatAction('upload_photo');
    const mediaGroup = data.images.map((b, idx) => MediaInput.photo(
      b, { caption: idx === 0 ? caption : undefined }
    ));

    await ctx.sendMediaGroup(mediaGroup)

    await sendAudioFromUrl(ctx, data.play, 'audio.mp3', {
      performer: data.music_info.author,
      title: data.music_info.title,
    });
  } else {
    // Handle single video
    ctx.sendChatAction('upload_video');
    await ctx.sendVideo(await MediaUpload.url(data.play),
      {
        thumbnail: MediaUpload.url(data.cover),
        duration: data.duration,
        supports_streaming: true,
        caption
      }
    );
  }
}

export default (bot: BotType) =>
  bot.hears(/tiktok\.com/, (context) => main(context));