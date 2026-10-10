/** Real CC0 ex-vivo specimen tissue. Illustrative alignment; never a user scan. */
export const MRI_TISSUE={
 uri:'./assets/models/mri-flash-tissue.glb',
 source:'https://doi.org/10.5061/dryad.119f80q',
 license:'https://creativecommons.org/publicdomain/zero/1.0/',
 sha256:'aa6248769d9fce2bfaac09fa7939b8a4c3052e23c289dd00c7320dcba1bb26bb',
 byteLength:10280752,
 originalSha256:'e2511e9a77aa6fac0d0be750f8227c9b445bdc64ab188ede75288e7b70f8a7a6'
};
export async function loadMRITissue({THREE,loader,url=MRI_TISSUE.uri,timeoutMs=15000}){
 let timer;
 try{
  const {scene:root}=await Promise.race([loader.loadAsync(url),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('MRI tissue load timeout')),timeoutMs);})]);
  let vertexCount=0,meshCount=0;
  root?.traverse(o=>{if(o.isMesh){
   if(!o.geometry.attributes.normal||!o.geometry.index)throw Error('MRI tissue normals/triangles missing');
   vertexCount+=o.geometry.attributes.position.count;meshCount++;
  }});
  if(meshCount!==2||vertexCount<50000)throw Error('MRI tissue mesh is invalid');
  if(root.userData.sourceSha256!==MRI_TISSUE.originalSha256||root.userData.medicalRegistration!==false)throw Error('MRI tissue provenance missing');
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
  if(!size.toArray().every(v=>Number.isFinite(v)&&v>0&&v<5))throw Error('MRI tissue bounds invalid');
  return {root,vertexCount,source:'CC0-Edlow-FLASH25'};
 }finally{clearTimeout(timer);}
}

export async function loadMRISlices(){
 const images=await Promise.all(['coronal','sagittal','axial'].map(view=>new Promise((resolve,reject)=>{
  const img=new Image();let timer;
  const done=()=>{clearTimeout(timer);img.onload=null;img.onerror=null;};
  timer=setTimeout(()=>{done();img.src='';reject(Error('MRI slice timeout'));},10000);
  img.onload=()=>{done();resolve([view,img]);};img.onerror=()=>{done();reject(Error('MRI slice load failed'));};img.src=`./assets/scans/mri-flash-${view}.png`;
 })));
 return Object.fromEntries(images);
}
