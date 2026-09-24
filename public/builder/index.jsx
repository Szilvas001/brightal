import {
  OPTIONS,
  DEFAULT,
  normalize,
  readDesign,
  description,
  PRESETS as LEGACY_PRESETS,
  isBand,
  isFashion,
  isModern,
  FASHION_STYLES,
  DAILY_STYLES, isDaily, maxDailyStones,
} from "./state.mjs";
import { RingRenderer } from "./renderer.js";
import { previewModel, unpackModel } from './progressive.js';
import { modernLayout } from './contemporary.mjs';
import { COLLECTION } from './collection.mjs';
import { GEM_TONES } from "./optics.mjs";
import { PRESETS } from './catalog.mjs';
const { useState, useEffect, useRef } = React;
const names = {
  ...Object.fromEntries(COLLECTION.map(c=>[c.style,c.name])),
  ribbon: ['Hullámzó gyémántsor','Diamond ribbon'], graduated: ['Fokozatos kősor','Graduated diamonds'],
  wavebezel:['Hullámos bezel','Tidal bezel'],openpair:['Nyitott ikergyémánt','Twin light'],eastwest: ['Horizont','East–west'], alternating: ['Váltakozó kőformák','Alternating cuts'], crown: ['Koronaív','Diamond crown'],
  bezelrow: ['Gyémántsor','Diamond row'], scatter: ['Csillagmező','Constellation'], chevron: ['Gyémánt V','Diamond V'],
  wave: ["Hullám", "Wave"],
  rope: ["Sodrott", "Rope"],
  dome: ["Domború", "Dome"],
  signet: ["Pecsétgyűrű", "Signet"],
  open: ["Nyitott", "Open cuff"],
  stack: ["Többsoros", "Stack"],
  metal: ["Tömör fém", "Solid metal"],
  onyx: ["Ónixfekete betét", "Onyx-black inlay"],
  ivory: ["Elefántcsontszínű betét", "Ivory inlay"],
  teal: ["Türkiz betét", "Teal inlay"],
  coral: ["Korall betét", "Coral inlay"],
  solitaire: ["Szoliter", "Solitaire"],
  halo: ["Halo", "Halo"],
  trilogy: ["Háromköves", "Three stone"],
  vintage: ["Vintage", "Vintage"],
  pave: ["Pavé", "Pavé"],
  band: ["Karikagyűrű", "Wedding band"],
  duet: ["Toi & Moi", "Toi & Moi"],
  cathedral: ["Katedrális", "Cathedral"],
  split: ["Osztott sín", "Split shank"],
  eternity: ["Örökkévalóság", "Eternity"],
  asscher: ["Asscher", "Asscher"],
  ice: ["Fehér gyémánt", "White diamond"],
  champagne: ["Pezsgő gyémánt", "Champagne diamond"],
  blush: ["Rózsaszín gyémánt", "Pink diamond"],
  canary: ["Sárga gyémánt", "Yellow diamond"],
  sapphire: ["Zafír", "Sapphire"],
  emeraldGreen: ["Smaragd", "Emerald gem"],
  ruby: ["Rubin", "Ruby"],
  pair: ["Szimmetrikus pár", "Symmetric pair"],
  cluster: ["Virágfürt", "Floral cluster"],
  five: ["Ötköves", "Five stone"],
  claw: ["Karmos", "Claw"],
  bezel: ["Zárt keret", "Bezel"],
  doubleclaw: ["Dupla karom", "Double claw"],
  north: ["Hosszában", "North–south"],
  east: ["Keresztben", "East–west"],
  match: ["Sínnel azonos", "Match band"],
  shoulders: ["Vállakon", "Shoulders"],
  half: ["Félkörben", "Half band"],
  full: ["Teljes körben", "Full band"],
  single: ["Egysoros halo", "Single halo"],
  double: ["Kétsoros halo", "Double halo"],
  serif: ["Klasszikus", "Classic"],
  script: ["Kézírás", "Script"],
  modern: ["Modern", "Modern"],
  round: ["Kerek", "Round"],
  oval: ["Ovális", "Oval"],
  cushion: ["Párna", "Cushion"],
  emerald: ["Smaragd", "Emerald"],
  pear: ["Csepp", "Pear"],
  princess: ["Princess", "Princess"],
  marquise: ["Marquise", "Marquise"],
  radiant: ["Radiant", "Radiant"],
  yellow14: ["14K sárgaarany", "14K yellow gold"],
  yellow18: ["18K sárgaarany", "18K yellow gold"],
  white14: ["14K fehérarany", "14K white gold"],
  white18: ["18K fehérarany", "18K white gold"],
  rose14: ["14K rozéarany", "14K rose gold"],
  rose18: ["18K rozéarany", "18K rose gold"],
  platinum: ["Platina 950", "Platinum 950"],
  polished: ["Tükörfényes", "Polished"],
  satin: ["Selyemfényű", "Satin"],
  brushed: ["Szálcsiszolt", "Brushed"],
  none: ["Letisztult", "Plain"],
  channel: ["Sínfoglalat", "Channel set"],
  hidden: ["Rejtett halo", "Hidden halo"],
  flat: ["Lapos", "Flat"],
  knife: ["Késél", "Knife edge"],
  studio: ["Stúdió", "Studio"],
  daylight: ["Nappali fény", "Daylight"],
  evening: ["Esti fény", "Evening"],
  lab: ["Laboratóriumi", "Lab grown"],
  natural: ["Természetes", "Natural"],
};
Object.assign(names, Object.fromEntries(COLLECTION.map(c=>[c.style,c.name])));
function Icon({ type = "gem", size = 20 }) {
  const paths = {
    gem: "M3 8 7 3h10l4 5-9 13L3 8Zm0 0h18M7 3l5 18 5-18",
    save: "M5 3h12l3 3v15H4V3h1Zm2 0v6h10V3M7 21v-8h10v8",
    share: "M12 15V3m-5 5 5-5 5 5M5 13v8h14v-8",
    reset: "M4 10a8 8 0 1 1 1 9M4 4v6h6",
    camera: "M3 7h4l2-3h6l2 3h4v14H3V7Zm13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    spark: "m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2",
    rotate:
      "M4 8a8 8 0 0 1 14-2l2 2M20 3v5h-5M20 16a8 8 0 0 1-14 2l-2-2M4 21v-5h5",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[type] || paths.gem} />
    </svg>
  );
}
function Shape({ shape, style }) {
  return (
    <svg
      viewBox="0 0 64 52"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      aria-hidden="true"
    >
      {style ? (
        <>
          <ellipse cx="32" cy="32" rx="17" ry="15" />
          {FASHION_STYLES.includes(style) && (
            <path
              d={
                {
                  wave: "M15 29q8-15 17 0t17 0",
                  rope: "M16 27q8-12 16 0t16 0M16 32q8-12 16 0t16 0",
                  dome: "M14 27Q32 2 50 27Z",
                  signet: "M22 10h20v17H22z",
                  open: "M18 23l-4-5m32 5 4-5",
                  stack: "M15 25q17-15 34 0M15 38q17 16 34 0",
                }[style]
              }
            />
          )}
          {!["band", "eternity", ...FASHION_STYLES].includes(style) && (
            <>
              <path d="m22 16 5-7h10l5 7-10 12-10-12Zm0 0h20M27 9l5 19 5-19" />
              {style === "trilogy" && (
                <>
                  <circle cx="14" cy="21" r="5" />
                  <circle cx="50" cy="21" r="5" />
                </>
              )}
              {style === "duet" && <path d="m40 10 8 1 5 8-9 10-8-10Z" />}
              {style === "cathedral" && <path d="M15 31 24 20M49 31 40 20" />}
              {style === "split" && <path d="M16 30 23 15M48 30 41 15" />}
              {["halo", "vintage"].includes(style) && (
                <ellipse
                  cx="32"
                  cy="17"
                  rx="16"
                  ry="13"
                  strokeDasharray="2 3"
                />
              )}
            </>
          )}
          {["pave", "band", "eternity"].includes(style) && (
            <path d="M18 28q14-12 28 0" strokeDasharray="2 3" />
          )}
        </>
      ) : (
        <g transform="translate(32 26)">
          {shape === "round" ? (
            <>
              <circle r="18" />
              <path d="m0-18 13 5 5 13-5 13-13 5-13-5-5-13 5-13Z M-13-13 13 13M13-13-13 13" />
            </>
          ) : shape === "oval" ? (
            <>
              <ellipse rx="14" ry="22" />
              <ellipse rx="8" ry="14" />
              <path d="M0-22v8M0 22v-8M-14 0h6M14 0H8" />
            </>
          ) : shape === "pear" ? (
            <>
              <path d="M0-23C-31 9-11 27 0 22 11 27 31 9 0-23Z" />
              <path d="M0-14C-18 7-8 18 0 15 8 18 18 7 0-14Z" />
            </>
          ) : shape === "marquise" ? (
            <>
              <path d="M0-24Q27 0 0 24-27 0 0-24Z" />
              <path d="M0-14Q15 0 0 14-15 0 0-14Z" />
            </>
          ) : (
            <>
              <rect
                x="-16"
                y="-20"
                width="32"
                height="40"
                rx={shape === "cushion" ? 10 : shape === "princess" ? 0 : 6}
              />
              <rect
                x="-10"
                y="-14"
                width="20"
                height="28"
                rx={shape === "cushion" ? 6 : 2}
              />
              <path d="m-16-20 6 6m26-6-6 6M-16 20l6-6m26 6-6-6" />
            </>
          )}
        </g>
      )}
    </svg>
  );
}
function download(data, name) {
  const a = document.createElement("a");
  a.href = data;
  a.download = name;
  a.click();
}

