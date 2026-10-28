import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  aggregate,
  parseFilters,
  MIN_GROUP,
  type Coding,
  type Submission,
} from "./live-results";
import { keyMatchesHash } from "./keys";
import { pickAnswers } from "./live-results";

// Made-up responses only. Real responses never go in this repo.
function sub(
  i: number,
  road: string,
  extra: Record<string, string> = {},
): Submission {
  return {
    created_at: `2026-01-01T10:00:${String(i).padStart(2, "0")}.123Z`,
    data: {
      road: `Kincora ${road}`,
      age_band: i % 2 ? "30 to 44" : "60 to 74",
      household: i % 3 ? "Just adults" : "Children 5 to 12, Teenagers",
      has_dog: i % 2 ? "Yes" : "No",
      needs_fixing: "Pavements, Nowhere to sit",
      one_change: "Secret full comment that must never be sent",
      ip: "203.0.113.9",
      user_agent: "Test",
      ...extra,
    },
  };
}

const subs = [
  ...Array.from({ length: 6 }, (_, i) => sub(i, "Avenue")),
  ...Array.from({ length: 3 }, (_, i) => sub(i + 10, "Grove")),
];

const coding: Coding = {
  updated: "2026-01-02",
  responses: { "2026-01-01T10:00:00": { change: ["S"], like: ["AM"] } },
  quotes: [
    {
      at: "2026-01-01T10:00:00",
      code: "S",
      text: "A bench please.",
      featured: true,
    },
    { at: "2026-01-01T10:00:10", code: "S", text: "Grove quote." },
  ],
};

describe("live results", () => {
  it("counts answers for the whole group", () => {
    const out = aggregate(subs, coding, {});
    assert.equal(out.small, false);
    if (out.small) return;
    assert.equal(out.n, 9);
    assert.equal(out.group.counts["road"]?.["Avenue"], 6);
    assert.equal(out.group.counts["fix"]?.["Pavements"], 9);
    assert.deepEqual(out.fixByRoad["Pavements"], { Avenue: 6, Grove: 3 });
    assert.equal(out.group.themes.coded, 1);
    assert.equal(out.group.themes.change["S"], 1);
  });

  it("hides groups smaller than the minimum", () => {
    const out = aggregate(subs, coding, { road: "Grove" });
    assert.ok(3 < MIN_GROUP);
    assert.deepEqual(Object.keys(out).sort(), [
      "codingUpdated",
      "latest",
      "n",
      "small",
      "total",
    ]);
    assert.equal(out.small, true);
  });

  it("only shows quotes from people in the group, labelled by road", () => {
    const out = aggregate(subs, coding, { road: "Avenue" });
    if (out.small) throw new Error("should not be small");
    assert.deepEqual(out.quotes, [
      { code: "S", text: "A bench please.", road: "Avenue", featured: true },
    ]);
  });

  it("never sends full comments, IP addresses or browser details", () => {
    const body = JSON.stringify(aggregate(subs, coding, {}));
    for (const secret of [
      "Secret full comment",
      "203.0.113.9",
      "user_agent",
      "Test",
    ])
      assert.ok(!body.includes(secret), secret);
  });

  it("ignores filter values it doesn't know", () => {
    assert.deepEqual(
      parseFilters(
        new URLSearchParams("road=Elsewhere&house=x&dog=Maybe&age=<b>"),
      ),
      {},
    );
    assert.deepEqual(
      parseFilters(new URLSearchParams("road=Drive&dog=Yes&house=kids")),
      {
        road: "Drive",
        dog: "Yes",
        house: "kids",
      },
    );
  });

  it("checks keys against their fingerprints", () => {
    const abcHash =
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
    assert.equal(keyMatchesHash("abc", abcHash), true);
    assert.equal(keyMatchesHash("abd", abcHash), false);
    assert.equal(keyMatchesHash(null, abcHash), false);
  });

  it("keeps only tick-box answers when saving a response", () => {
    const kept = pickAnswers(sub(1, "Drive"));
    assert.deepEqual(Object.keys(kept.data).sort(), [
      "age_band",
      "has_dog",
      "household",
      "needs_fixing",
      "road",
    ]);
    assert.ok(!JSON.stringify(kept).includes("Secret full comment"));
    assert.ok(!JSON.stringify(kept).includes("203.0.113.9"));
  });
});
