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
   float fresnel=pow(1.0-max(dot(n,normalize(vEye)),0.0),2.7);
   float diffuse=clamp(dot(n,normalize(vec3(-.32,.72,1.0))),0.0,1.0);
   float ridges=sin(vObject.x*29.0+sin(vObject.y*18.0)*1.6+vObject.z*12.0);
   float fold=clamp(.60+.36*ridges,0.,1.);
   float sulci=1.0-smoothstep(-.75,-.08,ridges);
   float activity=pow(.5+.5*sin(uTime*2.7+vObject.y*8.0+uRegion*2.1),5.0);
   vec3 warm=vec3(.76,.22,.52);
   vec3 cool=vec3(.17,.76,.97);
   vec3 route=mix(warm,cool,uRouteMix);
   vec3 cortex=mix(vec3(.025,.058,.12),vec3(.16,.25,.40),.22+diffuse*.56+fold*.15);
   vec3 color=cortex*(.92-.21*sulci);
   color+=route*(.035+.19*fresnel+.045*activity);
   color+=vec3(.075,.11,.17)*pow(fresnel,1.3);
   float alpha=clamp(.91+.07*fresnel,.0,1.0);
   gl_FragColor=vec4(color,alpha*uVisibility);
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
   gl_PointSize=clamp((2.0+5.0*vPulse)*6.0/max(1.0,-mvPosition.z),1.2,11.0);
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
   vec3 col=mix(magenta,cyan,clamp(uRouteMix+vGroup*.18,0.,1.));
   gl_FragColor=vec4(col*a,a);
 }
`
};
export const tractShaders={
vertex:`
 varying float vDistance;
 attribute float aProgress;
 uniform float uTime;
 void main(){vDistance=aProgress-uTime*.13;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`,
fragment:`
 precision highp float;
 uniform float uRouteMix;
 varying float vDistance;
 void main(){
   float trail=pow(.5+.5*cos(vDistance*18.85),18.0);
   vec3 col=mix(vec3(.9,.14,.47),vec3(.16,.79,1.0),uRouteMix);
   gl_FragColor=vec4(col,(.15+.85*trail)*.45);
 }
`
};
