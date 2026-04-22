//@ts-nocheck

import { describe, expect, it } from "bun:test";
import { Bot, format, bold } from "gramio";
import { TelegramTestEnvironment } from "@gramio/test";
import { autoload } from "@gramio/autoload";

// Костыль от ошибки при sendMediaGroup
// вроде косяк @gramio/test, но тест проходит норм
console.error = (...args) => {};

describe("My bot", () => {
  it("send video from tiktok link", async () => {
    const bot = new Bot("test").extend(await autoload({ path: "../src/commands" }));

    const env = new TelegramTestEnvironment(bot);
    const user = env.createUser({ first_name: "Yehor" });

    await user.sendMessage("https://vt.tiktok.com/ZSHw88Cdc/");

    expect(env.apiCalls[0].method).toBe("sendChatAction");
    expect(env.apiCalls[0].params.action).toBe("upload_video");
    expect(env.apiCalls[1].method).toBe("sendVideo");
  });

  it("send photo from tiktok link", async () => {
    const bot = new Bot("test").extend(await autoload({ path: "../src/commands" }));

    const env = new TelegramTestEnvironment(bot);
    const user = env.createUser({ first_name: "Yehor" });

    await user.sendMessage("https://vt.tiktok.com/ZS6vwT55v/");

    expect(env.apiCalls[0].method).toBe("sendChatAction");
    expect(env.apiCalls[0].params.action).toBe("upload_photo");
    expect(env.apiCalls[1].method).toBe("sendMediaGroup");
  });

  it("send error if link is invalid", async () => {
    const bot = new Bot("test").extend(await autoload({ path: "../src/commands" }));

    const env = new TelegramTestEnvironment(bot);
    const user = env.createUser({ first_name: "Yehor" });

    await user.sendMessage("https://vt.tiktok.com/NASRALKEK/");

    expect(env.apiCalls[0].method).toBe("sendMessage");
    expect(env.apiCalls[0].params.text).toBe("Видео не найдено или ссылка некорректная");
  });
});