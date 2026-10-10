/** Exact plane intersections of unchanged model triangles. These drawings
 * are anatomical model sections, not acquired medical images. */
export function meshSection(THREE,mesh,plane){
 const p=mesh.geometry.attributes.position,count=p.count,world=[],distances=new Float64Array(count);
 for(let i=0;i<count;i++){const v=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);world.push(v);distances[i]=plane.distanceToPoint(v);}
 const nodes=new Map(),edges=[],dedup=new Set(),ix=mesh.geometry.index;
 const key=p=>p.toArray().map(x=>Math.round(x*1e4)).join(',');
 const node=p=>{const k=key(p);if(!nodes.has(k))nodes.set(k,{p,edges:[]});return nodes.get(k);};
 for(let i=0;i<(ix?.count??count);i+=3){
  const ids=[0,1,2].map(j=>ix?ix.getX(i+j):i+j),ds=ids.map(j=>distances[j]);
  if(ds.every(d=>d>1e-7)||ds.every(d=>d< -1e-7))continue;
  const hits=[];
  for(let j=0;j<3;j++){
   const a=ids[j],b=ids[(j+1)%3],da=distances[a],db=distances[b];
   if(Math.abs(da)<1e-7)hits.push(world[a]);
   if(da*db<0)hits.push(world[a].clone().lerp(world[b],da/(da-db)));
  }
  const unique=[...new Map(hits.map(p=>[key(p),p])).values()];if(unique.length!==2)continue;
  const [a,b]=unique.map(node),k=[key(a.p),key(b.p)].sort().join('|');if(dedup.has(k))continue;dedup.add(k);
  const edge={a,b,used:false};edges.push(edge);a.edges.push(edge);b.edges.push(edge);
 }
 const paths=[];
 for(const first of edges){
  if(first.used)continue;const start=first.a,points=[];let current=start,edge=first,closed=false;
  while(edge&&!edge.used){
   points.push(current.p.clone());edge.used=true;current=edge.a===current?edge.b:edge.a;
   if(current===start){closed=true;break;}
   edge=current.edges.find(e=>!e.used);
  }
  if(!closed)points.push(current.p.clone());if(points.length>=3)paths.push({points,closed});
 }
 return paths;
}

export function renderModelSection(THREE,{atlas,head,view='sagittal',mirror=false,tissueSlice=null}){
 const canvas=document.createElement('canvas');canvas.width=216;canvas.height=280;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#02060d';ctx.fillRect(0,0,216,280);
 const config={coronal:{normal:[0,0,1],offset:-.10,u:0,v:1,center:[0,1.50],span:[4.5,4.15]},
  sagittal:{normal:[1,0,0],offset:.08,u:2,v:1,center:[.30,.55],span:[5.2,5.6]},
  axial:{normal:[0,1,0],offset:-1.85,u:0,v:2,center:[0,0],span:[4.7,4.9]}}[view];
 const plane=new THREE.Plane(new THREE.Vector3(...config.normal),config.offset);
 const scale=Math.min(216/config.span[0],280/config.span[1]);
 const project=p=>[(p.getComponent(config.u)-config.center[0])*scale*(mirror?-1:1)+108,140-(p.getComponent(config.v)-config.center[1])*scale];
 const draw=(model,skin=false)=>{
  if(!model)return;model.updateMatrixWorld(true);model.traverse(o=>{
   if(!o.isMesh)return;const region=o.userData.anatomicalRegion,deep=['connections','thalamus','striatum','hippocampus','brainstem'].includes(region);
   const paths=meshSection(THREE,o,plane);if(!paths.length)return;
   ctx.beginPath();for(const path of paths){const [x,y]=project(path.points[0]);ctx.moveTo(x,y);for(const p of path.points.slice(1)){const [x,y]=project(p);ctx.lineTo(x,y);}if(path.closed)ctx.closePath();}
   const ps=paths.flatMap(p=>p.points),xy=ps.map(project),xs=xy.map(p=>p[0]),ys=xy.map(p=>p[1]);
   const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
   const radius=Math.max(2,Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))*.70);
   const shading=ctx.createRadialGradient(cx-radius*.15,cy-radius*.15,0,cx,cy,radius);
   shading.addColorStop(0,skin?'#1b2e47':deep?'#92a6c9':'#8aa3c6');shading.addColorStop(.60,skin?'#101e32':deep?'#6e809e':'#546a8c');shading.addColorStop(1,skin?'#060d18':'#22344f');ctx.fillStyle=shading;
   // Only closed contours can fill; open boundaries retain their real lines.
   const closed=paths.filter(p=>p.closed);ctx.beginPath();for(const path of closed){const [x,y]=project(path.points[0]);ctx.moveTo(x,y);for(const p of path.points.slice(1)){const [x,y]=project(p);ctx.lineTo(x,y);}ctx.closePath();}ctx.fill('evenodd');
   ctx.beginPath();for(const path of paths){const [x,y]=project(path.points[0]);ctx.moveTo(x,y);for(const p of path.points.slice(1)){const [x,y]=project(p);ctx.lineTo(x,y);}if(path.closed)ctx.closePath();}
   ctx.strokeStyle=skin?'#91b1d6':deep?'#45516e':'#233751';ctx.lineWidth=skin?1.0:.65;ctx.stroke();
   if(!skin&&/^Allen_(thalamus|amygdaloid_complex)_[LR]$/.test(o.name)){
    const ps=paths.flatMap(p=>p.points),center=ps.reduce((s,p)=>s.add(p),new THREE.Vector3()).multiplyScalar(1/ps.length),[x,y]=project(center);
    const glow=ctx.createRadialGradient(x,y,0,x,y,10);glow.addColorStop(0,'#ffe7fd');glow.addColorStop(.18,'#ff82dc');glow.addColorStop(1,'#ee37b000');ctx.fillStyle=glow;ctx.fillRect(x-10,y-10,20,20);
   }
  });
 };
 draw(head.cc0Model,true);
 if(tissueSlice){
  ctx.save();if(mirror){ctx.translate(216,0);ctx.scale(-1,1);}ctx.drawImage(tissueSlice,0,0,216,280);ctx.restore();
  const point={coronal:new THREE.Vector3(0,1.3,.1),sagittal:new THREE.Vector3(-.08,1.3,.05),axial:new THREE.Vector3(0,1.85,.05)}[view];
  const [x,y]=project(point),glow=ctx.createRadialGradient(x,y,0,x,y,15);glow.addColorStop(0,'#ffe7fd');glow.addColorStop(.16,'#ff81d5');glow.addColorStop(1,'#ee37b000');ctx.fillStyle=glow;ctx.fillRect(x-15,y-15,30,30);
 }else draw(atlas.root);
 return canvas.toDataURL('image/png');
}
