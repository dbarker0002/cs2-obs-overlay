import { appendPremierRank } from "../shared/widget-view";
import "./test.css";

const gallery = document.querySelector<HTMLElement>("#badge-gallery");

if (!gallery) {
  throw new Error("Premier badge gallery is missing.");
}

const examples: Array<{ label: string; rating: number | null }> = [
  { label: "Unranked", rating: null },
  { label: "Gray · below 5,000", rating: 3_500 },
  { label: "Light blue · 5,000–9,999", rating: 7_500 },
  { label: "Blue · 10,000–14,999", rating: 12_500 },
  { label: "Purple · 15,000–19,999", rating: 17_500 },
  { label: "Pink · 20,000–24,999", rating: 22_500 },
  { label: "Red · 25,000–29,999", rating: 27_500 },
  { label: "Gold · 30,000+", rating: 32_500 },
];

for (const example of examples) {
  const item = document.createElement("section");
  item.className = "badge-example";

  const badge = document.createElement("div");
  badge.className = "badge-example__preview";
  appendPremierRank(badge, example.rating);

  const label = document.createElement("span");
  label.className = "badge-example__label";
  label.textContent = example.label;

  item.append(badge, label);
  gallery.append(item);
}
