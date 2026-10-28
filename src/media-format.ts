export function mediaKind(name:string):'image'|'video'|'audio'|null {
 const ext=name.split(/[?#]/)[0].split('.').pop()?.toLowerCase();
 if(['png','jpg','jpeg','gif','webp','svg','avif','bmp'].includes(ext??''))return 'image';
 if(['mp4','webm','mov','ogv','m4v'].includes(ext??''))return 'video';
 if(['mp3','wav','ogg','m4a','flac','aac','opus'].includes(ext??''))return 'audio';return null;
}
/** Embedded cover bytes only. No network lookup or whole-library scan. */
export function albumArt(buffer:ArrayBuffer):{data:Uint8Array;mime:string}|null {
 const b=new Uint8Array(buffer),v=new DataView(buffer),ascii=(p:number,n:number)=>new TextDecoder().decode(b.subarray(p,p+n));
 const u32=(p:number)=>v.getUint32(p,false),sync=(p:number)=>(b[p]<<21)|(b[p+1]<<14)|(b[p+2]<<7)|b[p+3];
 const picture=(p:number,end:number)=>{if(p+12>end)return null;p+=4;const m=u32(p);p+=4;if(m>200||p+m+4>end)return null;const mime=ascii(p,m);p+=m;const d=u32(p);p+=4+d+16;if(p+4>end)return null;const len=u32(p);p+=4;return p+len<=end?{data:b.slice(p,p+len),mime}:null;};
 try {
  if(ascii(0,3)==='ID3'&&b.length>=10){const version=b[3];if(version!==3&&version!==4)return null;const end=Math.min(b.length,10+sync(6));let p=10;if(b[5]&0x40)p+=version===4?sync(p):4+u32(p);
   while(p+10<=end){const id=ascii(p,4),len=version===4?sync(p+4):u32(p+4);if(!len||p+10+len>end)break;if(id==='APIC'){let q=p+10;const enc=b[q++],mimeEnd=b.indexOf(0,q);if(mimeEnd<0||mimeEnd>=p+10+len)return null;const mime=ascii(q,mimeEnd-q);q=mimeEnd+2;if(enc===0||enc===3){while(q<p+10+len&&b[q])q++;q++;}else{while(q+1<p+10+len&&(b[q]||b[q+1]))q+=2;q+=2;}return q<p+10+len?{data:b.slice(q,p+10+len),mime}:null;}p+=10+len;}
  }
  if(ascii(0,4)==='fLaC'){let p=4;while(p+4<=b.length){const kind=b[p]&127,last=!!(b[p]&128),len=(b[p+1]<<16)|(b[p+2]<<8)|b[p+3];if(p+4+len>b.length)break;if(kind===6)return picture(p+4,p+4+len);p+=4+len;if(last)break;}}
  // M4A cover lives in a covr/data atom. Validate each candidate's enclosing size.
  for(let p=4;p+24<b.length;p++){if(b[p]!==99||ascii(p,4)!=='covr')continue;const end=p-4+u32(p-4),q=p+4;if(end>b.length||end<=q+16)continue;if(ascii(q+4,4)==='data'){const len=u32(q),kind=u32(q+8)&0xffffff;if(q+len<=end&&(kind===13||kind===14))return {data:b.slice(q+16,q+len),mime:kind===13?'image/jpeg':'image/png'};}}
 }catch{return null;}return null;
}

