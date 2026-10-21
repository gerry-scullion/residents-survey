import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectFollowUps, selectedLabels, followUpsFor } from "./answer-details";
import { questions } from "../questions";

describe("additional answers", () => {
  it("offers details for alternative and none-of-these options", () => {
    for (const [id, label] of [["road", "Nearby, not one of these three"], ["outdoorPlaces", "Somewhere else nearby"], ["outdoorPlaces", "None of these"], ["placeUses", "Something else"], ["needsFixing", "Something else"], ["diyAmenities", "No"], ["diyAmenities", "Didn't know they were there"], ["needsFixing", "No"], ["looksAfter", "Not sure"], ["looksAfter", "Not that I know of"]]) {
      assert.ok(questions.find(q => q.id === id)?.options?.find(o => o.label === label)?.followUp);
    }
  });
  it("saves details while leaving selected labels unchanged", () => {
    const answer = { selected: ["Somewhere else nearby"], followUps: { "Somewhere else nearby": "  Bull Island  ", "None of these": "Hidden answer" } };
    assert.deepEqual(selectedLabels(answer), ["Somewhere else nearby"]);
    assert.deepEqual(collectFollowUps({ outdoorPlaces: answer }), { outdoor_places: { "Somewhere else nearby": "Bull Island" } });
  });
  it("keeps contacts separate from response details", () => {
    assert.deepEqual(collectFollowUps({ hearingBack: { selected: ["Keep me updated"], followUps: { email: "test@example.com" } } }), {});
  });
  it("reads saved details for results", () => {
    assert.deepEqual(followUpsFor({ follow_up_answers: { needs_fixing: { "Something else": "Broken sign" } } }, "needs_fixing"), { "Something else": "Broken sign" });
  });
});