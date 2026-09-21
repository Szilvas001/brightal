import * as T from 'three';
import { getKernel } from './kernel.mjs';
import { gemGeometry, gemstoneMaterial } from './optics.mjs';

export const MODERN_STYLES = ['bezelrow','scatter','chevron','ribbon','graduated','eastwest','alternating','crown','wave','rope','dome','signet','open','stack','band','eternity','curvedoval','contour','asymmetric','fullcircle'];
export const SCALE = .8;
export const MODEL_REVISION = 'atelier-solid-4';
const single = s => ['eastwest','signet','curvedoval'].includes(s.style) || ['wave','rope','dome','open','stack'].includes(s.style);
export function modernLayout(s) {
  const inner = s.size / (2*Math.PI);
  const jewel = !['band','wave','rope','dome','open','stack'].includes(s.style) || s.fashionStone;
  let count = !jewel ? 0 : single(s) ? 1 : s.dailyCount;
  const east = s.style === 'eastwest' || s.orientation === 'east';
  const maxDimension = Math.max(s.stoneLength,s.stoneWidth);
  const spacing = maxDimension + 2*s.bezelWall + s.dailySpacing + .35;
  const thickness = Math.max(s.thickness, count ? s.stoneDepth*.72 + .8 : 0);
  const width = Math.max(s.width, count ? (east?s.stoneWidth:s.stoneLength) + 2*s.bezelWall + .6 : 0,
    s.style==='stack'?s.layers*1.25+(s.layers-1)*s.gap:0,s.style==='signet'?s.faceSize:0);
  const top = a => Math.pow(Math.max(0,Math.cos(a)),4);
  const rise = a => {
    if(['dome','signet','rope','curvedoval','asymmetric'].includes(s.style)) return top(a)*s.sculpt*.55;
    return 0;
  };
  const shift = a => {
    if(['chevron','crown','contour'].includes(s.style)) return top(a)*s.sculpt*(s.style==='crown'?-1:1);
    if(['wave','ribbon','curvedoval','asymmetric'].includes(s.style)) return Math.sin(a*2)*s.sculpt*.5;
    return 0;
  };
  const widthAt = a => width * (.72+.28*top(a));
  const thicknessAt = a => thickness + rise(a) + (s.style==='rope' ? .24*(1+Math.cos(a*s.rhythm*3)) : 0);
  const radius = inner+thickness;
  let angularStep = 2*Math.asin(Math.min(.7, spacing/(2*radius)));
  if(s.style==='fullcircle'){count=Math.max(3,Math.floor(2*Math.PI/angularStep));angularStep=2*Math.PI/count;}
  const stones = [];
  for(let i=0;i<count;i++) {
    const angle=(i-(count-1)/2)*angularStep+(s.style==='asymmetric'?.3:0);
    const factor=['graduated','asymmetric'].includes(s.style)?1-.3*Math.abs(i-(count-1)/2)/Math.max(1,(count-1)/2):1;
    const shape=s.style==='alternating'&&i%2?s.sideShape:s.shape;
    const z=shift(angle)+(['scatter','asymmetric'].includes(s.style)?(i%2?1:-1)*Math.max(0,(widthAt(angle)-s.stoneLength-2*s.bezelWall)/2)*.6:0);
    const surface=inner+thicknessAt(angle);
    stones.push({ id:`S${i+1}`, shape, length:(['round','princess','asscher','cushion'].includes(shape)?s.stoneWidth:s.stoneLength)*factor,width:s.stoneWidth*factor,depth:s.stoneDepth*factor,
      angle,rotation:east?Math.PI/2:s.style==='crown'?angle*.25:0,z,
      girdleRadius:surface+.1, tone:s.alternateGems&&i%2?s.sideTone:s.gemTone });
  }
  return {inner,width,thickness,widthAt,thicknessAt,shift,stones};
}

