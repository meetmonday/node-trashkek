import dl from "#lib/ttdl";
import { sendAudioFromUrl } from "#lib/tomp3";
// import fs from "fs";
// import createSlideshow from "#lib/slideShower";

const MAX_BYTES = 50 * 1024 * 1024;
async function fetchToBuffer(url) {
  const res = await fetch(url, { timeout: 7000 });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  const len = res.headers.get('content-length');
  if (len && Number(len) > MAX_BYTES) throw new Error('File too large');
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

function main(ctx) {
  const url = ctx.update.message.text;
  dl(url).then(async ({data}) => {
    const caption = `👨‍🦰${data.author.nickname}\n❤️${data.digg_count} 👁${data.play_count}\n${data.title}`
    if (data.images) {
      const audioUrl = data.play;

      const buffers = await Promise.all(
        data.images.map(async (url) => {
          const buf = await fetchToBuffer(url);
          return { buffer: buf, url };
        })
      );

      const mediaGroup = buffers.map((b, idx) => ({
        type: 'photo',
        media: { source: b.buffer },
        caption: idx === 0 && caption ? caption : undefined,
      }));

      await ctx.replyWithChatAction('upload_photo');
      await ctx.sendMediaGroup(mediaGroup);

      sendAudioFromUrl(ctx, audioUrl, 'audio.mp3', {
        performer: data.music_info.author, title: data.music_info.title
      });
    } else {
      ctx.sendVideo(data.play, { caption });
    }
  }).catch(e => console.log(e));
}

export default main;
