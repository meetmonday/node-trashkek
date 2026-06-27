import { MediaUpload, MessageContext } from "gramio";
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
    ctx.sendChatAction("upload_photo");

    const buffer = await bot.downloadFile(doc);
    const params = reply.caption ? { caption: reply.caption } : undefined;

    await ctx.sendPhoto(
      MediaUpload.buffer(buffer, getFileName(doc) ?? "image.jpg"),
      params,
    );
  } catch (err) {
    console.error("Pokupka command error:", err);
    await ctx.reply(ERROR_PROCESSING).catch(() => {});
  }
}

export default (bot: BotType) =>
  bot.command("pokupka", (context) => main(context, bot));
