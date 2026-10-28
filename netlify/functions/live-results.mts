import { getStore } from "@netlify/blobs";
import {
  aggregate,
  parseFilters,
  type Coding,
  type Submission,
} from "../lib/live-results";
import { json, keyMatches } from "../lib/keys";

/**
 * Totals for the live results page (/live-results/#key=...).
 *
 * Needs two environment variables in Netlify:
 * - RESULTS_KEY: the key in the shared link
 * - NETLIFY_API_TOKEN: a personal access token, used to read form submissions
 */

const API = "https://api.netlify.com/api/v1";
const CACHE_MS = 60_000;
let cache: { at: number; subs: Submission[] } | null = null;

type Form = { id: string; name: string };
type ApiSubmission = { created_at: string; data: Record<string, unknown> };

async function api<T>(path: string, token: string): Promise<T> {
  const res = await fetch(API + path, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Netlify API ${path} returned ${res.status}`);
  return (await res.json()) as T;
}

async function loadSubmissions(
  siteId: string,
  token: string,
): Promise<Submission[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.subs;
  const forms = await api<Form[]>(`/sites/${siteId}/forms`, token);
  const survey = forms.find((f) => f.name === "survey");
  if (!survey) return [];
  const subs: Submission[] = [];
  for (let page = 1; page <= 50; page++) {
    const batch = await api<ApiSubmission[]>(
      `/forms/${survey.id}/submissions?per_page=100&page=${page}`,
      token,
    );
    // Keep only what the page needs; IP addresses and browser details are dropped here.
    for (const s of batch)
      subs.push({ created_at: s.created_at, data: s.data });
    if (batch.length < 100) break;
  }
  cache = { at: Date.now(), subs };
  return subs;
}

export default async (req: Request, context: { site?: { id?: string } }) => {
  const key = process.env["RESULTS_KEY"];
  const token = process.env["NETLIFY_API_TOKEN"];
  const siteId = context.site?.id ?? process.env["SITE_ID"];
  if (!key || !token || !siteId) return json({ error: "not-configured" }, 503);
  if (!keyMatches(req.headers.get("x-results-key"), key))
    return json({ error: "forbidden" }, 403);

  try {
    const [subs, coding] = await Promise.all([
      loadSubmissions(siteId, token),
      getStore("live-results").get("coding", {
        type: "json",
      }) as Promise<Coding | null>,
    ]);
    return json(
      aggregate(subs, coding, parseFilters(new URL(req.url).searchParams)),
    );
  } catch (error) {
    console.error(error);
    return json({ error: "unavailable" }, 502);
  }
};
