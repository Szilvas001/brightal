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
 const count=idx?idx.count:pos.count;const adjacency=new Map();
 for(let i=0;i<count;i+=3){
  const raw=[0,1,2].map(k=>idx?idx.getX(i+k):i+k),v=raw.map(k=>ids[k]);
  if(new Set(v).size<3){degenerate++;continue;}
  const p=raw.map(k=>[pos.getX(k),pos.getY(k),pos.getZ(k)]),[a,b,c]=p;
  volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
  for(let k=0;k<3;k++){const x=v[k],y=v[(k+1)%3],key=x<y?`${x}:${y}`:`${y}:${x}`;const e=edges.get(key)||{count:0,balance:0};e.count++;e.balance+=x<y?1:-1;edges.set(key,e);if(!adjacency.has(x))adjacency.set(x,new Set());adjacency.get(x).add(y);}
 }
 let components=0;const seen=new Set();for(const start of adjacency.keys()){if(seen.has(start))continue;components++;const stack=[start];while(stack.length){const v=stack.pop();if(seen.has(v))continue;seen.add(v);for(const n of adjacency.get(v)||[])if(!seen.has(n))stack.push(n);}}
 const boundaryEdges=[...edges.values()].filter(x=>x.count!==2).length,inconsistentEdges=[...edges.values()].filter(x=>x.balance!==0).length;
 return {valid:nonFinite===0&&degenerate===0&&boundaryEdges===0&&inconsistentEdges===0&&components===1&&volume>0,vertices:vertices.size,triangles:count/3,nonFinite,degenerate,boundaryEdges,inconsistentEdges,components,signedVolume:volume};
}
