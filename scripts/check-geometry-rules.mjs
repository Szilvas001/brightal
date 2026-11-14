// Full traversal for rules A–F (see public/builder/geometry-rules.mjs).
//   node scripts/check-geometry-rules.mjs [--shard=I/N] [--quick] [--style=a,b] [--resume]
//        [--cross (defaults and style × setting × cut only)] [--builder=public/builder] [--out=file.jsonl] [--only-failed=previous.jsonl]
// Every style × setting × cut, every option value, and every numeric parameter
// at its minimum, middle and maximum. Exit code 1 when any rule is violated.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const arg = name => (process.argv.find(a => a.startsWith(`--${name}=`)) || '').split('=').slice(1).join('=') || undefined;
const builder = pathToFileURL(path.resolve(arg('builder') || 'public/builder') + '/').href;
const {initKernel} = await import(builder + 'kernel.mjs');
const {inspectDesign} = await import(builder + 'geometry-rules.mjs');
const {stylePreset} = await import(builder + 'catalog.mjs');
const {normalize, OPTIONS, isModern, DAILY_STYLES, FASHION_STYLES} = await import(builder + 'state.mjs');

// [key, min, max] straight from state.mjs normalize(); middle = rounded mean.
export const RANGES = {
  carat: [.3, 5], width: [1.6, 10], size: [44, 72], sideCarat: [.1, 1.5], sideMainGap: [0, 1], sideSpacing: [0, .8],
  accentSize: [.6, 2], haloSize: [.6, 1.6], height: [.5, 2.5], sculpt: [.4, 2.5], rhythm: [2, 8], layers: [2, 4], gap: [.3, 1.5],
  faceSize: [5, 11], dailyCount: [1, 9], dailySpacing: [0, .5], stoneLength: [1.5, 6], stoneWidth: [1.5, 5], stoneDepth: [1, 3.5],
  thickness: [1.4, 3.4], bezelWall: [.35, .7], motifDepth: [0, 1.2], motifOffset: [-1, 1], edgeSoftness: [.35, 1.2],
};
const three = key => { const [min, max] = RANGES[key]; return [min, Number(((min + max) / 2).toFixed(2)), max]; };
const CLASSIC_NUMERIC = ['carat', 'width', 'size', 'height', 'thickness'];
const MODERN_NUMERIC = ['width', 'size', 'thickness', 'stoneLength', 'stoneWidth', 'stoneDepth', 'bezelWall', 'dailyCount', 'dailySpacing',
  'sculpt', 'rhythm', 'layers', 'gap', 'faceSize', 'motifDepth', 'motifOffset', 'edgeSoftness'];

