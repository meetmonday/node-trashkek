//@ts-nocheck

import { describe, expect, it } from "bun:test";
import { Bot, format, bold } from "gramio";
import { TelegramTestEnvironment } from "@gramio/test";
import { autoload } from "@gramio/autoload";

describe("Trashkek Command", () => {
  it("parse valid link", async () => {
    const bot = new Bot("test").extend(await autoload({ path: "../src/commands" }));

    const env = new TelegramTestEnvironment(bot);
    const user = env.createUser({ first_name: "Yehor" });

    await user.sendMessage("https://trashbox.ru/link/2026-04-17-mercedes-benz-salon-elektricheskogo-c-klassa-displey-na-vsyo-torpedo#div_comment_1426006");

    expect(env.apiCalls[0].method).toBe("sendMessage");
    expect(env.apiCalls[1].method).toBe("deleteMessage");
  });

  it("parse valid /topics/ link", async () => {
    const bot = new Bot("test").extend(await autoload({ path: "../src/commands" }));

    const env = new TelegramTestEnvironment(bot);
    const user = env.createUser({ first_name: "Yehor" });

    await user.sendMessage("https://trashbox.ru/topics/207704/luchshij-brauzer-vybiraem#div_comment_1426028");

    expect(env.apiCalls[0].method).toBe("sendMessage");
    expect(env.apiCalls[1].method).toBe("deleteMessage");
  });

  it("send error for link without comment_id", async () => {
    const bot = new Bot("test").extend(await autoload({ path: "../src/commands" }));

    const env = new TelegramTestEnvironment(bot);
    const user = env.createUser({ first_name: "Yehor" });

    await user.sendMessage("https://trashbox.ru/link/2026-04-17-mercedes-benz-salon-elektricheskogo-c-klassa-displey-na-vsyo-torpedo#div_comment_");

    expect(env.apiCalls[0].method).toBe("sendMessage");
    expect(env.apiCalls[0].response.text).toBe("Комментарий не найден");
  });

  it("send error for invalid topic", async () => {
    const bot = new Bot("test").extend(await autoload({ path: "../src/commands" }));

    const env = new TelegramTestEnvironment(bot);
    const user = env.createUser({ first_name: "Yehor" });

    await user.sendMessage("https://trashbox.ru/link/nasral#div_comment_1426006");

    expect(env.apiCalls[0].method).toBe("sendMessage");
    expect(env.apiCalls[0].response.text).toBe("Некорректная ссылка или топик не найден");
  });

  it("send error for invalid domain", async () => {
    const bot = new Bot("test").extend(await autoload({ path: "../src/commands" }));

    const env = new TelegramTestEnvironment(bot);
    const user = env.createUser({ first_name: "Yehor" });

    await user.sendMessage("https://zalupa.ru/link/nasral#div_comment_1426006");

    expect(env.apiCalls[0].method).toBe("sendMessage");
    expect(env.apiCalls[0].response.text).toBe("Некорректная ссылка");
  });
});