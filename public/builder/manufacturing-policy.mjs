// Project-specific lower limits from server/cad.js. These are construction
// limits, not a substitute for measuring the final cut metal or workshop review.
export const MIN_ROD_DIAMETER_MM=.6;
export const MIN_PRONG_DIAMETER_MM=.7;
export const SCENE_SCALE=.8;
export const ROD_SEGMENTS=12;
// A polygonal cylinder's narrowest cross-section is its inscribed diameter.
export const rodRadius=diameterMm=>diameterMm*SCENE_SCALE/(2*Math.cos(Math.PI/ROD_SEGMENTS));
export const MIN_ROD_RADIUS=rodRadius(MIN_ROD_DIAMETER_MM);
export const MIN_PRONG_RADIUS=rodRadius(MIN_PRONG_DIAMETER_MM);
