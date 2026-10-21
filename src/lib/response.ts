import {
  collectFollowUps,
  selectedLabels as list,
  type Answer,
  type Answers,
} from "./answer-details";

function one(answer: Answer | undefined): string | null {
  return list(answer)?.[0] ?? null;
}

function free(answer: Answer | undefined): string | null {
  const text = answer?.text?.trim();
  return text ? text : null;
}

/** One survey response, shaped like a row in the `responses` table. */
export function buildResponse(answers: Answers) {
  const looksAfter = answers["looksAfter"];
  const looksAfterChoice = looksAfter?.selected[0];
  const showWhyNot =
    answers["outdoorPlaces"]?.selected.includes("None of these");

  return {
    follow_up_answers: collectFollowUps(answers),
    road: one(answers["road"]),
    tenure: one(answers["howLong"]),
    household: list(answers["household"]),
    has_dog: one(answers["hasDog"]),
    age_band: one(answers["age"]),
    outdoor_places: list(answers["outdoorPlaces"]),
    place_uses: list(answers["placeUses"]),
    why_not_used: showWhyNot ? free(answers["whyNotUsed"]) : null,
    local_things: list(answers["diyAmenities"]),
    needs_fixing: list(answers["needsFixing"]),
    fixing_location: free(answers["fixingLocation"]),
    what_is_good: free(answers["whatIsGood"]),
    looks_after: looksAfterChoice ?? null,
    looks_after_detail: looksAfterChoice
      ? looksAfter?.followUps?.[looksAfterChoice]?.trim() || null
      : null,
    one_change: free(answers["ownIdea"]),
    anything_else: free(answers["anythingElse"]),
  };
}

export type SurveyResponse = ReturnType<typeof buildResponse>;

/**
 * The contact request, if any. It is kept apart from the response and never
 * carries anything that could link the two.
 */
export function buildContact(answers: Answers) {
  const hearing = answers["hearingBack"];
  const ownCopy =
    hearing?.selected.includes("Send me a copy of my answers") ?? false;
  const updates = hearing?.selected.includes("Keep me updated") ?? false;
  const email = hearing?.followUps?.["email"]?.trim();
  if (!(ownCopy || updates) || !email) return null;
  return {
    email,
    wants_summary: true,
    wants_own_copy: ownCopy,
    wants_updates: updates,
  };
}

export type ContactRequest = NonNullable<ReturnType<typeof buildContact>>;

/** Columns whose option details are sent to Netlify as `<column>_details`. */
export const DETAIL_COLUMNS = [
  "road",
  "outdoor_places",
  "place_uses",
  "local_things",
  "needs_fixing",
] as const;

/** Flattens a response into the plain text fields of the Netlify "survey" form. */
export function responseFields(
  response: SurveyResponse,
): Record<string, string> {
  const { follow_up_answers: details, ...columns } = response;
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(columns)) {
    fields[key] = Array.isArray(value) ? value.join(", ") : (value ?? "");
  }
  for (const column of DETAIL_COLUMNS) {
    fields[`${column}_details`] = Object.entries(details[column] ?? {})
      .map(([label, text]) => `${label}: ${text}`)
      .join("; ");
  }
  return fields;
}

/** Flattens a contact request into the fields of the Netlify "contact" form. */
export function contactFields(contact: ContactRequest): Record<string, string> {
  return {
    email: contact.email,
    wants_own_copy: contact.wants_own_copy ? "yes" : "no",
    wants_updates: contact.wants_updates ? "yes" : "no",
  };
}
