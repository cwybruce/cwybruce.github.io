import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {loadAnatomicalAtlas} from './atlas-loader.mjs';
import {getVolumeQuality,createVolumeShader} from './volumetrics.mjs';
import {brainSurfaceShaders} from './shaders.mjs';
import {createNeuralSignals} from './neural-signals.mjs';
import {cameraPoseAt} from './timeline.mjs';
import {createSubjectHead,loadCC0Head} from './subject-head.mjs';
import {createModelScans} from './model-scans.mjs';
import {createNeuralAtmosphere} from './neural-atmosphere.mjs';
import {addSurfaceRelief,corticalLayerWeight} from './surface-relief.mjs';
import {loadMRITissue,loadMRISlices,getAnatomySourcePolicy} from './mri-tissue.mjs';
import {createAnatomyReview,getReviewLayerPolicy} from './anatomy-review.mjs';
import {applyAnatomyPlacement,createAnatomyDepth,ANATOMY_PLACEMENT,getAnatomyMaterialPolicy} from './anatomy-layout.mjs';

export async function createBrainScene({canvas,modelUrl='./assets/models/hra-allen-brain-v1.4.glb',quality='high',reviewLayer='composite',reviewStyle='final'}={}){
 const reviewPolicy=getReviewLayerPolicy(reviewLayer);
 if(!['final','clay'].includes(reviewStyle))throw new RangeError('Unknown review style');
 if(!canvas)throw Error('WebGL canvas missing');
 const gl=canvas.getContext('webgl2',{antialias:quality==='high',alpha:true,depth:true,stencil:false,preserveDrawingBuffer:true,powerPreference:quality==='mobile'?'low-power':'high-performance'});
 if(!gl)throw Error('WebGL2 unavailable');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#04060e');
 const camera=new THREE.PerspectiveCamera(47,16/9,.025,90);
 const renderer=new THREE.WebGLRenderer({canvas,context:gl,antialias:quality==='high',alpha:true,preserveDrawingBuffer:true});
 renderer.localClippingEnabled=true;
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.22;
 const profile=getVolumeQuality(quality);
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,profile.pixelRatio));
 const ambient=new THREE.AmbientLight(0x475d93,.60);scene.add(ambient);
 const blue=new THREE.PointLight(0x65d5ff,32,14);blue.position.set(3,3,4);scene.add(blue);
 const pink=new THREE.PointLight(0xff37a5,28,12);pink.position.set(-3,-1,1);scene.add(pink);
 const source=await loadAnatomicalAtlas({THREE,GLTFLoader,url:modelUrl});
 // Both licensed assets use +Y up and +Z anterior. Fit the brain into the
 // cranial vault, above the facial features; keep the GLB triangles unchanged.
 applyAnatomyPlacement(source.root,'atlas');
 scene.add(source.root);
 const material=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uRouteMix:{value:0},uRegion:{value:0},uVisibility:{value:1},uSurfaceLayer:{value:0},uSurfaceStrength:{value:1}},vertexShader:brainSurfaceShaders.vertex,fragmentShader:brainSurfaceShaders.fragment,side:THREE.FrontSide,transparent:true,depthWrite:true,depthTest:true});
 const zoneIndex={prefrontal:1,hippocampus:2,amygdala:3,striatum:4,parietal:5,temporal:6,insula:7,thalamus:8,cortex:9,cerebellum:10,brainstem:11,connections:12};
 const uniforms=[],anatomicalLayers={},corticalLayers=[];
 source.root.traverse(object=>{
  if(!object.isMesh)return;
  addSurfaceRelief(THREE,object.geometry);
  const region=object.userData.anatomicalRegion;anatomicalLayers[region]=(anatomicalLayers[region]||0)+1;
  const m=material.clone();m.uniforms.uTime={value:0};m.uniforms.uRouteMix={value:0};m.uniforms.uRegion={value:zoneIndex[object.userData.anatomicalRegion]||0};
  const p=getAnatomyMaterialPolicy(object.name,region);object.userData.visualRole=p.role;
  if(p.role==='cortex'&&/_[LR]$/.test(object.name))corticalLayers.push({object,material:m,hemisphere:object.name.endsWith('_L')?-1:1});
  // The licensed deep geometry is an X-ray layer rather than a flat signal dot.
  // Cortex retains the nearest-surface prepass; deeper structures are visible
  // through it with restrained additive fill and their own region palette.
  m.uniforms.uSurfaceStrength.value=p.strength;m.depthTest=p.depthTest;m.depthWrite=p.depthWrite;m.blending=p.blending;object.renderOrder=p.renderOrder;
  object.material=m;uniforms.push(m.uniforms);
 });
 // A nearest-surface depth prepass prevents 283 translucent atlas regions from
 // accumulating pale rear surfaces before the front cortex is composited.
 // Share the original immutable geometry; no asset triangles are altered.
 const depthMaterial=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:true,depthTest:true,side:THREE.FrontSide});
 const depthRoot=createAnatomyDepth(THREE,source.root,depthMaterial);
 let depthIndex=0;source.root.traverse(o=>{if(o.isMesh)depthRoot.children[depthIndex++].visible=['cortex','cerebellum','brainstem'].includes(o.userData.visualRole);});
 scene.add(depthRoot);
 let tissue=null;
 // MRI geometry is diagnostic-only; normal visitors load just the HRA/head
 // and independent voxel HUD images, without this 10 MB request or timeout.
 if(reviewLayer==='mri')try{
  tissue=await loadMRITissue({THREE,loader:new GLTFLoader()});
  applyAnatomyPlacement(tissue.root,'tissue');scene.add(tissue.root);
  tissue.root.updateMatrixWorld(true);
  if(reviewLayer==='mri')depthRoot.children.forEach(o=>o.visible=false);
  tissue.root.traverse(object=>{
   if(!object.isMesh)return;
   addSurfaceRelief(THREE,object.geometry);
   const m=material.clone();m.uniforms.uRegion.value=13;object.material=m;uniforms.push(m.uniforms);
   corticalLayers.push({object,material:m,hemisphere:object.name.endsWith('_L')?-1:1});
   object.userData.visualRole='threshold-context';
   const d=new THREE.Mesh(object.geometry,depthMaterial);d.matrixAutoUpdate=false;d.matrix.copy(object.matrixWorld);d.renderOrder=-5;d.visible=reviewLayer==='mri';depthRoot.add(d);
  });
 }catch(error){console.warn('Supplementary MRI tissue unavailable; retaining complete HRA surface.',error);}
 const sourcePolicy=getAnatomySourcePolicy({tissueAvailable:Boolean(tissue),reviewLayer});
 const signals=createNeuralSignals(THREE,{mobile:quality==='mobile',atlas:source});scene.add(signals.root);
 applyAnatomyPlacement(signals.root,'atlas');
 const atmosphere=createNeuralAtmosphere(THREE,{mobile:quality==='mobile'});scene.add(atmosphere.root);
 const volumeSpec=createVolumeShader(quality);
 const volumeUniforms={uTime:{value:0},uRouteMix:{value:0},uCameraLocal:{value:new THREE.Vector3(0,0,5)}};
 const fog=new THREE.Mesh(new THREE.BoxGeometry(4.8,4.6,4.5),new THREE.ShaderMaterial({uniforms:volumeUniforms,vertexShader:volumeSpec.vertexShader,fragmentShader:volumeSpec.fragmentShader,transparent:true,depthWrite:false,depthTest:true,side:THREE.BackSide,blending:THREE.NormalBlending}));
 fog.name='bounded volumetric neural field';scene.add(fog);
 fog.scale.setScalar(.84);fog.position.y=1.30;
 // The face is a real 3D subject, with a procedural fallback if the CC0 mesh cannot load.
 const subjectHead=createSubjectHead(THREE,{mobile:quality==='mobile'});
 scene.add(subjectHead.root);
 try{
   await loadCC0Head(THREE,GLTFLoader,subjectHead,{url:'./assets/models/cc0-human-base.glb'});
 }catch(error){
   console.warn('Licensed CC0 human head unavailable; keeping the procedural 3D face.',error);
 }
 applyAnatomyPlacement(subjectHead.root,'head');
 let scanImages=null;
 let tissueSlices=null;try{tissueSlices=await loadMRISlices();}catch(error){console.warn('Specimen slices unavailable; retaining actual model sections.',error);}
 try{scanImages=createModelScans(THREE,{atlas:source,head:subjectHead,tissueSlices});}catch(error){console.warn('Model scan thumbnails unavailable; retaining schematic views.',error);}
 const haloGroup=new THREE.Group();scene.add(haloGroup);
 for(let j=0;j<3;j++){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.52+j*.23,.004,3,168),new THREE.MeshBasicMaterial({color:j===1?0xff6ab6:0x5edfff,transparent:true,opacity:.10,depthWrite:false}));
  ring.rotation.set(j*.4,j*.39,.6+j*.51);haloGroup.add(ring);
 }
 let composer=null;
 if(quality!=='mobile'&&reviewStyle!=='clay'){
  composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  // A single non-finite HDR sample must not poison all bloom blur levels.
  composer.addPass(new ShaderPass({uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);bvec4 bad=isnan(c);bvec4 huge=isinf(c);gl_FragColor=vec4(bad.x||huge.x?0.0:clamp(c.x,0.0,8.0),bad.y||huge.y?0.0:clamp(c.y,0.0,8.0),bad.z||huge.z?0.0:clamp(c.z,0.0,8.0),1.0);}'}));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1280,720),quality==='high'?.48:.30,.32,.90));
  composer.addPass(new OutputPass());
 }
 const review=createAnatomyReview(THREE,{roots:{hra:source.root,tissue:tissue?.root,head:subjectHead.root,signals:signals.root,atmosphere:atmosphere.root},layer:reviewLayer,style:reviewStyle,depthRoot,decorations:[fog,haloGroup],headModel:subjectHead.cc0Model,primarySource:ANATOMY_PLACEMENT.primarySource});
 if(reviewStyle==='clay'){ambient.color.set(0xffffff);ambient.intensity=.5;blue.color.set(0xffffff);pink.color.set(0xffffff);renderer.toneMappingExposure=1;}
 let disposed=false;
 let lastTime=0;
 let portrait=false;
 const onLost=e=>{e.preventDefault();disposed=true;window.dispatchEvent(new CustomEvent('consciousness-webgl-failed',{detail:'WebGL context lost'}));};
 canvas.addEventListener('webglcontextlost',onLost);
 function resize(width=canvas.clientWidth||1280,height=canvas.clientHeight||720){
   const w=Math.max(1,Math.round(width)),h=Math.max(1,Math.round(height));
   portrait=h>w;
   camera.aspect=w/h;
   if(w>=900)camera.setViewOffset(w,h,-Math.round(w*.055),0,w,h);else camera.clearViewOffset();
   camera.updateProjectionMatrix();renderer.setSize(w,h,false);composer?.setSize(w,h);
 }
 resize();
 function render(t,visual={}){
   if(disposed)return false;
   const pose=cameraPoseAt(t),mix=visual.cyanMix??pose.cyanMix;
   // Fade enclosing surfaces before the camera enters them. Keeping opaque
   // DoubleSide anatomy in an interior shot exposes enormous backface triangles.
   const near=Math.max(0,Math.min(1,(pose.radius-3.4)/2.3));
   const exterior=near*near*(3-2*near);
   source.root.visible=exterior>0&&sourcePolicy.atlasVisible;subjectHead.root.visible=exterior>0;depthRoot.visible=exterior>0;if(tissue)tissue.root.visible=exterior>0&&sourcePolicy.tissueVisible;
   const distance=portrait?1.26:1,centerZ=(portrait?.25:.35)*exterior;
   const centerX=-.45*(1-exterior),centerY=.45+.80*(1-exterior);
   camera.position.set(pose.position[0]*distance+centerX,pose.position[1]*distance+centerY,pose.position[2]*distance+centerZ);
   camera.lookAt(pose.target[0]+centerX,pose.target[1]+centerY,pose.target[2]+centerZ);
   camera.rotateZ(pose.roll);
   camera.updateMatrixWorld(true);
   corticalLayers.forEach(({object,material:m,hemisphere,supplemented})=>{
    const layer=corticalLayerWeight(hemisphere,camera.position.x);m.uniforms.uSurfaceLayer.value=layer;
    m.depthTest=layer===0&&!supplemented;m.depthWrite=layer===0&&!supplemented;m.blending=layer>0?THREE.AdditiveBlending:THREE.NormalBlending;object.renderOrder=layer>0?3:supplemented?2:0;
   });
   atmosphere.update(pose.time,camera,exterior);
   uniforms.forEach(u=>{u.uTime.value=pose.time;u.uRouteMix.value=mix;u.uVisibility.value=exterior;});
   signals.update(pose.time,mix,camera,exterior);subjectHead.update(pose.time,mix,exterior);
   volumeUniforms.uTime.value=pose.time;volumeUniforms.uRouteMix.value=mix;
   fog.updateMatrixWorld(true);volumeUniforms.uCameraLocal.value.copy(camera.position);fog.worldToLocal(volumeUniforms.uCameraLocal.value);
   haloGroup.rotation.y=pose.time*.013;
   pink.intensity=20+12*(1-mix);blue.intensity=18+17*mix;
   if(reviewStyle==='clay'){pink.intensity=5;blue.intensity=22;}
   review.apply();
   if(composer)composer.render(0);else renderer.render(scene,camera);
   lastTime=pose.time;
   return true;
 }
 function destroy(){
  disposed=true;canvas.removeEventListener('webglcontextlost',onLost);
  review.dispose();
  scene.traverse(o=>{o.geometry?.dispose(); if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});
  subjectHead.dispose();signals.dispose();atmosphere.dispose();composer?.dispose();renderer.dispose();
 }
 function getProjectedRegions(){
  signals.root.updateMatrixWorld(true);
  return Object.fromEntries(Object.entries(signals.anchors).map(([name,xyz])=>{const p=signals.root.localToWorld(new THREE.Vector3(...xyz)).project(camera);return [name,{x:(p.x+1)/2,y:(1-p.y)/2,visible:p.z>=-1&&p.z<=1&&Math.abs(p.x)<1&&Math.abs(p.y)<1}];}));
 }
 const anatomyState=()=>Object.fromEntries(Object.entries({hra:source.root,tissue:tissue?.root,head:subjectHead.cc0Model}).map(([name,root])=>[name,root?{visible:root.visible,position:root.position.toArray(),scale:root.scale.toArray(),bounds:{min:new THREE.Box3().setFromObject(root).min.toArray(),max:new THREE.Box3().setFromObject(root).max.toArray()},matrix:root.matrixWorld.toArray()}:null]));
 return {render,resize,destroy,model:source,quality,scanImages,getProjectedRegions,getDebugState:()=>({mode:'3d',lastTime,camera:camera.position.toArray(),exteriorVisible:source.root.visible,regions:getProjectedRegions(),neuralRoutes:signals.routeCount,corticalBranches:signals.surfaceEndpoints.length,modelScans:scanImages?.views.length||0,modelMeshes:source.meshCount,primaryAnatomy:sourcePolicy.primarySource,tissueActive:sourcePolicy.tissueVisible,tissueSource:tissue?.source||'HRA',tissueVertices:tissue?.vertexCount||0,neckFibers:subjectHead.surfaceFiberCount||0,headVertices:subjectHead.headVertexCount||subjectHead.mesh.geometry.attributes.position.count,headSource:subjectHead.headSource||'procedural',headMeshCount:subjectHead.headMeshCount||0,anatomicalLayers:{...anatomicalLayers},volumeSteps:volumeSpec.steps,threeVersion:THREE.REVISION,review:{layer:reviewLayer,style:reviewStyle,available:review.available,anatomy:review.enabled?anatomyState():undefined}})};
}
