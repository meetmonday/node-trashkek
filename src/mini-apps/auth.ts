import { createHmac } from "node:crypto";
import {
  getBotTokenSecretKey,
  validateAndParseInitData,
} from "@gramio/init-data";

export interface InitData {
  userId: number;
  username?: string;
  authDate: Date;
}

function parseInitDataRaw(
  raw: string,
  botToken: string,
): InitData | null {
  const secretKey = getBotTokenSecretKey(botToken);
  const result = validateAndParseInitData(raw, secretKey);
  if (!result || !result.user) return null;

  return {
    userId: result.user.id,
    username: result.user.username,
    authDate: new Date((result.auth_date ?? 0) * 1000),
  };
}

export function generateAuthUrl(userId: number, botToken: string): string {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const payload = `${userId}:${expires}`;
  const sig = createHmac("sha256", botToken).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

function validateUrlToken(token: string, botToken: string): { userId: number } | null {
  const parts = token.split(":");
  if (parts.length !== 3) return null;
  const [userIdStr, expiresStr, sig] = parts;
  const payload = `${userIdStr}:${expiresStr}`;
  const expectedSig = createHmac("sha256", botToken).update(payload).digest("hex");
  if (sig !== expectedSig) return null;
  const expires = Number(expiresStr);
  if (Number.isNaN(expires) || Date.now() / 1000 > expires) return null;
  return { userId: Number(userIdStr) };
}

export function parseAuth(
  initDataRaw: string,
  urlToken: string,
  botToken: string,
): InitData | null {
  if (initDataRaw) {
    const result = parseInitDataRaw(initDataRaw, botToken);
    if (result) return result;
  }

  if (urlToken) {
    const result = validateUrlToken(urlToken, botToken);
    if (result) return { userId: result.userId, authDate: new Date() };
  }

  return null;
}
