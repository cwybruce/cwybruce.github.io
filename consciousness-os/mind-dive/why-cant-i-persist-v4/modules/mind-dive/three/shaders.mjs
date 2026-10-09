/** These shaders are educational visual metaphors, never EEG/fMRI measurements. */
export const brainSurfaceShaders={
vertex:`
 varying vec3 vNormal;
 varying vec3 vObject;
 varying vec3 vEye;
 void main(){
   vObject=position;
   vec4 mv=modelViewMatrix*vec4(position,1.0);
   vNormal=normalize(normalMatrix*normal);
   vEye=normalize(-mv.xyz);
   gl_Position=projectionMatrix*mv;
 }
`,
fragment:`
 precision highp float;
 uniform float uTime;
 uniform float uRouteMix;
 uniform float uRegion;
 uniform float uVisibility;
 varying vec3 vNormal;
 varying vec3 vObject;
 varying vec3 vEye;
 float hash(vec3 p){return fract(sin(dot(p,vec3(17.1,47.7,83.5)))*43758.5453);}
 void main(){
   vec3 n=normalize(vNormal);
   float facing=abs(dot(n,normalize(vEye)));
   float fresnel=pow(max(0.0,1.0-facing),3.2);
   float diffuse=clamp(dot(n,normalize(vec3(-.32,.72,1.0))),0.0,1.0);
   float ridges=sin(vObject.x*29.0+sin(vObject.y*18.0)*1.6+vObject.z*12.0);
   float fold=clamp(.60+.36*ridges,0.,1.);
   float sulci=1.0-smoothstep(-.75,-.08,ridges);
   float activity=pow(.5+.5*sin(uTime*2.7+vObject.y*8.0+uRegion*2.1),5.0);
   vec3 warm=vec3(.76,.22,.52);
   vec3 cool=vec3(.17,.76,.97);
   vec3 route=mix(warm,cool,uRouteMix);
   // Actual HRA normals provide the gyri; scan detail is decorative.
   vec3 cortex=vec3(.009,.026,.055)*(.45+diffuse*.85+fold*.12);
   vec3 color=cortex*(1.0-.48*sulci);
   color+=vec3(.12,.48,1.05)*fresnel*(.70+.30*diffuse);
   color+=route*(.012+.12*fresnel+.025*activity);
   float alpha=clamp(.34+.43*fresnel,.0,.82);
   gl_FragColor=vec4(color,alpha*uVisibility);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
 }
`
};
export const neuralSignalShaders={
vertex:`
 attribute float aPhase;
 attribute float aGroup;
 uniform float uTime;
 uniform float uRouteMix;
 varying float vPulse;
 varying float vGroup;
 void main(){
   vGroup=aGroup;
   vPulse=pow(max(0.,cos((aPhase-uTime*.21)*6.2831853)),11.0);
   vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
   gl_PointSize=clamp((1.8+4.0*vPulse)*7.0/max(1.0,-mvPosition.z),1.0,9.0);
   gl_Position=projectionMatrix*mvPosition;
 }
`,
fragment:`
 precision highp float;
 uniform float uRouteMix;
 varying float vPulse;
 varying float vGroup;
 void main(){
   float d=length(gl_PointCoord-.5);
   float a=exp(-d*d*24.0)*(0.18+.86*vPulse);
   vec3 magenta=vec3(1.,.16,.59),cyan=vec3(.2,.94,1.);
   vec3 col=mix(magenta,cyan,vGroup);
   float strength=.7+.3*mix(1.0-uRouteMix,uRouteMix,vGroup);
   gl_FragColor=vec4(col*(.35+.65*vPulse)*a,a*strength*.48);
 }
`
};
export const tractShaders={
vertex:`
 varying float vDistance;
 varying float vGroup;
 attribute float aProgress;
 attribute float aGroup;
 uniform float uTime;
 void main(){vGroup=aGroup;vDistance=aProgress-uTime*.13;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`,
fragment:`
 precision highp float;
 uniform float uRouteMix;
 varying float vDistance;
 varying float vGroup;
 void main(){
   float trail=pow(.5+.5*cos(vDistance*18.85),18.0);
   vec3 col=mix(vec3(1.2,.12,.67),vec3(.12,.85,1.2),vGroup);
   float strength=.72+.28*mix(1.0-uRouteMix,uRouteMix,vGroup);
   gl_FragColor=vec4(col,(.04+.26*trail)*strength);
 }
`
};
