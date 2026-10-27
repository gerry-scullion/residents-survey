import { supabase } from "@/integrations/supabase/client";
import type { Answers } from "@/lib/answer-details";
import {
  buildContact,
  buildResponse,
  contactFields,
  responseFields,
} from "@/lib/response";
export type { Answer, Answers } from "@/lib/answer-details";

/**
 * Netlify finds the forms in this static file at deploy time (the app itself
 * is rendered by JavaScript, which Netlify's form detection cannot see).
 * Posting to a static path means Netlify handles the submission directly.
 */
const NETLIFY_FORMS_PATH = "/__forms.html";

async function postToNetlify(formName: string, fields: Record<string, string>) {
  const res = await fetch(NETLIFY_FORMS_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ "form-name": formName, ...fields }).toString(),
  });
  if (!res.ok)
    throw new Error(`Netlify form "${formName}" returned ${res.status}`);
}

async function saveToSupabase(
  response: ReturnType<typeof buildResponse>,
  contact: ReturnType<typeof buildContact>,
) {
  const { error } = await supabase.from("responses").insert(response);
  if (error) throw error;
  if (contact) await supabase.from("contacts").insert(contact);
}

async function saveToNetlify(
  response: ReturnType<typeof buildResponse>,
  contact: ReturnType<typeof buildContact>,
) {
  await postToNetlify("survey", responseFields(response));
  if (contact) await postToNetlify("contact", contactFields(contact));
}

/**
 * Sends the answers to Netlify Forms and to Supabase. Either one is enough:
 * on Netlify the form always works, and in the Lovable preview Supabase does.
 * The response and the contact are always sent as two separate submissions.
 */
export async function submitAnswers(answers: Answers): Promise<void> {
  const response = buildResponse(answers);
  const contact = buildContact(answers);

  const results = await Promise.allSettled([
    saveToNetlify(response, contact),
    saveToSupabase(response, contact),
  ]);
  if (results.some((r) => r.status === "fulfilled")) return;

  for (const r of results) if (r.status === "rejected") console.error(r.reason);
  throw new Error("We could not save your answers.");
}
