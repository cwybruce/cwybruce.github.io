import {AdditiveBlending,NormalBlending} from 'three';
const placement=(position,scale)=>Object.freeze({position:Object.freeze(position),rotation:Object.freeze([0,0,0]),scale:Object.freeze(Array.isArray(scale)?scale:[scale,scale,scale])});
/** Brain keeps its original proportions. Decorative CC0 skin is fitted to its
 * cranial envelope on three axes; source vertices stay unchanged. Not medical registration. */
export const ANATOMY_PLACEMENT=Object.freeze({
 primarySource:'HRA',
 atlas:placement([0,1.24,0],1.025),
 // Legacy threshold MRI remains available for isolated diagnosis only. Its
 // baked axis fit is documented; this transform does not undo that distortion.
 tissue:placement([0,1.33,0],.94),
 // Keep the verified enclosure; jaw depth is refined by directional surface light.
 head:placement([-.13,-.10,-.05],[1.32,1.14,1.20])
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
 if(/ventricle|central_canal|cerebellar_deep_nuclei/.test(name))role='context';
 else if(region==='brainstem'||region==='cerebellum')role=region;
 else if(['connections','hippocampus','amygdala','striatum','thalamus'].includes(region))role='deep';
 else if(/gyrus|gyri|lobule|operculum|cortex|occipital/.test(name)&&! /ventricle|canal/.test(name))role='cortex';
 const exterior=role==='cortex'||role==='cerebellum';
 const stemBody=/basilar_part_of_pons|pontine_tegmentum|medulla_oblongata|midbrain_tegmentum|cerebral_peduncle|cerebellar_peduncle/.test(name);
 const strength=role==='context'?.035:role==='deep'?(region==='connections'?.17:name.endsWith('_R')?.13:.38):role==='brainstem'?(stemBody?(name.endsWith('_R')?.45:1):.24):1;
 return {role,strength,depthWrite:exterior,depthTest:exterior,blending:exterior||role==='brainstem'?NormalBlending:AdditiveBlending,renderOrder:exterior?0:4};
}
