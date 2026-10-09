/** Small reusable views rendered from the loaded legal models, not reference
 * artwork or MRI data. This temporary renderer releases its GPU context. */
export function createModelScans(THREE,{atlas,head}){
 const canvas=document.createElement('canvas');
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});
 renderer.setSize(216,280,false);renderer.setPixelRatio(1);renderer.localClippingEnabled=true;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x02060d,0);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2.2,2.2,2.85,-2.85,.1,30);
 scene.add(new THREE.AmbientLight(0x90b2da,1.15));
 const key=new THREE.DirectionalLight(0xc5e8ff,2.4);key.position.set(-4,6,5);scene.add(key);
 const brain=atlas.root.clone(true);brain.scale.setScalar(1);brain.position.set(0,0,0);scene.add(brain);
 const materials=[],clipMaterials=[];
 brain.traverse(o=>{if(!o.isMesh)return;const region=o.userData.anatomicalRegion,deep=['hippocampus','amygdala','thalamus','striatum','brainstem','connections'].includes(region);
  const m=new THREE.MeshPhongMaterial({color:deep?0xbb86b7:0x7e93b0,emissive:deep?0x32142e:0x05101c,specular:0x94ccff,shininess:34,side:THREE.DoubleSide});o.material=m;materials.push(m);clipMaterials.push(m);
 });
 const capture=(position,up,plane)=>{camera.position.set(...position);camera.up.set(...up);camera.lookAt(0,0,0);clipMaterials.forEach(m=>m.clippingPlanes=plane?[plane]:[]);renderer.render(scene,camera);return canvas.toDataURL('image/png');};
 try{
  const views=[capture([0,0,8],[0,1,0],new THREE.Plane(new THREE.Vector3(0,0,-1),.12)),capture([-8,0,0],[0,1,0],new THREE.Plane(new THREE.Vector3(1,0,0),.08)),capture([0,8,0],[0,0,-1],new THREE.Plane(new THREE.Vector3(0,-1,0),.15))];
  const slices=Array.from({length:7},(_,i)=>capture([0,8,0],[0,0,-1],new THREE.Plane(new THREE.Vector3(0,-1,0),1.55-i*.47)));
  materials.forEach(m=>m.clippingPlanes=[]);brain.scale.setScalar(.84);brain.position.y=1.30;
  if(head.cc0Model){const shell=head.cc0Model.clone(true);shell.traverse(o=>{if(!o.isMesh)return;const m=o.material.clone();m.onBeforeCompile=o.material.onBeforeCompile;o.material=m;materials.push(m);});scene.add(shell);}
  camera.left=-2.95;camera.right=2.95;camera.top=3.83;camera.bottom=-3.83;camera.updateProjectionMatrix();
  const miniature=capture([-9,.25,-.3],[0,1,0],null);
  return {views,slices,miniature,provenance:'HRA/CC0 model render; illustrative cutaways, not MRI'};
 }finally{materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();}
}
