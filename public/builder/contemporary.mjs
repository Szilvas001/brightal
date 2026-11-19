import * as T from 'three';
import { getKernel } from './kernel.mjs';
import { creasedNormals } from './shading.mjs';
import { gemGeometry, gemstoneMaterial, gemFootprint } from './optics.mjs';
import { FASHION_STYLES, ATELIER_STYLES, stoneDimensions, longestStone } from './state.mjs';

// A faceted girdle is a polygon. Where it stands for a curve (round, oval,
// the bow of a pear), the collar and its opening follow that curve instead of
// repeating the facets as flats in the metal: a spline through the girdle's
// corners, which stays just outside the stone. Real corners and straight
// sides (emerald, princess, the point of a pear) are kept as they are.
export function smoothFootprint(points,steps=6){
  const n=points.length; if(n<8) return points;
  const turn=points.map((p,i)=>{const a=points[(i+n-1)%n],b=points[(i+1)%n];
    const u=[p[0]-a[0],p[1]-a[1]],v=[b[0]-p[0],b[1]-p[1]];
    return Math.abs(Math.atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1]));});
  const limit=Math.PI/5,out=[];
  for(let i=0;i<n;i++){
    const p0=points[(i+n-1)%n],p1=points[i],p2=points[(i+1)%n],p3=points[(i+2)%n];
    out.push(p1);
    // Both ends must be gentle bends, and the side itself part of a curve.
    if(turn[i]>limit||turn[(i+1)%n]>limit||turn[i]<1e-3||turn[(i+1)%n]<1e-3) continue;
    for(let k=1;k<steps;k++){const t=k/steps,t2=t*t,t3=t2*t;
      out.push([0,1].map(j=>.5*(2*p1[j]+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3)));}
  }
  // The curve keeps the girdle's own length and width: everything else in the
  // design (band width, stone spacing) is laid out for those.
  const span=(list,j)=>Math.max(...list.map(p=>Math.abs(p[j])));
  const kx=Math.min(1,span(points,0)/span(out,0)),kz=Math.min(1,span(points,1)/span(out,1));
  return out.map(p=>[p[0]*kx,p[1]*kz]);
}

