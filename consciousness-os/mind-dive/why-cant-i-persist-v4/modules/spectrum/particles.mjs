/** Fixed hash: topology does not depend on refresh or animation frame count. */
export function hash(n){const x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x);}
/** Artistic remap of derived decorative particles, not a change to licensed GLB
 * or HRA anatomy. Lower vault and longer facial turns match the supplied portrait. */
export function fitPortraitPoint([x,y,z]){
 const crown=y>1?1+(y-1)*.60:y;
 const face=y<.65?y-.12-(.65-y)*.06:crown-.12;
 const t=Math.max(0,Math.min(1,(-y-1.15))),front=Math.max(0,Math.min(1,(z-.65)/.5));
 return [x,face,z+.025*Math.exp(-Math.pow((y-.1)/.18,2))+.60*t*t*(3-2*t)*front];
}
/** Area-weighted barycentric samples on actual GLB triangles; no image mask. */
export function sampleSurface(triangles,count){
 if(!Number.isSafeInteger(count)||count<1||count>100000)throw Error('Invalid particle budget');
 if(!triangles.length||triangles.length%9)throw Error('Invalid triangle data');
 const areas=[],faces=[];let total=0;
 for(let i=0;i<triangles.length;i+=9){
  const a=triangles.slice(i,i+3),b=triangles.slice(i+3,i+6),c=triangles.slice(i+6,i+9);
  if([...a,...b,...c].some(x=>!Number.isFinite(x)))throw Error('Nonfinite triangle');
  const u=b.map((x,j)=>x-a[j]),v=c.map((x,j)=>x-a[j]);
  const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...n);
  if(length<1e-10)continue;total+=length*.5;areas.push(total);faces.push({a,b,c,n:n.map(x=>x/length)});
 }
 if(!total)throw Error('Empty surface');
 const positions=new Float32Array(count*3),normals=new Float32Array(count*3),seeds=new Float32Array(count);
 for(let i=0;i<count;i++){
  const target=hash(i*3+1)*total;let l=0,r=areas.length-1;
  while(l<r){const m=(l+r)>>1;if(areas[m]<target)l=m+1;else r=m;}
  const {a,b,c,n}=faces[l],s=Math.sqrt(hash(i*3+2)),t=hash(i*3+3);
  for(let j=0;j<3;j++){positions[i*3+j]=a[j]*(1-s)+b[j]*s*(1-t)+c[j]*s*t;normals[i*3+j]=n[j];}
  seeds[i]=hash(i+71);
 }
 return {positions,normals,seeds};
}
