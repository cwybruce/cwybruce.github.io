/** These shaders are educational visual metaphors, never EEG/fMRI measurements. */
export const brainSurfaceShaders={
vertex:`
 varying vec3 vNormal;
 varying vec3 vObject;
 varying vec3 vEye;
 varying vec3 vWorld;
 void main(){
   vObject=position;
   vec4 mv=modelViewMatrix*vec4(position,1.0);
   vNormal=normalize(normalMatrix*normal);
   vEye=normalize(-mv.xyz);
   vWorld=(modelMatrix*vec4(position,1.0)).xyz;
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
 varying vec3 vWorld;
 void main(){
   vec3 n=normalize(vNormal);
   float facing=abs(dot(n,normalize(vEye)));
   float fresnel=pow(max(0.0,1.0-facing),4.1);
   vec3 key=normalize(vec3(-.48,.72,.85));
   float diffuse=max(0.0,dot(n,key));
   float specular=pow(max(0.0,dot(n,normalize(key+normalize(vEye)))),38.0);
   float pinkLight=pow(max(0.0,dot(n,normalize(vec3(.75,-.25,.45)))),3.0);
   float coreFalloff=exp(-length(vWorld-vec3(-.35,1.30,.15))*1.10);
   // Rounded gyri come from the licensed mesh normals, with dark recesses.
   // Spatial lights stay legible at rest; absolute time moves only their activity.
   vec3 color=vec3(.003,.008,.025)+vec3(.010,.085,.40)*pow(diffuse,2.0);
   color+=vec3(.14,.58,2.1)*fresnel;
   color+=vec3(.38,.95,1.80)*specular*.90;
   color+=vec3(.85,.008,.28)*pinkLight*(.06+.30*coreFalloff)*(1.0-.35*uRouteMix);
   vec3 focusDelta=vWorld-vec3(-.95,2.15,-.75);
   float pinkFocus=exp(-dot(focusDelta,focusDelta)*1.5)*(1.0-.55*uRouteMix);
   vec3 rose=vec3(.015,.002,.02)+vec3(.42,.006,.22)*pow(diffuse,2.0)
     +vec3(1.55,.035,.88)*fresnel+vec3(1.65,.40,1.25)*specular*.90;
   color=mix(color,rose,pinkFocus*.85);
   float alpha=clamp(.70+.23*fresnel,.0,.95);
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
   vec3 col=mix(vec3(1.7,.025,.80),vec3(.025,1.0,1.7),vGroup);
   float strength=.72+.28*mix(1.0-uRouteMix,uRouteMix,vGroup);
   gl_FragColor=vec4(col,(.07+.36*trail)*strength);
 }
`
};
