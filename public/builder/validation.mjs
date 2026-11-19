// Vertices are identified by their exact coordinates (the same rule as before,
// written with typed arrays and numeric keys: a finished ring has 10⁵ vertices
// and these checks run on every design shown).
function positionIds(pos) {
 const n=pos.count,ids=new Int32Array(n),bits=new Uint32Array(3),view=new Float32Array(bits.buffer);
 let size=1;while(size<n*2)size<<=1;
 const table=new Int32Array(size).fill(-1),first=[];let unique=0;
 const x=new Float64Array(n),y=new Float64Array(n),z=new Float64Array(n);
 for(let i=0;i<n;i++){
  const px=pos.getX(i),py=pos.getY(i),pz=pos.getZ(i);x[i]=px;y[i]=py;z[i]=pz;
  view[0]=px+0;view[1]=py+0;view[2]=pz+0;
  let h=(Math.imul(bits[0]^(bits[0]>>>15),0x2c1b3c6d)^Math.imul(bits[1]^(bits[1]>>>13),0x297a2d39)^Math.imul(bits[2]^(bits[2]>>>11),0x5bd1e995))>>>0;
  // (Exact equality of the stored values; +0 and -0 count as equal.)
  for(let slot=h&(size-1);;slot=(slot+1)&(size-1)){
   const j=table[slot];
   if(j<0){table[slot]=i;ids[i]=unique++;first.push(i);break;}
   if(x[j]===px&&y[j]===py&&z[j]===pz){ids[i]=ids[j];break;}
  }
 }
 return {ids,unique,first,x,y,z};
}
export function removeCollapsedTriangles(geometry) {
 const p=geometry.attributes.position,idx=geometry.index,count=idx?idx.count:p.count,{ids}=positionIds(p),kept=[];
 for(let i=0;i<count;i+=3){const a=idx?idx.getX(i):i,b=idx?idx.getX(i+1):i+1,c=idx?idx.getX(i+2):i+2;if(ids[a]!==ids[b]&&ids[b]!==ids[c]&&ids[a]!==ids[c])kept.push(a,b,c);}
 geometry.setIndex(kept);return geometry;
}
// Independent indexed triangle checks used for workshop exports and tests.
export function validateMesh(geometry) {
 const pos=geometry.attributes.position,idx=geometry.index;
 const {ids,unique,first,x,y,z}=positionIds(pos);
 let nonFinite=0,degenerate=0,volume=0;
 for(let i=0;i<pos.count;i++)if(!(Number.isFinite(x[i])&&Number.isFinite(y[i])&&Number.isFinite(z[i])))nonFinite++;
 const count=idx?idx.count:pos.count;
 // Edges keyed by the pair of vertex ids (a number): how often used, and the
 // balance of their two directions (+1 / -1).
 const edgeCount=new Map(),edgeBalance=new Map();
 const parent=Int32Array.from({length:unique},(_,i)=>i),find=v=>{while(parent[v]!==v)v=parent[v]=parent[parent[v]];return v;};
 const used=new Uint8Array(unique),faceA=[],faceB=[],faceC=[];
 for(let i=0;i<count;i+=3){
  const r0=idx?idx.getX(i):i,r1=idx?idx.getX(i+1):i+1,r2=idx?idx.getX(i+2):i+2,v0=ids[r0],v1=ids[r1],v2=ids[r2];
  if(v0===v1||v1===v2||v0===v2){degenerate++;continue;}
  faceA.push(v0);faceB.push(v1);faceC.push(v2);
  volume+=(x[r0]*(y[r1]*z[r2]-z[r1]*y[r2])+y[r0]*(z[r1]*x[r2]-x[r1]*z[r2])+z[r0]*(x[r1]*y[r2]-y[r1]*x[r2]))/6;
  for(const [a,b] of [[v0,v1],[v1,v2],[v2,v0]]){
   const key=a<b?a*unique+b:b*unique+a;
   edgeCount.set(key,(edgeCount.get(key)||0)+1);edgeBalance.set(key,(edgeBalance.get(key)||0)+(a<b?1:-1));
   used[a]=1;parent[find(a)]=find(b);
  }
 }
 let components=0;for(let v=0;v<unique;v++)if(used[v]&&find(v)===v)components++;
 let boundaryEdges=0,inconsistentEdges=0;const problemEdges=[],keyOf=v=>[x[first[v]],y[first[v]],z[first[v]]].join(',');
 for(const [key,n] of edgeCount){
  const balance=edgeBalance.get(key);
  if(n!==2)boundaryEdges++;if(balance!==0)inconsistentEdges++;
  if((n!==2||balance!==0)&&problemEdges.length<8)problemEdges.push({points:[keyOf(Math.floor(key/unique)),keyOf(key%unique)],count:n,balance});
 }
 // Closed edges alone do not rule out two solids touching at one vertex.
 // The triangles around each vertex must form one continuous fan.
 const start=new Int32Array(unique+1),faces=faceA.length;
 for(let f=0;f<faces;f++){start[faceA[f]+1]++;start[faceB[f]+1]++;start[faceC[f]+1]++;}
 for(let v=0;v<unique;v++)start[v+1]+=start[v];
 const fill=start.slice(0,unique),linkA=new Int32Array(faces*3),linkB=new Int32Array(faces*3);
 for(let f=0;f<faces;f++){const t=[faceA[f],faceB[f],faceC[f]];for(let k=0;k<3;k++){const at=fill[t[k]]++;linkA[at]=t[(k+1)%3];linkB[at]=t[(k+2)%3];}}
 let nonManifoldVertices=0;
 for(let v=0;v<unique;v++){
  const from=start[v],to=start[v+1];if(to-from<2)continue;
  const nodes=[],up=[];const node=w=>{let i=nodes.indexOf(w);if(i<0){i=nodes.length;nodes.push(w);up.push(i);}return i;};
  const root=i=>{while(up[i]!==i)i=up[i];return i;};
  for(let c=from;c<to;c++){const a=node(linkA[c]),b=node(linkB[c]);up[root(a)]=root(b);}
  const r=root(0);for(let i=1;i<nodes.length;i++)if(root(i)!==r){nonManifoldVertices++;break;}
 }
 return {valid:nonManifoldVertices===0&&nonFinite===0&&degenerate===0&&boundaryEdges===0&&inconsistentEdges===0&&components===1&&volume>0,nonManifoldVertices,problemEdges,vertices:unique,triangles:count/3,nonFinite,degenerate,boundaryEdges,inconsistentEdges,components,signedVolume:volume};
}

