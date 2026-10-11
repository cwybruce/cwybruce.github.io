import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {getHeadPlacement} from '../mind-dive/three/subject-head.mjs';
import {loadAnatomicalAtlas} from '../mind-dive/three/atlas-loader.mjs';
import {sampleSurface,hash,fitPortraitPoint} from './particles.mjs';

const vertex=`attribute float aSeed;varying float vSeed;varying float vRim;varying float vY;varying float vLight;varying float vX;varying float vJaw;
 uniform float uTime;uniform float uRatio;uniform float uSize;uniform float uSurface;
 void main(){vSeed=aSeed;vY=position.y;vX=position.x;vec4 view=modelViewMatrix*vec4(position,1.);
 vec3 n=normalize(normalMatrix*normal);vRim=pow(1.-abs(dot(n,normalize(-view.xyz))),1.8);vLight=pow(max(0.,dot(n,normalize(vec3(-.35,.65,.8)))),2.);
 vJaw=pow(max(0.,dot(n,normalize(vec3(.35,-.65,.8)))),2.)*exp(-pow((position.y+1.0)/.75,2.));
 gl_Position=projectionMatrix*view;gl_PointSize=uRatio*uSize*(.5+1.4*aSeed)*mix(1.,mix(3.,1.65,uSurface),step(.993,aSeed))*(1.+.1*sin(uTime*.7+aSeed*30.));}`;
const fragment=`precision highp float;varying float vSeed;varying float vRim;varying float vY;varying float vLight;varying float vX;varying float vJaw;
 uniform float uTime;uniform float uIntensity;uniform float uSurface;uniform float uBrain;
 void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;
 float core=pow(1.-d,1.4);float pulse=.72+.28*sin(uTime*1.3+vSeed*60.);
 vec3 color=mix(vec3(.34,.48,.85),vec3(.82,.72,1.),vSeed);
 float hot=smoothstep(.9,1.7,vY)*(1.-smoothstep(2.2,2.8,vY));
 color=mix(color,vec3(1.,.02,.49),mix(.28+vSeed*.4,hot*.58,uSurface));
 color=mix(color,vec3(.15,.55,.85),step(.98,vSeed)*(1.-uSurface));
 color=mix(color,mix(vec3(.1,.8,1.),vec3(1.,.05,.6),smoothstep(-.7,.7,vX)),uBrain);
 float rim=mix(1.,vRim,uSurface);
 gl_FragColor=vec4(color*(.65+rim*.9+vLight*uSurface*.45+vJaw*uSurface*.65)*uIntensity,core*(mix(.055,.75,rim)+vLight*uSurface*.24+vJaw*uSurface*.30)*pulse);}`;
