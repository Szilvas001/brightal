import * as T from 'three';
import {MIN_PRONG_DIAMETER_MM,SCENE_SCALE} from './manufacturing-policy.mjs';
// Closed variable-radius sweep. The rounded tip is part of this mesh, not a
// separate sphere or a chain of cylinder/sphere primitives.
export function sweepProng(curve,radiusAt,{segments=80,sides=24}={}){
 const frames=curve.computeFrenetFrames(segments,false),vertices=[],indices=[],centers=[],radii=[];
 const addRing=(center,normal,binormal,r)=>{for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2;const p=center.clone().addScaledVector(normal,r*Math.cos(a)).addScaledVector(binormal,r*Math.sin(a));vertices.push(...p.toArray());}};
 for(let i=0;i<=segments;i++){const t=i/segments,center=curve.getPointAt(t),r=radiusAt(t);centers.push(center.toArray());radii.push(r);addRing(center,frames.normals[i],frames.binormals[i],r);}
 const tip=curve.getPointAt(1),tipRadius=radiusAt(1),normal=frames.normals[segments],binormal=frames.binormals[segments],tangent=frames.tangents[segments];
 for(let i=1;i<8;i++){const a=i/8*Math.PI/2;addRing(tip.clone().addScaledVector(tangent,tipRadius*Math.sin(a)),normal,binormal,tipRadius*Math.cos(a));}
 const rings=segments+8;
 for(let i=0;i<rings-1;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides,c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;indices.push(a,b,c,b,d,c);}
 const startIndex=vertices.length/3;vertices.push(...curve.getPointAt(0).toArray());
 const tipIndex=vertices.length/3;vertices.push(...tip.clone().addScaledVector(tangent,tipRadius).toArray());
 for(let j=0;j<sides;j++){indices.push(startIndex,(j+1)%sides,j);const a=(rings-1)*sides+j,b=(rings-1)*sides+(j+1)%sides;indices.push(a,b,tipIndex);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 // Topology winding follows the chosen Frenet frame; normalize orientation.
 let volume=0;const p=geometry.attributes.position;for(let i=0;i<indices.length;i+=3){const a=new T.Vector3().fromBufferAttribute(p,indices[i]),b=new T.Vector3().fromBufferAttribute(p,indices[i+1]),c=new T.Vector3().fromBufferAttribute(p,indices[i+2]);volume+=a.dot(b.cross(c))/6;}
 if(volume<0){for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];geometry.setIndex(indices);geometry.computeVertexNormals();}
 geometry.userData.sweep={segments,sides,centers,radii};return geometry;
}
class LipArc extends T.Curve{
 constructor(phi,radius,y,r,angle){super();Object.assign(this,{phi,radius,y,r,angle});}
 getPoint(t,target=new T.Vector3()){const a=t*this.angle,radial=this.radius-this.r*(1-Math.cos(a));return target.set(radial*Math.cos(this.phi),this.y+this.r*Math.sin(a),radial*Math.sin(this.phi));}
}
const smooth=t=>t*t*(3-2*t);
const radiusProfile=(t,join,root,girdle,tip)=>t<=join?T.MathUtils.lerp(root,girdle,smooth(t/join)):T.MathUtils.lerp(girdle,tip,smooth((t-join)/(1-join)));
function curveCheck(curve,radiusAt,planes,scale){
 const points=Array.from({length:161},(_,i)=>curve.getPointAt(i/160));let clearance=Infinity,bendRatio=Infinity;
 for(let i=0;i<points.length;i++){
  const p=points[i],r=radiusAt(i/160);clearance=Math.min(clearance,Math.max(...planes.map(n=>n.x*p.x+n.y*p.y+n.z*p.z-n.w*scale))-r);
  if(i&&i<points.length-1){const a=points[i-1].distanceTo(p),b=p.distanceTo(points[i+1]),c=points[i-1].distanceTo(points[i+1]),cross=points[i-1].clone().sub(p).cross(points[i+1].clone().sub(p)).length();if(cross>1e-9)bendRatio=Math.min(bendRatio,a*b*c/(2*cross)/(2*r));}
 }
 return {clearanceMm:clearance,minimumBendRadiusOverDiameter:bendRatio};
}
// Dimensions and curves are solved in millimetres, transformed to scene scale
// only once. No gemstone subtraction is used to repair a prong.
export function solveTaperedProng({phi,planes,scaleMm,root,widthMm}){
 const c=Math.cos(phi),s=Math.sin(phi),girdle=Math.min(...planes.filter(n=>n.x*c+n.z*s>1e-8).map(n=>n.w*scaleMm/(n.x*c+n.z*s)));
 const tipDiameter=Math.max(MIN_PRONG_DIAMETER_MM,.8),rootDiameter=Math.min(1.4,widthMm*.85);
 if(rootDiameter<=tipDiameter+.05)throw new Error('PRONG_ROOT_CANNOT_FIT_BAND');
 const rootR=rootDiameter/2,girdleR=Math.min(.5,(rootR+tipDiameter/2)/2),tipR=tipDiameter/2;
 let best;
 for(const margin of [.15,.25,.4])for(const degrees of [70,60,50])for(const inset of [.08,.15]){
  const radial=girdle+girdleR+margin,tipRadial=Math.max(.1,girdle-inset),angle=degrees*Math.PI/180,arcRadius=(radial-tipRadial)/(1-Math.cos(angle));
  const tipY=Math.min(...planes.filter(n=>n.y>1e-8).map(n=>(n.w*scaleMm+tipR+.012-(n.x*c+n.z*s)*tipRadial)/n.y));
  const y=tipY-arcRadius*Math.sin(angle),end=new T.Vector3(radial*c,y,radial*s),rise=y-root.y;if(rise<=.1)continue;
  for(const along of [.3,.45,.6])for(const up of [.3,.45])for(const down of [.45,.6,.75]){
   const p1=root.clone().lerp(end,along);p1.y=root.y+rise*up;const p2=end.clone();p2.y-=rise*down;
   const curve=new T.CurvePath();curve.add(new T.CubicBezierCurve3(root.clone(),p1,p2,end));curve.add(new LipArc(phi,radial,y,arcRadius,angle));curve.arcLengthDivisions=600;
   const join=curve.curves[0].getLength()/curve.getLength(),radiusAt=t=>radiusProfile(t,join,rootR,girdleR,tipR),quality=curveCheck(curve,radiusAt,planes,scaleMm);
   const score=Math.min(quality.clearanceMm/.01,quality.minimumBendRadiusOverDiameter-1);
   if(!best||score>best.score)best={curve,radiusAt,quality,score};
   if(quality.clearanceMm>=-.0001&&quality.minimumBendRadiusOverDiameter>=1.01)return best;
  }
 }
 const error=new Error('NO_CLEAR_SMOOTH_PRONG_PATH');error.diagnostics=best?.quality;throw error;
}
export function buildTaperedProng(options,material){const solution=solveTaperedProng(options),geometry=sweepProng(solution.curve,solution.radiusAt);geometry.scale(SCENE_SCALE,SCENE_SCALE,SCENE_SCALE);const mesh=new T.Mesh(geometry,material);mesh.userData={role:'prong',construction:'tapered-sweep',quality:solution.quality};return mesh;}

