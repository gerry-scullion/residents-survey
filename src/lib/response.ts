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

/**
 * Tidies an email address typed on the thank you page. Returns null if it
 * doesn't look like an email address.
 */
export function cleanEmail(input: string): string | null {
  const email = input.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
