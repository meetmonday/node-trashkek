import { MediaUpload, MediaInput, type Next } from "gramio";
import type { MessageContext } from "gramio";
import type { TelegramDocument } from "@gramio/types";
import type { BotType } from "..";

const ERROR_NO_REPLY =
  "Нужно ответить на сообщение с картинкой, отправленной как файл";
const ERROR_NOT_FILE_IMAGE =
  "Сообщение не содержит картинку, отправленную как файл";
const ERROR_PROCESSING = "Не удалось обработать файл";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".heic",
  ".avif",
  ".tiff",
]);

const CACHE_TTL = 5 * 60 * 1000;

interface CachedDoc {
  fileId: string;
  fileName?: string;
  caption?: string;
}

const mediaGroupCache = new Map<string, { items: CachedDoc[]; ts: number }>();

export function __resetMediaGroupCache() {
  mediaGroupCache.clear();
}

function cleanCache() {
  const now = Date.now();
  for (const [key, entry] of mediaGroupCache) {
    if (now - entry.ts > CACHE_TTL) mediaGroupCache.delete(key);
  }
}

type DocumentLike = Pick<TelegramDocument, "mime_type" | "file_name"> & {
  mimeType?: string;
  fileName?: string;
};

function getMimeType(doc: DocumentLike): string | undefined {
  return doc.mimeType ?? doc.mime_type;
}

function getFileName(doc: DocumentLike): string | undefined {
  return doc.fileName ?? doc.file_name;
}

export function isImageDocument(doc: DocumentLike): boolean {
  const mimeType = getMimeType(doc);
  if (mimeType?.startsWith("image/")) return true;

  if (mimeType && mimeType !== "application/octet-stream") {
    return false;
  }

  const name = getFileName(doc)?.toLowerCase();
  if (!name) return false;

  const dot = name.lastIndexOf(".");
  if (dot === -1) return false;

  return IMAGE_EXTENSIONS.has(name.slice(dot));
}

async function handleSingle(
  ctx: MessageContext<BotType>,
  bot: BotType,
  reply: NonNullable<MessageContext<BotType>["replyMessage"]>,
  doc: DocumentLike & { fileId?: string; file_id?: string },
): Promise<void> {
  await ctx.sendChatAction("upload_photo");

  const buffer = await bot.downloadFile(doc);
  const params = reply.caption ? { caption: reply.caption } : undefined;

  await ctx.sendPhoto(
    MediaUpload.buffer(buffer, getFileName(doc) ?? "image.jpg"),
    params,
  );
}

async function handleAlbum(
  ctx: MessageContext<BotType>,
  bot: BotType,
  reply: NonNullable<MessageContext<BotType>["replyMessage"]>,
  docs: CachedDoc[],
): Promise<void> {
  await ctx.sendChatAction("upload_photo");

  const buffers = await Promise.all(
    docs.map((d) => bot.downloadFile(d.fileId)),
  );

  const media = buffers.map((buffer, i) =>
    MediaInput.photo(
      MediaUpload.buffer(buffer, docs[i]?.fileName ?? "image.jpg"),
      i === 0 && reply.caption ? { caption: reply.caption } : undefined,
    ),
  );

  await ctx.sendMediaGroup(media);
}

async function main(
  ctx: MessageContext<BotType>,
  bot: BotType,
): Promise<void> {
  if (!ctx.replyMessage) {
    await ctx.reply(ERROR_NO_REPLY);
    return;
  }

  const reply = ctx.replyMessage;

  if (reply.photo?.length || !reply.document) {
    await ctx.reply(ERROR_NOT_FILE_IMAGE);
    return;
  }

  const doc = reply.document;
  if (!isImageDocument(doc)) {
    await ctx.reply(ERROR_NOT_FILE_IMAGE);
    return;
  }

  try {
    const groupId = (reply as any).mediaGroupId as string | undefined;
    if (groupId) {
      const cached = mediaGroupCache.get(groupId);
      if (cached && cached.items.length > 1) {
        await handleAlbum(ctx, bot, reply, cached.items);
        return;
      }
    }

    await handleSingle(ctx, bot, reply, doc);
  } catch (err) {
    console.error("Pokupka command error:", err);
    await ctx.reply(ERROR_PROCESSING).catch(() => {});
  }
}

export default (bot: BotType) => {
  bot.on("message", (ctx: MessageContext<BotType>, next: Next) => {
    const groupId = ctx.mediaGroupId;
    if (groupId && ctx.document && isImageDocument(ctx.document)) {
      let entry = mediaGroupCache.get(groupId);
      if (!entry) {
        entry = { items: [], ts: Date.now() };
        mediaGroupCache.set(groupId, entry);
      }
      entry.items.push({
        fileId: ctx.document.fileId,
        fileName: getFileName(ctx.document),
        caption: ctx.caption,
      });
      entry.ts = Date.now();
    }
    cleanCache();
    return next();
  });

  bot.command("pokupka", (context) => main(context, bot));
};
