/** Small dependency-free GLB validator suitable for Node tests and CI. */
export function readGlbMetadata(buffer){
 const b=Buffer.from(buffer);
 if(b.byteLength<20||b.toString('ascii',0,4)!=='glTF')throw new Error('Invalid GLB magic / truncated file');
 if(b.readUInt32LE(4)!==2)throw new Error('GLB version must be 2');
 if(b.readUInt32LE(8)!==b.byteLength)throw new Error('GLB length mismatch');
 let position=12,manifest=null;
 while(position+8<=b.length){
   const length=b.readUInt32LE(position),type=b.readUInt32LE(position+4);
   if(position+8+length>b.length)throw new Error('GLB truncated chunk');
   if(type===0x4e4f534a){
     manifest=JSON.parse(b.subarray(position+8,position+8+length).toString('utf8').replace(/\u0000+$/g,'').trim());
     break;
   }
   position+=8+length;
 }
 if(!manifest||manifest.asset?.version!=='2.0')throw new Error('GLB has no valid glTF 2.0 JSON');
 const meshCount=manifest.meshes?.length||0,nodeCount=manifest.nodes?.length||0;
 if(meshCount<1)throw new Error('GLB has no anatomical meshes');
 return {meshCount,nodeCount,extensionsUsed:manifest.extensionsUsed||[],maxAccessorVertices:Math.max(0,...(manifest.accessors||[]).map(a=>a.count||0)),nodes:(manifest.nodes||[]).map(x=>x.name||'')};
}
