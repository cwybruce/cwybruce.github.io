/** Ray-marched decorative volume; bounded to model coordinates and downscaled on mobile. */
export function getVolumeQuality(profile='high'){
 const key=['high','balanced','mobile'].includes(profile)?profile:'mobile';
 return {high:{steps:32,pixelRatio:1.5,maxOpacity:.06},balanced:{steps:20,pixelRatio:1.25,maxOpacity:.055},mobile:{steps:12,pixelRatio:1,maxOpacity:.05}}[key];
}
export function createVolumeShader(profile='high'){
 const {steps,maxOpacity}=getVolumeQuality(profile);
 return {steps,
 vertexShader:`varying vec3 vVolumePosition;void main(){vVolumePosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`precision highp float;
 uniform float uTime,uRouteMix;
 uniform vec3 uCameraLocal;
 varying vec3 vVolumePosition;
 float density(vec3 p){
   float base=exp(-dot(p,p)*.24);
   float waves=.5+.5*sin(p.x*11.+sin(p.z*8.+uTime*.23)*2.+p.y*6.);
   return base*mix(.03,.3,waves);
 }
 void main(){
   vec3 ro=vVolumePosition;
   vec3 dir=normalize(vVolumePosition-uCameraLocal);
   vec3 color=mix(vec3(.76,.10,.44),vec3(.02,.72,1.0),uRouteMix);
   float scatter=0.;
   for(int i=0;i<${steps};i++){
     vec3 p=ro-dir*(float(i)*.135);
     scatter+=density(p)*(0.7+0.3*sin(uTime*.19+p.y*5.));
   }
   scatter=clamp(scatter/float(${steps})*.58,0.,${maxOpacity.toFixed(3)});
   gl_FragColor=vec4(color*.75,scatter);
 }
`};
}
