import { aggregate, parseFilters, type Submission } from "../lib/live-results";
import { isViewKey, json } from "../lib/keys";
import { loadCoding, loadSubmissions } from "../lib/store";

/**
 * Totals for the live results page (/live-results/#key=...). Reads the
 * tick-box answers saved by submission-created, plus the hand-made themes
 * and quotes uploaded on the admin page.
 */

const CACHE_MS = 30_000;
let cache: { at: number; subs: Submission[] } | null = null;

export default async (req: Request) => {
  if (!isViewKey(req.headers.get("x-results-key")))
    return json({ error: "forbidden" }, 403);
  try {
    if (!cache || Date.now() - cache.at > CACHE_MS)
      cache = { at: Date.now(), subs: await loadSubmissions() };
    const coding = await loadCoding();
    return json(
      aggregate(
        cache.subs,
        coding,
        parseFilters(new URL(req.url).searchParams),
      ),
    );
  } catch (error) {
    console.error(error);
    return json({ error: "unavailable" }, 502);
  }
};
