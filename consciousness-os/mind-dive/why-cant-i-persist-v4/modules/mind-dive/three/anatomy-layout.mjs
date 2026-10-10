import {AdditiveBlending,NormalBlending} from 'three';
const placement=(position,scale)=>Object.freeze({position:Object.freeze(position),rotation:Object.freeze([0,0,0]),scale:Object.freeze([scale,scale,scale])});
/** Uniform illustrative fit; unmodified specimen vertices, never medical registration. */
export const ANATOMY_PLACEMENT=Object.freeze({
 primarySource:'HRA',
 atlas:placement([0,1.24,0],1.025),
 // Legacy threshold MRI remains available for isolated diagnosis only. Its
 // baked axis fit is documented; this transform does not undo that distortion.
 tissue:placement([0,1.33,0],.94),
 head:placement([0,-.10,-.08],1.04)
});
export function applyAnatomyPlacement(root,name){
 const p=ANATOMY_PLACEMENT[name];if(!p?.position)throw new RangeError(`Unknown anatomy placement: ${name}`);
 root.position.fromArray(p.position);root.rotation.fromArray(p.rotation);root.scale.fromArray(p.scale);root.updateMatrixWorld(true);return root;
}
export function createAnatomyDepth(THREE,root,material){
 const depth=new THREE.Group();depth.name='Nearest anatomical surface';root.updateMatrixWorld(true);
 root.traverse(o=>{if(!o.isMesh)return;const mesh=new THREE.Mesh(o.geometry,material);mesh.matrixAutoUpdate=false;mesh.matrix.copy(o.matrixWorld);mesh.renderOrder=-5;depth.add(mesh);});return depth;
}

/** Semantic roles from genuine named atlas structures, not a clinical mapping. */
export function getAnatomyMaterialPolicy(name,region){
 let role='context';
 if(region==='brainstem'||region==='cerebellum')role=region;
 else if(['connections','hippocampus','amygdala','striatum','thalamus'].includes(region))role='deep';
 else if(/gyrus|gyri|lobule|operculum|cortex|occipital/.test(name)&&! /ventricle|canal/.test(name))role='cortex';
 const exterior=role==='cortex'||role==='cerebellum';
 const strength=role==='context'?.035:role==='deep'?(region==='connections'?.22:name.endsWith('_R')?.20:.50):role==='brainstem'?.85:1;
 return {role,strength,depthWrite:exterior,depthTest:exterior,blending:exterior?NormalBlending:AdditiveBlending,renderOrder:exterior?0:4};
}
