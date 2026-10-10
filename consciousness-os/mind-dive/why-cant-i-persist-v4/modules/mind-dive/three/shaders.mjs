/** These shaders are educational visual metaphors, never EEG/fMRI measurements. */
export const brainSurfaceShaders={
vertex:`
 attribute vec2 aSurfaceRelief;
 varying vec2 vSurfaceRelief;
 varying vec3 vNormal;
 varying vec3 vObject;
 varying vec3 vEye;
 varying vec3 vWorld;
 void main(){
   vSurfaceRelief=aSurfaceRelief;
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
 uniform float uSurfaceLayer;
 uniform float uSurfaceStrength;
 varying vec2 vSurfaceRelief;
 varying vec3 vNormal;
 varying vec3 vObject;
 varying vec3 vEye;
 varying vec3 vWorld;
 void main(){
   vec3 n=normalize(vNormal);
   float facing=abs(dot(n,normalize(vEye)));
   float fresnel=pow(max(0.0,1.0-facing),4.2);
   vec3 key=normalize(vec3(-.48,.72,.85));
   float diffuse=max(0.0,dot(n,key));
   float specular=pow(max(0.0,dot(n,normalize(key+normalize(vEye)))),96.0);
   float pinkLight=pow(max(0.0,dot(n,normalize(vec3(.75,-.25,.45)))),3.0);
   float coreFalloff=exp(-length(vWorld-vec3(-.35,1.30,.15))*1.10);
   // Rounded gyri come from the licensed mesh normals, with dark recesses.
   // Spatial lights stay legible at rest; absolute time moves only their activity.
   vec3 color=vec3(.002,.008,.032)+vec3(.008,.14,.60)*pow(diffuse,1.5);
   color+=vec3(.075,1.50,8.2)*fresnel;
   color+=vec3(.38,.95,2.4)*specular*.42;
   // Curved crests get thin cool light; actual concavities stay deep blue.
   float ridge=vSurfaceRelief.x,groove=vSurfaceRelief.y;
   color*=1.0-.72*groove;
   color+=vec3(.06,.40,1.6)*ridge*(.10+.65*fresnel);
   float micro=.5+.5*sin(vWorld.y*93.0+sin(vWorld.z*17.0)*3.0+vWorld.x*31.0);
   color+=vec3(.015,.10,.22)*pow(micro,20.0)*ridge;
   color+=vec3(.85,.008,.28)*pinkLight*(.06+.30*coreFalloff)*(1.0-.35*uRouteMix);
   vec3 focusDelta=vWorld-vec3(-.95,2.15,-.75);
   float pinkFocus=exp(-dot(focusDelta,focusDelta)*1.5)*(1.0-.55*uRouteMix);
   vec3 rose=vec3(.007,.002,.018)+vec3(.09,.003,.06)*pow(diffuse,2.0)
     +vec3(1.8,.05,1.05)*fresnel+vec3(1.8,.55,1.45)*specular*.60;
   color=mix(color,rose,pinkFocus*.78);
   float alpha=clamp(.09+.70*sqrt(fresnel)+.035*diffuse,.0,.90);
   if(uRegion==13.0){
     // MRI specimen folds provide fine real geometry, with a cool tissue fill.
     color+=vec3(.015,.10,.36)*pow(diffuse,.7)*(1.0-.70*groove);
     color+=vec3(.04,.32,1.2)*ridge*(.08+.50*fresnel);
     color+=vec3(.12,1.20,2.0)*fresnel*1.5;
     alpha=clamp(.097+.70*pow(fresnel,.65)+.03*ridge,.0,.85);
   }
   // Named HRA structures carry distinct narrative light, never clinical values.
   bool deep=uRegion==2.0||uRegion==3.0||uRegion==4.0||uRegion==8.0||uRegion==11.0||uRegion==12.0;
   if(deep){
     vec3 tint=vec3(1.65,.10,1.0);
     if(uRegion==3.0)tint=vec3(2.0,.55,.38);
     if(uRegion==4.0)tint=vec3(2.0,.16,.80);
     if(uRegion==8.0)tint=vec3(2.4,.65,1.25);
     if(uRegion==11.0)tint=mix(vec3(.12,1.8,2.8),vec3(1.5,.10,1.8),smoothstep(-.7,.6,vWorld.y));
     if(uRegion==12.0)tint=vec3(1.8,.38,2.0);
     float contour=pow(max(0.0,1.0-facing),1.45);
     float hatch=pow(.5+.5*sin(vWorld.y*65.0+vWorld.z*12.0),22.0);
     color=tint*(.03+.12*diffuse+contour*1.2+specular*.40);
     color+=tint*hatch*(uRegion==11.0?.20:.05);
     alpha=clamp(.035+.28*contour+specular*.06,.0,.40);
   }else if(uRegion==10.0){
     float folia=pow(.5+.5*sin(vWorld.y*90.0+sin(vWorld.z*8.0)*2.0),24.0);
     color+=vec3(.08,.7,1.6)*folia*(.15+fresnel);
     color*=.82;alpha*=.78;
   }

   if(uSurfaceLayer>0.0){color*=.28;alpha*=mix(1.0,.065,uSurfaceLayer);}
   gl_FragColor=vec4(color,alpha*uVisibility*uSurfaceStrength);
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
