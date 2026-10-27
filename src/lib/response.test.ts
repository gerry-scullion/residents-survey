import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { questions } from "../questions";
import {
  DETAIL_COLUMNS,
  buildResponse,
  cleanEmail,
  responseFields,
} from "./response";

const formsHtml = readFileSync(
  new URL("../../public/__forms.html", import.meta.url),
  "utf8",
);

function fieldNames(formName: string): string[] {
  const form = formsHtml.match(
    new RegExp(`<form name="${formName}"[\\s\\S]*?</form>`),
  )?.[0];
  assert.ok(form, `form "${formName}" is missing from public/__forms.html`);
  return [...form.matchAll(/name="([^"]+)"/g)]
    .map((m) => m[1]!)
    .filter((n) => n !== formName && n !== "form-name" && n !== "bot-field")
    .sort();
}

describe("Netlify forms", () => {
  it("the static survey form lists every field the app sends", () => {
    const sent = Object.keys(responseFields(buildResponse({}))).sort();
    assert.deepEqual(fieldNames("survey"), sent);
  });

  it("the static contact form only takes an email address", () => {
    assert.deepEqual(fieldNames("contact"), ["email"]);
  });

  it("every option with a detail box has somewhere to go", () => {
    const columnFor: Record<string, string> = {
      road: "road",
      outdoorPlaces: "outdoor_places",
      placeUses: "place_uses",
      diyAmenities: "local_things",
      needsFixing: "needs_fixing",
    };
    for (const q of questions) {
      if (!q.options?.some((o) => o.followUp) || q.id === "looksAfter")
        continue;
      assert.ok(
        DETAIL_COLUMNS.includes(columnFor[q.id] as never),
        `${q.id} details are not sent`,
      );
    }
  });

  it("flattens answers and details into plain text", () => {
    const fields = responseFields(
      buildResponse({
        road: {
          selected: ["Nearby, not one of these three"],
          followUps: { "Nearby, not one of these three": " Vernon Avenue " },
        },
        needsFixing: {
          selected: ["Pavements", "Something else"],
          followUps: { "Something else": "Broken sign" },
        },
        looksAfter: {
          selected: ["Yes, someone else does"],
          followUps: { "Yes, someone else does": "A neighbour" },
        },
      }),
    );
    assert.equal(fields["road"], "Nearby, not one of these three");
    assert.equal(
      fields["road_details"],
      "Nearby, not one of these three: Vernon Avenue",
    );
    assert.equal(fields["needs_fixing"], "Pavements, Something else");
    assert.equal(fields["needs_fixing_details"], "Something else: Broken sign");
    assert.equal(fields["looks_after_detail"], "A neighbour");
    assert.equal(fields["tenure"], "");
  });

  it("the survey no longer asks for an email address", () => {
    assert.ok(!questions.some((q) => q.id === "hearingBack"));
    assert.ok(!fieldNames("survey").some((n) => n.includes("email")));
  });

  it("checks email addresses typed on the thank you page", () => {
    assert.equal(cleanEmail("  name@example.com "), "name@example.com");
    assert.equal(cleanEmail(""), null);
    assert.equal(cleanEmail("name"), null);
    assert.equal(cleanEmail("name@example"), null);
  });
});
