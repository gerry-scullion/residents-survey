/**
 * Turns Netlify Forms submissions into totals for the shareable live results
 * page. Only counts and hand-picked quotes leave the server: never a single
 * person's answers, IP address or full comments.
 */

export type Submission = { created_at: string; data: Record<string, unknown> };

/**
 * Hand-made grouping of written answers, uploaded through the admin page and
 * kept in Netlify Blobs (never in this public repo). Keys are submission
 * times to the second, e.g. "2026-10-27T11:04:16".
 */
export type Coding = {
  updated?: string;
  responses: Record<string, { change?: string[]; like?: string[] }>;
  quotes: { at: string; code: string; text: string; featured?: boolean }[];
  /** Tick-box answers for responses sent before the live page was switched on. */
  submissions?: Submission[];
};

/**
 * The only answers the live page keeps: tick boxes, no written comments.
 * Everything else in a submission (comments, IP address, browser) is dropped.
 */
export const ANSWER_FIELDS = [
  "road",
  "tenure",
  "household",
  "has_dog",
  "age_band",
  "outdoor_places",
  "place_uses",
  "local_things",
  "needs_fixing",
  "looks_after",
] as const;

export function pickAnswers(s: Submission): Submission {
  const data: Record<string, string> = {};
  for (const f of ANSWER_FIELDS) {
    const v = s.data[f];
    if (typeof v === "string") data[f] = v;
  }
  return { created_at: s.created_at, data };
}

export type Filters = {
  road?: string;
  age?: string;
  house?: string;
  dog?: string;
};

/** Smallest group we show. Smaller groups on three small roads could point to a household. */
export const MIN_GROUP = 5;

const ROADS = ["Avenue", "Grove", "Drive"] as const;

type Row = {
  at: string;
  road: string;
  age: string;
  tenure: string;
  household: string[];
  dog: string;
  places: string[];
  uses: string[];
  things: string[];
  fix: string[];
  looks: string;
};

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const list = (v: unknown) =>
  text(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Submission time to the second, used to match the hand-made grouping. */
export const timeKey = (createdAt: string) => createdAt.slice(0, 19);

export function toRow(s: Submission): Row {
  const d = s.data;
  const road = text(d["road"]);
  return {
    at: timeKey(s.created_at),
    road: road.startsWith("Kincora ") ? road.slice(8) : road ? "Other" : "",
    age: text(d["age_band"]),
    tenure: text(d["tenure"]),
    household: list(d["household"]),
    dog: text(d["has_dog"]),
    places: list(d["outdoor_places"]),
    uses: list(d["place_uses"]),
    things: list(d["local_things"]),
    fix: list(d["needs_fixing"]),
    looks: text(d["looks_after"]),
  };
}

export function parseFilters(params: URLSearchParams): Filters {
  const f: Filters = {};
  const road = params.get("road");
  const age = params.get("age");
  const house = params.get("house");
  const dog = params.get("dog");
  if (road && (ROADS as readonly string[]).includes(road)) f.road = road;
  if (age && /^[\w ]{1,20}$/.test(age)) f.age = age;
  if (house && ["kids", "teens", "adults"].includes(house)) f.house = house;
  if (dog === "Yes" || dog === "No") f.dog = dog;
  return f;
}

function matches(r: Row, f: Filters) {
  if (f.road && r.road !== f.road) return false;
  if (f.age && r.age !== f.age) return false;
  if (f.dog && r.dog !== f.dog) return false;
  if (f.house === "kids" && !r.household.some((h) => h.startsWith("Children")))
    return false;
  if (f.house === "teens" && !r.household.includes("Teenagers")) return false;
  if (
    f.house === "adults" &&
    !(r.household.length === 1 && r.household[0] === "Just adults")
  )
    return false;
  return true;
}

type Counts = Record<string, number>;
function tally(rows: Row[], get: (r: Row) => string[]): Counts {
  const c: Counts = {};
  for (const r of rows) for (const v of get(r)) if (v) c[v] = (c[v] ?? 0) + 1;
  return c;
}

const QUESTIONS: Record<string, (r: Row) => string[]> = {
  road: (r) => [r.road],
  age: (r) => [r.age],
  tenure: (r) => [r.tenure],
  household: (r) => r.household,
  places: (r) => r.places,
  uses: (r) => r.uses,
  things: (r) => r.things,
  looks: (r) => [r.looks],
  fix: (r) => r.fix,
};

function summarise(rows: Row[], coding: Coding | null) {
  const counts: Record<string, Counts> = {};
  for (const [k, get] of Object.entries(QUESTIONS))
    counts[k] = tally(rows, get);
  const coded = rows.filter((r) => coding?.responses[r.at]);
  const themes = {
    coded: coded.length,
    change: tally(coded, (r) => coding?.responses[r.at]?.change ?? []),
    like: tally(coded, (r) => coding?.responses[r.at]?.like ?? []),
  };
  return { n: rows.length, counts, themes };
}

export function aggregate(
  subs: Submission[],
  coding: Coding | null,
  f: Filters,
) {
  const all = subs.map(toRow);
  const rows = all.filter((r) => matches(r, f));
  const latest = all.reduce((m, r) => (r.at > m ? r.at : m), "");
  const base = {
    total: all.length,
    n: rows.length,
    latest,
    codingUpdated: coding?.updated ?? null,
  };
  if (rows.length < MIN_GROUP) return { ...base, small: true as const };

  const fixByRoad: Record<string, Counts> = {};
  for (const r of rows)
    for (const item of r.fix) {
      const by = (fixByRoad[item] ??= {});
      by[r.road] = (by[r.road] ?? 0) + 1;
    }

  const inGroup = new Map(rows.map((r) => [r.at, r]));
  const quotes = (coding?.quotes ?? [])
    .filter((q) => inGroup.has(q.at))
    .map((q) => ({
      code: q.code,
      text: q.text,
      road: inGroup.get(q.at)?.road ?? "",
      featured: q.featured === true,
    }));

  return {
    ...base,
    small: false as const,
    group: summarise(rows, coding),
    everyone: summarise(all, coding),
    fixByRoad,
    quotes,
  };
}
