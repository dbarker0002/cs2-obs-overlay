import { describe, expect, it } from "vitest";
import {
  configToParams,
  getEffectiveRefreshMinutes,
  isValidSteam64Id,
  paramsToConfig,
} from "./config";
import { DEFAULT_CONFIG } from "./types";

describe("widget config", () => {
  it("validates Steam64 IDs", () => {
    expect(isValidSteam64Id("76561198093148511")).toBe(true);
    expect(isValidSteam64Id("123")).toBe(false);
    expect(isValidSteam64Id("7656119809314851x")).toBe(false);
  });

  it("round-trips non-default settings", () => {
    const config = {
      ...DEFAULT_CONFIG,
      steamId: "76561198093148511",
      showFaceit: false,
      showAdr: false,
      showCompactHistory: true,
      historyCount: 5,
      refreshMinutes: 10,
    };

    expect(paramsToConfig(configToParams(config))).toEqual(config);
  });

  it("clamps numeric URL settings", () => {
    const parsed = paramsToConfig(
      new URLSearchParams("historyCount=100&refresh=-1"),
    );
    expect(parsed.historyCount).toBe(8);
    expect(parsed.refreshMinutes).toBe(1);
  });

  it("enforces a five-minute keyless minimum", () => {
    expect(getEffectiveRefreshMinutes(1, false)).toBe(5);
    expect(getEffectiveRefreshMinutes(1, true)).toBe(1);
  });
});
