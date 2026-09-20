export const OPTIONS = {
  style: ["solitaire", "halo", "trilogy", "vintage", "pave", "band"],
  shape: [
    "round",
    "oval",
    "cushion",
    "emerald",
    "pear",
    "princess",
    "marquise",
    "radiant",
  ],
  metal: [
    "yellow14",
    "yellow18",
    "white14",
    "white18",
    "rose14",
    "rose18",
    "platinum",
  ],
  finish: ["polished", "satin", "brushed"],
  color: ["D", "E", "F", "G", "H", "I", "J"],
  clarity: ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1"],
  certificate: ["GIA", "IGI", "HRD"],
  origin: ["lab", "natural"],
  accents: ["none", "pave", "channel", "hidden"],
  profile: ["round", "flat", "knife"],
  light: ["studio", "daylight", "evening"],
};
export const DEFAULT = Object.freeze({
  style: "solitaire",
  shape: "oval",
  metal: "yellow18",
  finish: "polished",
  carat: 1.5,
  color: "F",
  clarity: "VS1",
  certificate: "IGI",
  origin: "lab",
  accents: "none",
  profile: "round",
  width: 2,
  size: 54,
  prongs: 4,
  engraving: "",
  light: "studio",
  rotate: false,
});
export function normalize(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) input = {};
  const s = { ...DEFAULT };
  for (const [key, choices] of Object.entries(OPTIONS))
    if (choices.includes(input[key])) s[key] = input[key];
  for (const [key, min, max, step] of [
    ["carat", 0.3, 5, 0.1],
    ["width", 1.6, 5, 0.1],
    ["size", 44, 72, 1],
  ]) {
    const n = Number(input[key]);
    if (Number.isFinite(n) && input[key] !== undefined)
      s[key] = Number(
        (Math.round(Math.min(max, Math.max(min, n)) / step) * step).toFixed(2),
      );
  }
  s.prongs = Number(input.prongs) === 6 ? 6 : 4;
  s.engraving =
    typeof input.engraving === "string"
      ? input.engraving.replace(/[\u0000-\u001f]/g, "").slice(0, 24)
      : "";
  s.rotate = input.rotate === true;
  if (s.style === "band" && s.accents === "hidden") s.accents = "none";
  return s;
}
export function readDesign() {
  try {
    const shared = new URLSearchParams(location.hash.slice(1)).get("design");
    if (shared && shared.length < 5000) return normalize(JSON.parse(shared));
    return normalize(
      JSON.parse(localStorage.getItem("brightal-design-v1") || "{}"),
    );
  } catch {
    return { ...DEFAULT };
  }
}
export function description(s) {
  return (
    "BRIGHTAL Atelier / v1\n" +
    Object.entries(normalize(s))
      .filter(([k]) => !["rotate", "light"].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")
  );
}
export const PRESETS = [
  { name: ["Örök klasszikus", "Timeless oval"], config: { ...DEFAULT } },
  {
    name: ["Párizsi fények", "Parisian halo"],
    config: {
      ...DEFAULT,
      style: "halo",
      shape: "round",
      metal: "platinum",
      accents: "pave",
      carat: 2,
    },
  },
  {
    name: ["Art déco", "Art deco"],
    config: {
      ...DEFAULT,
      style: "trilogy",
      shape: "emerald",
      metal: "yellow18",
      carat: 2.4,
    },
  },
  {
    name: ["Rózsakert", "Rose garden"],
    config: {
      ...DEFAULT,
      style: "vintage",
      shape: "pear",
      metal: "rose18",
      accents: "hidden",
    },
  },
  {
    name: ["Mindörökké", "Forever band"],
    config: {
      ...DEFAULT,
      style: "band",
      metal: "yellow14",
      width: 3,
      accents: "channel",
    },
  },
];
