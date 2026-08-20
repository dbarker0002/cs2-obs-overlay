import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, type MatchDetails, type ProfileRecentMatch } from "./types";
import { buildHistory, calculateAggregates, sourceToPlatform } from "./stats";

const steamId = "76561198093148511";

function match(
  id: string,
  dataSource: string,
  kills: number,
  dpr: number,
): MatchDetails {
  return {
    id,
    data_source: dataSource,
    finished_at: `2026-08-${id.padStart(2, "0")}T00:00:00.000Z`,
    map_name: "de_mirage",
    stats: [
      {
        steam64_id: steamId,
        total_kills: kills,
        dpr,
      },
    ],
  };
}

function recent(
  id: string,
  dataSource: string,
  rank: number,
): ProfileRecentMatch {
  return {
    id,
    data_source: dataSource,
    finished_at: `2026-08-${id.padStart(2, "0")}T00:00:00.000Z`,
    map_name: "de_mirage",
    outcome: id === "1" ? "loss" : "win",
    rank,
  };
}

describe("Leetify stat derivation", () => {
  const matches = [
    match("1", "matchmaking", 20, 80),
    match("2", "faceit", 10, 60),
    match("3", "matchmaking_competitive", 99, 999),
  ];

  it("accepts only exact supported data sources", () => {
    expect(sourceToPlatform("matchmaking")).toBe("premier");
    expect(sourceToPlatform("faceit")).toBe("faceit");
    expect(sourceToPlatform("matchmaking_competitive")).toBeNull();
  });

  it("averages total kills and DPR across every eligible match", () => {
    expect(calculateAggregates(matches, steamId, DEFAULT_CONFIG)).toEqual({
      averageKills: 15,
      averageAdr: 70,
      matchCount: 2,
    });
  });

  it("uses enabled platforms as the aggregate scope", () => {
    const config = { ...DEFAULT_CONFIG, showFaceit: false };
    expect(calculateAggregates(matches, steamId, config)).toEqual({
      averageKills: 20,
      averageAdr: 80,
      matchCount: 1,
    });
  });

  it("joins history by ID and keeps profile outcome and ending rank", () => {
    const profileMatches = [
      recent("1", "matchmaking", 18500),
      recent("2", "faceit", 8),
      recent("3", "matchmaking_competitive", 12),
      recent("4", "matchmaking", 19000),
    ];
    const history = buildHistory(profileMatches, matches, DEFAULT_CONFIG);

    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({
      id: "2",
      platform: "faceit",
      outcome: "win",
      endingRank: 8,
    });
    expect(history[1]).toMatchObject({
      id: "1",
      platform: "premier",
      outcome: "loss",
      endingRank: 18500,
    });
  });

  it("derives Premier changes and resets after an unranked placement game", () => {
    const detailedMatches = [
      match("1", "matchmaking", 20, 80),
      match("2", "matchmaking", 22, 85),
      match("3", "matchmaking", 24, 90),
    ];
    const profileMatches = [
      recent("1", "matchmaking", 0),
      recent("2", "matchmaking", 19000),
      recent("3", "matchmaking", 19125),
    ];

    const history = buildHistory(profileMatches, detailedMatches, DEFAULT_CONFIG);
    expect(history.map(({ id, endingRank, premierChange }) => ({
      id,
      endingRank,
      premierChange,
    }))).toEqual([
      { id: "3", endingRank: 19125, premierChange: 125 },
      { id: "2", endingRank: 19000, premierChange: 0 },
      { id: "1", endingRank: 0, premierChange: null },
    ]);
  });

  it("keeps extra results available for auto-fitting compact history", () => {
    const detailedMatches = Array.from({ length: 12 }, (_, index) =>
      match(String(index + 1), "faceit", 15, 75),
    );
    const profileMatches = Array.from({ length: 12 }, (_, index) =>
      recent(String(index + 1), "faceit", 8),
    );
    const config = { ...DEFAULT_CONFIG, showCompactHistory: true };

    expect(buildHistory(profileMatches, detailedMatches, config)).toHaveLength(12);
  });
});