export const MODERN_STYLES = ['bezelrow','scatter','chevron','ribbon','graduated','eastwest','alternating','crown','wave','rope','dome','signet','open','stack','band','eternity','curvedoval','wavebezel','openpair','contour','asymmetric','fullcircle'];
export const SCALE = .8;
MODERN_STYLES.push(...FASHION_STYLES.filter(s=>!MODERN_STYLES.includes(s)));
export const MODEL_REVISION = 'geometry-rules-19';
const single = s => ['band','eastwest','curvedoval','wavebezel'].includes(s.style) || FASHION_STYLES.includes(s.style);
export function modernLayout(s) {
  const inner = s.size / (2*Math.PI);
  let count = single(s) ? 1 : Math.max(1,s.dailyCount);
  const east = s.style === 'eastwest' || s.orientation === 'east';
  const maxDimension = Math.max(longestStone(s),s.stoneWidth);
  const spacing = maxDimension + 2*s.bezelWall + s.dailySpacing + .35;
  const thickness = Math.max(s.thickness, count ? s.stoneDepth*.72 + .8 : 0);
  const width = Math.max(s.width, count ? (east?s.stoneWidth:longestStone(s)) + 2*s.bezelWall + .6 : 0,
    s.style==='stack'?s.layers*1.25+(s.layers-1)*s.gap:0);
  const top = a => Math.pow(Math.max(0,Math.cos(a)),4);
  const atelier=ATELIER_STYLES.includes(s.style),phase=s.motifOffset*Math.PI;
  const profileExponent=atelier?s.edgeSoftness:.55;
  const relief=(a,b)=>{
    if(!atelier)return 0;
    const outer=Math.max(0,Math.cos(b))*Math.sin(b)**2;
    const rhythm=s.rhythm;
    const pattern=s.style==='braid'?Math.sin(a*rhythm+b*3+phase)**2:
      s.style==='lotus'?Math.cos(a*rhythm+phase)**2:
      s.style==='orbit'?Math.cos(b*rhythm/2+phase)**2:
      s.style==='shield'?Math.cos(a*rhythm+Math.abs(b)*2+phase)**2:
      Math.sin(a*rhythm+b+phase)**2;
    return outer*s.motifDepth*pattern;
  };
  const rise = a => {
    if(s.style==='aurora')return top(a)*s.sculpt*(.55+.25*Math.sin(a*2+phase));
    if(s.style==='orbit')return s.sculpt*.2*Math.cos(a*2+phase)**2;
    if(s.style==='lotus')return top(a)*s.sculpt*.45*(1+Math.cos(a*2+phase)**2);
    if(s.style==='shield')return Math.max(0,Math.cos(a))**2*s.sculpt;
    if(s.style==='braid')return s.sculpt*.2*(1+Math.sin(a*s.rhythm+phase));
    if(s.style==='fluted') return s.sculpt*.3*(1+Math.cos(a*s.rhythm*2));
    if(s.style==='ripple') return s.sculpt*.35*(1+Math.cos(a*s.rhythm));
    if(s.style==='saddle') return s.sculpt*.5*Math.sin(a)**2;
    if(s.style==='tapered') return s.sculpt*.8*top(a);
    if(['dome','signet','rope','curvedoval','asymmetric'].includes(s.style)) return top(a)*s.sculpt*.55;
    return 0;
  };
  const shift = a => {
    if(s.style==='aurora')return Math.sin(a+phase)*s.sculpt*.75;
    if(s.style==='orbit')return Math.sin(a*2+phase)*s.sculpt*.2;
    if(s.style==='lotus')return top(a)*s.motifOffset*s.sculpt*.4;
    if(s.style==='shield')return top(a)*s.motifOffset*s.sculpt*.3;
    if(s.style==='braid')return Math.sin(a*s.rhythm+phase)*s.sculpt*.18;
    if(s.style==='twist') return Math.sin(a*s.rhythm)*s.sculpt*.3;
    if(s.style==='saddle') return Math.cos(a*2)*s.sculpt*.5;
    if(s.style==='ripple') return Math.sin(a*s.rhythm)*s.sculpt*.2;
    if(['chevron','crown','contour'].includes(s.style)) return top(a)*s.sculpt*(s.style==='crown'?-1:1);
    if(['wave','ribbon','curvedoval','wavebezel','asymmetric'].includes(s.style)) return Math.sin(a*2)*s.sculpt*.5;
    return 0;
  };
  const widthAt = a => {
    if(s.style==='signet') return width*(1-top(a))+s.faceSize*top(a);
    if(s.style==='aurora')return width*(.65+.35*top(a))*(1+.12*Math.sin(a+phase));
    if(s.style==='orbit')return width*(.85+.15*Math.cos(a*2+phase));
    if(s.style==='lotus')return width*(.65+.35*top(a))*(1+.16*top(a)*Math.cos(a*s.rhythm+phase));
    if(s.style==='shield')return width*(.35+.65*Math.max(0,Math.cos(a))**.5);
    if(s.style==='braid')return width*(.85+.15*Math.sin(a*s.rhythm+phase));
    if(s.style==='petal') return width*(.8+.2*Math.cos(a*s.rhythm))*(1+top(a)*s.sculpt*.15);
    if(s.style==='tapered') return width*(.4+.6*top(a));
    if(s.style==='twist') return width*(.8+.2*Math.cos(a*s.rhythm));
    return width * (.72+.28*top(a));
  };
  const thicknessAt = a => thickness + rise(a) + (s.style==='rope' ? .24*(1+Math.cos(a*s.rhythm*3)) : 0);
  const radius = inner+thickness;
  let angularStep = 2*Math.asin(Math.min(.7, spacing/(2*radius)));
  if(s.style==='fullcircle'){count=Math.max(3,Math.floor(2*Math.PI/angularStep));angularStep=2*Math.PI/count;}
  const stones = [];
  for(let i=0;i<count;i++) {
    const angle=(i-(count-1)/2)*(s.style==='openpair'?angularStep+s.gap/radius:angularStep)+(s.style==='asymmetric'?.3:0);
    const factor=['graduated','asymmetric'].includes(s.style)?1-.3*Math.abs(i-(count-1)/2)/Math.max(1,(count-1)/2):1;
    // Every alternation along the row (shape, edge, colour) is mirrored about
    // the centre: with an even count the two middle stones are alike (an
    // alternation by index would turn the row instead of mirroring it). A
    // pair of two is the exception for colour only: one stone of each tone.
    const odd=count%2===0?Math.floor(Math.abs(i-(count-1)/2))%2:i%2;
    const shape=s.style==='alternating'&&odd?s.sideShape:s.shape;
    const side=s.style==='scatter'?(odd?1:-1):(i%2?1:-1);
    const z=shift(angle)+(['scatter','asymmetric'].includes(s.style)?side*Math.max(0,(widthAt(angle)-s.stoneLength-2*s.bezelWall)/2)*.6:0);
    const surface=inner+thicknessAt(angle);
    stones.push({ id:`S${i+1}`, shape, length:stoneDimensions(s,shape).length*factor,width:s.stoneWidth*factor,depth:s.stoneDepth*factor,
      angle,rotation:east?Math.PI/2:s.style==='crown'?angle*.25:0,z,
      girdleRadius:surface+.1, tone:s.alternateGems&&(count===2?i%2:odd)?s.sideTone:s.gemTone });
  }
  // A tapering band must still carry every bezel completely: wherever a stone
  // sits, the band is at least as wide as that stone's collar (rule C: no
  // stone or bezel overhangs the band). The widening fades out smoothly.
  for(const stone of stones){
    const turn=Math.abs(Math.sin(stone.rotation)),along=Math.abs(Math.cos(stone.rotation));
    stone.halfZ=(stone.length*along+stone.width*turn)/2+s.bezelWall;
    stone.halfT=(stone.length*turn+stone.width*along)/2+s.bezelWall;
  }
  const carriedWidthAt=a=>{
    let w=widthAt(a);
    for(const stone of stones){
      const need=2*(Math.abs(stone.z-shift(stone.angle))+stone.halfZ)+.06;
      const d=Math.abs(Math.atan2(Math.sin(a-stone.angle),Math.cos(a-stone.angle))),flat=stone.halfT/radius+.03,ramp=.35;
      const weight=d<=flat?1:d>=flat+ramp?0:.5+.5*Math.cos(Math.PI*(d-flat)/ramp);
      if(weight>0)w=Math.max(w,widthAt(a)+(need-widthAt(stone.angle))*weight);
    }
    return w;
  };
  return {inner,width:s.style==='signet'?Math.max(width,s.faceSize):width,thickness,widthAt:carriedWidthAt,thicknessAt,shift,stones,profileExponent,relief};
}