export function buildTaperedHead({shape,scale,root,widthMm,prongs,doubleClaw,material,planes,galleryRequired=false}){
 const group=new T.Group(),arms=[],solutions=[];const scaleMm=scale/SCENE_SCALE,rootMm=root.clone().divideScalar(SCENE_SCALE);
 const rootDiameter=Math.min(1.4,widthMm*.85),halfX=Math.min(scaleMm*.6,rootDiameter*.7),halfZ=widthMm*.48;
 const baseGeometry=new T.CylinderGeometry(1,1,.85,64,4);baseGeometry.scale(halfX,1,halfZ);baseGeometry.translate(rootMm.x,rootMm.y+.18,rootMm.z);baseGeometry.scale(SCENE_SCALE,SCENE_SCALE,SCENE_SCALE);
 const base=new T.Mesh(baseGeometry,material);base.userData.role='head-root';group.add(base);
 for(let i=0;i<prongs;i++){
  const phi=2*Math.PI*(i+.5)/prongs;
  const spacing=doubleClaw?Math.min(Math.PI/prongs*.38,.45/scaleMm):0;
  for(const delta of doubleClaw?[-spacing,spacing]:[0]){
   const solution=solveTaperedProng({phi:phi+delta,planes,scaleMm,root:rootMm,widthMm});const geometry=sweepProng(solution.curve,solution.radiusAt);geometry.scale(SCENE_SCALE,SCENE_SCALE,SCENE_SCALE);
   const arm=new T.Mesh(geometry,material);arm.userData={role:'prong',construction:'tapered-sweep',quality:solution.quality};group.add(arm);arms.push(arm);solutions.push({...solution,phi:phi+delta});
  }
 }
 let gallery=null;
 if(galleryRequired){
  const y=-scaleMm*.35,anchors=solutions.map(s=>{let lo=0,hi=1;for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(s.curve.getPointAt(mid).y<y)lo=mid;else hi=mid;}const p=s.curve.getPointAt((lo+hi)/2);return {angle:(Math.atan2(p.z,p.x)+Math.PI*2)%(Math.PI*2),r:Math.hypot(p.x,p.z)};}).sort((a,b)=>a.angle-b.angle);
  const stoneRadius=a=>Math.min(...planes.filter(p=>p.x*Math.cos(a)+p.z*Math.sin(a)>1e-8).map(p=>(p.w*scaleMm-p.y*y)/(p.x*Math.cos(a)+p.z*Math.sin(a))));
  const points=Array.from({length:128},(_,i)=>{const a=i/128*Math.PI*2;let right=anchors.findIndex(p=>p.angle>=a);if(right<0)right=0;const left=(right+anchors.length-1)%anchors.length,l=anchors[left],r=anchors[right];let span=(r.angle-l.angle+Math.PI*2)%(Math.PI*2);if(span<1e-8)span=Math.PI*2;const t=((a-l.angle+Math.PI*2)%(Math.PI*2))/span;const radius=stoneRadius(a)*T.MathUtils.lerp(l.r/stoneRadius(l.angle),r.r/stoneRadius(r.angle),t);return new T.Vector3(radius*Math.cos(a),y,radius*Math.sin(a)).multiplyScalar(SCENE_SCALE);});
  const path=new T.CatmullRomCurve3(points,true,'centripetal');gallery=new T.Mesh(new T.TubeGeometry(path,256,.3*SCENE_SCALE,16,true),material);gallery.userData.role='gallery';group.add(gallery);
 }
 const attachment=a=>{if(!gallery)return root.toArray();const path=gallery.geometry.parameters.path;let best,distance=Infinity;for(let i=0;i<512;i++){const p=path.getPoint(i/512),delta=Math.abs(Math.atan2(Math.sin(Math.atan2(p.z,p.x)-a),Math.cos(Math.atan2(p.z,p.x)-a)));if(delta<distance){distance=delta;best=p;}}return best.toArray();};
 return {group,base,arms,gallery,attachment,solutions};
}
