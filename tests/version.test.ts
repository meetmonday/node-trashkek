//@ts-nocheck

import { describe, expect, it } from "bun:test";
import { Bot, format, bold } from "gramio";
import { TelegramTestEnvironment } from "@gramio/test";
import { autoload } from "@gramio/autoload";

describe("My bot", () => {
  it("reply to /ver", async () => {
    const bot = new Bot("test").extend(await autoload({ path: "../src/commands" }));

    const env = new TelegramTestEnvironment(bot);
    const user = env.createUser({ first_name: "Yehor" });

    await user.sendCommand("ver");
    expect(env.apiCalls[0].method).toBe("sendMessage");
  });
});