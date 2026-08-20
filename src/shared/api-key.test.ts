import { describe, expect, it } from "vitest";
import { apiKeyFromFragment, apiKeyToFragment } from "./api-key";

describe("API key fragment", () => {
  it("round-trips keys without putting them in query parameters", () => {
    const fragment = apiKeyToFragment("key with symbols/+");
    expect(fragment.startsWith("#apiKey=")).toBe(true);
    expect(apiKeyFromFragment(fragment)).toBe("key with symbols/+");
  });

  it("ignores missing and blank keys", () => {
    expect(apiKeyFromFragment("")).toBeNull();
    expect(apiKeyFromFragment("#apiKey=%20")).toBeNull();
    expect(apiKeyToFragment("  ")).toBe("");
  });
});
