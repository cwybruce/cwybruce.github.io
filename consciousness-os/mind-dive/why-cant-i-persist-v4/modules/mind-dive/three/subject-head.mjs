import {createNeckFilaments} from './neck-filaments.mjs';
/** Procedural translucent 3D human head shell, including facial profile and neck.
 * Geometry is authored mathematically; no screenshot, baked video or CSS pseudo-3D.
 * Real HRA cortex is rendered separately through this decorative enclosure.
 */
const HEAD_RINGS=Object.freeze([
 [3.12,.12,.15,.05], [2.95,1.13,.88,-.05], [2.72,1.72,1.32,-.08],
 [2.34,2.05,1.63,-.15], [1.85,2.17,1.79,-.19], [1.28,2.18,1.85,-.12],
 [.65,2.04,1.80,-.06], [.15,1.85,1.63,.02],[-.35,1.66,1.55,.13],
 [-.80,1.43,1.38,.19],[-1.20,1.16,1.16,.28],[-1.53,1.04,.94,.12],
 [-1.90,.81,.78,-.03],[-2.34,.72,.72,-.15],[-2.92,.78,.77,-.22],[-3.55,.90,.85,-.30]
]);
const gaussian=(x,m,width)=>Math.exp(-Math.pow((x-m)/width,2));
function interpolateRing(y){
 if(y>=HEAD_RINGS[0][0])return HEAD_RINGS[0];
 const last=HEAD_RINGS.length-1;
 if(y<=HEAD_RINGS[last][0])return HEAD_RINGS[last];
 let i=0;while(i<last-1&&y<HEAD_RINGS[i+1][0])i++;
 const top=HEAD_RINGS[i],bot=HEAD_RINGS[i+1];
 const t=(top[0]-y)/(top[0]-bot[0]);
 const ease=t*t*(3-2*t);
 return [y,...[1,2,3].map(j=>top[j]+(bot[j]-top[j])*ease)];
}
/** Textures and index buffers stay fixed across time; only Shader uniforms animate. */
export function makeHeadGeometry(THREE,{meridians=120,parallels=112}={}){
 const positions=[],uvs=[],indices=[];
 const top=HEAD_RINGS[0][0],bottom=HEAD_RINGS.at(-1)[0];
 for(let j=0;j<=parallels;j++){
   const v=j/parallels,y=top+(bottom-top)*v;
   const [_,rx,rz,shift]=interpolateRing(y);
   for(let i=0;i<=meridians;i++){
     const u=i/meridians,theta=u*Math.PI*2;
     const front=Math.pow(Math.max(0,Math.sin(theta)),12);
     // nose bridge, nose tip, philtrum, lips and chin are real vertices.
     const nose=.85*gaussian(y,.55,.39)+.25*gaussian(y,1.13,.26);
     const lips=.25*gaussian(y,-.38,.17)+.12*gaussian(y,-.10,.17);
     const chin=.13*gaussian(y,-1.05,.31);
     const eyeInset=-.20*gaussian(y,1.33,.18)*Math.pow(Math.max(0,Math.sin(theta)),6);
     const ear=.22*gaussian(y,.22,.35)*Math.pow(Math.abs(Math.cos(theta)),12);
     const x=rx*Math.cos(theta)+Math.sign(Math.cos(theta))*ear;
     const z=shift+rz*Math.sin(theta)+(nose+lips+chin+eyeInset)*front;
     positions.push(x,y,z);uvs.push(u,v);
   }
 }
 for(let j=0;j<parallels;j++)for(let i=0;i<meridians;i++){
  const a=j*(meridians+1)+i,b=a+meridians+1;
  indices.push(a,b,a+1,b,b+1,a+1);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 return geometry;
}
export const headShader={
 vertex:`varying vec3 vNormal;varying vec3 vEye;varying vec3 vObject;
 void main(){vObject=position;vec4 view=modelViewMatrix*vec4(position,1.0);
 vNormal=normalize(normalMatrix*normal);vEye=normalize(-view.xyz);
 gl_Position=projectionMatrix*view;}`,
 fragment:`precision highp float;varying vec3 vNormal;varying vec3 vEye;varying vec3 vObject;
 uniform float uTime;uniform float uCyan;uniform float uVisibility;
 void main(){vec3 n=normalize(vNormal);vec3 eye=normalize(vEye);
 float edge=pow(1.0-abs(dot(n,eye)),2.9);
 float scan=.5+.5*sin(vObject.y*46.0+uTime*.85);
 float fiber=.5+.5*sin(vObject.x*18.0+vObject.y*32.0+sin(vObject.z*12.0));
 vec3 blue=vec3(.09,.49,.97),cyan=vec3(.15,.91,1.0),rose=vec3(.58,.23,.81);
 vec3 color=mix(blue,cyan,.36+.36*scan);
 color=mix(color,rose,.10*(1.0-uCyan));
 float alpha=.035+.66*edge+.042*scan+.027*fiber;
 alpha*=smoothstep(-3.55,-2.4,vObject.y);
 alpha=clamp(alpha,0.0,.79);
 gl_FragColor=vec4(color*mix(.32,1.5,edge),alpha*uVisibility);}`
};
export function createSubjectHead(THREE,{mobile=false}={}){
 const geometry=makeHeadGeometry(THREE,{meridians:mobile?70:120,parallels:mobile?64:112});
 const uniforms={uTime:{value:0},uCyan:{value:0},uVisibility:{value:1}};
 const material=new THREE.ShaderMaterial({uniforms,vertexShader:headShader.vertex,fragmentShader:headShader.fragment,transparent:true,depthWrite:false,depthTest:false,side:THREE.DoubleSide,blending:THREE.NormalBlending});
 const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=9;mesh.name='3D transparent human facial profile';
 const root=new THREE.Group();root.add(mesh);
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(.49,.73,2.25,32,8),new THREE.MeshBasicMaterial({color:0x316caa,transparent:true,opacity:.065,side:THREE.DoubleSide,depthWrite:false}));
 neck.position.set(0,-2.58,-.1);root.add(neck);
 return {root,mesh,mobile,update(t,mix,visibility=1){uniforms.uTime.value=t;uniforms.uCyan.value=mix;uniforms.uVisibility.value=visibility;neck.material.opacity=.065*visibility;},dispose(){root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}};
}

