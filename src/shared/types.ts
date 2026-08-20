export type SupportedPlatform = "premier" | "faceit";

export interface ProfileRanks {
  premier: number | null;
  faceit: number | null;
  faceit_elo: number | null;
}

export interface ProfileRating {
  aim: number | null;
}

export interface ProfileRecentMatch {
  id: string;
  finished_at: string;
  data_source: string;
  outcome: string;
  rank: number | null;
  map_name: string;
}

export interface ProfileResponse {
  name: string;
  ranks: ProfileRanks;
  rating: ProfileRating;
  recent_matches: ProfileRecentMatch[];
}

export interface MatchPlayerStats {
  steam64_id: string;
  total_kills: number;
  dpr: number;
}

export interface MatchDetails {
  id: string;
  finished_at: string;
  data_source: string;
  map_name: string;
  stats: MatchPlayerStats[];
}

export interface WidgetConfig {
  steamId: string;
  showPremier: boolean;
  showFaceit: boolean;
  showAverageKills: boolean;
  showAdr: boolean;
  showAim: boolean;
  showCompactHistory: boolean;
  historyCount: number;
  refreshMinutes: number;
}

export interface AggregateStats {
  averageKills: number | null;
  averageAdr: number | null;
  matchCount: number;
}

export interface HistoryItem {
  id: string;
  platform: SupportedPlatform;
  finishedAt: string;
  mapName: string;
  outcome: "win" | "loss" | "tie" | "unknown";
  endingRank: number | null;
  premierChange: number | null;
}

export interface WidgetData {
  name: string;
  premierRating: number | null;
  faceitLevel: number | null;
  faceitElo: number | null;
  aim: number | null;
  aggregates: AggregateStats;
  history: HistoryItem[];
}

export const DEFAULT_CONFIG: WidgetConfig = {
  steamId: "",
  showPremier: true,
  showFaceit: true,
  showAverageKills: true,
  showAdr: true,
  showAim: true,
  showCompactHistory: false,
  historyCount: 8,
  refreshMinutes: 5,
};