// Float32 conversion can collapse a Boolean sliver into two exactly coincident,
// oppositely wound triangles. Cancel only those pairs; same-winding duplicates
// remain invalid and are caught by validateMesh. No vertex is moved.
export function removeOppositeCoincidentTriangles(geometry) {
 const p=geometry.attributes.position,idx=geometry.index,faces=new Map(),{ids}=positionIds(p);
 for(let i=0;i<(idx?idx.count:p.count);i+=3){
  const raw=[0,1,2].map(k=>idx?idx.getX(i+k):i+k),keys=raw.map(k=>ids[k]);
  if(keys[0]===keys[1]||keys[1]===keys[2]||keys[0]===keys[2])continue;
  const sorted=[...keys].sort((a,b)=>a-b),key=sorted.join(',');
  const start=keys.indexOf(sorted[0]),sign=keys[(start+1)%3]===sorted[1]?1:-1;
  const pending=faces.get(key)||[],opposite=pending.findIndex(f=>f.sign!==sign);
  if(opposite>=0)pending.splice(opposite,1);else pending.push({raw,sign});
  faces.set(key,pending);
 }
 geometry.setIndex([...faces.values()].flatMap(list=>list.flatMap(f=>f.raw)));
 return geometry;
}

// Two parts of one closed body that touch in a single point share that vertex:
// a pinch of zero thickness. It is not a connection and not a gap, only two
// surfaces grazing (a claw beside its neighbour). Each further fan of triangles
// around such a point gets its own vertex, drawn 0.25 µm into its own metal, so
// the surface is an ordinary closed skin again. Returns the number of pinches.
export function separatePinches(geometry,epsilon=2e-4){
 const pos=geometry.attributes.position,idx=geometry.index,keys=new Map(),ids=[];
 for(let i=0;i<pos.count;i++){const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].join(',');if(!keys.has(key))keys.set(key,keys.size);ids.push(keys.get(key));}
 const index=Array.from(idx.array),fans=new Map();
 for(let c=0;c<index.length;c++){const v=ids[index[c]];if(!fans.has(v))fans.set(v,[]);fans.get(v).push(c);}
 const P=Array.from(pos.array);let fixed=0;
 const point=i=>[P[i*3],P[i*3+1],P[i*3+2]];
 for(const corners of fans.values()){
  const parent=new Map(),root=x=>{while(parent.get(x)!==x)x=parent.get(x);return x;};
  const others=c=>{const t=c-c%3;return [ids[index[t+(c%3+1)%3]],ids[index[t+(c%3+2)%3]]];};
  for(const c of corners){const [a,b]=others(c);if(!parent.has(a))parent.set(a,a);if(!parent.has(b))parent.set(b,b);parent.set(root(a),root(b));}
  const groups=new Map();
  for(const c of corners){const r=root(others(c)[0]);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(c);}
  if(groups.size<2)continue;
  [...groups.values()].slice(1).forEach(group=>{
   const n=[0,0,0];
   for(const c of group){const t=c-c%3,[a,b,d]=[0,1,2].map(k=>point(index[t+k]));const u=b.map((v,j)=>v-a[j]),w=d.map((v,j)=>v-a[j]);n[0]+=u[1]*w[2]-u[2]*w[1];n[1]+=u[2]*w[0]-u[0]*w[2];n[2]+=u[0]*w[1]-u[1]*w[0];}
   const l=Math.hypot(...n)||1,at=point(index[group[0]]),fresh=P.length/3;
   P.push(at[0]-n[0]/l*epsilon,at[1]-n[1]/l*epsilon,at[2]-n[2]/l*epsilon);
   for(const c of group)index[c]=fresh;
  });
  fixed++;
 }
 if(fixed){geometry.setAttribute('position',new pos.constructor(new Float32Array(P),3));geometry.setIndex(index);}
 return fixed;
}

