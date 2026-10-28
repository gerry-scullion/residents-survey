import { createHash, timingSafeEqual } from "node:crypto";

/*
 * Only fingerprints (SHA-256) of the keys live here, because this repo is
 * public. The keys themselves are random and only in the links.
 * To change a key, put the fingerprint of a new random key here.
 */
const VIEW_KEY_SHA256 =
  "b42820855a3c2f88d297cc0f2a3dd152cbfe743dc6b85d05a5615f9485577e13";
const ADMIN_KEY_SHA256 =
  "ab441476a5c554943f3404ee71e75614a96edef4bcf4d81b26b072a71dbfbec4";

const sha256 = (s: string) => createHash("sha256").update(s).digest();

/** Compares a key from a request with a stored fingerprint, in constant time. */
export function keyMatchesHash(given: string | null, hexHash: string): boolean {
  if (!given) return false;
  return timingSafeEqual(sha256(given), Buffer.from(hexHash, "hex"));
}

export const isViewKey = (given: string | null) =>
  keyMatchesHash(given, VIEW_KEY_SHA256);
export const isAdminKey = (given: string | null) =>
  keyMatchesHash(given, ADMIN_KEY_SHA256);

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  });
}
