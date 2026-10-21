export type Answer = {
  selected: string[];
  text?: string | undefined;
  followUps?: Record<string, string> | undefined;
};

export type Answers = Record<string, Answer>;

const columns: Record<string, string> = {
  road: "road", howLong: "tenure", household: "household", hasDog: "has_dog",
  age: "age_band", outdoorPlaces: "outdoor_places", placeUses: "place_uses",
  diyAmenities: "local_things", needsFixing: "needs_fixing", looksAfter: "looks_after",
};

export function selectedLabels(answer?: Answer): string[] | null {
  return answer?.selected.length ? answer.selected : null;
}

export function collectFollowUps(answers: Answers): Record<string, Record<string, string>> {
  const details: Record<string, Record<string, string>> = {};
  for (const [question, column] of Object.entries(columns)) {
    const answer = answers[question];
    for (const label of answer?.selected ?? []) {
      const text = answer?.followUps?.[label]?.trim();
      if (text) (details[column] ??= {})[label] = text;
    }
  }
  return details;
}

export function followUpsFor(row: Record<string, unknown>, column: string): Record<string, string> {
  const details = row["follow_up_answers"];
  if (!details || typeof details !== "object" || Array.isArray(details)) return {};
  const entries = (details as Record<string, unknown>)[column];
  if (!entries || typeof entries !== "object" || Array.isArray(entries)) return {};
  return Object.fromEntries(Object.entries(entries).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

export function choiceLabel(column: string, value: string): string {
  if (column === "road" && value.startsWith("Nearby, not one of these three:")) return "Nearby, not one of these three";
  return value.split(": ")[0] ?? value;
}