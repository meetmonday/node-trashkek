import { format, bold, code } from "gramio";
import type { BotType } from "..";

const TARGET_BOTS = ["taranovs_bot", "naganbot"];

interface ParseResult {
  playerCount: number;
  apiUrl: string;
  fullUrl: string;
  gameId: string;
}

function parseMessage(text: string, linkUrl?: string): ParseResult | null {
  const lines = text.split("\n");

  const playerCount = lines.filter((l) => /^\d+\.\s/.test(l)).length;
  if (playerCount === 0) return null;

  const fullUrl = linkUrl || text.match(/https:\/\/api\.drand\.sh\/[^\s)]+/)?.[0];
  if (!fullUrl) return null;

  const qIdx = fullUrl.indexOf("?");
  if (qIdx === -1) return null;

  const apiUrl = fullUrl.substring(0, qIdx);
  const queryStr = fullUrl.substring(qIdx + 1);
  const gameId = new URLSearchParams(queryStr).get("game[id]");
  if (!gameId) return null;

  return { playerCount, apiUrl, fullUrl, gameId };
}

async function fetchDrandBeacon(apiUrl: string): Promise<string> {
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`Drand API: ${res.status}`);
  const data = (await res.json()) as { randomness: string };
  if (!data.randomness) throw new Error("No randomness in response");
  return data.randomness;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToUint64BE(buf: Uint8Array, offset: number): bigint {
  let result = 0n;
  for (let i = 0; i < 8; i++) {
    result = (result << 8n) | BigInt(buf[offset + i]!);
  }
  return result;
}

async function computeHash(
  randomnessHex: string,
  gameId: string,
): Promise<Uint8Array> {
  const randBytes = hexToBytes(randomnessHex);
  const idBytes = new TextEncoder().encode(gameId);
  const combined = new Uint8Array(randBytes.length + idBytes.length);
  combined.set(randBytes);
  combined.set(idBytes, randBytes.length);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", combined));
}

async function main(ctx: any): Promise<void> {
  if (!ctx.replyMessage) {
    await ctx.reply("Нужно ответить на сообщение @taranovs_bot или @naganbot");
    return;
  }

  const reply = ctx.replyMessage;
  const from = reply.from;

  if (!from?.username || !TARGET_BOTS.includes(from.username)) {
    await ctx.reply("Нужно ответить на сообщение @taranovs_bot или @naganbot");
    return;
  }

  const text = reply.text || reply.caption;
  if (!text) {
    await ctx.reply("В сообщении нет текста для анализа");
    return;
  }

  const linkEntity = reply.entities?.find(
    (e: any) => e.type === "text_link",
  );
  const linkUrl = linkEntity?.url;

  const parsed = parseMessage(text, linkUrl);
  if (!parsed) {
    await ctx.reply(
      "Не удалось распарсить сообщение. Убедитесь, что в нём есть список игроков и ссылка на drand.",
    );
    return;
  }

  let randomnessHex: string;
  try {
    randomnessHex = await fetchDrandBeacon(parsed.apiUrl);
  } catch {
    await ctx.reply("Ошибка при запросе к drand quicknet");
    return;
  }

  const hash = await computeHash(randomnessHex, parsed.gameId);
  const bulletValue = Number(bytesToUint64BE(hash, 0) % 100n);
  const isAtomic = bulletValue < 3;
  const bulletLabel = isAtomic ? "атомная 💀" : "свинцовая 🔫";
  const victimIndex = Number(
    bytesToUint64BE(hash, 8) % BigInt(parsed.playerCount),
  );
  const victimLabel = isAtomic ? "все" : `#${victimIndex + 1}`;

  await ctx.reply(format`
🎲 ${bold("Randomness:")} ${code(randomnessHex)}
🆔 ${bold("Game ID:")} ${code(parsed.gameId)}
👥 ${bold("Игроков:")} ${parsed.playerCount}
─────────
💥 ${bold("Тип пули:")} ${bulletLabel} (${bulletValue}/100)
🎯 ${bold("Жертва:")} ${victimLabel}
`);
}

export default (bot: BotType) =>
  bot.command("verify", (context) => main(context));
