import type { HistoryItem, WidgetConfig, WidgetData } from "./types";
import faceit1 from "../../assets/faceit/1.svg";
import faceit2 from "../../assets/faceit/2.svg";
import faceit3 from "../../assets/faceit/3.svg";
import faceit4 from "../../assets/faceit/4.svg";
import faceit5 from "../../assets/faceit/5.svg";
import faceit6 from "../../assets/faceit/6.svg";
import faceit7 from "../../assets/faceit/7.svg";
import faceit8 from "../../assets/faceit/8.svg";
import faceit9 from "../../assets/faceit/9.svg";
import faceit10 from "../../assets/faceit/10.svg";
import faceitPlaceholder from "../../assets/faceit/11.svg";
import leetifyBadge from "../../assets/Leetify_Badge_White_Small.png";
import premierBackground from "../../assets/premier/premier_rating_bg_large.svg";
import "./widget-view.css";

const FACEIT_RANK_IMAGES: Record<number, string> = {
  1: faceit1,
  2: faceit2,
  3: faceit3,
  4: faceit4,
  5: faceit5,
  6: faceit6,
  7: faceit7,
  8: faceit8,
  9: faceit9,
  10: faceit10,
};

const COMPACT_FADE_CLASSES = [
  "compact-result--oldest",
  "compact-result--second-oldest",
  "compact-result--third-oldest",
  "compact-result--fourth-oldest",
] as const;

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatNumber(value: number | null, digits = 0): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function image(className: string, source: string, alt: string) {
  const node = element("img", className);
  node.src = source;
  node.alt = alt;
  node.decoding = "async";
  return node;
}

function isRanked(value: number | null): value is number {
  return value !== null && value > 0;
}

function outcomeGlyph(outcome: HistoryItem["outcome"]): string {
  if (outcome === "win") return "W";
  if (outcome === "loss") return "L";
  if (outcome === "tie") return "D";
  return "?";
}

function premierTier(rating: number | null): string {
  if (!isRanked(rating)) return "none";
  if (rating < 5_000) return "gray";
  if (rating < 10_000) return "lightblue";
  if (rating < 15_000) return "blue";
  if (rating < 20_000) return "purple";
  if (rating < 25_000) return "pink";
  if (rating < 30_000) return "red";
  return "gold";
}

export function appendPremierRank(parent: HTMLElement, rating: number | null) {
  const ranked = isRanked(rating);
  const rank = element(
    "div",
    `rank-card rank-card--premier premier-rank premier-rank--${premierTier(rating)}`,
  );
  rank.append(
    image(
      "premier-rank__background",
      premierBackground,
      "",
    ),
  );
  const value = element("strong", "premier-rank__value");
  if (ranked) {
    const formatted = formatNumber(rating);
    const commaIndex = formatted.indexOf(",");
    const major = commaIndex === -1 ? formatted : formatted.slice(0, commaIndex);
    const minor = commaIndex === -1 ? "" : formatted.slice(commaIndex);
    value.append(element("span", "premier-rank__major", major));
    if (minor) value.append(element("span", "premier-rank__minor", minor));
  } else {
    value.append(element("span", "premier-rank__major", "-"));
  }
  rank.append(value);
  parent.append(rank);
}

export function appendFaceitRank(
  parent: HTMLElement,
  level: number | null,
  elo: number | null,
) {
  const normalizedLevel = isRanked(level) ? Math.trunc(level) : 0;
  const levelImage = FACEIT_RANK_IMAGES[normalizedLevel];
  const rankImage = levelImage ?? faceitPlaceholder;
  const hasElo = elo !== null && elo > 0;
  const rank = element("div", "rank-card rank-card--faceit");

  rank.append(
    image(
      "faceit-rank__icon",
      rankImage,
      levelImage ? `Faceit level ${normalizedLevel}` : "Faceit rank unavailable",
    ),
  );

  const text = element("div", "faceit-rank__text");
  const lines = element("div", "faceit-rank__lines");
  lines.append(
    element(
      "strong",
      "rank-card__value",
      normalizedLevel > 0 ? `Level ${normalizedLevel}` : hasElo ? "Last Rank" : "-",
    ),
  );
  if (hasElo) {
    lines.append(element("span", "rank-card__detail", `${formatNumber(elo)} Elo`));
  }
  text.append(lines);
  rank.append(text);
  parent.append(rank);
}

function formatPremierChange(item: HistoryItem): string {
  if (!isRanked(item.endingRank)) return "None";
  const change = item.premierChange ?? 0;
  return `${change >= 0 ? "+" : ""}${formatNumber(change)}`;
}

function appendHistoryRank(parent: HTMLElement, item: HistoryItem) {
  if (item.platform === "faceit") {
    const level = isRanked(item.endingRank) ? Math.trunc(item.endingRank) : 0;
    const rankImage = FACEIT_RANK_IMAGES[level];
    if (rankImage) {
      parent.append(
        image("match__faceit-rank", rankImage, `Faceit level ${level}`),
      );
    } else {
      parent.append(element("span", "match__none", "None"));
    }
    return;
  }

  if (!isRanked(item.endingRank)) {
    parent.append(element("span", "match__none", "None"));
    return;
  }

  const change = item.premierChange ?? 0;
  const changeClass =
    change === 0 ? "neutral" : change > 0 ? "positive" : "negative";
  parent.append(
    element(
      "span",
      `match__premier-change match__premier-change--${changeClass}`,
      formatPremierChange(item),
    ),
  );
}

