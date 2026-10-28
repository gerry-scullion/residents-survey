import { getStore } from "@netlify/blobs";
import {
  pickAnswers,
  timeKey,
  type Coding,
  type Submission,
} from "./live-results";

/** Where the live results page keeps its data, inside Netlify Blobs. */
export const STORE = "live-results";
const SUB_PREFIX = "sub/";

export const store = () => getStore(STORE);

/** Saves one response's tick-box answers. Same time = same response, so repeats overwrite. */
export async function saveSubmission(s: Submission) {
  const clean = pickAnswers(s);
  await store().setJSON(SUB_PREFIX + timeKey(clean.created_at), clean);
}

export async function loadSubmissions(): Promise<Submission[]> {
  const s = store();
  const { blobs } = await s.list({ prefix: SUB_PREFIX });
  const all = await Promise.all(
    blobs.map(
      (b) => s.get(b.key, { type: "json" }) as Promise<Submission | null>,
    ),
  );
  return all.filter((x): x is Submission => x !== null);
}

export async function loadCoding(): Promise<Coding | null> {
  return (await store().get("coding", { type: "json" })) as Coding | null;
}

export async function saveCoding(coding: Coding) {
  const { submissions, ...rest } = coding;
  for (const s of submissions ?? []) await saveSubmission(s);
  await store().setJSON("coding", rest);
}
