import {COLLECTION} from './collection.mjs';
import {PRESETS as LEGACY,DEFAULT,normalize,OPTIONS} from './state.mjs';
export const PRESETS=[...COLLECTION.map(c=>({name:c.name,config:normalize({...DEFAULT,...c.config,style:c.style})})),...LEGACY.filter(p=>!COLLECTION.some(c=>c.style===p.config.style)),...OPTIONS.style.filter(style=>!COLLECTION.some(c=>c.style===style)&&!LEGACY.some(p=>p.config.style===style)).map(style=>({name:[style,style],config:normalize({...DEFAULT,style})}))];
