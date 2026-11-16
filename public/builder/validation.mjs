export function removeCollapsedTriangles(geometry) {
 const p=geometry.attributes.position,idx=geometry.index,kept=[];
 const count=idx?idx.count:p.count;
 for(let i=0;i<count;i+=3){const raw=[0,1,2].map(k=>idx?idx.getX(i+k):i+k);const keys=raw.map(k=>[p.getX(k),p.getY(k),p.getZ(k)].join(','));if(new Set(keys).size===3)kept.push(...raw);}
 geometry.setIndex(kept);return geometry;
}
// Independent indexed triangle checks used for workshop exports and tests.
export function validateMesh(geometry) {
 const pos=geometry.attributes.position,idx=geometry.index,edges=new Map();
 const vertices=new Map(),ids=[];let nonFinite=0,degenerate=0,volume=0;
 for(let i=0;i<pos.count;i++){
  const p=[pos.getX(i),pos.getY(i),pos.getZ(i)];if(!p.every(Number.isFinite))nonFinite++;
  const key=p.join(',');if(!vertices.has(key))vertices.set(key,vertices.size);ids.push(vertices.get(key));
 }
 const count=idx?idx.count:pos.count;const adjacency=new Map(),links=new Map();
 for(let i=0;i<count;i+=3){
  const raw=[0,1,2].map(k=>idx?idx.getX(i+k):i+k),v=raw.map(k=>ids[k]);
  if(new Set(v).size<3){degenerate++;continue;}
  for(let k=0;k<3;k++){
   const link=links.get(v[k])||[];link.push(v[(k+1)%3],v[(k+2)%3]);links.set(v[k],link);
  }
  const p=raw.map(k=>[pos.getX(k),pos.getY(k),pos.getZ(k)]),[a,b,c]=p;
  volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
  for(let k=0;k<3;k++){const x=v[k],y=v[(k+1)%3],key=x<y?`${x}:${y}`:`${y}:${x}`;const e=edges.get(key)||{count:0,balance:0};e.count++;e.balance+=x<y?1:-1;edges.set(key,e);if(!adjacency.has(x))adjacency.set(x,new Set());adjacency.get(x).add(y);}
 }
 let components=0;const seen=new Set();for(const start of adjacency.keys()){if(seen.has(start))continue;components++;const stack=[start];while(stack.length){const v=stack.pop();if(seen.has(v))continue;seen.add(v);for(const n of adjacency.get(v)||[])if(!seen.has(n))stack.push(n);}}
 const vertexKeys=[...vertices.keys()];
 const problemEdges=[...edges.entries()].filter(([,e])=>e.count!==2||e.balance!==0).slice(0,8).map(([key,e])=>({points:key.split(':').map(i=>vertexKeys[Number(i)]),...e}));
 const boundaryEdges=[...edges.values()].filter(x=>x.count!==2).length,inconsistentEdges=[...edges.values()].filter(x=>x.balance!==0).length;
 // Closed edges alone do not rule out two solids touching at one vertex.
 // The triangles around each vertex must form one continuous fan.
 let nonManifoldVertices=0;
 for(const link of links.values()){
  const parent=new Map();
  const root=x=>{while(parent.get(x)!==x)x=parent.get(x);return x;};
  for(let i=0;i<link.length;i+=2){const a=link[i],b=link[i+1];if(!parent.has(a))parent.set(a,a);if(!parent.has(b))parent.set(b,b);parent.set(root(a),root(b));}
  if(new Set([...parent.keys()].map(root)).size!==1)nonManifoldVertices++;
 }
 return {valid:nonManifoldVertices===0&&nonFinite===0&&degenerate===0&&boundaryEdges===0&&inconsistentEdges===0&&components===1&&volume>0,nonManifoldVertices,problemEdges,vertices:vertices.size,triangles:count/3,nonFinite,degenerate,boundaryEdges,inconsistentEdges,components,signedVolume:volume};
}

// Float32 conversion can collapse a Boolean sliver into two exactly coincident,
// oppositely wound triangles. Cancel only those pairs; same-winding duplicates
// remain invalid and are caught by validateMesh. No vertex is moved.
export function removeOppositeCoincidentTriangles(geometry) {
 const p=geometry.attributes.position,idx=geometry.index,faces=new Map();
 for(let i=0;i<(idx?idx.count:p.count);i+=3){
  const raw=[0,1,2].map(k=>idx?idx.getX(i+k):i+k);
  const keys=raw.map(k=>[p.getX(k),p.getY(k),p.getZ(k)].join(','));
  if(new Set(keys).size<3)continue;
  const sorted=[...keys].sort(),key=sorted.join('|');
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