// The kernel's mesh is a proper closed skin by its own vertex numbering. Where
// two of its surfaces graze, two different vertices can land on the very same
// single-precision point, and a file format without vertex numbers (STL) would
// read them as one: a pinch of zero thickness, in a point or along an edge.
// Each such vertex is drawn 0.4 µm into its own metal, along its own surface
// normal, so the two surfaces are distinct again. Returns the number moved.
export function separateCoincident(geometry,epsilon=3e-4){
 const pos=geometry.attributes.position,index=geometry.index.array,groups=new Map();
 for(let i=0;i<pos.count;i++){const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}
 const moved=new Set();for(const list of groups.values())if(list.length>1)for(const i of list)moved.add(i);
 if(!moved.size)return 0;
 const normal=new Map([...moved].map(i=>[i,[0,0,0]])),P=i=>[pos.getX(i),pos.getY(i),pos.getZ(i)];
 for(let t=0;t<index.length;t+=3){
  if(!moved.has(index[t])&&!moved.has(index[t+1])&&!moved.has(index[t+2]))continue;
  const v=[P(index[t]),P(index[t+1]),P(index[t+2])];
  for(let k=0;k<3;k++){
   const n=normal.get(index[t+k]);if(!n)continue;
   const a=v[k],u=v[(k+1)%3].map((x,j)=>x-a[j]),w=v[(k+2)%3].map((x,j)=>x-a[j]);
   const c=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],l=Math.hypot(...c);
   if(!(l>0))continue;
   const angle=Math.atan2(l,u[0]*w[0]+u[1]*w[1]+u[2]*w[2]);
   for(let j=0;j<3;j++)n[j]+=c[j]/l*angle;
  }
 }
 for(const [i,n] of normal){const l=Math.hypot(...n);if(!(l>0))continue;const a=P(i);pos.setXYZ(i,a[0]-n[0]/l*epsilon,a[1]-n[1]/l*epsilon,a[2]-n[2]/l*epsilon);}
 pos.needsUpdate=true;
 return moved.size;
}

// Closed shells of a mesh by its own vertex numbering, with their signed
// volumes; drops every shell but the largest when all the others are smaller
// than `limit` (a bubble or a crumb left where surfaces graze). Returns the
// volumes removed, or null if a larger second shell exists.
export function dropTinyShells(geometry,limit=1e-3){
 const pos=geometry.attributes.position,index=geometry.index.array,parent=Int32Array.from({length:pos.count},(_,i)=>i);
 const root=x=>{while(parent[x]!==x)x=parent[x]=parent[parent[x]];return x;};
 for(let t=0;t<index.length;t+=3){parent[root(index[t])]=root(index[t+1]);parent[root(index[t+1])]=root(index[t+2]);}
 const volume=new Map();
 for(let t=0;t<index.length;t+=3){
  const [a,b,c]=[0,1,2].map(k=>[pos.getX(index[t+k]),pos.getY(index[t+k]),pos.getZ(index[t+k])]);
  const v=(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6,r=root(index[t]);
  volume.set(r,(volume.get(r)||0)+v);
 }
 if(volume.size<2)return [];
 const main=[...volume].sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]))[0][0],removed=[...volume].filter(([r])=>r!==main).map(([,v])=>v);
 if(removed.some(v=>Math.abs(v)>limit))return null;
 const kept=[];for(let t=0;t<index.length;t+=3)if(root(index[t])===main)kept.push(index[t],index[t+1],index[t+2]);
 geometry.setIndex(kept);
 return removed;
}
