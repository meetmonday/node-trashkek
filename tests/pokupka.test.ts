//@ts-nocheck

import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { Bot } from "gramio";
import { TelegramTestEnvironment } from "@gramio/test";
import { autoload } from "@gramio/autoload";
import { isImageDocument } from "../src/commands/pokupka";

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
    });
  });
});