/** CC0 MakeHuman whole-body asset is cut by a world-space clipping plane,
 * leaving a realistic anatomical face / scalp / upper neck silhouette.
 * Source: Innerscene MakeHuman/MPFB rigged base, CC0.
 */
export function getHeadPlacement({height,centerX=0,centerZ=0,topY=0}){
  if(!Number.isFinite(height)||height<=0)throw Error('Human head source bounding box invalid');
  const scale=5.8/(height*.165);
  // The whole-body bounds include forward feet. Its sagittal center is 1.415
  // normalized units in front of the cranium; register the skull, not the body.
  return {scale,topY:3.15,clipY:-2.36,x:-centerX*scale+.11,y:3.15-topY*scale,z:-centerZ*scale+1.635};
}
// Keep the licensed geometry intact. Detached eye/oral components receive a
// lower scan weight, instead of lighting them as bright floating solid spheres.
function shellWeights(THREE,mesh){
 const geometry=mesh.geometry,count=geometry.attributes.position.count;
 const parent=Int32Array.from({length:count},(_,i)=>i);
 const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 const index=geometry.index?.array;
 if(index)for(let i=0;i<index.length;i+=3){parent[find(index[i+1])]=find(index[i]);parent[find(index[i+2])]=find(index[i]);}
 const components=new Map(),point=new THREE.Vector3();
 for(let i=0;i<count;i++){const key=find(i);let c=components.get(key);if(!c){c={count:0,box:new THREE.Box3()};components.set(key,c);}c.count++;mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);c.box.expandByPoint(point);}
 const weights=new Float32Array(count).fill(1);
 for(const c of components.values()){
  const size=c.box.getSize(new THREE.Vector3()),center=c.box.getCenter(new THREE.Vector3());
  const eye=c.count>300&&c.count<3000&&size.x<.9&&size.y<.9&&center.y>.5&&center.y<1.3&&center.z>1.2;
  const oral=c.count>300&&c.count<4000&&center.y<.5&&center.y>-1.5&&size.x<2&&c.box.max.z>1.9;
  c.weight=eye?.025:oral?.08:1;
 }
 for(let i=0;i<count;i++)weights[i]=components.get(find(i)).weight;
 return weights;
}
export async function loadCC0Head(THREE,GLTFLoader,subject,{url='./assets/models/cc0-human-base.glb',timeoutMs=10000}={}){
 let timeout;
 try{
   const gltf=await Promise.race([
     new GLTFLoader().loadAsync(url),
     new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('CC0 head timeout')),timeoutMs);})
   ]);
   if(!gltf?.scene)throw Error('CC0 head GLB scene unavailable');
   gltf.scene.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(gltf.scene);
   const height=bounds.max.y-bounds.min.y;
   const center=bounds.getCenter(new THREE.Vector3());
   const placement=getHeadPlacement({height,centerX:center.x,centerZ:center.z,topY:bounds.max.y});
   gltf.scene.scale.setScalar(placement.scale);
   gltf.scene.position.set(placement.x,placement.y,placement.z);
   gltf.scene.updateMatrixWorld(true);
   const clip=new THREE.Plane(new THREE.Vector3(0,1,0),-placement.clipY);
   const matte=new THREE.MeshPhysicalMaterial({color:0x183d64,emissive:0x0a2649,emissiveIntensity:.28,
      roughness:.32,metalness:.12,clearcoat:.4,clearcoatRoughness:.26,transparent:true,opacity:.12,
      depthWrite:false,side:THREE.FrontSide,clippingPlanes:[clip]});
   // Camera-dependent Fresnel makes the real anatomical face readable over
   // the illuminated cortex while retaining an X-ray-transparent interior.
   matte.depthTest=false;
   matte.onBeforeCompile=(shader)=>{
     const marker='#include <dithering_fragment>';
     if(!shader.fragmentShader.includes(marker))throw Error('Unsupported Three.js PBR shader');
     shader.vertexShader='attribute float aShellWeight;varying float vShellWeight;varying vec3 vScanWorld;\n'+shader.vertexShader;
     shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvShellWeight=aShellWeight;').replace('#include <project_vertex>','#include <project_vertex>\nvScanWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
     shader.fragmentShader='varying float vShellWeight;varying vec3 vScanWorld;\n'+shader.fragmentShader;
     shader.fragmentShader=shader.fragmentShader.replace(marker,`
      vec3 scanNormal=normalize(normal),scanEye=normalize(vViewPosition);
      float faceRim=pow(max(0.0,1.0-abs(dot(scanNormal,scanEye))),2.0);
      float faceLight=pow(max(0.0,dot(scanNormal,normalize(vec3(-.35,.65,.85)))),2.0);
      float faceSpecular=pow(max(0.0,dot(scanNormal,normalize(scanEye+vec3(-.35,.65,.85)))),32.0);
      float scanEdge=pow(.5+.5*sin(vScanWorld.y*125.0),18.0);
      float filament=pow(.5+.5*sin(vScanWorld.y*39.0+sin(vScanWorld.z*19.0)*3.0+vScanWorld.x*28.0),28.0);
      float neckFade=smoothstep(-2.36,-1.75,vScanWorld.y);
      float faceZone=smoothstep(.35,1.7,vScanWorld.z)*(1.0-smoothstep(1.4,2.25,vScanWorld.y));
      gl_FragColor.rgb=vec3(.018,.065,.16)+vec3(.24,.78,1.65)*faceRim
        +vec3(.045,.17,.42)*faceLight*faceZone+vec3(.22,.54,.90)*faceSpecular*faceZone;
      gl_FragColor.a=clamp((.012+.050*faceZone+faceRim*.90*mix(.24,1.0,faceZone)+faceLight*faceZone*.20+scanEdge*.003+filament*.018)*opacity*8.0,0.0,.76)*vShellWeight*neckFade;
      #include <dithering_fragment>
     `);
   };
   let meshes=0,vertices=0;const scanLines=[];
   gltf.scene.traverse(obj=>{
     if(!obj.isMesh)return;
     obj.geometry.setAttribute('aShellWeight',new THREE.Float32BufferAttribute(shellWeights(THREE,obj),1));
     const ix=obj.geometry.index?.array,weights=obj.geometry.getAttribute('aShellWeight');
     if(ix)for(let i=0;i<ix.length;i+=9){const triangle=[ix[i],ix[i+1],ix[i+2]];if(triangle.some(k=>k===undefined||weights.getX(k)<.5))continue;const points=triangle.map(k=>obj.getVertexPosition(k,new THREE.Vector3()).applyMatrix4(obj.matrixWorld));if(points.some(v=>v.y<placement.clipY||v.y>1.85))continue;for(const [a,b]of [[0,1],[1,2],[2,0]])scanLines.push(...points[a].toArray(),...points[b].toArray());}
     obj.material=matte;obj.renderOrder=10;meshes++;vertices+=obj.geometry.attributes.position.count;
     obj.frustumCulled=false;
   });
   if(!meshes){matte.dispose();throw Error('No CC0 head mesh');}
   subject.root.add(gltf.scene);
   const surfaceFibers=createNeckFilaments(THREE,gltf.scene,{mobile:subject.mobile});subject.root.add(surfaceFibers.root);
   subject.surfaceFiberCount=surfaceFibers.endpoints.length;
   const wireGeometry=new THREE.BufferGeometry();wireGeometry.setAttribute('position',new THREE.Float32BufferAttribute(scanLines,3));
   const wireMaterial=new THREE.LineBasicMaterial({color:0x2878a7,transparent:true,opacity:.20,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending});
   const wire=new THREE.LineSegments(wireGeometry,wireMaterial);wire.name='CC0 face and neck scan topology';wire.renderOrder=11;subject.root.add(wire);
   subject.mesh.visible=false;
   subject.cc0Model=gltf.scene;
   subject.cc0Material=matte;
   subject.headSource='CC0-MakeHuman';
   subject.headMeshCount=meshes;
   subject.headVertexCount=vertices;
   const oldUpdate=subject.update;
   subject.update=(t,mix,visibility=1)=>{
     oldUpdate(t,mix,visibility);
     surfaceFibers.update(t,visibility);
     matte.opacity=(.10+.012*(.5+.5*Math.sin(t*.57)))*visibility;
     matte.emissiveIntensity=.28+.10*mix;
     wireMaterial.opacity=(subject.mobile?.009:.016)*visibility;
   };
   return {headSource:subject.headSource,meshes,placement};
 }finally{clearTimeout(timeout);}
}
