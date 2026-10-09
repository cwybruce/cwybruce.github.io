/** Human Reference Atlas/Allen male brain v1.4, CC BY 4.0. See docs/ASSET_CREDITS.md. */
export const ATLAS_MODEL={
  name:'HRA Allen Human Brain Atlas, male v1.4',
  uri:'./assets/models/hra-allen-brain-v1.4.glb',
  source:'https://cdn.humanatlas.io/digital-objects/ref-organ/brain-male/v1.4/assets/3d-allen-m-brain.glb',
  license:'https://creativecommons.org/licenses/by/4.0/',
  sha256:'c97d7d0b9ff0baebbdec5566fa7b08d789195ef965e0bd04cf743a8d683882db',
  byteLength:11982812
};

export function classifyStructure(name=''){
 const n=String(name).toLowerCase();
 if(/pons|pontine|medulla|midbrain|tegmentum|colliculus|substantia_nigra|red_nucleus|cerebral_peduncle/.test(n))return 'brainstem';
 if(/corpus_callosum|fornix|commissure/.test(n))return 'connections';
 if(/cerebell|小脑/.test(n))return 'cerebellum';
 if(/hippocamp|海马/.test(n))return 'hippocampus';
 if(/amygdal|杏仁/.test(n))return 'amygdala';
 if(/striatu|caudate|putamen|纹状/.test(n))return 'striatum';
 if(/prefrontal|fronto|frontal|额叶/.test(n))return 'prefrontal';
 if(/parietal|顶叶/.test(n))return 'parietal';
 if(/temporal|颞叶/.test(n))return 'temporal';
 if(/insula|岛叶/.test(n))return 'insula';
 if(/thalam|丘脑/.test(n))return 'thalamus';
 return 'cortex';
}
export async function loadAnatomicalAtlas({THREE,GLTFLoader,url=ATLAS_MODEL.uri,timeoutMs=40000}){
 if(!url)throw Error('Anatomical GLB URL is required');
 const loader=new GLTFLoader();
 const load=loader.loadAsync(url);
 let timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('3D anatomical model load timeout')),timeoutMs);});
 try{
  const gltf=await Promise.race([load,timeout]);
  if(!gltf?.scene)throw Error('Invalid anatomical GLB scene');
  const box=new THREE.Box3().setFromObject(gltf.scene);
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const largest=Math.max(size.x,size.y,size.z);
  if(!Number.isFinite(largest)||largest<=0)throw Error('Anatomical mesh bounds are invalid');
  const scale=4.4/largest;
  const root=new THREE.Group();root.name='HRA licensed anatomical model';
  gltf.scene.scale.setScalar(scale);
  gltf.scene.position.copy(center).multiplyScalar(-scale);
  root.add(gltf.scene);
  let meshCount=0;
  root.traverse(object=>{if(object.isMesh){meshCount++;object.userData.anatomicalRegion=classifyStructure(object.name||object.parent?.name);}});
  if(!meshCount)throw Error('Anatomical GLB does not contain any mesh');
  return {root,meshCount,dimensions:[size.x*scale,size.y*scale,size.z*scale],scale,source:ATLAS_MODEL.source,asset:gltf.scene};
 } finally{clearTimeout(timer);}
}
