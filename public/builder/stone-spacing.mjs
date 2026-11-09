import {outline} from './optics.mjs';
// Equal arc-length placement followed by a chord-clearance check. Angular
// increments crowd stones at the tip of pear/marquise outlines.
export function spacedOutline(shape,radius,minimumDistance,maxCount=56,preferredCount){
 const clear=points=>points.every((p,i)=>points.every((q,j)=>i===j||Math.hypot(p[0]-q[0],p[1]-q[1])>=minimumDistance-1e-8));
 if(preferredCount){const original=Array.from({length:preferredCount},(_,i)=>outline(shape,i/preferredCount*Math.PI*2).map(v=>v*radius));if(clear(original))return original;}
 const samples=Array.from({length:513},(_,i)=>outline(shape,i/512*Math.PI*2).map(v=>v*radius));
 const cumulative=[0];for(let i=1;i<samples.length;i++)cumulative.push(cumulative[i-1]+Math.hypot(samples[i][0]-samples[i-1][0],samples[i][1]-samples[i-1][1]));
 const length=cumulative.at(-1);
 for(let count=Math.min(maxCount,Math.floor(length/minimumDistance));count>=3;count--){
  const points=Array.from({length:count},(_,i)=>{const d=i*length/count;let j=1;while(cumulative[j]<d)j++;const f=(d-cumulative[j-1])/(cumulative[j]-cumulative[j-1]);return samples[j-1].map((v,k)=>v+f*(samples[j][k]-v));});
  if(clear(points))return points;
 }
 return [];
}
