import { getStore } from "@netlify/blobs";
import type { Coding } from "../lib/live-results";
import { json, keyMatches } from "../lib/keys";

/**
 * Uploads the hand-made theme grouping and approved quotes for the live
 * results page. Used by /live-results/admin.html.
 *
 * Needs RESULTS_ADMIN_KEY in Netlify. Keep it different from RESULTS_KEY,
 * which is shared with readers.
 */

const MAX_BYTES = 500_000;

function isCoding(v: unknown): v is Coding {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  if (
    !c["responses"] ||
    typeof c["responses"] !== "object" ||
    !Array.isArray(c["quotes"])
  )
    return false;
  for (const entry of Object.values(
    c["responses"] as Record<string, unknown>,
  )) {
    if (!entry || typeof entry !== "object") return false;
    for (const k of ["change", "like"]) {
      const list = (entry as Record<string, unknown>)[k];
      if (
        list !== undefined &&
        !(Array.isArray(list) && list.every((x) => typeof x === "string"))
      )
        return false;
    }
  }
  return (c["quotes"] as unknown[]).every((q) => {
    const o = q as Record<string, unknown>;
    return (
      typeof o["at"] === "string" &&
      typeof o["code"] === "string" &&
      typeof o["text"] === "string"
    );
  });
}

export default async (req: Request) => {
  if (
    !keyMatches(
      req.headers.get("x-admin-key"),
      process.env["RESULTS_ADMIN_KEY"],
    )
  )
    return json({ error: "forbidden" }, 403);

  const store = getStore("live-results");
  if (req.method === "GET") {
    const coding = (await store.get("coding", {
      type: "json",
    })) as Coding | null;
    return json({
      updated: coding?.updated ?? null,
      responses: coding ? Object.keys(coding.responses).length : 0,
      quotes: coding?.quotes.length ?? 0,
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

  await store.setJSON("coding", coding);
  return json({
    ok: true,
    responses: Object.keys(coding.responses).length,
    quotes: coding.quotes.length,
  });
};
