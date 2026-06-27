//@ts-nocheck

import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { Bot } from "gramio";
import { TelegramTestEnvironment } from "@gramio/test";
import { autoload } from "@gramio/autoload";
import { isImageDocument, __resetMediaGroupCache } from "../src/commands/pokupka";

const COMMAND_ENTITY = [{ type: "bot_command", offset: 0, length: 8 }];

async function createBot() {
  return new Bot("test").extend(await autoload({ path: "../src/commands" }));
}

async function sendPokupkaReply(user, replyTo) {
  return user.sendMessage("/pokupka", {
    reply_to: replyTo,
    entities: COMMAND_ENTITY,
  });
}

async function sendImageDocument(user, overrides = {}) {
  const { caption, ...docOverrides } = overrides;
  const docMsg = await user.sendDocument(caption ? { caption } : undefined);
  Object.assign(docMsg.payload.document, {
    mime_type: "image/png",
    file_name: "pic.png",
    ...docOverrides,
  });
  return docMsg;
}

describe("/pokupka", () => {
  afterEach(() => {
    __resetMediaGroupCache();
  });

  describe("isImageDocument", () => {
    it("accepts image mime types", () => {
      expect(isImageDocument({ mime_type: "image/png" })).toBe(true);
      expect(isImageDocument({ mime_type: "image/jpeg" })).toBe(true);
    });

    it("accepts octet-stream with image extension", () => {
      expect(
        isImageDocument({
          mime_type: "application/octet-stream",
          file_name: "photo.jpg",
        }),
      ).toBe(true);
    });

    it("rejects non-image mime types", () => {
      expect(isImageDocument({ mime_type: "video/mp4" })).toBe(false);
      expect(
        isImageDocument({
          mime_type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      ).toBe(false);
    });
  });

  describe("command handler", () => {
    it("errors when not a reply", async () => {
      const bot = await createBot();
      const env = new TelegramTestEnvironment(bot);
      const user = env.createUser({ first_name: "Yehor" });

      await user.sendCommand("pokupka");

      expect(env.apiCalls[0].method).toBe("sendMessage");
      expect(env.apiCalls[0].params.text).toBe(
        "Нужно ответить на сообщение с картинкой, отправленной как файл",
      );
    });

    it("errors when reply is a video document", async () => {
      const bot = await createBot();
      const env = new TelegramTestEnvironment(bot);
      const user = env.createUser({ first_name: "Yehor" });

      const docMsg = await sendImageDocument(user, {
        mime_type: "video/mp4",
        file_name: "video.mp4",
      });
      await sendPokupkaReply(user, docMsg);

      expect(env.apiCalls[0].method).toBe("sendMessage");
      expect(env.apiCalls[0].params.text).toBe(
        "Сообщение не содержит картинку, отправленную как файл",
      );
    });

    it("errors when reply is a non-image document", async () => {
      const bot = await createBot();
      const env = new TelegramTestEnvironment(bot);
      const user = env.createUser({ first_name: "Yehor" });

      const docMsg = await sendImageDocument(user, {
        mime_type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        file_name: "data.xlsx",
      });
      await sendPokupkaReply(user, docMsg);

      expect(env.apiCalls[0].method).toBe("sendMessage");
      expect(env.apiCalls[0].params.text).toBe(
        "Сообщение не содержит картинку, отправленную как файл",
      );
    });

    it("errors when reply is already a photo", async () => {
      const bot = await createBot();
      const env = new TelegramTestEnvironment(bot);
      const user = env.createUser({ first_name: "Yehor" });

      const photoMsg = await user.sendPhoto();
      await sendPokupkaReply(user, photoMsg);

      expect(env.apiCalls[0].method).toBe("sendMessage");
      expect(env.apiCalls[0].params.text).toBe(
        "Сообщение не содержит картинку, отправленную как файл",
      );
    });

    describe("success", () => {
      const originalFetch = globalThis.fetch;

      beforeEach(() => {
        globalThis.fetch = async (input) => {
          const url = typeof input === "string" ? input : input.url;
          if (url.includes("photos/test.jpg")) {
            return new Response(new Uint8Array([0xff, 0xd8, 0xff]), {
              status: 200,
            });
          }
          return originalFetch(input);
        };
      });

      afterEach(() => {
        globalThis.fetch = originalFetch;
      });

      it("re-uploads image document as photo", async () => {
        const bot = await createBot();
        const env = new TelegramTestEnvironment(bot);
        const user = env.createUser({ first_name: "Yehor" });

        env.onApi("getFile", (params) => ({
          file_id: params.file_id,
          file_path: "photos/test.jpg",
          file_size: 3,
        }));

        const docMsg = await sendImageDocument(user, {
          caption: "test caption",
        });
        await sendPokupkaReply(user, docMsg);

        expect(env.apiCalls[0].method).toBe("sendChatAction");
        expect(env.apiCalls[0].params.action).toBe("upload_photo");
        expect(env.filterApiCalls("getFile")).toHaveLength(1);
        expect(env.lastApiCall("sendPhoto")?.params.caption).toBe("test caption");
        expect(env.lastApiCall("sendPhoto")?.params.photo).toBeDefined();
      });

      it("re-uploads media group as album", async () => {
        const bot = await createBot();
        const env = new TelegramTestEnvironment(bot);
        const user = env.createUser({ first_name: "Yehor" });

        env.onApi("getFile", (params) => ({
          file_id: params.file_id,
          file_path: `photos/${params.file_id}.bin`,
          file_size: 3,
        }));

        env.onApi("sendMediaGroup", (params) =>
          params.media.map((_, i) => ({
            message_id: 100 + i,
            date: Math.floor(Date.now() / 1000),
            chat: { id: 1, type: "private" },
            photo: [
              {
                file_id: `result_${i}`,
                file_unique_id: `u_result_${i}`,
                width: 100,
                height: 100,
              },
            ],
          })),
        );

        const origFetch = globalThis.fetch;
        globalThis.fetch = async (input) => {
          const url = typeof input === "string" ? input : input.url;
          if (url.includes("photos/")) {
            return new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xee]), {
              status: 200,
            });
          }
          return origFetch(input);
        };

        const [msg1] = await user.sendMediaGroup([
          {
            document: {
              file_id: "album_0",
              file_unique_id: "u_album_0",
              file_name: "img0.png",
              mime_type: "image/png",
              file_size: 100,
            },
          },
          {
            document: {
              file_id: "album_1",
              file_unique_id: "u_album_1",
              file_name: "img1.png",
              mime_type: "image/png",
              file_size: 100,
            },
          },
          {
            document: {
              file_id: "album_2",
              file_unique_id: "u_album_2",
              file_name: "img2.png",
              mime_type: "image/png",
              file_size: 100,
            },
          },
        ]);

        await sendPokupkaReply(user, msg1);

        expect(env.filterApiCalls("sendChatAction")).toHaveLength(1);
        expect(env.lastApiCall("sendChatAction")?.params.action).toBe(
          "upload_photo",
        );

        const albumCalls = env.filterApiCalls("sendMediaGroup");
        expect(albumCalls).toHaveLength(1);
        expect(albumCalls[0].params.media).toHaveLength(3);
        albumCalls[0].params.media.forEach((m) => {
          expect(m.type).toBe("photo");
        });

        globalThis.fetch = origFetch;
      });
    });
  });
});
