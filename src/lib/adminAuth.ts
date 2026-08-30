import { createHash, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE_NAME = "admin_session";

function expectedToken() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(password).digest("hex");
}

export function tokenForPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function isValidSession(token: string | undefined) {
  const expected = expectedToken();
  if (!expected || !token) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
