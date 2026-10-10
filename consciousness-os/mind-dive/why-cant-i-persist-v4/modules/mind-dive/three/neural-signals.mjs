import {neuralSignalShaders,tractShaders} from './shaders.mjs';
import {ANATOMY_PLACEMENT} from './anatomy-layout.mjs';

// Artist-authored anchors in the normalized atlas frame: illustrative routes,
// not tractography, medical region centroids or measured brain activity.
// Their 3D placement follows the approved reference's narrative composition.
const REFERENCE_ANCHORS={
 pfc:[-.82,.831,-1.085],amygdala:[-.62,.205,-1.570],striatum:[-.52,-.186,-.639],
 parietal:[-.65,1.334,1.235],hippocampus:[-.65,.040,.869],insula:[-1.02,-.933,1.188],
 thalamus:[-.38,-.171,.260],cerebellum:[-.78,-.902,-.936],brainstem:[0,-1.425,-.375],spine:[0,-4.0,-1.15]
};
// Preserve approved world-space reference hubs when uniformly fitting the
// specimen. Surface endpoints still come from that specimen's actual vertices.
const fit=ANATOMY_PLACEMENT.atlas;
export const SIGNAL_ANCHORS=Object.freeze(Object.fromEntries(Object.entries(REFERENCE_ANCHORS).map(([name,xyz])=>[name,Object.freeze(xyz.map((n,i)=>(n*.94+(i===1?1.33:0)-fit.position[i])/fit.scale[i]))])));
const ROUTES=[['pfc','striatum',0],['pfc','amygdala',0],['parietal','thalamus',1],
 ['hippocampus','thalamus',0],['insula','striatum',1],['striatum','thalamus',0],
 ['thalamus','cerebellum',1],['amygdala','hippocampus',0],['parietal','pfc',1],
 ['cerebellum','brainstem',1],['thalamus','brainstem',0],['brainstem','spine',1]];

