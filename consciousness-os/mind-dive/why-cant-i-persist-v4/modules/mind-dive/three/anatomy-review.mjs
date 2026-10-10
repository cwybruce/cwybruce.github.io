/** Offline review only: visibility is enforced after the normal absolute-time update. */
export function getReviewLayerPolicy(layer='composite'){
 if(!['composite','hra','mri','head'].includes(layer))throw new RangeError(`Unknown review layer: ${layer}`);
 return {hra:layer==='composite'||layer==='hra',tissue:layer==='composite'||layer==='mri',head:layer==='composite'||layer==='head',signals:layer==='composite',atmosphere:layer==='composite'};
}

export function createAnatomyReview(THREE,{roots,layer='composite',style='final',depthRoot,decorations=[],headModel,primarySource='both'}={}){
 if(!['clay','final'].includes(style))throw new RangeError(`Unknown review style: ${style}`);
 const policy=getReviewLayerPolicy(layer),enabled=style==='clay'||layer!=='composite';
 const available=layer!=='mri'||Boolean(roots.tissue),replacements=[];
 if(style==='clay')for(const [name,root]of Object.entries(roots)){
  if(!root||!['hra','tissue','head'].includes(name))continue;
  (name==='head'&&headModel?headModel:root).traverse(o=>{
   if(!o.isMesh)return;
   const original=o.material;
   const clay=new THREE.MeshStandardMaterial({color:name==='head'?0x9b9fa6:0xb8bec7,roughness:.72,metalness:0,side:THREE.FrontSide,clippingPlanes:original.clippingPlanes});
   if(name==='head'&&layer==='composite'){clay.transparent=true;clay.opacity=.10;clay.depthWrite=false;}
   // The body asset contains separate eyelashes/eyeballs. Keep the same shell
   // selection as production when showing the real clipped head.
   if(name==='head'&&o.geometry.getAttribute('aShellWeight'))clay.onBeforeCompile=shader=>{
    shader.vertexShader='attribute float aShellWeight;varying float vShellWeight;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvShellWeight=aShellWeight;');
    shader.fragmentShader='varying float vShellWeight;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vShellWeight<.5)discard;');
   };
   replacements.push({object:o,original,clay,order:o.renderOrder});o.material=clay;o.renderOrder=0;
  });
 }
 let disposed=false;
 return {available,policy,enabled,apply(){
  if(!enabled||disposed)return;
  for(const [name,root]of Object.entries(roots))if(root)root.visible=Boolean(policy[name])&&(style!=='clay'||!['signals','atmosphere'].includes(name));
  if(layer==='composite'&&primarySource==='HRA'&&roots.tissue)roots.tissue.visible=false;
  for(const root of decorations)root.visible=style!=='clay'&&policy.atmosphere;
  if(depthRoot)depthRoot.visible=style!=='clay'&&(policy.hra||policy.tissue);
  if(style==='clay'&&roots.head&&headModel)roots.head.children.forEach(o=>{o.visible=o===headModel;});
 },dispose(){
  if(disposed)return;disposed=true;
  for(const {object,original,clay,order}of replacements){object.material=original;object.renderOrder=order;clay.dispose();}
 }};
}
