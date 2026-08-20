import { DEFAULT_CONFIG, type WidgetConfig } from "./types";

const STEAM64_PATTERN = /^\d{17}$/;

function readBoolean(params: URLSearchParams, name: string, fallback: boolean) {
  const value = params.get(name);
  if (value === null) return fallback;
  return value !== "0";
}

function readInteger(
  params: URLSearchParams,
  name: string,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number.parseInt(params.get(name) ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export function isValidSteam64Id(value: string): boolean {
  return STEAM64_PATTERN.test(value);
}

export function paramsToConfig(params: URLSearchParams): WidgetConfig {
  return {
    steamId: params.get("steamId")?.trim() ?? DEFAULT_CONFIG.steamId,
    showPremier: readBoolean(params, "premier", DEFAULT_CONFIG.showPremier),
    showFaceit: readBoolean(params, "faceit", DEFAULT_CONFIG.showFaceit),
    showAverageKills: readBoolean(
      params,
      "avgKills",
      DEFAULT_CONFIG.showAverageKills,
    ),
    showAdr: readBoolean(params, "adr", DEFAULT_CONFIG.showAdr),
    showAim: readBoolean(params, "aim", DEFAULT_CONFIG.showAim),
    showCompactHistory:
      params.get("compact") === "1" || DEFAULT_CONFIG.showCompactHistory,
    historyCount: readInteger(
      params,
      "historyCount",
      DEFAULT_CONFIG.historyCount,
      1,
      8,
    ),
    refreshMinutes: readInteger(
      params,
      "refresh",
      DEFAULT_CONFIG.refreshMinutes,
      1,
      60,
    ),
  };
}

export function configToParams(config: WidgetConfig): URLSearchParams {
  const params = new URLSearchParams({ steamId: config.steamId });
  if (!config.showPremier) params.set("premier", "0");
  if (!config.showFaceit) params.set("faceit", "0");
  if (!config.showAverageKills) params.set("avgKills", "0");
  if (!config.showAdr) params.set("adr", "0");
  if (!config.showAim) params.set("aim", "0");
  if (config.showCompactHistory) params.set("compact", "1");
  if (config.historyCount !== DEFAULT_CONFIG.historyCount) {
    params.set("historyCount", String(config.historyCount));
  }
  if (config.refreshMinutes !== DEFAULT_CONFIG.refreshMinutes) {
    params.set("refresh", String(config.refreshMinutes));
  }
  return params;
}

export function getEffectiveRefreshMinutes(
  requestedMinutes: number,
  hasApiKey: boolean,
): number {
  return hasApiKey ? Math.max(1, requestedMinutes) : Math.max(5, requestedMinutes);
}