/** Fixed bundled curves; only absolute-time GPU uniforms and hub scales animate. */
export function createNeuralSignals(THREE,{mobile=false,atlas=null}={}){
 const root=new THREE.Group();root.name='Illustrative neural signals';
 const strands=mobile?4:8,samples=mobile?28:46;
 const positions=[],phases=[],groups=[],linePositions=[],lineProgress=[],lineGroups=[],bundleCurves=[];
 for(let r=0;r<ROUTES.length;r++){
  const [start,end,group]=ROUTES[r],a=new THREE.Vector3(...SIGNAL_ANCHORS[start]),b=new THREE.Vector3(...SIGNAL_ANCHORS[end]);
  for(let i=0;i<strands;i++){
   const angle=i*2.39996323+r*.41,spread=.07+.11*Math.sqrt(i/strands);
   const mid=a.clone().lerp(b,.5).add(new THREE.Vector3(-.20+Math.cos(angle)*spread,Math.sin(angle)*spread+(r===8?.72:r===2?.30:0),.26*Math.sin(r*1.7)+Math.cos(angle)*spread));
   const curve=new THREE.CatmullRomCurve3([a,a.clone().lerp(mid,.55),mid,mid.clone().lerp(b,.55),b]);
   if(i<1)bundleCurves.push({curve,group});
   let prev=null;
   for(let j=0;j<samples;j++){
    const t=j/(samples-1),pos=curve.getPoint(t);
    positions.push(pos.x,pos.y,pos.z);phases.push((t+r*.137+i*.041)%1);groups.push(group);
    if(prev){linePositions.push(...prev,...pos.toArray());lineProgress.push(t,t);lineGroups.push(group,group);}
    prev=pos.toArray();
   }
  }
 }
 // Fine terminal branches give the fixed narrative bundles a cortical spread.
 // These are artist-authored paths, not an added anatomical tractography claim.
 for(const [r,[name,xyz]]of Object.entries(SIGNAL_ANCHORS).filter(([name])=>name!=='spine').entries()){
  const a=new THREE.Vector3(...xyz),group=['parietal','insula','cerebellum','brainstem'].includes(name)?1:0;
  for(let i=0;i<(mobile?3:5);i++){
   const angle=i*2.39996323+r*.71;
   const b=a.clone().add(new THREE.Vector3(-.16-.22*(.5+.5*Math.sin(angle)),Math.sin(angle)*.48,Math.cos(angle)*.48));
   const mid=a.clone().lerp(b,.55).add(new THREE.Vector3(-.09,.10*Math.cos(angle),.11*Math.sin(angle)));
   const curve=new THREE.CatmullRomCurve3([a,mid,b]);let previous=null;
   for(let j=0;j<20;j++){
    const progress=j/19,p=curve.getPoint(progress);
    positions.push(...p.toArray());phases.push((progress+r*.117+i*.021)%1);groups.push(group);
    if(previous){linePositions.push(...previous,...p.toArray());lineProgress.push(progress,progress);lineGroups.push(group,group);}
    previous=p.toArray();
   }
  }
 }
 const pointsGeometry=new THREE.BufferGeometry();
 pointsGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 pointsGeometry.setAttribute('aPhase',new THREE.Float32BufferAttribute(phases,1));
 pointsGeometry.setAttribute('aGroup',new THREE.Float32BufferAttribute(groups,1));
 const uniforms={uTime:{value:0},uRouteMix:{value:0}};
 const pointsMaterial=new THREE.ShaderMaterial({uniforms,vertexShader:neuralSignalShaders.vertex,fragmentShader:neuralSignalShaders.fragment,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending});
 const points=new THREE.Points(pointsGeometry,pointsMaterial);points.name='GPU synapses';points.renderOrder=12;root.add(points);
 const fiberGeo=new THREE.BufferGeometry();fiberGeo.setAttribute('position',new THREE.Float32BufferAttribute(linePositions,3));fiberGeo.setAttribute('aProgress',new THREE.Float32BufferAttribute(lineProgress,1));fiberGeo.setAttribute('aGroup',new THREE.Float32BufferAttribute(lineGroups,1));
 const fiberMaterial=new THREE.ShaderMaterial({uniforms:{uTime:uniforms.uTime,uRouteMix:uniforms.uRouteMix},vertexShader:tractShaders.vertex,fragmentShader:tractShaders.fragment,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending});
 const fiberLines=new THREE.LineSegments(fiberGeo,fiberMaterial);fiberLines.name='Region fibre bundles';fiberLines.renderOrder=12;root.add(fiberLines);
 // A few real 3D filaments carry the light; fine line strands retain detail.
 // Both use the same fixed curves and absolute-time signal shader.
 for(const {curve,group}of bundleCurves){
  const geometry=new THREE.TubeGeometry(curve,mobile?28:46,mobile?.006:.008,5,false);
  const count=geometry.attributes.position.count,progress=new Float32Array(count),hue=new Float32Array(count).fill(group);
  for(let i=0;i<count;i++)progress[i]=geometry.attributes.uv.getX(i);
  geometry.setAttribute('aProgress',new THREE.BufferAttribute(progress,1));geometry.setAttribute('aGroup',new THREE.BufferAttribute(hue,1));
  const filament=new THREE.Mesh(geometry,fiberMaterial);filament.renderOrder=12;filament.name='Luminous route filament';root.add(filament);
 }
 // Grow a fine narrative field to sampled vertices of the licensed cortex.
 // Endpoints follow the real surface; the connecting paths remain illustration.
 const surfaceEndpoints=[],fieldVisibility={value:1};
 if(atlas?.root){
  atlas.root.updateMatrixWorld(true);
  const inverse=atlas.root.matrixWorld.clone().invert(),ends=[],parcels=[],budget=mobile?140:360;
  atlas.root.traverse(o=>{
   if(!o.isMesh||! /gyrus|gyri|lobule|operculum|cortex|occipital/.test(o.name))return;
   const pos=o.geometry.attributes.position,stride=Math.max(1,Math.floor(pos.count/16)),candidates=[];
   for(let i=0;i<pos.count;i+=stride){
    const p=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld).applyMatrix4(inverse);
    if(p.x<-.20)candidates.push(p);
   }
   if(candidates.length)parcels.push(candidates);
  });
  // Round-robin parcels before taking another endpoint from any one mesh.
  for(let round=0;round<17&&ends.length<budget;round++)for(const parcel of parcels){
   if(parcel[round]&&ends.length<budget){ends.push(parcel[round]);surfaceEndpoints.push(parcel[round].clone());}
  }
  const vertices=[],progresses=[],colors=[];
  for(let i=0;i<ends.length;i++){
   const b=ends[i],group=b.z>.20?1:0;
   const names=['pfc','parietal','insula','thalamus'];
   const nearest=names.map(name=>new THREE.Vector3(...SIGNAL_ANCHORS[name])).sort((a,c)=>a.distanceToSquared(b)-c.distanceToSquared(b))[0];
   const a=nearest.clone().lerp(new THREE.Vector3(...SIGNAL_ANCHORS.thalamus),i%5===0?.55:0);
   // Most fine connections stay local; major logical bundles still reach hubs.
   // This prevents every cortical vertex from becoming the same bright fan.
   if(i%12!==0){
    const nearby=ends.filter((p,j)=>j!==i&&p.distanceToSquared(b)>.10&&p.distanceToSquared(b)<1.2)
      .sort((p,q)=>p.distanceToSquared(b)-q.distanceToSquared(b));
    if(nearby.length)a.copy(nearby[i%Math.min(nearby.length,8)]).multiplyScalar(.86);
   }
   a.add(new THREE.Vector3(.13*Math.sin(i*1.37),.17*Math.cos(i*1.71),.13*Math.sin(i*2.11)));
   const trunk=a.clone().lerp(b,.25).add(new THREE.Vector3(-.06,.14*Math.sin(i*.71),.18*Math.cos(i*.63)));
   const mid=a.clone().lerp(b,.63).add(new THREE.Vector3(-.18-.12*Math.sin(i*2.4),.23*Math.sin(i*1.7),.18*Math.cos(i*2.1)));
   const curve=new THREE.CatmullRomCurve3([a,trunk,mid,b]);let prev=null;
   for(let j=0;j<20;j++){
    const t=j/19,p=curve.getPoint(t);
    if(prev){vertices.push(...prev.toArray(),...p.toArray());progresses.push(t+i*.137,t+i*.137);colors.push(group,group);}
    prev=p;
   }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('aProgress',new THREE.Float32BufferAttribute(progresses,1));g.setAttribute('aGroup',new THREE.Float32BufferAttribute(colors,1));
  const m=new THREE.ShaderMaterial({uniforms:{uTime:uniforms.uTime,uRouteMix:uniforms.uRouteMix,uFieldVisibility:fieldVisibility},vertexShader:tractShaders.vertex,
   fragmentShader:tractShaders.fragment.replace('uniform float uRouteMix;','uniform float uRouteMix;uniform float uFieldVisibility;').replace('(.07+.36*trail)*strength','(.012+.10*trail)*strength*uFieldVisibility'),transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending});
  const field=new THREE.LineSegments(g,m);field.name='Atlas cortical arborizations';field.renderOrder=12;root.add(field);
  const dots=[],phases=[],groups=[];
  for(let i=0;i<vertices.length;i+=6){dots.push(...vertices.slice(i+3,i+6));phases.push(progresses[i/3+1]%1);groups.push(colors[i/3+1]);}
  const dotGeometry=new THREE.BufferGeometry();dotGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dots,3));dotGeometry.setAttribute('aPhase',new THREE.Float32BufferAttribute(phases,1));dotGeometry.setAttribute('aGroup',new THREE.Float32BufferAttribute(groups,1));
   const dotMaterial=new THREE.ShaderMaterial({uniforms:{...uniforms,uFieldVisibility:fieldVisibility},vertexShader:neuralSignalShaders.vertex,fragmentShader:neuralSignalShaders.fragment.replace('uniform float uRouteMix;','uniform float uRouteMix;uniform float uFieldVisibility;').replace('a*strength*.48','a*strength*.24*uFieldVisibility'),transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending});
  const nodeField=new THREE.Points(dotGeometry,dotMaterial);nodeField.name='Cortical signal dust';nodeField.renderOrder=12;root.add(nodeField);
 }
 const hubs=[];
 for(const [name,xyz]of Object.entries(SIGNAL_ANCHORS)){
  if(name==='spine')continue;
  const cyan=['parietal','insula','cerebellum','brainstem'].includes(name),color=new THREE.Color(cyan?0x37e9ff:0xff48be);
  const core=name==='thalamus',orb=new THREE.Mesh(new THREE.SphereGeometry(core?.052:.028,12,10),new THREE.MeshBasicMaterial({color:color.clone().multiplyScalar(core?1.8:1.5),transparent:true,opacity:.80,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));
  orb.position.set(...xyz);orb.name=`signal-${name}`;orb.renderOrder=12;root.add(orb);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(core?.72:.44,core?.72:.44),new THREE.ShaderMaterial({uniforms:{uColor:{value:color},uPulse:{value:1}},transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:'varying vec2 vUv;uniform vec3 uColor;uniform float uPulse;void main(){vec2 p=vUv-.5;float d=length(p);float halo=exp(-d*d*32.0);float core=exp(-d*d*550.0);float rays=exp(-abs(p.x)*180.0)*exp(-abs(p.y)*8.0)+exp(-abs(p.y)*180.0)*exp(-abs(p.x)*8.0);gl_FragColor=vec4(uColor*(halo*1.4+core*3.0)+vec3(core*2.0),clamp((halo*.52+core*.9+rays*.18)*uPulse,0.0,1.0));}'}));
  glow.position.copy(orb.position);glow.renderOrder=13;root.add(glow);hubs.push({orb,glow});
 }
 return {root,surfaceEndpoints,anchors:SIGNAL_ANCHORS,routeCount:ROUTES.length,
  update(t,routeMix,camera,exterior=1){fieldVisibility.value=exterior;uniforms.uTime.value=t;uniforms.uRouteMix.value=routeMix;root.updateMatrixWorld(true);hubs.forEach(({orb,glow},i)=>{
   const pulse=.83+.22*Math.sin(t*(2.1+i*.17)+i);
   // Bound apparent hub size when the camera dives inside the brain. The same
   // exterior highlight must not become a full-screen white billboard nearby.
   const distance=camera?camera.position.distanceTo(root.localToWorld(orb.position.clone())):5;
   const size=Math.min(1,Math.max(.06,distance/5));
   orb.scale.setScalar(pulse*size);glow.scale.setScalar(size);glow.material.uniforms.uPulse.value=pulse;
   if(camera)glow.quaternion.copy(camera.quaternion);
  });},
  dispose(){root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 };
}
