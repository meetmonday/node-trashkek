import { MediaUpload, MediaInput, type MessageContext } from 'gramio';
import type { BotType } from '..';

const TARGET_USERNAME = 'generated_anime_women';
const MEDIA_GROUP_TIMEOUT = 800;

interface MediaGroupEntry {
  chatId: number;
  items: Array<{ buffer: ArrayBuffer; fileName?: string }>;
  caption?: string;
  timer: ReturnType<typeof setTimeout>;
}

export default (bot: BotType) => {
  const mediaGroups = new Map<string, MediaGroupEntry>();

  async function flushMediaGroup(key: string) {
    const entry = mediaGroups.get(key);
    if (!entry) return;
    mediaGroups.delete(key);

    const { chatId, items, caption } = entry;
    if (items.length === 0) return;

    bot.api.sendChatAction({ chat_id: chatId, action: 'upload_photo' }).catch(() => {});

    const group = items.map((item, idx) =>
      MediaInput.photo(MediaUpload.buffer(item.buffer, item.fileName), {
        caption: idx === 0 ? caption : undefined,
      }),
    );

    try {
      await bot.api.sendMediaGroup({ chat_id: chatId, media: group });
    } catch {
      /* silent */
    }
  }

  bot.on('message', async (ctx: MessageContext<BotType>) => {
    try {
      const origin = ctx.forwardOrigin;
      if (origin?.type !== 'channel' || origin.chat.username !== TARGET_USERNAME) return;

      const doc = ctx.document;
      if (!doc?.mimeType?.startsWith('image/')) return;

      if (ctx.mediaGroupId) {
        const key = ctx.mediaGroupId;
        const existing = mediaGroups.get(key);
        const buffer = await ctx.download();

        if (existing) {
          clearTimeout(existing.timer);
          existing.items.push({ buffer, fileName: doc.fileName });
          existing.caption ??= ctx.caption;
          existing.timer = setTimeout(() => flushMediaGroup(key), MEDIA_GROUP_TIMEOUT);
        } else {
          const timer = setTimeout(() => flushMediaGroup(key), MEDIA_GROUP_TIMEOUT);
          mediaGroups.set(key, {
            chatId: ctx.chat.id,
            items: [{ buffer, fileName: doc.fileName }],
            caption: ctx.caption,
            timer,
          });
        }
        return;
      }

      ctx.sendChatAction('upload_photo');
      const buffer = await ctx.download();
      await ctx.sendPhoto(MediaUpload.buffer(buffer, doc.fileName), {
        caption: ctx.caption,
      });
    } catch (err) {
      console.error('anime_women error:', err);
    }
  });
};
