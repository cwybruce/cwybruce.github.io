/** Original narrative fibers to the real CC0 facial/neck surface, not nerves
 * measured from a person. Positions are fixed; uniforms use absolute seek. */
export function createNeckFilaments(THREE,model,{mobile=false}={}){
 model.updateMatrixWorld(true);
 const bins=Array.from({length:12},()=>[]),budget=mobile?84:240;
 model.traverse(o=>{
  if(!o.isMesh)return;const weight=o.geometry.getAttribute('aShellWeight');
  for(let i=0;i<o.geometry.attributes.position.count;i+=3){
   if(weight&&weight.getX(i)<.5)continue;
   const p=o.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(o.matrixWorld);
   if(p.y< -2.30||p.y>.65||p.x>-.06)continue;
   bins[Math.min(11,Math.floor((p.y+2.30)/2.95*12))].push(p);
  }
 });
 const endpoints=[];
 for(let round=0;round<budget&&endpoints.length<budget;round++)for(const bin of bins){
  const p=bin[Math.floor(round*bin.length/Math.ceil(budget/12))];if(p&&endpoints.length<budget)endpoints.push(p);
 }
 const positions=[],progress=[],hues=[];
 for(let i=0;i<endpoints.length;i++){
  const end=endpoints[i];
  const nearby=endpoints.filter((p,j)=>j!==i&&p.distanceToSquared(end)>.012&&p.distanceToSquared(end)<.40)
   .sort((a,b)=>a.distanceToSquared(end)-b.distanceToSquared(end));
  const start=(nearby[i%Math.min(nearby.length,6)]||endpoints[(i+13)%endpoints.length]).clone();
  const mid=start.clone().lerp(end,.55);mid.x+=.015;mid.z+=.04*Math.sin(i*1.71);mid.y+=.035*Math.cos(i*2.11);
  const curve=new THREE.CatmullRomCurve3([start,mid,end]);let previous=null;
  for(let j=0;j<28;j++){
   const t=j/27,p=curve.getPoint(t);
   if(previous){positions.push(...previous.toArray(),...p.toArray());progress.push(t+i*.13,t+i*.13);hues.push(i%13===0?1:0,i%13===0?1:0);}
   previous=p;
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('aProgress',new THREE.Float32BufferAttribute(progress,1));geometry.setAttribute('aHue',new THREE.Float32BufferAttribute(hues,1));
 const uniforms={uTime:{value:0},uVisibility:{value:1}};
 const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,
  vertexShader:'attribute float aProgress,aHue;varying float vProgress,vHue;void main(){vProgress=aProgress;vHue=aHue;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform float uTime,uVisibility;varying float vProgress,vHue;void main(){float pulse=pow(.5+.5*cos((vProgress-uTime*.08)*25.13),16.0);vec3 color=mix(vec3(.08,.62,1.5),vec3(1.2,.08,.7),vHue);gl_FragColor=vec4(color,(.024+.07*pulse)*uVisibility);}'});
 const root=new THREE.Group(),lines=new THREE.LineSegments(geometry,material);lines.renderOrder=11;lines.name='CC0 surface-linked narrative fibers';root.add(lines);
 return {root,endpoints,uniforms,update(t,visibility=1){uniforms.uTime.value=t;uniforms.uVisibility.value=visibility;},dispose(){geometry.dispose();material.dispose();}};
}
