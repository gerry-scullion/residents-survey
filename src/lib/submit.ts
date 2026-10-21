import { supabase } from "@/integrations/supabase/client";
import { collectFollowUps, selectedLabels as list, type Answer, type Answers } from "@/lib/answer-details";
export type { Answer, Answers } from "@/lib/answer-details";

function one(answer: Answer | undefined): string | null {
  return list(answer)?.[0] ?? null;
}

function free(answer: Answer | undefined): string | null {
  const text = answer?.text?.trim();
  return text ? text : null;
}

export async function submitAnswers(answers: Answers): Promise<void> {
  const looksAfter = answers["looksAfter"];
  const placeUses = answers["placeUses"];
  const showWhyNot = answers["outdoorPlaces"]?.selected.includes("None of these");

  const response = {
    follow_up_answers: collectFollowUps(answers),
    road: one(answers["road"]),
    tenure: one(answers["howLong"]),
    household: list(answers["household"]),
    has_dog: one(answers["hasDog"]),
    age_band: one(answers["age"]),
    outdoor_places: list(answers["outdoorPlaces"]),
    place_uses: list(placeUses),
    why_not_used: showWhyNot ? free(answers["whyNotUsed"]) : null,
    local_things: list(answers["diyAmenities"]),
    needs_fixing: list(answers["needsFixing"]),
    fixing_location: free(answers["fixingLocation"]),
    what_is_good: free(answers["whatIsGood"]),
    looks_after: looksAfter?.selected[0] ?? null,
    looks_after_detail: looksAfter?.selected[0]
      ? looksAfter.followUps?.[looksAfter.selected[0]]?.trim() || null
      : null,
    one_change: free(answers["ownIdea"]),
    anything_else: free(answers["anythingElse"]),
  };

  const { error } = await supabase.from("responses").insert(response);
  if (error) throw error;

  // Contacts are written separately and are never linked to the response.
  const hearing = answers["hearingBack"];
  const ownCopy = hearing?.selected.includes("Send me a copy of my answers") ?? false;
  const updates = hearing?.selected.includes("Keep me updated") ?? false;
  const email = hearing?.followUps?.["email"]?.trim();
  if ((ownCopy || updates) && email) {
    await supabase.from("contacts").insert({
      email,
      wants_summary: true,
      wants_own_copy: ownCopy,
      wants_updates: updates,
    });
  }
}
