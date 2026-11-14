import * as T from 'three';
import {outline} from './optics.mjs';
import {MIN_ROD_RADIUS} from './manufacturing-policy.mjs';
// Choose one candidate for a whole mounting, never an independent first fit
// per leg. Four diagonal anchors avoid an ambiguous sign at the mirror plane.
// Reflected members share the gallery offset, foot offset and lateral lift.
export function supportLayout({assembly,shape,scale,width,radius,split,bandShift,cathedral,pathClear}) {
 const w=width*(split?.55:1),r=Math.max(MIN_ROD_RADIUS,Math.min(.22,Math.max(.10,scale*.075)));
 let routes=[];
 for(const offset of [0,.12,-.12,.25,-.25])for(const footOffset of [0,.06,-.06,.12,-.12])for(const flankDirection of [1,-1])for(const lift of [0,.4,.8,1.2]){
  routes=[];
  for(const [sx,sz]of [[1,1],[-1,1],[-1,-1],[1,-1]]){
   const a=Math.atan2(sz*Math.sin(Math.PI/4+offset),sx*Math.cos(Math.PI/4+offset));
   const [x,z]=outline(shape,a),outward=new T.Vector3(x,0,z).normalize().multiplyScalar(.08);
   const end=assembly.localToWorld(new T.Vector3(x*scale*.72,-scale*.58-.13,z*scale*.72).add(outward));
   const angle=Math.atan2(end.x,end.y),footAngle=angle+(Math.abs(end.x)<1e-8?sx:Math.sign(end.x))*footOffset;
   const splitSign=Math.abs(end.z)<1e-8?sz:Math.sign(end.z),flank=splitSign*flankDirection;
   const track=split?splitSign*(width*.65+.55)*Math.pow(Math.max(0,Math.cos(footAngle)),2):bandShift(footAngle);
   const start=new T.Vector3(Math.sin(footAngle)*radius,Math.cos(footAngle)*radius,track+flank*w*.35);
   const mid=start.clone().lerp(end,.5);mid.z=flank*(Math.max(Math.abs(start.z),Math.abs(end.z))+.12+lift);if(cathedral)mid.y+=.3;
   const points=[start,mid,end];routes.push({start,end,points,splitSign,r,clear:pathClear(points,r)});
  }
  if(routes.every(route=>route.clear))return routes;
 }
 // Preserve and flag an unsolved assembly. Never silently delete a member.
 return routes;
}
