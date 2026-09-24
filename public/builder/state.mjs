export const FASHION_STYLES = [
  "wave",
  "rope",
  "dome",
  "signet",
  "open",
  "stack",
];
export const isFashion = (s) => FASHION_STYLES.includes(s.style);
export const DAILY_STYLES = ['bezelrow','scatter','chevron','ribbon','graduated','eastwest','alternating','crown','curvedoval','wavebezel','openpair','contour','asymmetric','fullcircle'];
export const isDaily = s => DAILY_STYLES.includes(s.style);
export const isModern = s => isDaily(s) || isFashion(s) || ['band','eternity'].includes(s.style);
export function maxDailyStones(s) {
  if(['eastwest','curvedoval','wavebezel'].includes(s.style)) return 1;
  const r=s.size/(2*Math.PI)+Math.max(s.thickness,s.stoneDepth*.72+.8);
  const step=2*Math.asin(Math.min(.7,(Math.max(s.stoneLength,s.stoneWidth)+2*s.bezelWall+s.dailySpacing+.35)/(2*r)));
  return Math.max(1,Math.min(9,Math.floor(2.2/step)+1));
}
export const OPTIONS = {
  style: [
    "solitaire",
    "hiddenhalo", "bezel", "tension",
    "halo",
    "trilogy",
    "vintage",
    "pave",
    "band",
    "duet",
    "cathedral",
    "split",
    "eternity",
    ...DAILY_STYLES,
    ...FASHION_STYLES,
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
  face: ["oval", "cushion", "round"],
  inlay: ["metal", "onyx", "ivory", "teal", "coral"],
  secondaryMetal: ["platinum", "yellow18", "rose18"],
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
  sculpt: 1.2,
  rhythm: 4,
  layers: 3,
  gap: 0.7,
  faceSize: 7,
  face: "oval",
  inlay: "metal",
  secondaryMetal: "platinum",
  mixedMetal: false,
  dailyCount: 5,
  dailyCarat: .1,
  dailySpacing: .15,
  alternateGems: false,
  stoneLength: 2.6,
  stoneWidth: 2.6,
  stoneDepth: 1.6,
  thickness: 1.6,
  bezelWall: .45,
  fashionStone: false,
});
export function normalize(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) input = {};
  const s = { ...DEFAULT };
  for (const [key, choices] of Object.entries(OPTIONS))
    if (choices.includes(input[key])) s[key] = input[key];
  for (const [key, min, max, step] of [
    ["carat", 0.3, 5, 0.1],
    ["width", 1.6, 10, 0.1],
    ["size", 44, 72, 1],
    ["sideCarat", 0.1, 1.5, 0.05],
    ["accentSize", 0.6, 2, 0.1],
    ["haloSize", 0.6, 1.6, 0.1],
    ["height", 0.5, 2.5, 0.1],
    ["fire", 0.5, 1.5, 0.1],
    ["sculpt", 0.4, 2.5, 0.1],
    ["rhythm", 2, 8, 1],
    ["layers", 2, 4, 1],
    ["gap", 0.3, 1.5, 0.1],
    ["faceSize", 5, 11, 0.5],
    ['dailyCount',1,9,1],
    ['dailyCarat',.05,.3,.01],
    ['dailySpacing',0,.5,.05],
    ['stoneLength',1.5,6,.1],
    ['stoneWidth',1.5,5,.1],
    ['stoneDepth',1,3.5,.1],
    ['thickness',1.4,3,.1],
    ['bezelWall',.35,.7,.05],
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
  if(s.style==='split') s.accentRows=1;
  s.accentSize =
    Math.floor(Math.min(s.accentSize, s.width * (s.style==='split'?.55:1) / (s.accentRows + 0.4)) * 10) /
    10;
  s.hiddenHalo =
    (input.hiddenHalo === true || input.accents === "hidden") && !isBand(s);
  s.engraving =
    typeof input.engraving === "string"
      ? input.engraving.replace(/[\u0000-\u001f]/g, "").slice(0, 24)
      : "";
  s.rotate = input.rotate === true;
  s.mixedMetal = input.mixedMetal === true;
  s.alternateGems = input.alternateGems === true;
  s.fashionStone = input.fashionStone === true;
  if(s.style==='hiddenhalo') s.hiddenHalo=true;
  if(s.style==='bezel') s.setting='bezel';
  if(s.style==='tension') {s.setting='bezel';s.headMetal='match';}
  if(!isModern(s)) s.width=Math.min(5,s.width);
  if(isModern(s)) {
    s.setting='bezel'; s.mixedMetal=false; s.inlay='metal'; s.headMetal='match';
    if(['round','princess','asscher','cushion'].includes(s.shape)) s.stoneLength=s.stoneWidth;
    else s.stoneWidth=Math.min(s.stoneWidth,s.stoneLength);
    s.stoneDepth=Math.min(s.stoneDepth,Number((s.stoneWidth*.75).toFixed(1)));
    if(s.style==='eastwest') s.orientation='east';
  }
  if(s.style==='openpair') {s.dailyCount=2;s.shape=['round','oval'].includes(s.shape)?s.shape:'round';s.stoneWidth=Math.min(2.5,s.stoneWidth);s.stoneLength=Math.min(3,s.stoneLength);s.stoneDepth=Math.min(1.5,s.stoneDepth);s.gap=Math.max(.5,s.gap);}
  s.dailyCount=Math.min(s.dailyCount,maxDailyStones(s));
  if(isDaily(s)) {s.accents='none';s.sideMode='none';s.hiddenHalo=false;}
  if (["wave", "dome"].includes(s.style)) s.mixedMetal = false;
  if (isFashion(s)) {
    s.accents = "none";
    s.profile = "round";
    s.engraving = "";
  }
  if (isBand(s) && s.accents === "hidden") s.accents = "none";
  if (isBand(s)) s.sideMode = "none";
  if (s.style === "eternity") {
    s.coverage = "full";
    if (s.accents === "none") s.accents = "pave";
  }
  if (s.style === "trilogy" && s.sideMode === "none") s.sideMode = "pair";
  return s;
}
export const isBand = (s) =>
  ["band", "eternity", ...FASHION_STYLES, ...DAILY_STYLES].includes(s.style);
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
  s=normalize(s);
  const fashionKeys=['sculpt','rhythm','layers','gap','faceSize','face','inlay','secondaryMetal','mixedMetal'];
  const dailyKeys=['dailyCount','dailyCarat','dailySpacing','alternateGems'];
  return (
    "BRIGHTAL Atelier / v2\n" +
    Object.entries(normalize(s))
      .filter(([k]) => !["rotate", "light"].includes(k))
      .filter(([k]) => (isFashion(s)||k==='sculpt'&&['chevron','ribbon','crown'].includes(s.style)||!fashionKeys.includes(k)) && (isDaily(s)||!dailyKeys.includes(k)))
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")
  );
}
const LEGACY_PRESETS = [
  { name: ["Örök klasszikus", "Timeless oval"], config: { ...DEFAULT } },
  ...[
    ['Selyemfény', 'Silk diamonds', 'ribbon', 'oval', 'rose18'],
    ['Fénylépcső', 'Crescendo', 'graduated', 'round', 'yellow18'],
    ['Horizont', 'Horizon', 'eastwest', 'emerald', 'platinum'],
    ['Ritmus', 'Diamond rhythm', 'alternating', 'oval', 'yellow18'],
    ['Fénykorona', 'Light crown', 'crown', 'pear', 'rose18'],
  ].map(([hu,en,style,shape,metal])=>({name:[hu,en],config:{...DEFAULT,style,shape,metal,dailyCarat:.1,dailyCount:5,setting:'bezel',sideShape:'round',width:2.5}})),
  {name:['Mindennapi ragyogás','Everyday light'],config:{...DEFAULT,style:'bezelrow',setting:'bezel',dailyCount:5,dailyCarat:.1,metal:'yellow18'}},
  {name:['Csillagtérkép','Star map'],config:{...DEFAULT,style:'scatter',dailyCount:5,shape:'round',dailyCarat:.08,alternateGems:true,sideTone:'sapphire',width:3.2}},
  {name:['Diamond V','Diamond V'],config:{...DEFAULT,style:'chevron',dailyCount:5,dailyCarat:.07,sculpt:1.6,metal:'platinum'}},
  {
    name: ["Liquid Wave", "Liquid Wave"],
    config: {
      ...DEFAULT,
      style: "wave",
      width: 2.5,
      sculpt: 1.5,
      rhythm: 3,
      metal: "yellow18",
    },
  },
  {
    name: ["Soft Armor", "Soft Armor"],
    config: {
      ...DEFAULT,
      style: "dome",
      width: 4.5,
      sculpt: 2,
      metal: "rose18",
    },
  },
  {
    name: ["Midnight Seal", "Midnight Seal"],
    config: {
      ...DEFAULT,
      style: "signet",
      width: 3.5,
      faceSize: 8,
      inlay: "onyx",
      metal: "yellow14",
    },
  },
  {
    name: ["Orbit Stack", "Orbit Stack"],
    config: {
      ...DEFAULT,
      style: "stack",
      width: 1.8,
      layers: 3,
      gap: 0.7,
      mixedMetal: true,
      metal: "yellow18",
      secondaryMetal: "platinum",
    },
  },
  {
    name: ["Golden Rope", "Golden Rope"],
    config: {
      ...DEFAULT,
      style: "rope",
      width: 2.5,
      rhythm: 6,
      mixedMetal: true,
      secondaryMetal: "rose18",
    },
  },
  {
    name: ["Open Current", "Open Current"],
    config: {
      ...DEFAULT,
      style: "open",
      sculpt: 1.4,
      gap: 1.1,
      width: 2.4,
      metal: "platinum",
      mixedMetal: true,
    },
  },
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
export const PRESETS = LEGACY_PRESETS;
