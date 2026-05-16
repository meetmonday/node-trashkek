import { MediaUpload, MediaInput, MessageContext } from 'gramio';

import type { TikTokApiResponse } from '@/types/tiktok';
import type { BotType } from '..';

/**
 * Handles TikTok video/image download and sends to user.
 * @param {any} ctx - Context object.
 */
async function main(ctx: MessageContext<BotType>) {
  try {
    const url = ctx.text;
    const response = await fetch('https://www.tikwm.com/api/',
      { method: 'POST', body: JSON.stringify({ url, hd: 1 }) }
    );
    if (response.status !== 200) {
      await ctx.reply('Failed to fetch TikTok data');
      return;
    }

    const { data } = await response.json() as TikTokApiResponse;
    if(data === undefined) {
      await ctx.reply("Видео не найдено или ссылка некорректная");
      return;
    }

    const caption = `👨‍🦰${data.author.nickname}\n❤️${data.digg_count} 👁${data.play_count}\n${data.title}`;

    if (data.images) {
      ctx.sendChatAction('upload_photo');

      await ctx.sendMediaGroup(data.images.map((b, idx) => MediaInput.photo(
        b, { caption: idx === 0 ? caption : undefined }
      )));

      await ctx.sendAudio(await MediaUpload.url(data.play), {
        performer: data.music_info.author,
        title: data.music_info.title,
      });

    } else {
      ctx.sendChatAction('upload_video');
      await ctx.sendVideo(await MediaUpload.url(data.play),
        {
          thumbnail: await MediaUpload.url(data.cover),
          duration: data.duration,
          supports_streaming: true,
          caption
        }
      );
    }
  } catch (err) {
    console.error('TikTok command error:', err);
    await ctx.reply('Произошла ошибка при обработке видео').catch(() => {});
  }
}

export default (bot: BotType) =>
  bot.hears(/tiktok\.com/, (context) => main(context));