/** Lighting data from the unchanged licensed triangles, not new anatomy.
 * Normal projection of neighbouring edges distinguishes ridges and recesses.
 * Squared edge lengths and mesh extent keep it independent of tessellation/units.
 */
export function addSurfaceRelief(THREE,geometry){
 const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal');
 const projection=new Float64Array(p.count),length=new Float64Array(p.count);
 const edge=(a,b)=>{
  const x=p.getX(b)-p.getX(a),y=p.getY(b)-p.getY(a),z=p.getZ(b)-p.getZ(a),d=Math.hypot(x,y,z);
  if(d<1e-12)return;
  const la=Math.hypot(n.getX(a),n.getY(a),n.getZ(a))||1,lb=Math.hypot(n.getX(b),n.getY(b),n.getZ(b))||1;
  projection[a]+=(x*n.getX(a)+y*n.getY(a)+z*n.getZ(a))/la;length[a]+=d*d;
  projection[b]-=(x*n.getX(b)+y*n.getY(b)+z*n.getZ(b))/lb;length[b]+=d*d;
 };
 const ix=geometry.index;
 for(let i=0;i<(ix?.count??p.count);i+=3){
  const a=ix?ix.getX(i):i,b=ix?ix.getX(i+1):i+1,c=ix?ix.getX(i+2):i+2;
  edge(a,b);edge(b,c);edge(c,a);
 }
 const values=new Float32Array(p.count*2);
 geometry.computeBoundingBox();const size=geometry.boundingBox.getSize(new THREE.Vector3()),extent=Math.max(size.x,size.y,size.z);
 for(let i=0;i<p.count;i++){
  const signed=length[i]>0?projection[i]/length[i]*extent*.40:0;
  values[i*2]=Math.min(1,Math.max(0,-signed));values[i*2+1]=Math.min(1,Math.max(0,signed));
 }
 const attribute=new THREE.BufferAttribute(values,2);geometry.setAttribute('aSurfaceRelief',attribute);return attribute;
}

/** Hemispheres keep real geometry; only the far side receives faint X-ray light. */
export function corticalLayerWeight(hemisphere,cameraX){
 return Number.isFinite(cameraX)?Math.min(1,Math.max(0,-hemisphere*cameraX/2)):0;
}
