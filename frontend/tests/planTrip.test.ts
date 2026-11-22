import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { stableStringify } from "@/lib/stableStringify";
import { isErrorString, hasErrorEvent, TimelineEvent } from "@/lib/planTrip";

describe("stableStringify & Cross-Language Golden HMAC", () => {
  const goldenSecret = "test-golden-secret-key-32-chars-ok";
  const expectedGoldenHmac = "7bc51b18e8143619b8e0e46e152f3c3699d780b26571aa158d45b8226db11723";

  const goldenDna = {
    constraints: {
      accessibility: ["wheelchair"],
      dietary: "vegetarian",
      home_hub: "BOM",
      travel_pace: "moderate",
    },
    metadata: {
      last_login: "2026-11-22T00:00:00.000Z",
      version: "v2.0",
    },
    user_id: "usr_test_golden_12345",
    weights: {
      flight_class: {
        business: 0,
        economy: 1,
        first: 0,
        premium_economy: 0,
      },
      interests: ["culture", "food"],
      stay_tier: {
        budget: 0,
        luxury: 0,
        mid_range: 1,
        resort: 0,
      },
    },
  };

  it("produces deterministic sorted-key JSON string matching Python", () => {
    const d1 = { z: 1, a: 2, m: { y: 10, b: 20 } };
    const d2 = { a: 2, m: { b: 20, y: 10 }, z: 1 };
    expect(stableStringify(d1)).toBe('{"a":2,"m":{"b":20,"y":10},"z":1}');
    expect(stableStringify(d1)).toBe(stableStringify(d2));
  });

  it("handles primitives, arrays, null and undefined", () => {
    expect(stableStringify("hello")).toBe('"hello"');
    expect(stableStringify(42)).toBe("42");
    expect(stableStringify(true)).toBe("true");
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(undefined)).toBe("null");
    expect(stableStringify(["b", "a", 1])).toBe('["b","a",1]');
  });

  it("matches cross-language golden HMAC digest exactly with Python suite", () => {
    const canonical = stableStringify(goldenDna);
    const signature = crypto
      .createHmac("sha256", goldenSecret)
      .update(canonical)
      .digest("hex");

    expect(signature).toBe(expectedGoldenHmac);
  });
});


describe("Error Detection Filter (pre-save trip validation)", () => {
  it("detects known error patterns in LLM outputs", () => {
    expect(isErrorString("Coordinator Error: groq api returned 503")).toBe(true);
    expect(isErrorString("Validation error in trip schedule")).toBe(true);
    expect(isErrorString("did not find google_api_key in environment")).toBe(true);
    expect(isErrorString("did not find groq_api_key in environment")).toBe(true);
    expect(isErrorString("Traceback (most recent call last):\n  File 'main.py'")).toBe(true);
    expect(isErrorString("Error code: 429 Too Many Requests")).toBe(true);
    expect(isErrorString("Error: No attractions found in city")).toBe(true);
  });

  it("allows valid itinerary descriptions without triggering false positives", () => {
    expect(isErrorString("Day 1: Arrive in Tokyo and check into hotel")).toBe(false);
    expect(isErrorString("Evening walk through Shinjuku neon streets")).toBe(false);
    expect(isErrorString("Trip Summary: Estimated total cost $1500")).toBe(false);
  });

  it("blocks trip persistence when any timeline event contains an error", () => {
    const validEvents: TimelineEvent[] = [
      { status: "Flight to Tokyo", description: "Flight on ANA 830" },
      { status: "Check-in Hotel", description: "Stay at Shinjuku Granbell" },
      { status: "Trip Summary", description: "Total cost: $1400" },
    ];
    expect(hasErrorEvent(validEvents)).toBe(false);

    const corruptedEvents: TimelineEvent[] = [
      { status: "Flight to Tokyo", description: "Flight on ANA 830" },
      { status: "Error: Service Unavailable", description: "Traceback (most recent call last)" },
    ];
    expect(hasErrorEvent(corruptedEvents)).toBe(true);

    const statusCorrupted: TimelineEvent[] = [
      { status: "Coordinator Error: model failed", description: "Please retry" },
    ];
    expect(hasErrorEvent(statusCorrupted)).toBe(true);
  });

  it("characterizes known gap: placeholder messages currently bypass error filter", () => {
    // Characterization: placeholder text does NOT trigger isErrorString,
    // which explains why placeholders historically got saved to user history.
    const placeholderText = "[Flight data unavailable — advise user to check manually. Error: TimeoutError]";
    expect(isErrorString(placeholderText)).toBe(false);
  });
});
