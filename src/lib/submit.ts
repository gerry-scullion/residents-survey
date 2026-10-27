import { supabase } from "@/integrations/supabase/client";
import type { Answers } from "@/lib/answer-details";
import { buildResponse, responseFields } from "@/lib/response";
export type { Answer, Answers } from "@/lib/answer-details";

/**
 * Netlify finds the forms in this static file at deploy time (the app itself
 * is rendered by JavaScript, which Netlify's form detection cannot see).
 * Posting to a static path means Netlify handles the submission directly.
 */
export const NETLIFY_FORMS_PATH = "/__forms.html";

async function postToNetlify(formName: string, fields: Record<string, string>) {
  const res = await fetch(NETLIFY_FORMS_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ "form-name": formName, ...fields }).toString(),
  });
  if (!res.ok)
    throw new Error(`Netlify form "${formName}" returned ${res.status}`);
}

/**
 * Sends to Netlify Forms and to Supabase. Either one is enough: on Netlify
 * the form always works, and in the Lovable preview Supabase does.
 */
async function saveToEither(
  netlify: () => Promise<void>,
  supabaseInsert: () => Promise<void>,
) {
  const results = await Promise.allSettled([netlify(), supabaseInsert()]);
  if (results.some((r) => r.status === "fulfilled")) return;
  for (const r of results) if (r.status === "rejected") console.error(r.reason);
  throw new Error("Could not save.");
}

export async function submitAnswers(answers: Answers): Promise<void> {
  const response = buildResponse(answers);
  await saveToEither(
    () => postToNetlify("survey", responseFields(response)),
    async () => {
      const { error } = await supabase.from("responses").insert(response);
      if (error) throw error;
    },
  );
}

/**
 * Saves an email address for sending the report. It is sent on its own,
 * after the answers, so it can never be matched to them.
 */
export async function submitEmail(email: string): Promise<void> {
  await saveToEither(
    () => postToNetlify("contact", { email }),
    async () => {
      const { error } = await supabase.from("contacts").insert({
        email,
        wants_summary: true,
        wants_own_copy: false,
        wants_updates: false,
      });
      if (error) throw error;
    },
  );
}
