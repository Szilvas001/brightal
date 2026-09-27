import {COLLECTION} from './collection.mjs';
import {PRESETS as LEGACY,DEFAULT,normalize,OPTIONS} from './state.mjs';
import {MODEL_REVISION} from './contemporary.mjs';
export const PRESETS=[...COLLECTION.map(c=>({name:c.name,config:{...DEFAULT,...c.config,style:c.style}})),...LEGACY.filter(p=>!COLLECTION.some(c=>c.style===p.config.style)),...OPTIONS.style.filter(style=>!COLLECTION.some(c=>c.style===style)&&!LEGACY.some(p=>p.config.style===style)).map(style=>({name:[style,style],config:{...DEFAULT,style}}))].map(p=>({...p,config:normalize(p.config)}));
// One complete, normalized design drives each style tile, thumbnail and click.
export function stylePreset(style) {
  const preset=PRESETS.find(p=>p.config.style===style);
  if(!preset)throw new Error('Unknown ring style: '+style);
  return normalize(preset.config);
}
// Stable per-design URL prevents old index-based images surviving a catalogue
// reorder or a browser cache. Bump the render version when thumbnail shading changes.
export function thumbnailUrl(config) {
  let hash=2166136261;
  for(const ch of JSON.stringify(['thumbnail-3',MODEL_REVISION,normalize(config)]))hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
  return `/builder/thumbnails/${config.style}-${hash.toString(16)}.webp`;
}