function RingBuilder({ lang = "hu", onQuote, onUpload }) {
  const en = lang === "en",
    L = (hu, eng) => (en ? eng : hu),
    label = (k) => (names[k] ? names[k][en ? 1 : 0] : k);
  const [history, setHistory] = useState(() => ({
    past: [],
    present: readDesign(),
    future: [],
  }));
  const s = history.present;
  const [step, setStep] = useState(0),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(false),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  const thumbs = PRESETS.map((_,i)=>`/builder/thumbnails/preset-${i}.webp`);
  const worker = useRef(null), job = useRef(0), queued = useRef(null), active = useRef(false);
  const [refining,setRefining] = useState(true);
  const [family, setFamily] = useState("classic");
  useEffect(() => {
    setFamily(isFashion(s) ? 'fashion' : isDaily(s) || ['band','eternity'].includes(s.style) ? 'daily' : 'classic');
  }, [s.style]);
  const [designName,setDesignName]=useState('');
  useEffect(()=>setSaved(false),[s]);
  const [focus, setFocus] = useState(false);
  const [library, setLibrary] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem("brightal-library-v2") || "[]");
      return Array.isArray(v)
        ? v.filter(x=>x&&x.design).slice(0, 24).map((x) => ({ ...x, design: normalize(x.design) }))
        : [];
    } catch {
      return [];
    }
  });
  const libraryDialog = useRef(null),
    importInput = useRef(null);
  const host = useRef(null),
    engine = useRef(null),
    timer = useRef(null),
    latest = useRef(s);
  latest.current = s;
  const notify = (text) => {
    setNotice(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(""), 5000);
  };
  const change = (patch) => {
    setHistory((h) => ({
      past: [...h.past.slice(-39), h.present],
      present: normalize({ ...h.present, ...patch }),
      future: [],
    }));
    setSaved(false);
  };
  const undo = () =>
    setHistory((h) =>
      h.past.length
        ? {
            past: h.past.slice(0, -1),
            present: h.past[h.past.length - 1],
            future: [h.present, ...h.future],
          }
        : h,
    );
  const redo = () =>
    setHistory((h) =>
      h.future.length
        ? {
            past: [...h.past, h.present],
            present: h.future[0],
            future: h.future.slice(1),
          }
        : h,
    );
  useEffect(() => {
    try {
      engine.current = new RingRenderer(host.current, () => setError(true));
      worker.current = new Worker('/builder/geometry-worker.js', {type:'module'});
      worker.current.onmessage = ({data}) => {
        active.current=false;
        if(data.id===job.current && engine.current) {
          if(data.error) { console.error(data.error); setError(true); }
          else {
            engine.current.update(latest.current,unpackModel(data.packed,engine.current.studioTexture));
            host.current.dataset.geometryMs=data.packed.buildMs.toFixed(1);
            host.current.dataset.quality='detailed';
            setRefining(false);setError(false);setReady(true);
          }
        }
        if(queued.current) {const next=queued.current;queued.current=null;active.current=true;worker.current.postMessage(next);}
      };
      worker.current.onerror = () => {setError(true);setRefining(false);};
    } catch(e) {console.error(e);setError(true);}
    return () => {worker.current?.terminate();engine.current?.dispose();engine.current=null;clearTimeout(timer.current);};
  }, []);
  useEffect(() => {
    if(!engine.current||!worker.current)return;
    if(engine.current.config && JSON.stringify({...s,rotate:false})===JSON.stringify({...engine.current.config,rotate:false})) {
      engine.current.controls.autoRotate=s.rotate;engine.current.config=s;return;
    }
    const start=performance.now();
    try {
      engine.current.update(s,previewModel(s,engine.current.studioTexture));
      host.current.dataset.previewMs=(performance.now()-start).toFixed(1);
      host.current.dataset.quality='preview';setReady(false);setRefining(true);setError(false);
      const request={id:++job.current,config:s};
      if(active.current)queued.current=request;
      else {active.current=true;worker.current.postMessage(request);}
    } catch(e){console.error(e);setError(true);}
  }, [s]);
  useEffect(() => {
    const listener = () => {
      if (location.hash.includes("design=")) change(readDesign());
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  const choices = (key, visual = false) => (
    <div className={"rb-choices " + (visual ? "rb-visual" : "")}>
      {OPTIONS[key]
        .filter(
          (value) =>
            key !== "style" ||
            family === "all" ||
            (family==='fashion'?FASHION_STYLES.includes(value):family==='daily'?[...DAILY_STYLES,'band','eternity'].includes(value):!FASHION_STYLES.includes(value)&&![...DAILY_STYLES,'band','eternity'].includes(value)),
        )
        .map((value) => (
          <button
            key={value}
            type="button"
            className={"rb-choice " + (s[key] === value ? "selected" : "")}
            aria-pressed={s[key] === value}
            onClick={() =>
              change(
                key === "style"
                  ? {
                      ...(COLLECTION.find(c=>c.style===value)?.config || {}),
                      ...{ [key]: value },
                    sideMode: value === "trilogy" ? "pair" : "none",
                    setting: COLLECTION.find(c=>c.style===value)?.config.setting || (value==='bezelrow'?'bezel':s.setting),
                      accents:
                        value === "eternity" || value === "pave"
                          ? "pave"
                          : s.accents,
                    }
                  : { [key]: value },
              )
            }
          >
            {visual && key==='style' && thumbs[PRESETS.findIndex(p=>p.config.style===value)] ? <img className="rb-style-photo" src={thumbs[PRESETS.findIndex(p=>p.config.style===value)]} alt=""/> : visual && (
              <Shape
                {...(key === "style" ? { style: value } : { shape: value })}
              />
            )}
            <span>{label(value)}</span>
            {key==='style'&&COLLECTION.find(c=>c.style===value)&&<small className="rb-style-story">{COLLECTION.find(c=>c.style===value).story[lang==='en'?1:0]}</small>}
            {s[key] === value && <i aria-hidden="true">✓</i>}
          </button>
        ))}
    </div>
  );
  const tones = (key) => (
    <div className="rb-tones">
      {OPTIONS[key].map((tone) => (
        <button
          key={tone}
          className={s[key] === tone ? "selected" : ""}
          aria-pressed={s[key] === tone}
          onClick={() => change({ [key]: tone })}
        >
          <span
            className="rb-tone"
            style={{ "--tone": GEM_TONES[tone].color }}
          />
          <span>{label(tone)}</span>
        </button>
      ))}
    </div>
  );
  const select = (key, title) => (
    <label className="rb-select">
      {title}
      <select
        value={s[key]}
        onChange={(e) => change({ [key]: e.target.value })}
      >
        {OPTIONS[key].map((x) => (
          <option key={x} value={x}>
            {label(x)}
          </option>
        ))}
      </select>
    </label>
  );
  const slider = (key, title, min, max, increment, unit) => (
    <label className="rb-slider">
      <span>
        {title}
        <strong>
          {Number(s[key]).toFixed(increment < 0.1 ? 2 : increment < 1 ? 1 : 0)}{" "}
          {unit}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={increment}
        value={s[key]}
        onChange={(e) => change({ [key]: Number(e.target.value) })}
      />
      <small>
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </small>
    </label>
  );
  const save = () => {
    try {
      if(library.length>=24) {notify(L('A gyűjtemény megtelt (24 terv). Töltsd le ezt a tervet fájlba.','Collection full (24 designs). Download this design as a file.'));return;}
      localStorage.setItem("brightal-design-v1", JSON.stringify(s));
      const next = [{ id: Date.now(), name:designName.trim().slice(0,60)||label(s.style), design: s }, ...library];
      localStorage.setItem("brightal-library-v2", JSON.stringify(next));
      setLibrary(next);
      setSaved(true);
      notify(
        L(
          "A terved elmentve ezen az eszközön.",
          "Your design is saved on this device.",
        ),
      );
    } catch {
      notify(
        L(
          "A böngésző nem engedte a mentést. Exportáld a tervet.",
          "Storage unavailable. Export your design instead.",
        ),
      );
    }
  };
  const share = async () => {
    const url = new URL(location.href);
    url.hash = new URLSearchParams({
      design: JSON.stringify({ ...s, rotate: false }),
    }).toString();
    try {
      await navigator.clipboard.writeText(url.href);
      notify(L("A terv linkje a vágólapon.", "Design link copied."));
    } catch {
      window.prompt(
        L("Másold ki a terv linkjét:", "Copy your design link:"),
        url.href,
      );
    }
  };
  const quote = async () => {
    if (!engine.current || error) return;
    setBusy(true);
    try {
      const png = engine.current.capture();
      const bytes = Uint8Array.from(atob(png.split(",")[1]), (c) =>
        c.charCodeAt(0),
      );
      onQuote({
        file: new File([bytes], "brightal-ring-design.png", {
          type: "image/png",
        }),
        preview: png,
        design: s,
        name: designName.trim().slice(0,60),
        note: description(s),
        metal: label(s.metal),
      });
    } catch {
      notify(
        L(
          "Nem sikerült a kép mentése. Próbáld újra.",
          "Could not capture the design. Please try again.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const exportDesign = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { version: 2, design: s, description: description(s) },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    download(url, "brightal-design.json");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importDesign = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 20000) throw new Error("size");
      const parsed = JSON.parse(await file.text());
      if (
        !parsed.design ||
        Array.isArray(parsed.design) ||
        typeof parsed.design !== "object"
      )
        throw new Error("format");
      change(normalize(parsed.design));
      notify(L("A terv betöltve.", "Design imported."));
    } catch {
      notify(
        L(
          "Nem sikerült beolvasni. Válassz egy BRIGHTAL JSON tervfájlt.",
          "Could not import. Choose a BRIGHTAL JSON design file.",
        ),
      );
    }
  };
  const fashionControls = () => (
    <div className="rb-sculpt-controls">
      <h3>{L("Alakítsd a sziluettet", "Sculpt the silhouette")}</h3>
      {["wave", "dome", "open", "rope", "signet"].includes(s.style) &&
        slider(
          "sculpt",
          L("Forma intenzitása", "Sculptural intensity"),
          0.4,
          2.5,
          0.1,
          "",
        )}
      {["rope"].includes(s.style) &&
        slider("rhythm", L("Forma ritmusa", "Pattern rhythm"), 2, 8, 1, "")}
      {s.style === "stack" &&
        slider("layers", L("Gyűrűsorok száma", "Number of bands"), 2, 4, 1, "")}
      {["stack", "open"].includes(s.style) &&
        slider(
          "gap",
          L("Távolság / nyitás", "Spacing / opening"),
          0.3,
          1.5,
          0.1,
          "",
        )}
      {s.style === "signet" && (
        <>
          {slider(
            "faceSize",
            L("Pecsét mérete", "Signet face size"),
            5,
            11,
            0.5,
            "mm",
          )}
        </>
      )}
      {slider("width", L("Sín szélessége", "Band width"), 1.6, 10, 0.1, "mm")}
    </div>
  );
  const stoneControls = () => <>
    {['wave','rope','dome','open','stack','band'].includes(s.style)&&<label className="rb-toggle"><input type="checkbox" checked={s.fashionStone} onChange={e=>change({fashionStone:e.target.checked})}/>{L('Gyémánt hozzáadása','Add a diamond')}</label>}
    {modernLayout(s).stones.length>0&&<>
      <h3>{L('Csiszolás és szín','Cut and colour')}</h3>{choices('shape',true)}{tones('gemTone')}
      {s.style!=='eastwest'&&select('orientation',L('Kő tájolása','Stone orientation'))}
      <h3>{L('Kőméretek milliméterben','Stone dimensions in millimetres')}</h3>
      {slider('stoneWidth',L('Kő szélessége','Stone width'),1.5,5,.1,'mm')}
      {!['round','cushion','princess','asscher'].includes(s.shape)&&slider('stoneLength',L('Kő hossza','Stone length'),s.stoneWidth,6,.1,'mm')}
      {slider('stoneDepth',L('Kő teljes mélysége','Total stone depth'),1,Math.min(3.5,Math.round(s.stoneWidth*.75*10)/10),.1,'mm')}
      {!['eastwest','curvedoval','wavebezel','openpair','fullcircle',...FASHION_STYLES].includes(s.style)&&slider('dailyCount',L('Kövek száma','Number of stones'),1,maxDailyStones(s),1,'')}
      {s.style==='alternating'&&select('sideShape',L('Váltakozó csiszolás','Alternating cut'))}
      {slider('dailySpacing',L('Kősor térköze','Stone spacing'),0,.5,.05,'mm')}
      <p className="rb-fine">{L('A méreteket a kiválasztott kövekhez lehet igazítani. A végleges követ és a foglalást az ötvös ellenőrzi.','Match these dimensions to the selected stones. The goldsmith verifies the actual stones and setting.')}</p>
    </>}
  </>;
  const remix = () => {
    const pick = (values) => values[Math.floor(Math.random() * values.length)];
    change({
      ...s,
      style: pick(FASHION_STYLES),
      metal: pick(OPTIONS.metal),
      secondaryMetal: pick(OPTIONS.secondaryMetal),
      mixedMetal: Math.random() > 0.4,
      sculpt: pick([0.7, 1.2, 1.8, 2.3]),
      rhythm: pick([3, 4, 6]),
      layers: pick([2, 3, 4]),
      inlay: pick(OPTIONS.inlay),
      width: pick([1.8, 2.4, 3.2, 4.2]),
      faceSize: pick([6, 8, 10]),
    });
    setStep(0);
    setFamily("fashion");
    notify(
      L(
        "Új variáció — egy kattintással visszavonható.",
        "New variation — undo is always available.",
      ),
    );
  };
  const steps = [
    L("Stílus", "Style"),
    isFashion(s) ? L("Sziluett", "Silhouette") : L("Gyémánt", "Diamond"),
    L("Nemesfém", "Metal"),
    isFashion(s) ? L("Kontraszt", "Contrast") : L("Oldalkövek", "Side stones"),
    L("Részletek", "Details"),
    L("A terved", "Your design"),
  ];
  return (
    <main className={"rb-page rb-lab " + (focus ? "rb-focus" : "")}>
      <div className="rb-path-switch">
        <button className="active" aria-current="page">
          <Icon type="gem" size={16} />
          {L("Megtervezem 3D-ben", "Design in 3D")}
        </button>
        <button onClick={onUpload}>
          <Icon type="camera" size={16} />
          {L("Van egy képem", "I have a photo")}
          <span>↗</span>
        </button>
      </div>
      <header className="rb-heading">
        <div>
          <div className="rb-eyebrow">
            <span /> BRIGHTAL / DESIGN LAB{" "}
            <span className="rb-tag">VOL. 03</span>
          </div>
          <h1>
            {L("Ne kövesd.", "Don't follow.")}{" "}
            <em>{L("Alkosd.", "Create.")}</em>
          </h1>
          <p>
            {L(
              "Eljegyzésre. Minden napra. számtalan forma és személyes részlet.",
              "For a proposal. For every day. countless forms and personal details.",
            )}
          </p>
        </div>
        <div className="rb-heading-actions">
          <button
            className="rb-library-button"
            onClick={() => libraryDialog.current.showModal()}
          >
            {L("Saját terveim", "My collection")}{" "}
            <span>{library.length.toString().padStart(2, "0")}</span>
          </button>
          <button className="rb-save" onClick={save}>
            <Icon type="save" />
            {saved ? L("Elmentve", "Saved") : L("Terv mentése", "Save design")}
          </button>
        </div>
      </header>
      <div className="rb-lab-toolbar">
        <span>
          ● {L("ÉLŐ 3D MŰHELY", "LIVE 3D STUDIO")}{" "}
          <small> / {label(s.style)}</small>
        </span>
        <div>
          <button onClick={remix}>
            ✧ {L("Lepj meg egy variációval", "Surprise me")}
          </button>
          <button aria-pressed={focus} onClick={() => setFocus(!focus)}>
            {focus
              ? L("Vissza a vezérlőkhöz", "Back to controls")
              : L("Nagy munkatér ↗", "Focus canvas ↗")}
          </button>
        </div>
      </div>
      <div className="rb-workspace">
        <section
          className={"rb-stage rb-light-" + s.light}
          aria-label={L("A gyűrű 3D előnézete", "3D ring preview")}
        >
          <div className="rb-stage-heading">
            <span>
              <i /> {L("A TE ALKOTÁSOD", "YOUR CREATION")}{" "}
              <span className="rb-live-pill">LIVE</span>
            </span>
            <div>
              <button
                onClick={undo}
                disabled={!history.past.length}
                aria-label={L("Visszavonás", "Undo")}
              >
                ↶
              </button>
              <button
                onClick={redo}
                disabled={!history.future.length}
                aria-label={L("Újra", "Redo")}
              >
                ↷
              </button>
              <button
                onClick={share}
                aria-label={L("Terv megosztása", "Share design")}
              >
                <Icon type="share" size={17} />
              </button>
            </div>
          </div>
          <div className="rb-watermark" aria-hidden="true">
            atelier.
          </div>
          <span className="rb-stage-edition" aria-hidden="true">
            BRIGHTAL OBJECTS / N°{" "}
            {String(OPTIONS.style.indexOf(s.style) + 1).padStart(2, "0")}
          </span>
          <div ref={host} className="rb-canvas" />
          {!ready && !error && (
            <div className="rb-progress">
              {L("Részletes modell betöltése…", "Opening the atelier…")}
            </div>
          )}
          {error && (
            <div className="rb-fallback">
              <Icon size={40} />
              <h2>{L("A 3D nézet nem elérhető", "3D preview unavailable")}</h2>
              <p>
                {L(
                  "A részletes modell nem készült el. Válassz más paramétereket vagy töltsd újra az oldalt. A tervfájlt továbbra is mentheted.",
                  "Enable browser hardware acceleration and reload. You can still edit and export your design.",
                )}
              </p>
              <button onClick={() => location.reload()}>
                {L("Újratöltés", "Reload")}
              </button>
            </div>
          )}
          <div className="rb-preview-caption">
            <span>{label(s.style)}</span>
            <h2>
              {isBand(s)
                ? label(s.metal)
                : `${Number(s.carat).toFixed(1)} ct ${label(s.shape)}`}
            </h2>
            <p>
              {label(s.metal)} <span>·</span> {s.width.toFixed(1)} mm
            </p>
          </div>
          <div className="rb-orbit-tools">
            <button
              onClick={() => engine.current?.zoom(0.88)}
              aria-label={L("Nagyítás", "Zoom in")}
            >
              +
            </button>
            <button
              onClick={() => engine.current?.zoom(1.12)}
              aria-label={L("Kicsinyítés", "Zoom out")}
            >
              −
            </button>
            <span />
            <button
              onClick={() => change({ rotate: !s.rotate })}
              aria-pressed={s.rotate}
              aria-label={L("Automatikus forgatás", "Auto rotate")}
            >
              <Icon type="rotate" />
            </button>
            <button
              onClick={() => engine.current?.view("hero")}
              aria-label={L("Nézet visszaállítása", "Reset view")}
            >
              <Icon type="reset" />
            </button>
            <button
              disabled={!ready || error}
              onClick={() =>
                download(engine.current.capture(), "brightal-ring.png")
              }
              aria-label={L("Kép letöltése", "Download image")}
            >
              <Icon type="camera" />
            </button>
          </div>
          <div className="rb-stage-bottom">
            <div className="rb-views">
              {[
                ["hero", "3/4"],
                ["top", L("Felül", "Top")],
                ["front", L("Elöl", "Front")],
                ["side", L("Oldalt", "Side")],
              ].map(([id, title]) => (
                <button key={id} onClick={() => engine.current?.view(id)}>
                  {title}
                </button>
              ))}
            </div>
            <p>
              {L(
                "Húzás: forgatás · Görgetés: nagyítás a kurzorhoz · Jobb húzás / két ujj: eltolás",
                "Drag: orbit · Scroll: zoom to cursor · Right drag / two fingers: pan",
              )}
            </p>
          </div>
        </section>
        <section
          className="rb-panel"
          aria-label={L("Gyűrű beállításai", "Ring configuration")}
        >
          <nav
            className="rb-steps"
            aria-label={L("Tervezés lépései", "Design steps")}
          >
            {steps.map((name, i) => (
              <button
                key={name}
                className={i === step ? "active" : ""}
                aria-current={i === step ? "step" : undefined}
                onClick={() => setStep(i)}
              >
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>{name}</span>
              </button>
            ))}
          </nav>
          <div className="rb-controls">
            <div className="rb-section-title">
              <span>
                {L("ALKOTÓELEM", "DESIGN ELEMENT")} {step + 1} / 6
              </span>
              <h2>
                {
                  [
                    L(
                      "Mivel kezdődik a történeted?",
                      "Where does your story begin?",
                    ),
                    isFashion(s) && step === 1
                      ? L("Formáld szabadon.", "Sculpt it your way.")
                      : L(
                          "A ragyogás középpontja.",
                          "At the heart of the sparkle.",
                        ),
                    L("Találd meg a saját fényed.", "Find your kind of glow."),
                    isFashion(s)
                      ? L("A kontraszt karakter.", "Contrast is character.")
                      : L("A ragyogás folytatódik.", "Let the sparkle unfold."),
                    L(
                      "Az apróságok teszik a tiéddé.",
                      "The details make it yours.",
                    ),
                    L("Egyetlen. Megismételhetetlen.", "One of a kind. Yours."),
                  ][step]
                }
              </h2>
              <p>
                {
                  [
                    L(
                      "Válassz egy alapot. Minden részletet a saját ízlésedre formálhatsz.",
                      "Choose a starting point. Make every detail your own.",
                    ),
                    isFashion(s)
                      ? L(
                          "Játssz az ívekkel, arányokkal és a forma ritmusával.",
                          "Explore curves, proportions and the rhythm of the form.",
                        )
                      : L(
                          "Forma, arány és karakter — a gyémánt, ahogyan te szereted.",
                          "Shape, proportion and character. A diamond your way.",
                        ),
                    L(
                      "Meleg arany, finom rozé vagy hűvös platina.",
                      "Warm gold, soft rose or cool platinum.",
                    ),
                    isFashion(s)
                      ? L(
                          "Kombináld a fémeket. Pecsétgyűrűnél próbálj színes betétet is.",
                          "Mix metals. Explore colored inlays on your signet.",
                        )
                      : L(
                          "Állítsd külön az oldalkövek formáját, méretét és színét. Rajzold körbe fénnyel a gyűrűd.",
                          "Choose the shape, size and color of your side stones. Trace your ring in light.",
                        ),
                    isFashion(s)
                      ? L(
                          "Találd meg a hozzád illő méretet és szélességet.",
                          "Find your ideal size and width.",
                        )
                      : L(
                          "Egy titkos üzenet. Egy váratlan csillanás. Egy személyes döntés.",
                          "A secret message. An unexpected sparkle. A personal touch.",
                        ),
                    L(
                      "Nézd meg minden oldalról, és küldd el az ötvösünknek.",
                      "Explore every angle, then share it with our goldsmith.",
                    ),
                  ][step]
                }
              </p>
            </div>
            {step === 0 && (
              <>
                <h3>{L("Gyűrű stílusa", "Ring style")}</h3>
                <div className="rb-family">
                  {[
                    ["classic", L("Eljegyzési gyűrűk", "Engagement rings")],
                    ["daily", L("Mindennapi gyémánt", "Everyday diamonds")],
                    ["fashion", L("Önkifejezés", "Self-expression")],
                    ["all", L(`Mind a ${OPTIONS.style.length}`, `All ${OPTIONS.style.length}`)],
                  ].map(([key, title]) => (
                    <button
                      key={key}
                      aria-pressed={family === key}
                      onClick={() => setFamily(key)}
                    >
                      {title}
                    </button>
                  ))}
                </div>
                {choices("style", true)}
                {isFashion(s) && fashionControls()}
                {!isModern(s) && (!isBand(s)||isDaily(s)) && (
                  <>
                    <h3>{L("A kő foglalata", "Stone setting")}</h3>
                    {choices("setting")}
                    <div className="rb-select-row">
                      {select(
                        "orientation",
                        L("Kő tájolása", "Stone orientation"),
                      )}
                      {select(
                        "headMetal",
                        L("Foglalat nemesféme", "Head metal"),
                      )}
                    </div>
                  </>
                )}
                <div className="rb-editorial">
                  <Icon type="spark" />
                  <div>
                    <strong>
                      {L(
                        "A szépség a részletekben rejlik.",
                        "Beauty is in the details.",
                      )}
                    </strong>
                    <p>
                      {L(
                        "A stílus csak a kezdet. A következő lépésekben te döntesz a gyémántról, a fémről és minden személyes részletről.",
                        "The style is just the beginning. Next, choose your diamond, metal and personal details.",
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
            {step === 1 && isModern(s) && stoneControls()}
            {step === 1 &&
              !isModern(s) &&
              (isBand(s)&&!isDaily(s) ? (
                <div className="rb-editorial">
                  <Icon />
                  <p>
                    {L(
                      "A karikagyűrűnek nincs központi köve. Az Oldalkövek lépésben pavé vagy sínbe foglalt gyémántsort adhatsz hozzá.",
                      "Wedding bands have no center stone. Add pavé or channel-set diamonds in Side stones.",
                    )}
                  </p>
                </div>
              ) : (
                <>
                  <h3>{L("Gyémántforma", "Diamond shape")}</h3>
                  {choices("shape", true)}
                  <h3>{L("Kő és színvilág", "Gemstone palette")}</h3>
                  {tones("gemTone")}
                  {isDaily(s)?<>
                    {slider('dailyCarat',L('Egy gyémánt súlya','Weight per diamond'),.05,.3,.01,'ct')}
                    {slider('dailyCount',L('Gyémántok száma','Diamond count'),3,maxDailyStones(s),1,'')}
                    {s.style==='alternating'&&select('sideShape',L('Váltakozó kőforma','Alternating cut'))}
                    {slider('dailySpacing',L('Kövek közötti ráhagyás','Stone spacing'),0,.5,.05,'')}
                    {['chevron','ribbon','crown','contour','curvedoval','wavebezel','asymmetric'].includes(s.style)&&slider('sculpt',L('Ív mélysége','Curve depth'),.4,2.5,.1,'')}
                    <p className="rb-fine">{L('A kőszám a látványterv arányaihoz igazodik; a tényleges kőméreteket a műhely ellenőrzi.','Maximum count adapts to the preview proportions; actual stone dimensions require workshop verification.')}</p>
                  </>:slider(
                    "carat",
                    L("Karátsúly", "Carat weight"),
                    0.3,
                    5,
                    0.1,
                    "ct",
                  )}
                  {s.gemTone === "ice" && (
                    <div className="rb-select-row">
                      {select("color", L("Szín", "Color"))}
                      {select("clarity", L("Tisztaság", "Clarity"))}
                    </div>
                  )}
                  <div className="rb-select-row">
                    {select("origin", L("Eredet", "Origin"))}
                    {select(
                      "certificate",
                      L("Kért tanúsítvány", "Requested certificate"),
                    )}
                  </div>
                  <p className="rb-fine">
                    {L(
                      "A minősítés a keresett kő specifikációja. A tényleges készletet és tanúsítványt az ötvös erősíti meg.",
                      "Grades describe your desired stone. Availability and certification are confirmed by the goldsmith.",
                    )}
                  </p>
                </>
              ))}
            {step === 2 && (
              <>
                <h3>{L("Nemesfém", "Precious metal")}</h3>
                <div className="rb-metals">
                  {OPTIONS.metal.map((m) => (
                    <button
                      key={m}
                      className={s.metal === m ? "selected" : ""}
                      aria-pressed={s.metal === m}
                      onClick={() => change({ metal: m })}
                    >
                      <span className={"rb-swatch " + m.replace(/14|18/, "")} />
                      <span>{label(m)}</span>
                      {s.metal === m && <b>✓</b>}
                    </button>
                  ))}
                </div>
                <h3>{L("Felület", "Finish")}</h3>
                {choices("finish")}
                <h3>
                  {L("Próbáld más fényben", "See it in a different light")}
                </h3>
                {choices("light")}
                <p className="rb-fine">
                  {L(
                    "A fényváltás az előnézet hangulatát változtatja. A fém és a kövek a választott fényforrásokat tükrözik.",
                    "Lighting changes the preview mood. Metals and stones reflect the selected light rig.",
                  )}
                </p>
              </>
            )}
            {step === 3 && isModern(s) && <>
              <h3>{L('Arányok és foglalat','Proportions and setting')}</h3>
              {slider('thickness',L('Alap falvastagsága','Base metal thickness'),1.4,3,.1,'mm')}
              {modernLayout(s).stones.length>0&&slider('bezelWall',L('Foglalat pereme','Bezel wall'),.35,.7,.05,'mm')}
              {['chevron','ribbon','crown','contour','curvedoval','wavebezel','asymmetric'].includes(s.style)&&slider('sculpt',L('Ív mélysége','Curve depth'),.4,2.5,.1,'mm')}
              {modernLayout(s).stones.length>1&&<label className="rb-toggle"><input type="checkbox" checked={s.alternateGems} onChange={e=>change({alternateGems:e.target.checked})}/>{L('Váltakozó kőszínek','Alternating stone colours')}</label>}
              {s.alternateGems&&tones('sideTone')}
              <p className="rb-fine">{L('Az ívek és a foglalatok egyetlen összefüggő fémtestet alkotnak. A szükséges szélesség a kőméretekhez igazodik.','The curves and settings form one continuous metal body. The required width adapts to the stone dimensions.')}</p>
            </>}
            {step === 3 && !isModern(s) && (
              <>
                {!isBand(s) && (
                  <>
                    {s.style !== "duet" && (
                      <>
                        <h3>
                          {L(
                            "Oldalkövek elrendezése",
                            "Side stone arrangement",
                          )}
                        </h3>
                        <div className="rb-choices">
                          {OPTIONS.sideMode
                            .filter(
                              (v) => s.style !== "trilogy" || v !== "none",
                            )
                            .map((v) => (
                              <button
                                key={v}
                                className={
                                  "rb-choice " +
                                  (s.sideMode === v ? "selected" : "")
                                }
                                aria-pressed={s.sideMode === v}
                                onClick={() => change({ sideMode: v })}
                              >
                                {label(v)}
                              </button>
                            ))}
                        </div>
                      </>
                    )}
                    {(s.sideMode !== "none" || s.style === "duet") && (
                      <>
                        <h3>
                          {s.style === "duet"
                            ? L("Második főköved", "Your second center stone")
                            : L("Oldalkő formája", "Side stone shape")}
                        </h3>
                        {choices("sideShape", true)}
                        {slider(
                          "sideCarat",
                          L("Egy oldalkő súlya", "Each side stone weight"),
                          0.1,
                          1.5,
                          0.05,
                          "ct",
                        )}
                      </>
                    )}
                  </>
                )}
                <h3>
                  {L(
                    "Oldalkövek és berakások színe",
                    "Side stone & accent palette",
                  )}
                </h3>
                {tones("sideTone")}
                <h3>{L("Sín berakása", "Band accents")}</h3>
                <div className="rb-choices">
                  {OPTIONS.accents
                    .filter((a) => s.style !== "eternity" || a !== "none")
                    .map((a) => (
                      <button
                        className={
                          "rb-choice " + (s.accents === a ? "selected" : "")
                        }
                        key={a}
                        aria-pressed={s.accents === a}
                        onClick={() => change({ accents: a })}
                      >
                        {label(a)}
                      </button>
                    ))}
                </div>
                {!isBand(s) && (
                  <label className="rb-toggle">
                    <input
                      type="checkbox"
                      checked={s.hiddenHalo}
                      onChange={(e) => change({ hiddenHalo: e.target.checked })}
                    />
                    <span>
                      {L(
                        "Rejtett halo a főkő alatt",
                        "Hidden halo below the center stone",
                      )}
                    </span>
                  </label>
                )}
                {(["pave", "channel"].includes(s.accents) ||
                  ["pave", "vintage", "eternity"].includes(s.style)) && (
                  <>
                    {slider(
                      "accentSize",
                      L("Berakott kövek átmérője", "Accent stone diameter"),
                      0.6,
                      Number(
                        Math.min(2, s.width / (s.accentRows + 0.4)).toFixed(2),
                      ),
                      0.1,
                      "mm",
                    )}
                    <div className="rb-select-row">
                      {s.style !== "eternity" &&
                        select(
                          "coverage",
                          L("Berakás hossza", "Accent coverage"),
                        )}
                      <label className="rb-select">
                        {L("Kősorok száma", "Stone rows")}
                        <select
                          value={s.accentRows}
                          onChange={(e) =>
                            change({ accentRows: Number(e.target.value) })
                          }
                        >
                          <option value="1">1</option>
                          {s.style!=='split'&&<option value="2">2</option>}
                        </select>
                      </label>
                    </div>
                    <p className="rb-fine">
                      {L(
                        "A maximális kőméret igazodik a sín szélességéhez és a sorok számához.",
                        "Maximum stone diameter adapts to band width and row count.",
                      )}
                    </p>
                  </>
                )}
                {["halo", "vintage"].includes(s.style) && (
                  <>
                    <h3>{L("Halo kialakítása", "Halo design")}</h3>
                    {choices("halo")}
                    {slider(
                      "haloSize",
                      L("Halo kövek átmérője", "Halo stone diameter"),
                      0.6,
                      1.6,
                      0.1,
                      "mm",
                    )}
                  </>
                )}
              </>
            )}
            {step === 4 && (
              <>
                {!isModern(s) && slider("thickness", L("Sín vastagsága", "Band thickness"), 1.4, 3, .1, "mm")}
                {slider(
                  "width",
                  L("Sín szélessége", "Band width"),
                  1.6,
                  isModern(s)?10:5,
                  0.1,
                  "mm",
                )}
                {slider(
                  "size",
                  L("Gyűrűméret (EU kerület)", "Ring size (EU circumference)"),
                  44,
                  72,
                  1,
                  "mm",
                )}
                <div className="rb-select-row">
                  {!isModern(s) &&
                    select("profile", L("Sín profilja", "Band profile"))}
                  {(!isBand(s)||isDaily(s)) && s.setting !== "bezel" && (
                    <label className="rb-select">
                      {L("Karmok", "Prongs")}
                      <select
                        value={s.prongs}
                        onChange={(e) =>
                          change({ prongs: Number(e.target.value) })
                        }
                      >
                        <option value="4">4</option>
                        <option value="6">6</option>
                        <option value="8">8</option>
                      </select>
                    </label>
                  )}
                </div>
                {!isModern(s) && (!isBand(s)||isDaily(s)) &&
                  slider(
                    "height",
                    L("Foglalat emelése", "Setting lift"),
                    0.5,
                    2.5,
                    0.1,
                    "mm",
                  )}
                {!isModern(s) && (
                  <>
                    <label className="rb-select rb-engraving">
                      {L("A ti titkos üzenetetek", "Your secret message")}
                      <input
                        maxLength="24"
                        value={s.engraving}
                        placeholder={L(
                          "pl. Örökké veled ♡",
                          "e.g. Always, with you ♡",
                        )}
                        onChange={(e) => change({ engraving: e.target.value })}
                      />
                      <small>
                        {s.engraving.length}/24 ·{" "}
                        {L(
                          "Gravírozás a gyűrű belső oldalán",
                          "Engraved inside the band",
                        )}
                      </small>
                    </label>
                    {select(
                      "engravingFont",
                      L("Gravírozás betűje", "Engraving lettering"),
                    )}
                  </>
                )}
              </>
            )}
            {step === 5 && (
              <>
                <div className="rb-save-final">
                  <label className="rb-select">{L('Adj nevet a tervednek','Name your design')}<input maxLength={60} value={designName} onChange={e=>setDesignName(e.target.value)} placeholder={label(s.style)}/></label>
                  <button className="rb-primary" onClick={save}>{saved?L('Elmentve a saját terveid közé','Saved to your collection'):L('Terv mentése a gyűjteménybe','Save design to collection')}</button>
                  <p className="rb-fine">{L('Mentés ezen a böngészőn. Másik eszközhöz töltsd le a tervfájlt.','Saved in this browser. Download the design file to use another device.')}</p>
                </div>
                <dl className="rb-summary">
                  {isModern(s)&&<><div><dt>{L('Kövek és foglalat','Stones and setting')}</dt><dd>{modernLayout(s).stones.length} · {s.stoneLength} × {s.stoneWidth} × {s.stoneDepth} mm · {label(s.shape)}</dd></div><div><dt>{L('Belső átmérő / tényleges szélesség','Inner diameter / actual width')}</dt><dd>{(s.size/Math.PI).toFixed(3)} mm / {modernLayout(s).width.toFixed(2)} mm</dd></div></>}
                  {isFashion(s) && (
                    <>
                      <div>
                        <dt>
                          {L("Szobrászi paraméterek", "Sculptural parameters")}
                        </dt>
                        <dd>
                          {["wave", "rope"].includes(s.style)
                            ? `${L("Ritmus", "Rhythm")}: ${s.rhythm}`
                            : s.style === "stack"
                              ? `${s.layers} ${L("sor", "bands")}`
                              : s.style === "signet"
                                ? `${s.faceSize} mm · ${label(s.face)} · ${label(s.inlay)}`
                                : `${L("Intenzitás", "Intensity")}: ${s.sculpt}`}
                        </dd>
                      </div>
                      {s.mixedMetal &&
                        ["rope", "open", "stack", "signet"].includes(
                          s.style,
                        ) && (
                          <div>
                            <dt>{L("Második nemesfém", "Secondary metal")}</dt>
                            <dd>{label(s.secondaryMetal)}</dd>
                          </div>
                        )}
                    </>
                  )}
                  {[
                    ["style", L("Stílus", "Style")],
                    ...(isBand(s)
                      ? []
                      : [
                          ["shape", L("Gyémánt", "Diamond")],
                          ["origin", L("Eredet", "Origin")],
                          [
                            "certificate",
                            L("Kért tanúsítvány", "Requested certificate"),
                          ],
                        ]),
                    ["metal", L("Nemesfém", "Metal")],
                    ["finish", L("Felület", "Finish")],
                    ["accents", L("Kísérőkövek", "Accents")],
                    ...(!isBand(s)
                      ? [
                          ["gemTone", L("Főkő", "Center gem")],
                          ["setting", L("Foglalat", "Setting")],
                          ["headMetal", L("Foglalat féme", "Head metal")],
                          ["orientation", L("Tájolás", "Orientation")],
                        ]
                      : []),
                    ...(!isFashion(s)
                      ? [["sideTone", L("Oldalkövek színe", "Accent color")]]
                      : []),
                  ].map(([key, title]) => (
                    <div key={key}>
                      <dt>{title}</dt>
                      <dd>
                        {key === "shape"
                          ? `${label(s.shape)} · ${s.carat.toFixed(1)} ct${s.gemTone === "ice" ? ` · ${s.color} / ${s.clarity}` : ""}`
                          : label(s[key])}
                      </dd>
                    </div>
                  ))}
                  {!isBand(s) &&
                    (s.sideMode !== "none" || s.style === "duet") && (
                      <div>
                        <dt>{L("Oldalkő", "Side stone")}</dt>
                        <dd>
                          {label(s.sideShape)} · {s.sideCarat.toFixed(2)} ct ·{" "}
                          {s.style === "duet" ? "Toi & Moi" : label(s.sideMode)}
                        </dd>
                      </div>
                    )}
                  {s.accents !== "none" && (
                    <div>
                      <dt>{L("Berakás", "Accents")}</dt>
                      <dd>
                        {s.accentSize} mm · {s.accentRows} {L("sor", "rows")} ·{" "}
                        {label(s.coverage)}
                      </dd>
                    </div>
                  )}
                  {s.hiddenHalo && (
                    <div>
                      <dt>{L("Rejtett halo", "Hidden halo")}</dt>
                      <dd>{L("Igen", "Yes")}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{L("Szélesség / méret", "Width / size")}</dt>
                    <dd>
                      {s.width.toFixed(1)} mm / EU {s.size}
                    </dd>
                  </div>
                  {s.engraving && (
                    <div>
                      <dt>{L("Gravírozás", "Engraving")}</dt>
                      <dd>“{s.engraving}”</dd>
                    </div>
                  )}
                </dl>
                <p className="rb-fine">
                  {L(
                    "Egyedi árajánlat készül. A látványterv szemléltetés; a gyárthatóságot, a kőminőséget és a végleges arányokat az ötvös ellenőrzi.",
                    "Individually quoted. This is a visual concept; manufacturability, stone quality and final proportions are reviewed by the goldsmith.",
                  )}
                </p>
                <div className="rb-export">
                  <button onClick={() => importInput.current.click()}>
                    {L("Terv importálása", "Import design")} ↑
                  </button>
                  <button onClick={exportDesign}>
                    {L("Tervfájl letöltése (JSON)", "Download design (JSON)")} ↓
                  </button>
                  <button onClick={share}>
                    {L("Terv megosztása", "Share design")} ↗
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="rb-panel-footer">
            <div>
              <span>{L("KIFEJEZETTEN NEKED", "MADE JUST FOR YOU")}</span>
              <p>
                {step === 5
                  ? L("Személyre szabott árajánlat", "A personal quote")
                  : L(
                      "Kézzel készül. Szívből.",
                      "Handcrafted. From the heart.",
                    )}
              </p>
            </div>
            <button
              className="rb-primary"
              disabled={step === 5 && (!ready || error || busy)}
              onClick={() => (step < 5 ? setStep(step + 1) : quote())}
            >
              {step === 5
                ? busy
                  ? L("Mentés…", "Saving…")
                  : L("Ajánlatot kérek", "Request a quote")
                : L("Tovább", "Continue")}
              <Icon type="arrow" size={18} />
            </button>
          </div>
        </section>
      </div>
      <section className="rb-inspiration">
        <div>
          <span className="rb-eyebrow">
            {L("EGY KIS INSPIRÁCIÓ", "A LITTLE INSPIRATION")}
          </span>
          <h2>{L("Találj rá az érzésre.", "Find your feeling.")}</h2>
        </div>
        <div className="rb-presets">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                change(p.config);
                setStep(0);
                notify(
                  L(
                    "Inspiráció betöltve — formáld a sajátodra.",
                    "Inspiration loaded. Make it your own.",
                  ),
                );
              }}
            >
              <div className={"rb-preset-art preset-" + i}>
                {thumbs[i] ? (
                  <img
                    src={thumbs[i]}
                    alt={p.name[en ? 1 : 0]}
                    loading="lazy"
                  />
                ) : (
                  <Shape style={p.config.style} />
                )}
              </div>
              <span>
                {p.name[en ? 1 : 0]} <i>↗</i>
              </span>
            </button>
          ))}
        </div>
      </section>
      <div className="rb-assurance">
        <span>◇ {L("Magyar ötvösműhely", "Hungarian goldsmith atelier")}</span>
        <span>
          ✧ {L("Minden részlet személyes", "Personal in every detail")}
        </span>
        <span>♡ {L("Kötelezettségmentes ajánlat", "No-obligation quote")}</span>
      </div>
      <div className="rb-notice" role="status" aria-live="polite">
        {notice}
      </div>
      <input
        ref={importInput}
        type="file"
        accept=".json,application/json"
        onChange={importDesign}
        hidden
      />
      <dialog ref={libraryDialog} className="rb-library-dialog">
        <div className="rb-library-head">
          <div>
            <span className="rb-eyebrow">BRIGHTAL / COLLECTION</span>
            <h2>
              {L("A képzeleted gyűjteménye.", "Your imagination, collected.")}
            </h2>
          </div>
          <button
            onClick={() => libraryDialog.current.close()}
            aria-label={L("Bezárás", "Close")}
          >
            ×
          </button>
        </div>
        <p>
          {L(
            "Legfeljebb 24 terv, ezen a böngészőn. Egy kattintás, és folytathatod az alkotást.",
            "Up to 24 designs, saved in this browser. Pick one and keep creating.",
          )}
        </p>
        <div className="rb-library-grid">
          {library.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                change(item.design);
                setDesignName(item.name||'');
                libraryDialog.current.close();
                notify(L("Mentett terv betöltve.", "Saved design loaded."));
              }}
            >
              <Shape style={item.design.style} />
              <strong>{item.name||label(item.design.style)}</strong>
              <span>
                {label(item.design.metal)} ·{" "}
                {isBand(item.design)
                  ? `EU ${item.design.size}`
                  : `${item.design.carat} ct`}
              </span>
            </button>
          ))}
        </div>
        {!library.length && (
          <p>
            {L(
              "Még nincs mentett terved. Kezdd egy ötlettel.",
              "No saved designs yet. Start with an idea.",
            )}
          </p>
        )}
        <button
          className="rb-primary"
          onClick={() => {
            libraryDialog.current.close();
            importInput.current.click();
          }}
        >
          {L("Terv importálása", "Import design")} ↑
        </button>
      </dialog>
    </main>
  );
}
window.BrightalBuilder = { RingBuilder };

import { DiamondViewer } from './diamond-viewer.js';
window.BrightalBuilder.DiamondViewer = DiamondViewer;
