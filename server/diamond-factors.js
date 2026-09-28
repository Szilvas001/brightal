'use strict';
// Commercial priors, NOT measured DIPEN premiums or a published market price list.
// Normalize every supplier observation by these factors before interpolation.
const VERSION='dipen-anchored-quality-v2';
const TABLES={
 shape:{round:11200,oval:10000,pear:9800,emerald:9700,radiant:10100,cushion:9700,princess:9500,marquise:10300,asscher:10200,heart:10600},
 color:{D:11200,E:10600,F:10000,G:9500,H:9000,I:8400,J:7800,K:7200,L:6700,M:6200},
 clarity:{FL:14000,IF:12800,VVS1:11800,VVS2:11000,VS1:10000,VS2:9300,SI1:8300,SI2:7300},
 cut:{Excellent:10000,'Very Good':9300,Good:8500,Fair:7300,Poor:6200,'Not graded':10000},
 polish:{Excellent:10000,'Very Good':9800,Good:9500,Fair:9000,Poor:8500,'Not graded':10000},
 symmetry:{Excellent:10000,'Very Good':9700,Good:9300,Fair:8700,Poor:8000,'Not graded':10000},
 fluorescence:{None:10000,Faint:9900,Medium:9700,Strong:9300,'Very Strong':8800}
};
const DEFAULTS={cut:'Excellent',polish:'Excellent',symmetry:'Excellent',fluorescence:'None'};
function quality(input){const result={};for(const [key,fallback]of Object.entries(DEFAULTS)){const v=input[key]??fallback;if(!Object.hasOwn(TABLES[key],v))throw Error('INVALID_COMBINATION');result[key]=v;}return result;}
function breakdown(c){return Object.fromEntries(Object.entries(TABLES).map(([k,t])=>[k,t[c[k]??DEFAULTS[k]]/10000]));}
function factor(c){return Object.values(breakdown(c)).reduce((a,b)=>a*b,1);}
module.exports={VERSION,TABLES,DEFAULTS,quality,breakdown,factor,caratExponent:1.15};