export function matrix(styles = OPTIONS.style, quick = false, cross = false) {
  const cases = new Map();
  const push = (style, patch, label) => {
    const config = normalize({...stylePreset(style), ...patch}), key = JSON.stringify(config);
    if (!cases.has(key)) cases.set(key, {style, label, config});
  };
  for (const style of styles) {
    const base = stylePreset(style), modern = isModern(base);
    push(style, {}, 'default');
    if (quick) continue;
    // style × setting × cut
    for (const setting of modern ? [base.setting] : OPTIONS.setting) for (const shape of OPTIONS.shape) push(style, {setting, shape}, `setting=${setting} shape=${shape}`);
    if (cross) continue;
    if (modern) {
      for (const key of MODERN_NUMERIC) for (const value of three(key)) push(style, {[key]: value}, `${key}=${value}`);
      for (const orientation of OPTIONS.orientation) push(style, {orientation}, `orientation=${orientation}`);
      for (const sideShape of OPTIONS.sideShape) push(style, {sideShape}, `sideShape=${sideShape}`);
      for (const face of OPTIONS.face) push(style, {face}, `face=${face}`);
      push(style, {size: 44, width: 1.6, thickness: 1.4, bezelWall: .35, stoneWidth: 5, stoneLength: 6, stoneDepth: 3.5, dailyCount: 9, sculpt: 2.5}, 'all-extreme');
      continue;
    }
    for (const key of CLASSIC_NUMERIC) for (const value of three(key)) push(style, {[key]: value}, `${key}=${value}`);
    for (const setting of ['claw', 'doubleclaw']) for (const prongs of [4, 6, 8]) for (const carat of [.3, 1.5, 5]) push(style, {setting, prongs, carat}, `setting=${setting} prongs=${prongs} carat=${carat}`);
    for (const profile of OPTIONS.profile) push(style, {profile}, `profile=${profile}`);
    for (const orientation of OPTIONS.orientation) for (const shape of ['oval', 'pear', 'marquise']) push(style, {orientation, shape}, `orientation=${orientation} shape=${shape}`);
    for (const hiddenHalo of [false, true]) for (const setting of OPTIONS.setting) push(style, {hiddenHalo, setting}, `hiddenHalo=${hiddenHalo} setting=${setting}`);
    for (const halo of OPTIONS.halo) for (const haloSize of three('haloSize')) push(style, {halo, haloSize}, `halo=${halo} haloSize=${haloSize}`);
    for (const sideMode of OPTIONS.sideMode) {
      push(style, {sideMode}, `sideMode=${sideMode}`);
      if (sideMode === 'none') continue;
      for (const sideCarat of three('sideCarat')) push(style, {sideMode, sideCarat}, `sideMode=${sideMode} sideCarat=${sideCarat}`);
      for (const sideMainGap of three('sideMainGap')) push(style, {sideMode, sideMainGap}, `sideMode=${sideMode} sideMainGap=${sideMainGap}`);
      for (const sideSpacing of three('sideSpacing')) push(style, {sideMode, sideSpacing}, `sideMode=${sideMode} sideSpacing=${sideSpacing}`);
      for (const setting of OPTIONS.setting) push(style, {sideMode, setting}, `sideMode=${sideMode} setting=${setting}`);
    }
    for (const sideShape of OPTIONS.sideShape) push(style, {sideMode: 'pair', sideShape}, `sideMode=pair sideShape=${sideShape}`);
    for (const accents of ['pave', 'channel']) {
      for (const accentRows of [1, 2]) for (const coverage of OPTIONS.coverage) push(style, {accents, accentRows, coverage}, `accents=${accents} rows=${accentRows} coverage=${coverage}`);
      for (const accentSize of three('accentSize')) for (const accentRows of [1, 2]) push(style, {accents, accentSize, accentRows}, `accents=${accents} accentSize=${accentSize} rows=${accentRows}`);
      for (const width of three('width')) push(style, {accents, width}, `accents=${accents} width=${width}`);
      for (const sideSpacing of three('sideSpacing')) push(style, {accents, sideSpacing}, `accents=${accents} sideSpacing=${sideSpacing}`);
      for (const sideMainGap of three('sideMainGap')) push(style, {accents, sideMainGap}, `accents=${accents} sideMainGap=${sideMainGap}`);
      for (const sideMode of ['pair', 'cluster', 'five']) push(style, {accents, sideMode}, `accents=${accents} sideMode=${sideMode}`);
    }
    // Everything at once, small and large (the previous audit's stress cases).
    for (const size of [44, 72]) for (const large of [false, true]) for (const accents of OPTIONS.accents) for (const sideMode of ['cluster', 'five'])
      push(style, {size, width: large ? 5 : 1.6, carat: large ? 5 : .3, sideCarat: large ? 1.5 : .1, accents, hiddenHalo: true, sideMode, halo: 'double'},
        `stress size=${size} ${large ? 'large' : 'small'} accents=${accents} sideMode=${sideMode}`);
  }
  return [...cases.values()];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await initKernel();
  const [shard, shards] = (arg('shard') || '0/1').split('/').map(Number);
  const styles = arg('style') ? arg('style').split(',') : OPTIONS.style;
  let cases = matrix(styles, process.argv.includes('--quick'), process.argv.includes('--cross'));
  if (arg('only-failed')) {
    const failed = new Set(fs.readFileSync(arg('only-failed'), 'utf8').trim().split('\n').map(l => JSON.parse(l)).filter(r => r.violations.length).map(r => JSON.stringify(r.config)));
    cases = cases.filter(c => failed.has(JSON.stringify(c.config)));
  }
  cases = cases.filter((_, i) => i % shards === shard);
  const out = arg('out'), resume = process.argv.includes('--resume') && out && fs.existsSync(out);
  // --resume keeps the results already in --out and inspects only the rest.
  const done = new Map(resume ? fs.readFileSync(out, 'utf8').split('\n').filter(Boolean).map(l => { const r = JSON.parse(l); return [JSON.stringify(r.config), r]; }) : []);
  if (out && !resume) fs.writeFileSync(out, '');
  let failures = 0; const started = Date.now();
  for (const [i, c] of cases.entries()) {
    const earlier = done.get(JSON.stringify(c.config));
    if (earlier) { if (earlier.violations.length) failures++; continue; }
    const result = inspectDesign(c.config, {exportCheck: c.label === 'default' || process.argv.includes('--export')});
    if (!result.valid) { failures++; console.log(`FAIL ${c.style} [${c.label}] ${result.violations.map(v => `${v.rule}:${v.code}×${v.count}`).join(' ')}`); }
    if (out) fs.appendFileSync(out, JSON.stringify({style: c.style, label: c.label, config: c.config, violations: result.violations, metrics: result.metrics}) + '\n');
    globalThis.gc?.();
    if ((i + 1) % 25 === 0) console.log(`PROGRESS ${i + 1}/${cases.length} failures=${failures} ${Math.round((Date.now() - started) / 1000)}s`);
  }
  console.log(`TOTAL ${cases.length} FAILURES ${failures}`);
  process.exitCode = failures ? 1 : 0;
}
