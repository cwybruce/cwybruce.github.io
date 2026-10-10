/** Fixed artist-authored space around the subject, never measured activity.
 * Depth-dependent point profiles leave the anatomy sharp while distant/near
 * lights soften. Geometry is generated once; animation uses absolute seek(t).
 */
export function createNeuralAtmosphere(THREE,{mobile=false}={}) {
 const root=new THREE.Group();root.name='Depth-layered neural atmosphere';
 const count=mobile?700:3000,positions=[],sizes=[],hues=[],seeds=[],halos=[],links=[];
 const points=[];
 for(let i=0;i<count;i++) {
  const angle=i*2.39996323,radius=2.5+1.9*(.5+.5*Math.sin(i*7.17));
  const p=new THREE.Vector3(1.8+3.6*(.5+.5*Math.sin(i*3.71)),
    1.0+Math.sin(angle)*radius*.90,Math.cos(angle)*radius*1.55);
  // Sparse foreground lights live outside the face's projected centre.
  if(i%97===0){p.x=-4.3-(i%5)*.18;p.z=Math.sign(p.z)*(2.8+Math.abs(p.z)*.3);}
  const halo=i%83===0&&i%97!==0;
  points.push(p);positions.push(...p.toArray());sizes.push(halo?21:i%97===0?3.5:i%17===0?4.0:1.0+(i%5)*.28);halos.push(halo?1:0);
  hues.push(i%7===0?1:0);seeds.push(i*.173);
  if(i>0&&i%43===0&&i%97!==0) {
   const neighbours=points.slice(Math.max(0,i-21),i).filter(q=>q.x>0)
     .map(q=>({q,d:q.distanceTo(p)})).filter(q=>q.d<3.2).sort((a,b)=>a.d-b.d).slice(0,1);
   for(const {q}of neighbours)links.push(...q.toArray(),...p.toArray());
  }
 }
 // Actual 3D orbital filaments sit behind the subject, with tiny fixed nodes.
 for(let j=0;j<(mobile?3:6);j++){
  let previous=null;
  for(let k=0;k<=120;k++){
   const angle=-2.5+k/120*5.2+j*.031,radius=2.55+j*.085;
   const p=new THREE.Vector3(Math.sin(angle*2+j)*.30,Math.sin(angle)*radius,Math.cos(angle)*radius*(1.05+j*.013));
   p.applyAxisAngle(new THREE.Vector3(0,0,1),j*.095).applyAxisAngle(new THREE.Vector3(0,1,0),j*.07);p.x+=2.0+j*.08;p.y+=1.3;
   if(previous)links.push(...previous.toArray(),...p.toArray());previous=p;
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 for(const [name,values]of [['aSize',sizes],['aHue',hues],['aSeed',seeds],['aHalo',halos]])geometry.setAttribute(name,new THREE.Float32BufferAttribute(values,1));
 const uniforms={uTime:{value:0},uFocus:{value:8},uVisibility:{value:1}};
 const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,
  vertexShader:`attribute float aSize,aHue,aSeed,aHalo;uniform float uFocus;varying float vBlur,vHue,vSeed,vHalo;
   void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vBlur=max(aHalo*.8,clamp(abs(-mv.z-uFocus)/4.0,0.0,1.0));vHue=aHue;vSeed=aSeed;vHalo=aHalo;
   gl_PointSize=clamp(aSize*mix(1.0,7.5,vBlur)*8.0/max(2.0,-mv.z),1.0,${mobile?'70.0':'170.0'});gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform float uTime,uVisibility;varying float vBlur,vHue,vSeed,vHalo;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
   void main(){vec2 p=gl_PointCoord-.5;float d=dot(p,p);float soft=exp(-d*mix(mix(100.0,22.0,vBlur),14.0,vHalo));
   float sharp=exp(-d*340.0)*(1.0-vBlur)*(1.0-vHalo);float pulse=.76+.24*sin(uTime*.43+vSeed);
   vec3 color=mix(vec3(.10,.72,1.65),vec3(1.25,.065,.70),vHue);
   float cloud=.68+.32*noise(p*4.0+vSeed+uTime*.012);soft*=mix(1.0,cloud,vHalo);
   float energy=mix(mix(1.0,.40,vBlur),.46,vHalo);
   gl_FragColor=vec4(color*(soft*1.10+sharp*1.4),(soft*.85+sharp*.65)*pulse*energy*uVisibility);}`});
 const lights=new THREE.Points(geometry,material);lights.name='Depth lights';root.add(lights);
 const networkGeometry=new THREE.BufferGeometry();networkGeometry.setAttribute('position',new THREE.Float32BufferAttribute(links,3));
 const networkMaterial=new THREE.ShaderMaterial({uniforms:{uFocus:uniforms.uFocus,uVisibility:uniforms.uVisibility},transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,
  vertexShader:'uniform float uFocus;varying float vFade;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vFade=1.0-clamp(abs(-mv.z-uFocus)/8.0,0.0,.85);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uVisibility;varying float vFade;void main(){gl_FragColor=vec4(.10,.50,1.15,.085*vFade*uVisibility);}'});
 const network=new THREE.LineSegments(networkGeometry,networkMaterial);network.name='Distant neural connections';root.add(network);
 const focus=new THREE.Vector3();let disposed=false;
 return {root,update(t,camera,visibility=1){
  if(disposed)return;
  uniforms.uTime.value=t;uniforms.uVisibility.value=visibility;
  focus.set(0,1.3,0).applyMatrix4(camera.matrixWorldInverse);uniforms.uFocus.value=-focus.z;
 },dispose(){if(disposed)return;disposed=true;geometry.dispose();material.dispose();networkGeometry.dispose();networkMaterial.dispose();}};
}
