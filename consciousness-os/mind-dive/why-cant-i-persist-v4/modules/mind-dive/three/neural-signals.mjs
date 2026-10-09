import {neuralSignalShaders,tractShaders} from './shaders.mjs';

/** Stream packets and long axon-like fibres are *GPU time driven*, not interval animations. */
export function createNeuralSignals(THREE,{mobile=false}={}){
 const root=new THREE.Group();root.name='Illustrative neural signals';
 const count=mobile?58:120,samples=mobile?18:28;
 const positions=[],phases=[],groups=[],linePositions=[],lineProgress=[];
 for(let i=0;i<count;i++){
  const p=i/count;
  const radial=.5+1.15*(.5+.5*Math.sin(p*24.71));
  const a=p*Math.PI*12.5;
  const from=new THREE.Vector3(Math.cos(a)*radial*.85,Math.sin(a)*radial*.61,Math.sin(a*1.6)*.78);
  const to=new THREE.Vector3(Math.sin(a*.87)*radial*.78,Math.cos(a*.91)*radial*.70,Math.cos(a*1.19)*.8);
  const mid=new THREE.Vector3((from.x+to.x)*.43,(from.y+to.y)*.38,.21*Math.sin(i*2.13));
  const curve=new THREE.QuadraticBezierCurve3(from,mid,to);
  let prev=null;
  for(let j=0;j<samples;j++){
   const t=j/(samples-1),pos=curve.getPoint(t);
   positions.push(pos.x,pos.y,pos.z);
   phases.push((t*.9+p*.83)%1);
   groups.push(i%5===0?1:0);
   if(prev){linePositions.push(...prev,...pos.toArray());lineProgress.push(t,t);}
   prev=pos.toArray();
  }
 }
 const pointsGeometry=new THREE.BufferGeometry();
 pointsGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 pointsGeometry.setAttribute('aPhase',new THREE.Float32BufferAttribute(phases,1));
 pointsGeometry.setAttribute('aGroup',new THREE.Float32BufferAttribute(groups,1));
 const uniforms={uTime:{value:0},uRouteMix:{value:0}};
 const pointsMaterial=new THREE.ShaderMaterial({uniforms,vertexShader:neuralSignalShaders.vertex,fragmentShader:neuralSignalShaders.fragment,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending});
 const points=new THREE.Points(pointsGeometry,pointsMaterial);points.name='GPU synapses';points.renderOrder=12;root.add(points);
 const fiberGeo=new THREE.BufferGeometry();fiberGeo.setAttribute('position',new THREE.Float32BufferAttribute(linePositions,3));fiberGeo.setAttribute('aProgress',new THREE.Float32BufferAttribute(lineProgress,1));
 const fiberMaterial=new THREE.ShaderMaterial({uniforms:{uTime:uniforms.uTime,uRouteMix:uniforms.uRouteMix},vertexShader:tractShaders.vertex,fragmentShader:tractShaders.fragment,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending});
 const fiberLines=new THREE.LineSegments(fiberGeo,fiberMaterial);fiberLines.renderOrder=12;root.add(fiberLines);
 const regions=[['PREFRONTAL',[-.9,.45,.88]],['HIPPOCAMPUS',[.4,-.6,.36]],['REWARD',[.25,.1,-.65]],['OBSERVER',[.5,.58,.65]]];
 const anchors=[];
 for(const [name,xyz]of regions){
  const orb=new THREE.Mesh(new THREE.SphereGeometry(.095,12,10),new THREE.MeshBasicMaterial({color:0xff5bad,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));
  orb.position.set(...xyz);orb.name=`signal-${name}`;orb.renderOrder=12;anchors.push(orb);root.add(orb);
 }
 return {
  root,
  update(t,routeMix){uniforms.uTime.value=t;uniforms.uRouteMix.value=routeMix;anchors.forEach((mesh,i)=>{mesh.scale.setScalar(.85+.36*Math.sin(t*(2.8+i*.34)+i));mesh.material.color.setRGB(1-routeMix*.55,.21+routeMix*.66,.53+routeMix*.46);});},
  dispose(){root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 };
}
