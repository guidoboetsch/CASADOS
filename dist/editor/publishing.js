/* Packages one UTF-8 HTML file under its public route. ZIP STORE, no remote service. */
"use strict";
window.KazaPublish=(()=>{
  const slugOK=s=>s.length>=2&&s.length<=60&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
  const url=s=>"https://guidoboetsch.github.io/CASADOS/i/"+s+"/";
  const table=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
  function zip(slug,html){
    if(!slugOK(slug))throw Error("Nombre de enlace inválido");
    const encoder=new TextEncoder(),name=encoder.encode("i/"+slug+"/index.html"),data=encoder.encode(html);
    let crc=0xffffffff;for(const b of data)crc=table[(crc^b)&255]^(crc>>>8);crc=(crc^0xffffffff)>>>0;
    function header(n,fields){const a=new Uint8Array(n),v=new DataView(a.buffer);for(const [i,size,num] of fields)v[size===4?"setUint32":"setUint16"](i,num,true);return a}
    const local=header(30,[[0,4,0x04034b50],[4,2,20],[6,2,0x800],[12,2,33],[14,4,crc],[18,4,data.length],[22,4,data.length],[26,2,name.length]]);
    const central=header(46,[[0,4,0x02014b50],[4,2,20],[6,2,20],[8,2,0x800],[14,2,33],[16,4,crc],[20,4,data.length],[24,4,data.length],[28,2,name.length]]);
    const end=header(22,[[0,4,0x06054b50],[8,2,1],[10,2,1],[12,4,central.length+name.length],[16,4,local.length+name.length+data.length]]);
    return new Blob([local,name,data,central,name,end],{type:"application/zip"});
  }
  return {slugOK,url,zip};
})();
