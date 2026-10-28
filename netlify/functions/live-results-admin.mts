import type { Coding } from "../lib/live-results";
import { isAdminKey, json } from "../lib/keys";
import { loadCoding, loadSubmissions, saveCoding } from "../lib/store";

/**
 * Uploads the hand-made themes and approved quotes for the live results
 * page, plus the tick-box answers of responses sent before the page was
 * switched on. Used by /live-results/admin.html.
 */

const MAX_BYTES = 1_000_000;

const isStringList = (v: unknown) =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

function isCoding(v: unknown): v is Coding {
  if (!isObject(v) || !isObject(v["responses"]) || !Array.isArray(v["quotes"]))
    return false;
  for (const entry of Object.values(v["responses"])) {
    if (!isObject(entry)) return false;
    for (const k of ["change", "like"])
      if (entry[k] !== undefined && !isStringList(entry[k])) return false;
  }
  const quotesOk = v["quotes"].every(
    (q) =>
      isObject(q) &&
      typeof q["at"] === "string" &&
      typeof q["code"] === "string" &&
      typeof q["text"] === "string",
  );
  const subs = v["submissions"];
  const subsOk =
    subs === undefined ||
    (Array.isArray(subs) &&
      subs.every(
        (s) =>
          isObject(s) &&
          typeof s["created_at"] === "string" &&
          isObject(s["data"]),
      ));
  return quotesOk && subsOk;
}

export default async (req: Request) => {
  if (!isAdminKey(req.headers.get("x-admin-key")))
    return json({ error: "forbidden" }, 403);

  if (req.method === "GET") {
    const [coding, subs] = await Promise.all([loadCoding(), loadSubmissions()]);
    return json({
      updated: coding?.updated ?? null,
      grouped: coding ? Object.keys(coding.responses).length : 0,
      quotes: coding?.quotes.length ?? 0,
      responses: subs.length,
    });
  }
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const body = await req.text();
  if (body.length > MAX_BYTES) return json({ error: "too-large" }, 413);
  let coding: unknown;
  try {
    coding = JSON.parse(body);
  } catch {
    return json({ error: "not-json" }, 400);
  }
  if (!isCoding(coding)) return json({ error: "wrong-shape" }, 400);

  await saveCoding(coding);
  const subs = await loadSubmissions();
  return json({
    ok: true,
    grouped: Object.keys(coding.responses).length,
    quotes: coding.quotes.length,
    responses: subs.length,
  });
};
