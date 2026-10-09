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

export async function createBrainScene({canvas,modelUrl='./assets/models/hra-allen-brain-v1.4.glb',quality='high'}={}){
 if(!canvas)throw Error('WebGL canvas missing');
 const gl=canvas.getContext('webgl2',{antialias:quality==='high',alpha:true,depth:true,stencil:false,preserveDrawingBuffer:true,powerPreference:quality==='mobile'?'low-power':'high-performance'});
 if(!gl)throw Error('WebGL2 unavailable');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#04060e');
 const camera=new THREE.PerspectiveCamera(47,16/9,.025,90);
 const renderer=new THREE.WebGLRenderer({canvas,context:gl,antialias:quality==='high',alpha:true,preserveDrawingBuffer:true});
 renderer.localClippingEnabled=true;
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=0.96;
 const profile=getVolumeQuality(quality);
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,profile.pixelRatio));
 const ambient=new THREE.AmbientLight(0x475d93,.60);scene.add(ambient);
 const blue=new THREE.PointLight(0x65d5ff,32,14);blue.position.set(3,3,4);scene.add(blue);
 const pink=new THREE.PointLight(0xff37a5,28,12);pink.position.set(-3,-1,1);scene.add(pink);
 const source=await loadAnatomicalAtlas({THREE,GLTFLoader,url:modelUrl});
 // Both licensed assets use +Y up and +Z anterior. Fit the brain into the
 // cranial vault, above the facial features; keep the GLB triangles unchanged.
 source.root.scale.setScalar(.90);source.root.position.y=1.30;
 scene.add(source.root);
 const material=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uRouteMix:{value:0},uRegion:{value:0},uVisibility:{value:1}},vertexShader:brainSurfaceShaders.vertex,fragmentShader:brainSurfaceShaders.fragment,side:THREE.FrontSide,transparent:true,depthWrite:true,depthTest:true});
 const zoneIndex={prefrontal:1,hippocampus:2,amygdala:3,striatum:4,parietal:5,temporal:6,insula:7,thalamus:8,cortex:9,cerebellum:10};
 const uniforms=[];
 source.root.traverse(object=>{
  if(!object.isMesh)return;
  const m=material.clone();m.uniforms.uTime={value:0};m.uniforms.uRouteMix={value:0};m.uniforms.uRegion={value:zoneIndex[object.userData.anatomicalRegion]||0};
  object.material=m;uniforms.push(m.uniforms);
 });
 // A nearest-surface depth prepass prevents 283 translucent atlas regions from
 // accumulating pale rear surfaces before the front cortex is composited.
 // Share the original immutable geometry; no asset triangles are altered.
 const depthRoot=new THREE.Group();depthRoot.name='Nearest anatomical surface';
 const depthMaterial=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:true,depthTest:true,side:THREE.FrontSide});
 source.root.updateMatrixWorld(true);
 source.root.traverse(object=>{
  if(!object.isMesh)return;
  const depthMesh=new THREE.Mesh(object.geometry,depthMaterial);
  depthMesh.matrixAutoUpdate=false;depthMesh.matrix.copy(object.matrixWorld);depthMesh.renderOrder=-5;
  depthRoot.add(depthMesh);
 });
 scene.add(depthRoot);
 const signals=createNeuralSignals(THREE,{mobile:quality==='mobile'});scene.add(signals.root);
 signals.root.scale.setScalar(.90);signals.root.position.y=1.30;
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
 let scanImages=null;
 try{scanImages=createModelScans(THREE,{atlas:source,head:subjectHead});}catch(error){console.warn('Model scan thumbnails unavailable; retaining schematic views.',error);}
 const haloGroup=new THREE.Group();scene.add(haloGroup);
 for(let j=0;j<3;j++){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.52+j*.23,.004,3,168),new THREE.MeshBasicMaterial({color:j===1?0xff6ab6:0x5edfff,transparent:true,opacity:.10,depthWrite:false}));
  ring.rotation.set(j*.4,j*.39,.6+j*.51);haloGroup.add(ring);
 }
 let composer=null;
 if(quality!=='mobile'){
  composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  // A single non-finite HDR sample must not poison all bloom blur levels.
  composer.addPass(new ShaderPass({uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);bvec4 bad=isnan(c);bvec4 huge=isinf(c);gl_FragColor=vec4(bad.x||huge.x?0.0:clamp(c.x,0.0,8.0),bad.y||huge.y?0.0:clamp(c.y,0.0,8.0),bad.z||huge.z?0.0:clamp(c.z,0.0,8.0),1.0);}'}));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1280,720),quality==='high'?.48:.30,.32,.90));
  composer.addPass(new OutputPass());
 }
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
   source.root.visible=exterior>0;subjectHead.root.visible=exterior>0;depthRoot.visible=exterior>0;
   const distance=portrait?1.26:1,centerZ=(portrait?.25:.35)*exterior;
   const centerX=-.45*(1-exterior),centerY=.45+.80*(1-exterior);
   camera.position.set(pose.position[0]*distance+centerX,pose.position[1]*distance+centerY,pose.position[2]*distance+centerZ);
   camera.lookAt(pose.target[0]+centerX,pose.target[1]+centerY,pose.target[2]+centerZ);
   camera.rotateZ(pose.roll);
   camera.updateMatrixWorld(true);
   atmosphere.update(pose.time,camera,exterior);
   uniforms.forEach(u=>{u.uTime.value=pose.time;u.uRouteMix.value=mix;u.uVisibility.value=exterior;});
   signals.update(pose.time,mix,camera);subjectHead.update(pose.time,mix,exterior);
   volumeUniforms.uTime.value=pose.time;volumeUniforms.uRouteMix.value=mix;
   fog.updateMatrixWorld(true);volumeUniforms.uCameraLocal.value.copy(camera.position);fog.worldToLocal(volumeUniforms.uCameraLocal.value);
   haloGroup.rotation.y=pose.time*.013;
   pink.intensity=20+12*(1-mix);blue.intensity=18+17*mix;
   if(composer)composer.render(0);else renderer.render(scene,camera);
   lastTime=pose.time;
   return true;
 }
 function destroy(){
  disposed=true;canvas.removeEventListener('webglcontextlost',onLost);
  scene.traverse(o=>{o.geometry?.dispose(); if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});
  subjectHead.dispose();signals.dispose();atmosphere.dispose();composer?.dispose();renderer.dispose();
 }
 function getProjectedRegions(){
  signals.root.updateMatrixWorld(true);
  return Object.fromEntries(Object.entries(signals.anchors).map(([name,xyz])=>{const p=signals.root.localToWorld(new THREE.Vector3(...xyz)).project(camera);return [name,{x:(p.x+1)/2,y:(1-p.y)/2,visible:p.z>=-1&&p.z<=1&&Math.abs(p.x)<1&&Math.abs(p.y)<1}];}));
 }
 return {render,resize,destroy,model:source,quality,scanImages,getProjectedRegions,getDebugState:()=>({mode:'3d',lastTime,camera:camera.position.toArray(),exteriorVisible:source.root.visible,regions:getProjectedRegions(),neuralRoutes:signals.routeCount,modelScans:scanImages?.views.length||0,modelMeshes:source.meshCount,headVertices:subjectHead.headVertexCount||subjectHead.mesh.geometry.attributes.position.count,headSource:subjectHead.headSource||'procedural',headMeshCount:subjectHead.headMeshCount||0,volumeSteps:volumeSpec.steps,threeVersion:THREE.REVISION})};
}