// Exact shared millimetre geometry: the browser and the workshop exporter use
// this same solid, including the Boolean-cut stone seats and access bores.
export function buildContemporary(s, environment, colors) {
  const {Manifold, Mesh, CrossSection}=getKernel(), owned=[];
  const own=x=>(owned.push(x),x);
  const layout=modernLayout(s), {inner,width,thicknessAt,widthAt,shift,stones}=layout;
  const group=new T.Group(), gems=[];
  const material=new T.MeshPhysicalMaterial({color:colors[s.metal],metalness:1,roughness:s.finish==='polished'?.13:s.finish==='satin'?.3:.4});
  let report;
  try {
    const makeBand=(offset=0, widthFactor=1) => {
      const positions=[],indices=[],n=ATELIER_STYLES.includes(s.style)?384:256,m=ATELIER_STYLES.includes(s.style)?96:48; // sculpted relief needs a finer skin
      for(let i=0;i<n;i++) {
        const a=2*Math.PI*i/n, width=widthAt(a)*widthFactor;
        for(let j=0;j<m;j++) {
          const b=2*Math.PI*j/m, co=Math.cos(b),si=Math.sin(b);
          const r=inner+thicknessAt(a)*(.5+.5*Math.sign(co)*Math.pow(Math.abs(co),layout.profileExponent))+layout.relief(a,b);
          const z=shift(a)+offset+width*.5*Math.sign(si)*Math.pow(Math.abs(si),layout.profileExponent);
          positions.push(Math.sin(a)*r,Math.cos(a)*r,z);
          const k=i*m+j, next=((i+1)%n)*m+j, q=i*m+(j+1)%m, nextQ=((i+1)%n)*m+(j+1)%m;
          indices.push(k,q,next,q,nextQ,next);
        }
      }
      return own(new Manifold(new Mesh({numProp:3,vertProperties:new Float32Array(positions),triVerts:new Uint32Array(indices)})));
    };
    let body=makeBand();
    if(s.style==='openpair'){const gap=own(Manifold.cube([Math.max(.6,s.gap),30,60],true));const cut=own(gap.translate([0,inner+15-.3,0]));body=own(body.subtract(cut));}
    if(['open','stack'].includes(s.style)) {
      // A carved central groove leaves the palm-side bridges intact, producing
      // an architectural double band with one connected metal body.
      const grooveWidth=Math.min(width*.24,s.gap);
      const outer=own(Manifold.cylinder(40,inner+20,inner+20,128,true));
      // (The groove floor keeps 1.06 mm of metal: the minimum wall, however wide the grooves.)
      const innerCut=own(Manifold.cylinder(42,inner+.85,inner+.85,128,true));
      const annulus=own(outer.subtract(innerCut));
      const frontRaw=own(Manifold.cube([60,30,60],true));
      const front=own(frontRaw.translate([0,15-inner*.25,0]));
      const slots=s.style==='stack'?s.layers-1:1;
      for(let i=0;i<slots;i++) {
        const slabRaw=own(Manifold.cube([60,60,grooveWidth],true));
        const rotated=own(slabRaw.rotate([0,s.style==='open'?s.sculpt*10:0,0]));
        const slab=own(rotated.translate([0,0,(i-(slots-1)/2)*(width/s.layers)]));
        const cut=own(Manifold.intersection([annulus,slab,front]));
        body=own(body.subtract(cut));
      }
    }
    // All collars are joined to the band in one Boolean and all seats cut in
    // another: much faster than stone by stone, and no collar can fill the seat
    // of a stone placed before it.
    const schedule=[],collars=[],cuts=[];
    for(const stone of stones) {
      const {geometry,planes}=gemGeometry(stone.shape);
      geometry.computeBoundingBox();
      const box=geometry.boundingBox, dimensions=box.getSize(new T.Vector3());
      const scale=new T.Vector3(stone.width/dimensions.x,stone.depth/dimensions.y,stone.length/dimensions.z);
      const matrix=new T.Matrix4().makeRotationZ(-stone.angle)
        .multiply(new T.Matrix4().makeTranslation(0,stone.girdleRadius,stone.z))
        .multiply(new T.Matrix4().makeRotationY(stone.rotation));
      // Derive both the collar and the aperture from the actual faceted girdle.
      // A generic ellipse both erased pointed cuts and intersected their crowns.
      const footprint=smoothFootprint(gemFootprint(geometry,scale));
      // …a hair (12 µm) outside the girdle, so the opening's wall never passes
      // exactly through the girdle's corners (two surfaces meeting in a line).
      const section=own(own(new CrossSection([footprint])).offset(.012,'Round',2,128));
      const perimeter=own(section.offset(s.bezelWall,'Round',2,128));
      const collarHeight=stone.depth*.72+.6;
      const collarRaw=own(perimeter.extrude(collarHeight));
      const collarTurned=own(collarRaw.rotate([90,0,0]));
      const collarMoved=own(collarTurned.translate([0,.18,0]));
      const collar=own(collarMoved.transform(matrix.elements));
      collars.push(collar);
      // Cut the exact scaled stone volume plus a small radial setting clearance.
      const points=geometry.attributes.position;
      const verts=[];
      for(let i=0;i<points.count;i++) verts.push(new T.Vector3().fromBufferAttribute(points,i).multiply(scale).applyMatrix4(matrix).toArray());
      const cavity=own(Manifold.hull(verts));
      cuts.push(cavity);
      // Open the top of the seat above the girdle to allow insertion. Final lip
      // burnishing and allowance are workshop operations, not simulated claims.
      const openRaw=own(section.extrude(4));
      const openRotated=own(openRaw.rotate([90,0,0]));
      const openTurned=own(openRotated.translate([0,4,0]));
      const openCut=own(openTurned.transform(matrix.elements));
      cuts.push(openCut);
      const boreRaw=own(Manifold.cylinder(stone.depth+thicknessAt(stone.angle)+4,Math.min(stone.width,stone.length)*.19,Math.min(stone.width,stone.length)*.19,32));
      const boreTurned=own(boreRaw.rotate([90,0,0]));
      const bore=own(boreTurned.transform(matrix.elements));
      cuts.push(bore);
      const gem=new T.Mesh(geometry,gemstoneMaterial(planes,environment,stone.tone,s.color,s.light,s.fire));
      gem.matrixAutoUpdate=false;
      gem.matrix.copy(new T.Matrix4().makeScale(SCALE,SCALE,SCALE).multiply(matrix).multiply(new T.Matrix4().makeScale(scale.x,scale.y,scale.z)));
      gem.userData={gem:true,tone:stone.tone,stoneId:stone.id,shape:stone.shape,onBand:true,set:'collar'};group.add(gem);gems.push(gem);
      schedule.push({...stone,positionMm:[Math.sin(stone.angle)*stone.girdleRadius,Math.cos(stone.angle)*stone.girdleRadius,stone.z]});
    }
    if(collars.length)body=own(Manifold.union([body,...collars]));
    if(cuts.length)body=own(body.subtract(own(Manifold.union(cuts))));
    if(body.status()!=='NoError'||body.isEmpty()) throw new Error(`Invalid solid: ${body.status()}`);
    const components=body.decompose();
    const componentCount=components.length;components.forEach(x=>x.delete());
    if(componentCount!==1) throw new Error('Metal body must be a single connected solid');
    // Collapse sub-micron Boolean slivers (0.3 µm) before the single-precision
    // mesh is written: two vertices that close together round to the same point.
    const mesh=own(body.simplify(.0003)).getMesh(), geo=new T.BufferGeometry();
    const xyz=[];
    for(let i=0;i<mesh.vertProperties.length;i+=mesh.numProp) xyz.push(mesh.vertProperties[i]*SCALE,mesh.vertProperties[i+1]*SCALE,mesh.vertProperties[i+2]*SCALE);
    geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setIndex(Array.from(mesh.triVerts));
    // Sculpted relief is meant to read as one flowing surface: only real edges (collars, seats, grooves) are creased.
    const partOfFace=new Int32Array(mesh.triVerts.length/3).fill(-1);
    for(let run=0;run<mesh.runOriginalID.length;run++)for(let i=mesh.runIndex[run];i<mesh.runIndex[run+1];i+=3)partOfFace[i/3]=mesh.runOriginalID[run];
    const shaded=creasedNormals(geo,55,partOfFace);geo.dispose();
    const metal=new T.Mesh(shaded,material);metal.userData.role='unified-metal';group.add(metal);
    report={version:MODEL_REVISION,units:'mm',status:'geometry_checked',metalSolids:componentCount,volumeMm3:body.volume(),innerDiameterMm:inner*2,
      nominalInnerCircumferenceMm:s.size,bandWidthMm:width,minimumBaseThicknessMm:layout.thickness,bezelWallMm:s.bezelWall,
      tessellation:{angularSegments:256,maxRadialChordErrorMm:(inner+layout.thickness+2)*(1-Math.cos(Math.PI/256))},stones:schedule,
      requiresWorkshopApproval:true,checks:['Manifold Boolean operations succeeded','One connected closed metal solid','Shared preview/export geometry','Exact nominal inner-radius construction'],
      pending:['Verify actual stone measurements and cut scans','Confirm alloy, casting shrinkage, setting/finishing allowances','Goldsmith approval before manufacturing']};
  } catch(error) {
    group.traverse(o=>{o.geometry?.dispose();if(o.material!==material)o.material?.dispose();});material.dispose();throw error;
  } finally { for(let i=owned.length-1;i>=0;i--)owned[i].delete(); }
  group.updateMatrixWorld(true);
  return {group,gems,radius:(inner+layout.thickness/2)*SCALE,width:width*SCALE,metal:material,engineering:report};
}