function appendHistory(
  parent: HTMLElement,
  history: HistoryItem[],
  playerName: string,
  detailed: boolean,
) {
  const section = element("section", `history${detailed ? "" : " history--compact"}`);
  const heading = element("div", "history__label");
  heading.append(element("span", "history__player", playerName));
  heading.append(element("span", "history__separator", " - "));
  heading.append(element("span", "history__title", "Recent matches"));
  section.append(heading);
  const list = element("div", "history__list");

  if (history.length === 0) {
    list.append(element("span", "history__empty", "No eligible recent matches"));
  } else if (!detailed) {
    for (const item of [...history].reverse()) {
      const result = element(
        "span",
        `compact-result compact-result--${item.outcome}`,
        outcomeGlyph(item.outcome),
      );
      result.title = `${item.mapName.replace(/^de_/, "")} · ${item.platform}`;
      list.append(result);
    }
  } else {
    const chronological = [...history].reverse();
    for (const [index, item] of chronological.entries()) {
      const ageClass =
        chronological.length >= 3
          ? index === 0
            ? " match--oldest"
            : index === 1
              ? " match--second-oldest"
              : ""
          : "";
      const card = element(
        "div",
        `match match--${item.outcome}${ageClass}`,
      );
      const rankDescription = isRanked(item.endingRank)
        ? formatNumber(item.endingRank)
        : "None";
      card.title = `${item.mapName.replace(/^de_/, "")} · ${item.platform} · ending rank ${rankDescription}`;
      card.append(element("strong", "match__outcome", outcomeGlyph(item.outcome)));
      const rank = element("div", "match__rank");
      appendHistoryRank(rank, item);
      card.append(rank);
      list.append(card);
    }
  }

  section.append(list);
  parent.append(section);
  return section;
}

function fitCompactHistory(top: HTMLElement, section: HTMLElement) {
  const list = section.querySelector<HTMLElement>(".history__list");
  if (!list) return;

  const children = [...top.children] as HTMLElement[];
  const gap = Number.parseFloat(getComputedStyle(top).columnGap) || 0;
  const contentWidth =
    children.reduce((width, child) => width + child.offsetWidth, 0) +
    Math.max(0, children.length - 1) * gap;
  section.style.width = `${contentWidth}px`;

  while (list.scrollWidth > list.clientWidth && list.children.length > 1) {
    list.firstElementChild?.remove();
  }

  const results = [...list.children];
  for (const result of results) {
    result.classList.remove(...COMPACT_FADE_CLASSES);
  }
  const fadedResultCount = Math.min(COMPACT_FADE_CLASSES.length, results.length - 1);
  for (let index = 0; index < fadedResultCount; index += 1) {
    const fadeClass = COMPACT_FADE_CLASSES[index];
    if (fadeClass) results[index]?.classList.add(fadeClass);
  }
}

function widgetFrame(widget: HTMLElement, includeCredit = false): HTMLElement {
  const frame = element("div", "widget-frame");
  frame.append(widget);
  if (includeCredit) {
    const credit = element("div", "widget-credit");
    credit.append(
      image("widget-credit__badge", leetifyBadge, "Data provided by Leetify"),
    );
    frame.append(credit);
  }
  return frame;
}

export function renderWidget(
  container: HTMLElement,
  config: WidgetConfig,
  data: WidgetData,
) {
  const widget = element("article", "widget-shell");
  const top = element("div", "widget-top");
  const ranks = element("div", "ranks");
  if (config.showFaceit) {
    appendFaceitRank(ranks, data.faceitLevel, data.faceitElo);
  }
  if (config.showPremier) {
    appendPremierRank(ranks, data.premierRating);
  }
  top.append(ranks);

  const stats = element("div", "stats");
  const statValues: Array<[boolean, string, string]> = [
    [
      config.showAverageKills,
      formatNumber(data.aggregates.averageKills, 1),
      "Avg kills",
    ],
    [config.showAdr, formatNumber(data.aggregates.averageAdr, 1), "ADR"],
    [config.showAim, formatNumber(data.aim, 1), "Aim"],
  ];

  let visibleStatCount = 0;
  for (const [visible, value, label] of statValues) {
    if (!visible) continue;
    if (visibleStatCount > 0) stats.append(element("span", "stat-divider"));
    const stat = element("div", "stat");
    stat.append(element("strong", "stat__value", value));
    stat.append(element("span", "stat__label", label));
    if (label !== "Aim") {
      stat.title = `Calculated from ${data.aggregates.matchCount} eligible matches`;
    }
    stats.append(stat);
    visibleStatCount += 1;
  }
  if (stats.childElementCount > 0) top.append(stats);
  widget.append(top);

  const history = appendHistory(
    widget,
    data.history,
    data.name,
    !config.showCompactHistory,
  );

  container.replaceChildren(widgetFrame(widget, true));
  if (config.showCompactHistory) fitCompactHistory(top, history);
}

export function renderWidgetState(
  container: HTMLElement,
  state: "loading" | "error",
  message: string,
) {
  const widget = element("article", `widget-shell widget-shell--${state}`);
  widget.append(element("strong", "state__title", state === "loading" ? "Loading" : "Error"));
  widget.append(element("span", "state__message", message));
  container.replaceChildren(widgetFrame(widget));
}
