import type {
  MatchDetails,
  MatchPlayerStats,
  ProfileRecentMatch,
  ProfileResponse,
} from "./types";

const API_BASE = "https://api-public.cs-prod.leetify.com";
const REQUEST_TIMEOUT_MS = 15_000;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseRecentMatch(value: unknown): ProfileRecentMatch | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  return {
    id: value.id,
    finished_at: stringValue(value.finished_at),
    data_source: stringValue(value.data_source),
    outcome: stringValue(value.outcome),
    rank: numberValue(value.rank),
    map_name: stringValue(value.map_name, "unknown"),
  };
}

function parseProfile(value: unknown): ProfileResponse {
  if (!isRecord(value)) throw new Error("Leetify returned an invalid profile.");

  const ranks = isRecord(value.ranks) ? value.ranks : {};
  const rating = isRecord(value.rating) ? value.rating : {};
  const recentMatches = Array.isArray(value.recent_matches)
    ? value.recent_matches
        .map(parseRecentMatch)
        .filter((match): match is ProfileRecentMatch => match !== null)
    : [];

  return {
    name: stringValue(value.name, "Unknown player"),
    ranks: {
      premier: numberValue(ranks.premier),
      faceit: numberValue(ranks.faceit),
      faceit_elo: numberValue(ranks.faceit_elo),
    },
    rating: { aim: numberValue(rating.aim) },
    recent_matches: recentMatches,
  };
}

function parsePlayerStats(value: unknown): MatchPlayerStats | null {
  if (!isRecord(value) || typeof value.steam64_id !== "string") return null;
  return {
    steam64_id: value.steam64_id,
    total_kills: numberValue(value.total_kills) ?? 0,
    dpr: numberValue(value.dpr) ?? 0,
  };
}

function parseMatch(value: unknown): MatchDetails | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  const stats = Array.isArray(value.stats)
    ? value.stats
        .map(parsePlayerStats)
        .filter((player): player is MatchPlayerStats => player !== null)
    : [];

  return {
    id: value.id,
    finished_at: stringValue(value.finished_at),
    data_source: stringValue(value.data_source),
    map_name: stringValue(value.map_name, "unknown"),
    stats,
  };
}

function parseMatches(value: unknown): MatchDetails[] {
  if (!Array.isArray(value)) {
    throw new Error("Leetify returned an invalid match list.");
  }
  return value.map(parseMatch).filter((match): match is MatchDetails => match !== null);
}

async function fetchJson(url: URL, apiKey?: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers: HeadersInit = apiKey ? { _leetify_key: apiKey } : {};

  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (response.status === 429) {
      throw new Error("Leetify rate limit reached. Please wait before refreshing.");
    }
    if (response.status === 404) {
      throw new Error(
        "Leetify profile not found. Ensure your Leetify account is set up, match tracking is enabled, and your Leetify profile is not private.",
      );
    }
    if (!response.ok) {
      throw new Error(`Leetify request failed (${response.status}).`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Leetify took too long to respond.");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function fetchLeetifyData(steamId: string, apiKey?: string) {
  const profileUrl = new URL("/v3/profile", API_BASE);
  const matchesUrl = new URL("/v3/profile/matches", API_BASE);
  profileUrl.searchParams.set("steam64_id", steamId);
  matchesUrl.searchParams.set("steam64_id", steamId);

  const [profileJson, matchesJson] = await Promise.all([
    fetchJson(profileUrl, apiKey),
    fetchJson(matchesUrl, apiKey),
  ]);

  return {
    profile: parseProfile(profileJson),
    matches: parseMatches(matchesJson),
  };
}
