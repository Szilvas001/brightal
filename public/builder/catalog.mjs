import {COLLECTION} from './collection.mjs';
import {PRESETS as LEGACY,DEFAULT,normalize,OPTIONS} from './state.mjs';
export const PRESETS=[...COLLECTION.map(c=>({name:c.name,config:normalize({...DEFAULT,...c.config,style:c.style})})),...LEGACY.filter(p=>!COLLECTION.some(c=>c.style===p.config.style)),...OPTIONS.style.filter(style=>!COLLECTION.some(c=>c.style===style)&&!LEGACY.some(p=>p.config.style===style)).map(style=>({name:[style,style],config:normalize({...DEFAULT,style})}))];
// One complete, normalized design drives each style tile, thumbnail and click.
export function stylePreset(style) {
  const preset=PRESETS.find(p=>p.config.style===style);
  if(!preset)throw new Error('Unknown ring style: '+style);
  return normalize(preset.config);
}
