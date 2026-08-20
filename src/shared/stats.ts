import type {
  AggregateStats,
  HistoryItem,
  MatchDetails,
  ProfileRecentMatch,
  SupportedPlatform,
  WidgetConfig,
  WidgetData,
  ProfileResponse,
} from "./types";

export const COMPACT_HISTORY_LIMIT = 30;

export function sourceToPlatform(source: string): SupportedPlatform | null {
  if (source === "matchmaking") return "premier";
  if (source === "faceit") return "faceit";
  return null;
}

export function isPlatformEnabled(platform: SupportedPlatform, config: WidgetConfig) {
  return platform === "premier" ? config.showPremier : config.showFaceit;
}

export function calculateAggregates(
  matches: MatchDetails[],
  steamId: string,
  config: WidgetConfig,
): AggregateStats {
  const players = matches.flatMap((match) => {
    const platform = sourceToPlatform(match.data_source);
    if (!platform || !isPlatformEnabled(platform, config)) return [];
    const player = match.stats.find((entry) => entry.steam64_id === steamId);
    return player ? [player] : [];
  });

  if (players.length === 0) {
    return { averageKills: null, averageAdr: null, matchCount: 0 };
  }

  const kills = players.reduce((sum, player) => sum + player.total_kills, 0);
  const adr = players.reduce((sum, player) => sum + player.dpr, 0);

  return {
    averageKills: kills / players.length,
    averageAdr: adr / players.length,
    matchCount: players.length,
  };
}

function normalizeOutcome(outcome: string): HistoryItem["outcome"] {
  if (outcome === "win" || outcome === "loss" || outcome === "tie") return outcome;
  return "unknown";
}

function toHistoryItem(
  recent: ProfileRecentMatch,
  detail: MatchDetails,
): HistoryItem | null {
  const platform = sourceToPlatform(recent.data_source);
  if (!platform || sourceToPlatform(detail.data_source) !== platform) return null;

  return {
    id: recent.id,
    platform,
    finishedAt: recent.finished_at || detail.finished_at,
    mapName: recent.map_name || detail.map_name,
    outcome: normalizeOutcome(recent.outcome),
    endingRank: recent.rank,
    premierChange: null,
  };
}

export function buildHistory(
  recentMatches: ProfileRecentMatch[],
  details: MatchDetails[],
  config: WidgetConfig,
): HistoryItem[] {
  const detailsById = new Map(details.map((match) => [match.id, match]));

  const history = recentMatches
    .flatMap((recent) => {
      const detail = detailsById.get(recent.id);
      if (!detail) return [];
      const item = toHistoryItem(recent, detail);
      return item && isPlatformEnabled(item.platform, config) ? [item] : [];
    })
    .sort((a, b) => Date.parse(a.finishedAt) - Date.parse(b.finishedAt));

  let previousPremierRank: number | null = null;
  for (const item of history) {
    if (item.platform !== "premier") continue;

    if (item.endingRank !== null && item.endingRank > 0) {
      item.premierChange =
        previousPremierRank !== null && previousPremierRank > 0
          ? item.endingRank - previousPremierRank
          : 0;
    }
    previousPremierRank = item.endingRank;
  }

  const limit = config.showCompactHistory ? COMPACT_HISTORY_LIMIT : config.historyCount;
  return history.reverse().slice(0, limit);
}

export function buildWidgetData(
  profile: ProfileResponse,
  matches: MatchDetails[],
  config: WidgetConfig,
): WidgetData {
  return {
    name: profile.name,
    premierRating: profile.ranks.premier,
    faceitLevel: profile.ranks.faceit,
    faceitElo: profile.ranks.faceit_elo,
    aim: profile.rating.aim,
    aggregates: calculateAggregates(matches, config.steamId, config),
    history: buildHistory(profile.recent_matches, matches, config),
  };
}
