import { appendFaceitRank, appendPremierRank } from "../shared/widget-view";
import "./test.css";

const gallery = document.querySelector<HTMLElement>("#badge-gallery");

if (!gallery) {
  throw new Error("Rank badge gallery is missing.");
}

interface BadgeExample {
  label: string;
  render: (parent: HTMLElement) => void;
}

const premierExamples: BadgeExample[] = [
  {
    label: "Premier · unranked",
    render: (parent) => appendPremierRank(parent, null),
  },
  {
    label: "Premier · gray · below 5,000",
    render: (parent) => appendPremierRank(parent, 3_500),
  },
  {
    label: "Premier · light blue · 5,000–9,999",
    render: (parent) => appendPremierRank(parent, 7_500),
  },
  {
    label: "Premier · blue · 10,000–14,999",
    render: (parent) => appendPremierRank(parent, 12_500),
  },
  {
    label: "Premier · purple · 15,000–19,999",
    render: (parent) => appendPremierRank(parent, 17_500),
  },
  {
    label: "Premier · pink · 20,000–24,999",
    render: (parent) => appendPremierRank(parent, 22_500),
  },
  {
    label: "Premier · red · 25,000–29,999",
    render: (parent) => appendPremierRank(parent, 27_500),
  },
  {
    label: "Premier · gold · 30,000+",
    render: (parent) => appendPremierRank(parent, 32_500),
  },
];

const faceitLevels = [
  { level: 1, elo: 300, range: "100–500" },
  { level: 2, elo: 625, range: "501–750" },
  { level: 3, elo: 825, range: "751–900" },
  { level: 4, elo: 975, range: "901–1,050" },
  { level: 5, elo: 1_125, range: "1,051–1,200" },
  { level: 6, elo: 1_275, range: "1,201–1,350" },
  { level: 7, elo: 1_440, range: "1,351–1,530" },
  { level: 8, elo: 1_640, range: "1,531–1,750" },
  { level: 9, elo: 1_875, range: "1,751–2,000" },
  { level: 10, elo: 2_100, range: "2,001+" },
];

const faceitExamples: BadgeExample[] = faceitLevels.map(({ level, elo, range }) => ({
  label: `Faceit · level ${level} · ${range} Elo`,
  render: (parent) => appendFaceitRank(parent, level, elo),
}));

faceitExamples.push(
  {
    label: "Faceit · unranked",
    render: (parent) => appendFaceitRank(parent, null, null),
  },
  {
    label: "Faceit · last known Elo",
    render: (parent) => appendFaceitRank(parent, null, 1_325),
  },
);

const examples = [...premierExamples, ...faceitExamples];

for (const example of examples) {
  const item = document.createElement("section");
  item.className = "badge-example";

  const badge = document.createElement("div");
  badge.className = "ranks";
  example.render(badge);

  const label = document.createElement("span");
  label.className = "badge-example__label";
  label.textContent = example.label;

  item.append(badge, label);
  gallery.append(item);
}
