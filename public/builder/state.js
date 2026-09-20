export const OPTIONS = {
  style: [
    "solitaire",
    "halo",
    "trilogy",
    "vintage",
    "pave",
    "band",
    "duet",
    "cathedral",
    "split",
    "eternity",
  ],
  shape: [
    "round",
    "oval",
    "cushion",
    "emerald",
    "pear",
    "princess",
    "marquise",
    "radiant",
    "asscher",
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
  accents: ["none", "pave", "channel"],
  profile: ["round", "flat", "knife"],
  light: ["studio", "daylight", "evening"],
  gemTone: [
    "ice",
    "champagne",
    "blush",
    "canary",
    "sapphire",
    "emeraldGreen",
    "ruby",
  ],
  sideTone: [
    "ice",
    "champagne",
    "blush",
    "canary",
    "sapphire",
    "emeraldGreen",
    "ruby",
  ],
  sideShape: [
    "round",
    "oval",
    "pear",
    "emerald",
    "marquise",
    "princess",
    "asscher",
  ],
  sideMode: ["none", "pair", "cluster", "five"],
  setting: ["claw", "bezel", "doubleclaw"],
  orientation: ["north", "east"],
  headMetal: ["match", "platinum", "yellow18", "rose18"],
  coverage: ["shoulders", "half", "full"],
  halo: ["single", "double"],
  engravingFont: ["serif", "script", "modern"],
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
  gemTone: "ice",
  sideTone: "ice",
  sideShape: "round",
  sideMode: "none",
  sideCarat: 0.3,
  setting: "claw",
  orientation: "north",
  headMetal: "match",
  coverage: "shoulders",
  accentSize: 1,
  accentRows: 1,
  halo: "single",
  haloSize: 1,
  height: 1,
  engravingFont: "serif",
  fire: 1,
  hiddenHalo: false,
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
    ["sideCarat", 0.1, 1.5, 0.05],
    ["accentSize", 0.6, 2, 0.1],
    ["haloSize", 0.6, 1.6, 0.1],
    ["height", 0.5, 2.5, 0.1],
    ["fire", 0.5, 1.5, 0.1],
  ]) {
    const n = Number(input[key]);
    if (Number.isFinite(n) && input[key] !== undefined)
      s[key] = Number(
        (Math.round(Math.min(max, Math.max(min, n)) / step) * step).toFixed(2),
      );
  }
  s.prongs = [4, 6, 8].includes(Number(input.prongs))
    ? Number(input.prongs)
    : 4;
  s.accentRows = Number(input.accentRows) === 2 ? 2 : 1;
  s.accentSize =
    Math.floor(Math.min(s.accentSize, s.width / (s.accentRows + 0.4)) * 10) /
    10;
  s.hiddenHalo =
    (input.hiddenHalo === true || input.accents === "hidden") && !isBand(s);
  s.engraving =
    typeof input.engraving === "string"
      ? input.engraving.replace(/[\u0000-\u001f]/g, "").slice(0, 24)
      : "";
  s.rotate = input.rotate === true;
  if (isBand(s) && s.accents === "hidden") s.accents = "none";
  if (isBand(s)) s.sideMode = "none";
  if (s.style === "eternity") {
    s.coverage = "full";
    if (s.accents === "none") s.accents = "pave";
  }
  if (s.style === "trilogy" && s.sideMode === "none") s.sideMode = "pair";
  return s;
}
export const isBand = (s) => ["band", "eternity"].includes(s.style);
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
    "BRIGHTAL Atelier / v2\n" +
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
      sideMode: "pair",
      sideShape: "emerald",
      sideCarat: 0.5,
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
  {
    name: ["Éjszakai múzsa", "Midnight muse"],
    config: {
      ...DEFAULT,
      style: "cathedral",
      gemTone: "sapphire",
      shape: "cushion",
      sideMode: "pair",
      sideCarat: 0.4,
      metal: "platinum",
    },
  },
  {
    name: ["Toi & Moi", "Toi & Moi"],
    config: {
      ...DEFAULT,
      style: "duet",
      shape: "pear",
      sideShape: "emerald",
      sideTone: "blush",
      sideCarat: 1.1,
      metal: "rose18",
    },
  },
  {
    name: ["Aranyhíd", "Golden bridge"],
    config: {
      ...DEFAULT,
      style: "split",
      shape: "radiant",
      setting: "bezel",
      headMetal: "platinum",
      accents: "pave",
      width: 3,
    },
  },
];