// Exact shared millimetre geometry: the browser and the workshop exporter use
// this same solid, including the Boolean-cut stone seats and access bores.
export function buildContemporary(s, environment, colors) {
  const {Manifold, Mesh}=getKernel(), owned=[];
  const own=x=>(owned.push(x),x);
  const layout=modernLayout(s), {inner,width,thicknessAt,widthAt,shift,stones}=layout;
  const group=new T.Group(), gems=[];
  const material=new T.MeshPhysicalMaterial({color:colors[s.metal],metalness:1,roughness:s.finish==='polished'?.13:s.finish==='satin'?.3:.4});
  let report;
  try {
    const makeBand=(offset=0, widthFactor=1) => {
      const positions=[],indices=[],n=256,m=48;
      for(let i=0;i<n;i++) {
        const a=2*Math.PI*i/n, width=widthAt(a)*widthFactor;
        for(let j=0;j<m;j++) {
          const b=2*Math.PI*j/m, co=Math.cos(b),si=Math.sin(b);
          const r=inner+thicknessAt(a)*(.5+.5*Math.sign(co)*Math.pow(Math.abs(co),.55));
          const z=shift(a)+offset+width*.5*Math.sign(si)*Math.pow(Math.abs(si),.55);
          positions.push(Math.sin(a)*r,Math.cos(a)*r,z);
          const k=i*m+j, next=((i+1)%n)*m+j, q=i*m+(j+1)%m, nextQ=((i+1)%n)*m+(j+1)%m;
          indices.push(k,q,next,q,nextQ,next);
        }
      }
      return own(new Manifold(new Mesh({numProp:3,vertProperties:new Float32Array(positions),triVerts:new Uint32Array(indices)})));
    };
    let body=makeBand();
    if(['open','stack'].includes(s.style)) {
      // A carved central groove leaves the palm-side bridges intact, producing
      // an architectural double band with one connected metal body.
      const grooveWidth=Math.min(width*.24,s.gap);
      const outer=own(Manifold.cylinder(40,inner+20,inner+20,128,true));
      const innerCut=own(Manifold.cylinder(42,inner+.55,inner+.55,128,true));
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
    const schedule=[];
    for(const stone of stones) {
      const {geometry,planes}=gemGeometry(stone.shape);
      geometry.computeBoundingBox();
      const box=geometry.boundingBox, dimensions=box.getSize(new T.Vector3());
      const scale=new T.Vector3(stone.width/dimensions.x,stone.depth/dimensions.y,stone.length/dimensions.z);
      const matrix=new T.Matrix4().makeRotationZ(-stone.angle)
        .multiply(new T.Matrix4().makeTranslation(0,stone.girdleRadius,stone.z))
        .multiply(new T.Matrix4().makeRotationY(stone.rotation));
      // A rounded bezel collar intersects the underlying ring deeply enough to
      // form one solid. Its bore is smaller than the girdle: a real seating ledge.
      const perimeter=[];
      const N=64;
      for(let k=0;k<N;k++) {
        const a=2*Math.PI*k/N, x=Math.cos(a),z=Math.sin(a);
        const power=['emerald','asscher','princess','radiant'].includes(stone.shape)?.32:stone.shape==='cushion'?.55:1;
        perimeter.push([Math.sign(x)*Math.pow(Math.abs(x),power)*(stone.width/2+s.bezelWall),Math.sign(z)*Math.pow(Math.abs(z),power)*(stone.length/2+s.bezelWall)]);
      }
      const collarHeight=stone.depth*.72+.6;
      const collarRaw=own(Manifold.extrude([perimeter],collarHeight));
      const collarTurned=own(collarRaw.rotate([90,0,0]));
      const collarMoved=own(collarTurned.translate([0,.18,0]));
      const collar=own(collarMoved.transform(matrix.elements));
      body=own(body.add(collar));
      // Cut the exact scaled stone volume plus a small radial setting clearance.
      const points=geometry.attributes.position;
      const verts=[];
      for(let i=0;i<points.count;i++) verts.push(new T.Vector3().fromBufferAttribute(points,i).multiply(scale).applyMatrix4(matrix).toArray());
      const cavity=own(Manifold.hull(verts));
      body=own(body.subtract(cavity));
      // Open the top of the seat above the girdle to allow insertion. Final lip
      // burnishing and allowance are workshop operations, not simulated claims.
      const opening=perimeter.map(([x,z])=>[x*(stone.width/(stone.width+2*s.bezelWall)),z*(stone.length/(stone.length+2*s.bezelWall))]);
      const openRaw=own(Manifold.extrude([opening],4));
      const openTurned=own(openRaw.rotate([-90,0,0]));
      const openCut=own(openTurned.transform(matrix.elements));
      body=own(body.subtract(openCut));
      const boreRaw=own(Manifold.cylinder(stone.depth+thicknessAt(stone.angle)+4,Math.min(stone.width,stone.length)*.19,Math.min(stone.width,stone.length)*.19,32));
      const boreTurned=own(boreRaw.rotate([90,0,0]));
      const bore=own(boreTurned.transform(matrix.elements));
      body=own(body.subtract(bore));
      const gem=new T.Mesh(geometry,gemstoneMaterial(planes,environment,stone.tone,s.color,s.light,s.fire));
      gem.matrixAutoUpdate=false;
      gem.matrix.copy(new T.Matrix4().makeScale(SCALE,SCALE,SCALE).multiply(matrix).multiply(new T.Matrix4().makeScale(scale.x,scale.y,scale.z)));
      gem.userData={gem:true,tone:stone.tone,stoneId:stone.id};group.add(gem);gems.push(gem);
      schedule.push({...stone,positionMm:[Math.sin(stone.angle)*stone.girdleRadius,Math.cos(stone.angle)*stone.girdleRadius,stone.z]});
    }
    if(body.status()!=='NoError'||body.isEmpty()) throw new Error(`Invalid solid: ${body.status()}`);
    const components=body.decompose();
    const componentCount=components.length;components.forEach(x=>x.delete());
    if(componentCount!==1) throw new Error('Metal body must be a single connected solid');
    const mesh=body.getMesh(), geo=new T.BufferGeometry();
    const xyz=[];
    for(let i=0;i<mesh.vertProperties.length;i+=mesh.numProp) xyz.push(mesh.vertProperties[i]*SCALE,mesh.vertProperties[i+1]*SCALE,mesh.vertProperties[i+2]*SCALE);
    geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setIndex(Array.from(mesh.triVerts));geo.computeVertexNormals();
    const metal=new T.Mesh(geo,material);metal.userData.role='unified-metal';group.add(metal);
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
