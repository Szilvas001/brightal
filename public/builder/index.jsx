import {
  OPTIONS,
  DEFAULT,
  normalize,
  readDesign,
  description,
  PRESETS,
} from "./state.js";
import { RingRenderer } from "./renderer.js";
const { useState, useEffect, useRef } = React;
const names = {
  solitaire: ["Szoliter", "Solitaire"],
  halo: ["Halo", "Halo"],
  trilogy: ["Háromköves", "Three stone"],
  vintage: ["Vintage", "Vintage"],
  pave: ["Pavé", "Pavé"],
  band: ["Karikagyűrű", "Wedding band"],
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
          {style !== "band" && (
            <>
              <path d="m22 16 5-7h10l5 7-10 12-10-12Zm0 0h20M27 9l5 19 5-19" />
              {style === "trilogy" && (
                <>
                  <circle cx="14" cy="21" r="5" />
                  <circle cx="50" cy="21" r="5" />
                </>
              )}
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
          {["pave", "band"].includes(style) && (
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

function RingBuilder({ lang = "hu", onQuote }) {
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
      engine.current.update(latest.current);
      setReady(true);
    } catch (e) {
      console.error(e);
      setError(true);
    }
    return () => {
      engine.current?.dispose();
      engine.current = null;
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    try {
      engine.current?.update(s);
    } catch (e) {
      console.error(e);
      setError(true);
    }
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
      {OPTIONS[key].map((value) => (
        <button
          key={value}
          type="button"
          className={"rb-choice " + (s[key] === value ? "selected" : "")}
          aria-pressed={s[key] === value}
          onClick={() => change({ [key]: value })}
        >
          {visual && (
            <Shape
              {...(key === "style" ? { style: value } : { shape: value })}
            />
          )}
          <span>{label(value)}</span>
          {s[key] === value && <i aria-hidden="true">✓</i>}
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
          {Number(s[key]).toFixed(increment < 1 ? 1 : 0)} {unit}
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
      localStorage.setItem("brightal-design-v1", JSON.stringify(s));
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
            { version: 1, design: s, description: description(s) },
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
  const steps = [
    L("Stílus", "Style"),
    L("Gyémánt", "Diamond"),
    L("Nemesfém", "Metal"),
    L("Részletek", "Details"),
    L("A terved", "Your design"),
  ];
  return (
    <main className="rb-page">
      <header className="rb-heading">
        <div>
          <div className="rb-eyebrow">
            <span /> BRIGHTAL ATELIER <span className="rb-tag">3D STUDIO</span>
          </div>
          <h1>
            {L("Egy gyűrű.", "One ring.")}{" "}
            <em>{L("Végtelen lehetőség.", "Infinite possibilities.")}</em>
          </h1>
          <p>
            {L(
              "A te történeted, minden apró részletben. Alkosd meg, ami csak a tiéd.",
              "Your story, in every little detail. Create something entirely yours.",
            )}
          </p>
        </div>
        <button className="rb-save" onClick={save}>
          <Icon type="save" />
          {saved ? L("Elmentve", "Saved") : L("Terv mentése", "Save design")}
        </button>
      </header>
      <div className="rb-workspace">
        <section
          className={"rb-stage rb-light-" + s.light}
          aria-label={L("A gyűrű 3D előnézete", "3D ring preview")}
        >
          <div className="rb-stage-heading">
            <span>
              <i /> {L("ÉLŐ 3D ELŐNÉZET", "LIVE 3D PREVIEW")}
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
            B.
          </div>
          <div ref={host} className="rb-canvas" />
          {!ready && !error && (
            <div className="rb-loading">
              {L("A műhely megnyitása…", "Opening the atelier…")}
            </div>
          )}
          {error && (
            <div className="rb-fallback">
              <Icon size={40} />
              <h2>{L("A 3D nézet nem elérhető", "3D preview unavailable")}</h2>
              <p>
                {L(
                  "Kapcsold be a böngésző hardveres gyorsítását, majd töltsd újra az oldalt. A tervet továbbra is szerkesztheted és exportálhatod.",
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
              {s.style === "band"
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
                "Húzd a forgatáshoz · Görgess a nagyításhoz",
                "Drag to rotate · Scroll to zoom",
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
                {L("LÉPÉS", "STEP")} {step + 1} / 5
              </span>
              <h2>
                {
                  [
                    L(
                      "Mivel kezdődik a történeted?",
                      "Where does your story begin?",
                    ),
                    L(
                      "A ragyogás középpontja.",
                      "At the heart of the sparkle.",
                    ),
                    L("Találd meg a saját fényed.", "Find your kind of glow."),
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
                    L(
                      "Forma, arány és karakter — a gyémánt, ahogyan te szereted.",
                      "Shape, proportion and character. A diamond your way.",
                    ),
                    L(
                      "Meleg arany, finom rozé vagy hűvös platina.",
                      "Warm gold, soft rose or cool platinum.",
                    ),
                    L(
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
                {choices("style", true)}
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
            {step === 1 &&
              (s.style === "band" ? (
                <div className="rb-editorial">
                  <Icon />
                  <p>
                    {L(
                      "A karikagyűrűnek nincs központi köve. A Részletek lépésben pavé vagy sínbe foglalt gyémántsort adhatsz hozzá.",
                      "Wedding bands have no center stone. Add pavé or channel-set diamonds in Details.",
                    )}
                  </p>
                </div>
              ) : (
                <>
                  <h3>{L("Gyémántforma", "Diamond shape")}</h3>
                  {choices("shape", true)}
                  {slider(
                    "carat",
                    L("Karátsúly", "Carat weight"),
                    0.3,
                    5,
                    0.1,
                    "ct",
                  )}
                  <div className="rb-select-row">
                    {select("color", L("Szín", "Color"))}
                    {select("clarity", L("Tisztaság", "Clarity"))}
                  </div>
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
              </>
            )}
            {step === 3 && (
              <>
                {slider(
                  "width",
                  L("Sín szélessége", "Band width"),
                  1.6,
                  5,
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
                  {select("profile", L("Sín profilja", "Band profile"))}
                  {s.style !== "band" && (
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
                      </select>
                    </label>
                  )}
                </div>
                <h3>{L("Kísérő gyémántok", "Accent diamonds")}</h3>
                <div className="rb-choices">
                  {OPTIONS.accents
                    .filter((a) => s.style !== "band" || a !== "hidden")
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
              </>
            )}
            {step === 4 && (
              <>
                <dl className="rb-summary">
                  {[
                    ["style", L("Stílus", "Style")],
                    ...(s.style === "band"
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
                  ].map(([key, title]) => (
                    <div key={key}>
                      <dt>{title}</dt>
                      <dd>
                        {key === "shape"
                          ? `${label(s.shape)} · ${s.carat.toFixed(1)} ct · ${s.color} / ${s.clarity}`
                          : label(s[key])}
                      </dd>
                    </div>
                  ))}
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
                  <button onClick={exportDesign}>
                    {L("Specifikáció exportálása", "Export specification")} ↓
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
                {step === 4
                  ? L("Személyre szabott árajánlat", "A personal quote")
                  : L(
                      "Kézzel készül. Szívből.",
                      "Handcrafted. From the heart.",
                    )}
              </p>
            </div>
            <button
              className="rb-primary"
              disabled={step === 4 && (!ready || error || busy)}
              onClick={() => (step < 4 ? setStep(step + 1) : quote())}
            >
              {step === 4
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
                <Shape style={p.config.style} />
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
    </main>
  );
}
window.BrightalBuilder = { RingBuilder };
