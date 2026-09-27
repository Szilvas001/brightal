import {buildRing} from './model.mjs';
import {unifyLegacy} from './solidify.mjs';
// The detailed browser model and its catalogue thumbnail share the entire
// construction pipeline, including legacy solid unions and stone cavities.
export const buildFinishedRing = config => unifyLegacy(buildRing(config,null));
