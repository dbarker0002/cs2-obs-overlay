import { consumeApiKey } from "../shared/api-key";
import { fetchLeetifyData } from "../shared/api";
import {
  getEffectiveRefreshMinutes,
  paramsToConfig,
  widgetConfigError,
} from "../shared/config";
import { buildWidgetData } from "../shared/stats";
import { renderWidget, renderWidgetState } from "../shared/widget-view";
import "./widget.css";

const container = document.querySelector<HTMLElement>("#app");

if (!container) {
  throw new Error("Widget container is missing.");
}

const config = paramsToConfig(new URLSearchParams(window.location.search));
const apiKey = consumeApiKey();
const configError = widgetConfigError(config);

if (configError) {
  renderWidgetState(container, "error", configError);
} else {
  let requestInProgress = false;

  const update = async () => {
    if (requestInProgress) return;
    requestInProgress = true;

    try {
      const { profile, matches } = await fetchLeetifyData(config.steamId, apiKey);
      renderWidget(container, config, buildWidgetData(profile, matches, config));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load stats.";
      renderWidgetState(container, "error", message);
    } finally {
      requestInProgress = false;
    }
  };

  renderWidgetState(container, "loading", "Fetching Leetify stats…");
  void update();

  const refreshMinutes = getEffectiveRefreshMinutes(
    config.refreshMinutes,
    Boolean(apiKey),
  );
  window.setInterval(update, refreshMinutes * 60_000);
}
