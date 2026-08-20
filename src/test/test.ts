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

const faceitExamples: BadgeExample[] = Array.from({ length: 10 }, (_, index) => {
  const level = index + 1;
  return {
    label: `Faceit · level ${level}`,
    render: (parent) => appendFaceitRank(parent, level, 750 + level * 175),
  };
});

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
  badge.className = "badge-example__preview";
  example.render(badge);

  const label = document.createElement("span");
  label.className = "badge-example__label";
  label.textContent = example.label;

  item.append(badge, label);
  gallery.append(item);
}
