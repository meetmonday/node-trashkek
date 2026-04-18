import dl from '#lib/ttdl.js';
import { sendAudioFromUrl } from '#lib/tomp3.js';
import { MediaUpload, MediaInput } from 'gramio';

/**
 * Handles TikTok video/image download and sends to user.
 * @param {Object} ctx - Telegraf context object.
 */
async function main(ctx, retry = 0) {
  const url = ctx.text;
  if(retry > 5) { ctx.send('Ну ваще никак братан'); return false;}
  try {
    const { data } = await dl(url);
    const caption = `👨‍🦰${data.author.nickname}\n❤️${data.digg_count} 👁${data.play_count}\n${data.title}`;

    if (data.images) {
      ctx.sendChatAction('upload_photo');
      // Handle slideshow (images)
      const audioUrl = data.play;
      const mediaGroup = await data.images.map( (b, idx) => MediaInput.photo(
        b, { caption: idx === 0 ? caption : undefined }
      ));

      await ctx.sendMediaGroup(mediaGroup)

      await sendAudioFromUrl(ctx, audioUrl, 'audio.mp3', {
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
  } catch (e) {
    ctx.send('У пидорасов опять api сдохло, увы')
    console.error('TikTok handler error:', e);
    main(ctx, ++retry)
  }
}

export default (bot: BotType) =>
    bot.hears(/tiktok\.com/, (context) => main(context));