import {neuralSignalShaders,tractShaders} from './shaders.mjs';

// Artist-authored anchors in the normalized atlas frame: illustrative routes,
// not tractography or an individual's measured brain activity.
export const SIGNAL_ANCHORS=Object.freeze({
 pfc:[-.82,.98,.95],amygdala:[-.62,-.38,.62],striatum:[-.52,.02,.12],
 parietal:[-.65,1.12,-.55],hippocampus:[-.65,-.40,-.52],insula:[-1.02,.18,.34],
 thalamus:[-.38,-.04,-.20],cerebellum:[-.78,-1.06,-.91],brainstem:[0,-1.60,-.50],spine:[0,-4.0,-.20]
});
const ROUTES=[['pfc','striatum',0],['pfc','amygdala',0],['parietal','thalamus',1],
 ['hippocampus','thalamus',0],['insula','striatum',1],['striatum','thalamus',0],
 ['thalamus','cerebellum',1],['amygdala','hippocampus',0],['parietal','pfc',1],
 ['cerebellum','brainstem',1],['thalamus','brainstem',0],['brainstem','spine',1]];

/** Fixed bundled curves; only absolute-time GPU uniforms and hub scales animate. */
export function createNeuralSignals(THREE,{mobile=false}={}){
 const root=new THREE.Group();root.name='Illustrative neural signals';
 const strands=mobile?8:18,samples=mobile?28:46;
 const positions=[],phases=[],groups=[],linePositions=[],lineProgress=[],lineGroups=[],bundleCurves=[];
 for(let r=0;r<ROUTES.length;r++){
  const [start,end,group]=ROUTES[r],a=new THREE.Vector3(...SIGNAL_ANCHORS[start]),b=new THREE.Vector3(...SIGNAL_ANCHORS[end]);
  for(let i=0;i<strands;i++){
   const angle=i*2.39996323+r*.41,spread=.07+.11*Math.sqrt(i/strands);
   const mid=a.clone().lerp(b,.5).add(new THREE.Vector3(-.20+Math.cos(angle)*spread,Math.sin(angle)*spread,.26*Math.sin(r*1.7)+Math.cos(angle)*spread));
   const curve=new THREE.CatmullRomCurve3([a,a.clone().lerp(mid,.55),mid,mid.clone().lerp(b,.55),b]);
   if(i<2)bundleCurves.push({curve,group});
   let prev=null;
   for(let j=0;j<samples;j++){
    const t=j/(samples-1),pos=curve.getPoint(t);
    positions.push(pos.x,pos.y,pos.z);phases.push((t+r*.137+i*.009)%1);groups.push(group);
    if(prev){linePositions.push(...prev,...pos.toArray());lineProgress.push(t,t);lineGroups.push(group,group);}
    prev=pos.toArray();
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
  const geometry=new THREE.TubeGeometry(curve,mobile?28:46,mobile?.010:.014,5,false);
  const count=geometry.attributes.position.count,progress=new Float32Array(count),hue=new Float32Array(count).fill(group);
  for(let i=0;i<count;i++)progress[i]=geometry.attributes.uv.getX(i);
  geometry.setAttribute('aProgress',new THREE.BufferAttribute(progress,1));geometry.setAttribute('aGroup',new THREE.BufferAttribute(hue,1));
  const filament=new THREE.Mesh(geometry,fiberMaterial);filament.renderOrder=12;filament.name='Luminous route filament';root.add(filament);
 }
 const hubs=[];
 for(const [name,xyz]of Object.entries(SIGNAL_ANCHORS)){
  if(name==='spine')continue;
  const cyan=['parietal','insula','cerebellum','brainstem'].includes(name),color=new THREE.Color(cyan?0x37e9ff:0xff48be);
  const core=name==='thalamus',orb=new THREE.Mesh(new THREE.SphereGeometry(core?.072:.034,12,10),new THREE.MeshBasicMaterial({color:color.clone().multiplyScalar(core?2.3:1.8),transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));
  orb.position.set(...xyz);orb.name=`signal-${name}`;orb.renderOrder=12;root.add(orb);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(core?1.05:.52,core?1.05:.52),new THREE.ShaderMaterial({uniforms:{uColor:{value:color},uPulse:{value:1}},transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:'varying vec2 vUv;uniform vec3 uColor;uniform float uPulse;void main(){vec2 p=vUv-.5;float d=length(p);float halo=exp(-d*d*32.0);float core=exp(-d*d*550.0);float rays=exp(-abs(p.x)*180.0)*exp(-abs(p.y)*8.0)+exp(-abs(p.y)*180.0)*exp(-abs(p.x)*8.0);gl_FragColor=vec4(uColor*(halo*1.4+core*3.0)+vec3(core*2.0),clamp((halo*.52+core*.9+rays*.18)*uPulse,0.0,1.0));}'}));
  glow.position.copy(orb.position);glow.renderOrder=13;root.add(glow);hubs.push({orb,glow});
 }
 return {root,anchors:SIGNAL_ANCHORS,routeCount:ROUTES.length,
  update(t,routeMix,camera){uniforms.uTime.value=t;uniforms.uRouteMix.value=routeMix;root.updateMatrixWorld(true);hubs.forEach(({orb,glow},i)=>{
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