function points(samples,{size=1.5,intensity=1.0,surface=true,brain=false}={}){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(samples.positions,3));g.setAttribute('normal',new THREE.BufferAttribute(samples.normals,3));g.setAttribute('aSeed',new THREE.BufferAttribute(samples.seeds,1));
 const uniforms={uTime:{value:0},uRatio:{value:1},uSize:{value:size},uIntensity:{value:intensity},uSurface:{value:surface?1:0},uBrain:{value:brain?1:0}};
 const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 const object=new THREE.Points(g,material);return {object,uniforms};
}
function collectTriangles(root,predicate=()=>true,skinOnly=false){
 const data=[];root.updateMatrixWorld(true);const p=new THREE.Vector3();
 root.traverse(m=>{if(!m.isMesh)return;const ix=m.geometry.index?.array,attr=m.geometry.attributes.position;
  let skin=null;
  if(skinOnly&&ix){const parents=Int32Array.from({length:attr.count},(_,i)=>i),find=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;};for(let i=0;i<ix.length;i+=3){parents[find(ix[i+1])]=find(ix[i]);parents[find(ix[i+2])]=find(ix[i]);}const groups=new Map();for(let i=0;i<attr.count;i++){const id=find(i);if(!groups.has(id))groups.set(id,{count:0,box:new THREE.Box3()});const g=groups.get(id);g.count++;m.getVertexPosition(i,p).applyMatrix4(m.matrixWorld);g.box.expandByPoint(p);}const excluded=new Set();for(const [id,g] of groups){const size=g.box.getSize(new THREE.Vector3()),center=g.box.getCenter(new THREE.Vector3());const eye=g.count>300&&g.count<3000&&size.x<.9&&size.y<.9&&center.y>.5&&center.y<1.3&&center.z>1.2;const oral=g.count>300&&g.count<4000&&center.y<.5&&center.y>-1.5&&size.x<2&&g.box.max.z>1.9;if(eye||oral)excluded.add(id);}skin=i=>!excluded.has(find(i));}
  for(let i=0;i<(ix?.length||attr.count);i+=3){if(skin&&!skin(ix[i]))continue;const tri=[];for(let j=0;j<3;j++){m.getVertexPosition(ix?ix[i+j]:i+j,p).applyMatrix4(m.matrixWorld);tri.push(...p.toArray());}if(predicate(tri))data.push(...tri);}
 });return data;
}
function disposeTree(root){root.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();});}
function makeTrails(mobile){
 const root=new THREE.Group(),particles=[],normals=[],seeds=[];const curves=[];
 for(let i=0;i<(mobile?65:150);i++){
  const s=hash(i+200),angle=s*Math.PI*2;
  const start=new THREE.Vector3((s-.5)*.02,.92+(hash(i+800)-.5)*.02,.85+(hash(i+812)-.5)*.02);
  const end=new THREE.Vector3((hash(i+91)-.5)*4,2.5+hash(i+19)*3.2,-2.0-hash(i+6)*2.0);
  let bends;
  if(i%3===0){end.set((s-.5)*3,-1.8+hash(i+87)*1.1,-3-hash(i+7)*2);bends=[new THREE.Vector3((s-.5)*.8,.45-hash(i+44)*.55,.3),new THREE.Vector3((s-.5)*1.5,-.35-hash(i+22),-.6),new THREE.Vector3((s-.5)*2,-1.3+Math.sin(angle)*.5,-1.5)];}
  else if(i%3===1){bends=[new THREE.Vector3(Math.cos(angle)*.7,1.5+Math.sin(angle)*.6,1.1+Math.cos(angle)*.6),new THREE.Vector3((s-.5)*1.5,1.8+hash(i+9)*.6,-.25),new THREE.Vector3((s-.5)*2,2.0+Math.sin(angle)*.9,-1.6)];}
  else{bends=[new THREE.Vector3(Math.cos(angle)*.9,1.25+Math.sin(angle)*.9,.7+Math.cos(angle)*.8),new THREE.Vector3(Math.cos(angle+1.9)*.8,1.25+Math.sin(angle+1.9)*.7,.7+Math.cos(angle+1.9)*.8),new THREE.Vector3((s-.5)*2,1.5+Math.sin(angle)*1.3,-1.5)];}
  const curve=new THREE.CatmullRomCurve3([start,...bends,end]);
  curves.push(curve);
  if(i%6===0){const tube=new THREE.TubeGeometry(curve,mobile?32:50,.008+hash(i+1190)*.008,4,false),light=new THREE.MeshBasicMaterial({color:i%12===0?0xff82d0:0xff229a,transparent:true,opacity:.22,depthWrite:false,blending:THREE.AdditiveBlending});root.add(new THREE.Mesh(tube,light));}
  const coords=curve.getPoints(65),geo=new THREE.BufferGeometry().setFromPoints(coords);
  const mat=new THREE.LineBasicMaterial({color:i%5===0?0xb9c1ff:0xff229a,transparent:true,opacity:.06+hash(i+900)*.28,depthWrite:false,blending:THREE.AdditiveBlending});root.add(new THREE.Line(geo,mat));
  coords.forEach((p,j)=>{if(j>4&&j%2===0){particles.push(...p.toArray());normals.push(1,0,0);seeds.push(hash(i*70+j));}});
 }
 for(let i=0;i<(mobile?1400:4500);i++){const p=curves[i%curves.length].getPoint(.12+.88*hash(i+1700)),spread=.12+hash(i+1822)*.3;p.x+=(hash(i+2300)-.5)*spread;p.y+=(hash(i+2700)-.5)*spread;p.z+=(hash(i+3200)-.5)*spread;particles.push(...p.toArray());normals.push(1,0,0);seeds.push(hash(i+4400));}
 const sparks=points({positions:new Float32Array(particles),normals:new Float32Array(normals),seeds:new Float32Array(seeds)},{size:1.7,intensity:1.35,surface:false});root.add(sparks.object);
 const pulses=new THREE.Group();const spriteG=new THREE.SphereGeometry(.035,8,6),spriteM=new THREE.MeshBasicMaterial({color:0xff85d1});
 for(let i=0;i<24;i++){const m=new THREE.Mesh(spriteG,spriteM);pulses.add(m);}root.add(pulses);
 return {root,update(t){sparks.uniforms.uTime.value=t;pulses.children.forEach((m,i)=>m.position.copy(curves[i%curves.length].getPoint((t*.045+hash(i+43))%1)));}};
}
export async function createSpectrumScene(canvas,miniCanvas,{modelBase='./assets/models/',mobile=false,onStatus=()=>{}}={}){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});
 renderer.setClearColor(0x000000,1);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-5,5,4,-4,.1,80);
 camera.position.set(10,.45,2.25);camera.lookAt(0,.45,1.1);
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 const bloom=new UnrealBloomPass(new THREE.Vector2(100,100),.42,.24,.72);composer.addPass(bloom);composer.addPass(new OutputPass());
 const clouds=[];let time=22.5,disposed=false,observer;
 let miniRenderer,miniScene,miniCamera,miniPoints,meshes=0;
 try{
 const gltf=await new GLTFLoader().loadAsync(modelBase+'cc0-human-base.glb');
 const bounds=new THREE.Box3().setFromObject(gltf.scene),center=bounds.getCenter(new THREE.Vector3());
 const fit=getHeadPlacement({height:bounds.max.y-bounds.min.y,centerX:center.x,centerZ:center.z,topY:bounds.max.y});
 gltf.scene.scale.setScalar(fit.scale);gltf.scene.position.set(fit.x,fit.y,fit.z);
 const triangles=collectTriangles(gltf.scene,t=>[1,4,7].every(i=>t[i]>-2.4)&&[1,4,7].some(i=>t[i]<3.14),true);
 const fitted=[];for(let i=0;i<triangles.length;i+=3)fitted.push(...fitPortraitPoint(triangles.slice(i,i+3)));
 const head=points(sampleSurface(fitted,mobile?24000:48000),{size:1.15,intensity:1.5});head.object.position.set(0,-.25,.50);scene.add(head.object);clouds.push(head);disposeTree(gltf.scene);
 const trails=makeTrails(mobile);scene.add(trails.root);
 // Fixed surrounding field: white/pink sparks vary in depth and size.
 const field={positions:new Float32Array((mobile?1000:3500)*3),normals:new Float32Array((mobile?1000:3500)*3),seeds:new Float32Array(mobile?1000:3500)};
 for(let i=0;i<field.seeds.length;i++){field.positions.set([(hash(i+48)-.5)*7,(hash(i+18)-.5)*8,-1.2-hash(i+72)*6],i*3);field.normals.set([1,0,0],i*3);field.seeds[i]=hash(i+54);}
 const stars=points(field,{size:1.9,intensity:1.1,surface:false});scene.add(stars.object);clouds.push(stars);
 // Restrained solid emissive hubs, not a baked brain or reference image.
 const hubs=new THREE.Group();[[0,.92,.85,.065],[.25,1.75,-.45,.04],[0,.35,-.45,.035]].forEach(([x,y,z,r])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),new THREE.MeshBasicMaterial({color:0xffb0e6}));m.position.set(x,y,z);hubs.add(m);});scene.add(hubs);
 try{
  const atlas=await loadAnatomicalAtlas({THREE,GLTFLoader,url:modelBase+'hra-allen-brain-v1.4.glb'});
  miniPoints=points(sampleSurface(collectTriangles(atlas.root),mobile?2400:5000),{size:1.7,intensity:1.7,surface:false,brain:true});disposeTree(atlas.root);
  miniRenderer=new THREE.WebGLRenderer({canvas:miniCanvas,alpha:true,antialias:true,preserveDrawingBuffer:true});miniRenderer.setPixelRatio(1);miniRenderer.setClearColor(0,0);
  miniScene=new THREE.Scene();miniScene.add(miniPoints.object);miniCamera=new THREE.PerspectiveCamera(36,1,.1,30);miniCamera.position.set(7,2,3);miniCamera.lookAt(0,0,0);meshes=atlas.meshCount;
 }catch(e){onStatus('HRA 小图加载失败；主体仍为真实 CC0 模型粒子。');}
 function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);composer.setSize(r.width,r.height);const span=6.5;camera.left=-span*r.width/r.height/2;camera.right=-camera.left;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();clouds.forEach(p=>p.uniforms.uRatio.value=renderer.getPixelRatio());if(miniRenderer){const b=miniCanvas.getBoundingClientRect();miniRenderer.setSize(b.width,b.height,false);miniCamera.aspect=b.width/b.height;miniCamera.updateProjectionMatrix();}render(time);}
 function render(t){if(disposed)return;time=Math.max(0,Number.isFinite(t)?t:0);clouds.forEach(p=>p.uniforms.uTime.value=time);trails.update(time);composer.render();if(miniRenderer){miniPoints.uniforms.uTime.value=time;miniPoints.object.rotation.y=Math.sin(time*.15)*.12;miniRenderer.render(miniScene,miniCamera);}}
 observer=new ResizeObserver(resize);observer.observe(canvas);observer.observe(miniCanvas);resize();
 await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));resize();
 return {render,info:()=>({mode:'3d',headSource:'CC0-MakeHuman',headParticles:head.object.geometry.attributes.position.count,brainSource:meshes?'HRA':null,modelMeshes:meshes,time}),dispose(){disposed=true;observer.disconnect();disposeTree(scene);if(miniScene)disposeTree(miniScene);composer.dispose();renderer.dispose();miniRenderer?.dispose();}};
 }catch(error){observer?.disconnect();disposeTree(scene);if(miniScene)disposeTree(miniScene);composer.dispose();renderer.dispose();miniRenderer?.dispose();throw error;}
}
