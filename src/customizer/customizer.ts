import { apiKeyToFragment } from "../shared/api-key";
import { fetchLeetifyData } from "../shared/api";
import leetifyBadge from "../../assets/Leetify_Badge_White_Large.png";
import {
  configToParams,
  isValidSteam64Id,
  paramsToConfig,
} from "../shared/config";
import { buildWidgetData } from "../shared/stats";
import {
  DEFAULT_CONFIG,
  type HistoryItem,
  type MatchDetails,
  type ProfileResponse,
  type WidgetConfig,
  type WidgetData,
} from "../shared/types";
import { renderWidget, renderWidgetState } from "../shared/widget-view";
import "./customizer.css";

function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element: ${id}`);
  return node as T;
}

const form = byId<HTMLFormElement>("config-form");
const customizerLeetifyBadge = byId<HTMLImageElement>("customizer-leetify-badge");
const steamIdInput = byId<HTMLInputElement>("steam-id");
const apiKeyInput = byId<HTMLInputElement>("api-key");
const premierInput = byId<HTMLInputElement>("show-premier");
const faceitInput = byId<HTMLInputElement>("show-faceit");
const killsInput = byId<HTMLInputElement>("show-kills");
const adrInput = byId<HTMLInputElement>("show-adr");
const aimInput = byId<HTMLInputElement>("show-aim");
const compactHistoryInput = byId<HTMLInputElement>("compact-history");
const historyCountInput = byId<HTMLSelectElement>("history-count");
const refreshInput = byId<HTMLSelectElement>("refresh");
const refreshHint = byId<HTMLElement>("refresh-hint");
const preview = byId<HTMLElement>("preview");
const widgetUrlInput = byId<HTMLInputElement>("widget-url");
const copyButton = byId<HTMLButtonElement>("copy-url");
const recommendedCanvas = byId<HTMLElement>("recommended-canvas");

let previewSource: { profile: ProfileResponse; matches: MatchDetails[] } | null = null;
let previewSteamId = "";
let hasGeneratedUrl = false;
let previewDebounceTimer: number | undefined;
let previewRequestId = 0;

const EMPTY_WIDGET_DATA: WidgetData = {
  name: "Your name",
  premierRating: null,
  faceitLevel: null,
  faceitElo: null,
  aim: null,
  aggregates: {
    averageKills: null,
    averageAdr: null,
    matchCount: 0,
  },
  history: [],
};

const SAMPLE_OUTCOMES = [
  "win",
  "win",
  "win",
  "loss",
  "loss",
  "win",
  "tie",
  "loss",
  "win",
  "win",
  "win",
  "loss",
  "win",
  "loss",
  "loss",
  "win",
  "win",
  "win",
  "loss",
  "win",
] as const;

const SAMPLE_HISTORY: HistoryItem[] = Array.from({ length: 50 }, (_, index) => {
  const platform = index % 2 === 0 ? "premier" : "faceit";
  const outcome = SAMPLE_OUTCOMES[index % SAMPLE_OUTCOMES.length]!;
  const ratingChangeMagnitude = 110 + ((index * 37) % 441);
  return {
    id: `sample-${index}`,
    platform,
    finishedAt: new Date(Date.UTC(2026, 7, 19 - index)).toISOString(),
    mapName: "de_mirage",
    outcome,
    endingRank: platform === "faceit" ? 10 : 18_000 + index * 47,
    premierChange:
      platform !== "premier"
        ? null
        : outcome === "win"
          ? ratingChangeMagnitude
          : outcome === "loss"
            ? -ratingChangeMagnitude
            : (Math.floor(index / 20) % 2 === 0 ? 1 : -1) *
              (51 + (index % 6)),
  };
});

function sampleWidgetData(config: WidgetConfig): WidgetData {
  const history = SAMPLE_HISTORY.filter((item) =>
    item.platform === "premier" ? config.showPremier : config.showFaceit,
  );
  return {
    ...EMPTY_WIDGET_DATA,
    history: config.showCompactHistory
      ? history
      : history.slice(0, config.historyCount),
  };
}

function updateCanvasRecommendation() {
  const frame = preview.querySelector<HTMLElement>(".widget-frame");
  if (!frame) {
    recommendedCanvas.textContent =
      "Recommended canvas: 520 × 190 based on current selected options.";
    return;
  }

  const bounds = frame.getBoundingClientRect();
  const roundUpToEven = (value: number) => Math.ceil(value / 2) * 2;
  const width = roundUpToEven(bounds.width + 8);
  const height = roundUpToEven(bounds.height + 8);
  recommendedCanvas.textContent =
    `Recommended canvas: ${width} × ${height} based on current selected options.`;
}

function readConfig(): WidgetConfig {
  return {
    steamId: steamIdInput.value.trim(),
    showPremier: premierInput.checked,
    showFaceit: faceitInput.checked,
    showAverageKills: killsInput.checked,
    showAdr: adrInput.checked,
    showAim: aimInput.checked,
    showCompactHistory: compactHistoryInput.checked,
    historyCount: Number.parseInt(historyCountInput.value, 10),
    refreshMinutes: Number.parseInt(refreshInput.value, 10),
  };
}

function writeConfig(config: WidgetConfig) {
  steamIdInput.value = config.steamId;
  premierInput.checked = config.showPremier;
  faceitInput.checked = config.showFaceit;
  killsInput.checked = config.showAverageKills;
  adrInput.checked = config.showAdr;
  aimInput.checked = config.showAim;
  compactHistoryInput.checked = config.showCompactHistory;
  historyCountInput.value = String(config.historyCount);
  refreshInput.value = String(config.refreshMinutes);
}

function widgetBaseUrl(): URL {
  const pageUrl = new URL(window.location.href);
  pageUrl.search = "";
  pageUrl.hash = "";
  return new URL("./widget/", pageUrl);
}

function updateKeyControls() {
  const hasKey = apiKeyInput.value.trim().length > 0;
  for (const option of refreshInput.options) {
    option.disabled = !hasKey && Number(option.value) < 5;
  }
  if (!hasKey && Number(refreshInput.value) < 5) refreshInput.value = "5";
  refreshHint.textContent = hasKey
    ? "Your key enables the faster refresh choices."
    : "5 minute minimum without API key.";
}

function updateUrl() {
  updateKeyControls();
  historyCountInput.disabled = compactHistoryInput.checked;
  const config = readConfig();
  if (!hasGeneratedUrl || !isValidSteam64Id(config.steamId)) {
    widgetUrlInput.value = "";
    copyButton.disabled = true;
    return;
  }

  const url = widgetBaseUrl();
  url.search = configToParams(config).toString();
  url.hash = apiKeyToFragment(apiKeyInput.value);
  widgetUrlInput.value = url.toString();
  copyButton.disabled = false;
}

function renderCurrentPreview() {
  const config = readConfig();
  const data =
    previewSource && previewSteamId === config.steamId
      ? buildWidgetData(previewSource.profile, previewSource.matches, config)
      : sampleWidgetData(config);
  renderWidget(preview, config, data);
  window.requestAnimationFrame(updateCanvasRecommendation);
}

function updatePlatformRequirements(changed?: HTMLInputElement) {
  if (!premierInput.checked && !faceitInput.checked) {
    (changed ?? premierInput).checked = true;
  }
  const premierTitle = faceitInput.checked
    ? ""
    : "Premier must remain enabled while Faceit is disabled.";
  const faceitTitle = premierInput.checked
    ? ""
    : "Faceit must remain enabled while Premier is disabled.";
  premierInput.title = premierTitle;
  faceitInput.title = faceitTitle;
  const premierLabel = premierInput.closest("label");
  const faceitLabel = faceitInput.closest("label");
  if (premierLabel) premierLabel.title = premierTitle;
  if (faceitLabel) faceitLabel.title = faceitTitle;
}

function schedulePreviewLoad() {
  if (previewDebounceTimer !== undefined) {
    window.clearTimeout(previewDebounceTimer);
  }
  if (!isValidSteam64Id(steamIdInput.value.trim())) return;
  previewDebounceTimer = window.setTimeout(() => {
    void loadPreview(false);
  }, 500);
}

async function loadPreview(reportErrors: boolean) {
  const config = readConfig();
  if (!isValidSteam64Id(config.steamId)) {
    steamIdInput.setCustomValidity("Enter a valid 17-digit Steam64 ID.");
    if (reportErrors) steamIdInput.reportValidity();
    return;
  }
  steamIdInput.setCustomValidity("");

  if (!config.showPremier && !config.showFaceit) {
    renderWidgetState(preview, "error", "Enable Premier, Faceit, or both.");
    return;
  }

  const requestId = ++previewRequestId;
  preview.setAttribute("aria-busy", "true");
  try {
    const { profile, matches } = await fetchLeetifyData(
      config.steamId,
      apiKeyInput.value.trim() || undefined,
    );
    if (requestId !== previewRequestId || steamIdInput.value.trim() !== config.steamId) {
      return;
    }
    previewSource = { profile, matches };
    previewSteamId = config.steamId;
    renderCurrentPreview();
  } catch (error) {
    if (requestId !== previewRequestId || steamIdInput.value.trim() !== config.steamId) {
      return;
    }
    const message = error instanceof Error ? error.message : "Could not load stats.";
    renderWidgetState(preview, "error", message);
    updateCanvasRecommendation();
  } finally {
    if (requestId === previewRequestId) preview.removeAttribute("aria-busy");
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const config = readConfig();
  if (!isValidSteam64Id(config.steamId)) {
    steamIdInput.setCustomValidity("Enter a valid 17-digit Steam64 ID.");
    steamIdInput.reportValidity();
    return;
  }
  hasGeneratedUrl = true;
  updateUrl();
  if (!previewSource || previewSteamId !== config.steamId) {
    if (previewDebounceTimer !== undefined) {
      window.clearTimeout(previewDebounceTimer);
      previewDebounceTimer = undefined;
    }
    void loadPreview(true);
  }
});

form.addEventListener("input", (event) => {
  const target = event.target;
  if (event.target === steamIdInput && steamIdInput.validity.customError) {
    steamIdInput.setCustomValidity("");
  }
  if (target === premierInput || target === faceitInput) {
    updatePlatformRequirements(
      target === premierInput ? premierInput : faceitInput,
    );
  }
  if (target === steamIdInput) {
    if (hasGeneratedUrl) hasGeneratedUrl = false;
    if (previewSteamId !== steamIdInput.value.trim()) previewSource = null;
    schedulePreviewLoad();
  }
  updateUrl();
  renderCurrentPreview();
});

form.addEventListener("change", (event) => {
  const target = event.target;
  if (target === premierInput || target === faceitInput) {
    updatePlatformRequirements(
      target === premierInput ? premierInput : faceitInput,
    );
  }
  updateUrl();
  renderCurrentPreview();
});

byId<HTMLButtonElement>("reset").addEventListener("click", () => {
  writeConfig(DEFAULT_CONFIG);
  apiKeyInput.value = "";
  previewSource = null;
  previewSteamId = "";
  hasGeneratedUrl = false;
  previewRequestId += 1;
  if (previewDebounceTimer !== undefined) {
    window.clearTimeout(previewDebounceTimer);
  }
  updatePlatformRequirements();
  updateUrl();
  renderCurrentPreview();
});

copyButton.addEventListener("click", async () => {
  if (!widgetUrlInput.value) {
    steamIdInput.reportValidity();
    return;
  }

  try {
    await navigator.clipboard.writeText(widgetUrlInput.value);
    copyButton.textContent = "Copied";
    window.setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1500);
  } catch {
    widgetUrlInput.select();
  }
});

const initialConfig = paramsToConfig(new URLSearchParams(window.location.search));
customizerLeetifyBadge.src = leetifyBadge;
writeConfig(initialConfig);
updatePlatformRequirements();
updateUrl();
renderCurrentPreview();
if (isValidSteam64Id(initialConfig.steamId)) schedulePreviewLoad();
