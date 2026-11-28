/* Metres, centered origin; x points right and z down on the plan. No DOM or guest data. */
(() => {
  "use strict";
  const KEY="kaza:salon:maqueta:v1", LIMIT=64;
  const presets={atrio:"Atrio central", galeria:"Galería larga", libre:"Salón vacío"};
  const kinds={table:"Mesa",main:"Mesa principal",floor:"Pista de baile",dj:"Cabina de DJ"};
  const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v)), round=v=>Math.round(v*100)/100;
  const rad=deg=>deg*Math.PI/180, table=o=>o.kind==="table"||o.kind==="main";
  function size(o){
    if(!table(o))return {w:o.w,d:o.d};
    if(o.shape==="round"){const d=1.16+o.seats*.105;return {w:d,d}}
    return {w:Math.max(o.kind==="main"?3.2:1.65,Math.ceil(o.seats/2)*.64+.25),d:1.22};
  }
  function seats(o){
    if(!table(o))return [];
    const {w,d}=size(o), points=[];
    for(let i=0;i<o.seats;i++){
      if(o.shape==="round"){const a=i*2*Math.PI/o.seats;points.push({x:(w/2+.31)*Math.sin(a),z:(d/2+.31)*Math.cos(a),a});}
      else{
        const upper=Math.ceil(o.seats/2),top=i<upper,n=top?upper:o.seats-upper,j=top?i:i-upper;
        points.push({x:((j+.5)/n-.5)*w,z:(top?-1:1)*(d/2+.31),a:top?Math.PI:0});
      }
    }return points;
  }
  function extents(o){
    const {w,d}=size(o),gap=table(o)?.56:.04;
    if(table(o)&&o.shape==="round")return {x:w/2+gap,z:d/2+gap};
    const c=Math.abs(Math.cos(rad(o.angle))),s=Math.abs(Math.sin(rad(o.angle)));
    return {x:c*(w/2+gap)+s*(d/2+gap),z:s*(w/2+gap)+c*(d/2+gap)};
  }
  function keepInside(room,o){
    const e=extents(o);
    o.x=round(clamp(o.x,-room.width/2+e.x,room.width/2-e.x));
    o.z=round(clamp(o.z,-room.depth/2+e.z,room.depth/2-e.z));return o;
  }
  function make(kind,id,number,shape){
    const o={id,kind,name:kinds[kind],x:0,z:0,angle:0};
    if(table(o))Object.assign(o,{number,shape:shape||(kind==="main"?"rect":"round"),seats:kind==="main"?4:8});
    else Object.assign(o,kind==="floor"?{w:4.1,d:3.3}:{w:1.9,d:.9});
    return o;
  }
  function preset(id="atrio"){
    const long=id==="galeria", room={v:1,preset:id,width:long?20:18,depth:long?11:14,items:[],reference:""};
    const add=(kind,x,z,number,shape)=>room.items.push({...make(kind,"e"+(room.items.length+1),number,shape),x,z});
    if(id==="atrio"){
      for(const [i,z] of [-4.2,0,4.2].entries()){add("table",-5.65,z,2*i+1);add("table",5.65,z,2*i+2)}
      add("main",0,-4.65,7);add("floor",0,.05);add("dj",.3,4.7);
    }else if(long){
      for(const [i,x] of [-6.9,-2.6,1.7].entries()){add("table",x,-3.15,i+1,"rect");add("table",x,3.15,i+4,"rect")}
      add("main",6.8,-2.8,7);add("floor",6.2,1.3);add("dj",-6.8,0);
    }
    return room;
  }
  // Project the actual padded seating footprints onto their separating axes.
  function intersects(a,b,padding=0){
    const rect=o=>{const {w,d}=size(o),g=table(o)?.56:.04,t=rad(o.angle);
      return {u:[Math.cos(t),Math.sin(t)],v:[-Math.sin(t),Math.cos(t)],hw:w/2+g,hd:d/2+g}};
    const circ=o=>table(o)&&o.shape==="round",dx=a.x-b.x,dz=a.z-b.z;
    if(circ(a)&&circ(b))return Math.hypot(dx,dz)<extents(a).x+extents(b).x+padding;
    if(circ(a)||circ(b)){
      const c=circ(a)?a:b,r=rect(c===a?b:a);
      return Math.hypot(Math.max(0,Math.abs(dx*r.u[0]+dz*r.u[1])-r.hw),
        Math.max(0,Math.abs(dx*r.v[0]+dz*r.v[1])-r.hd))<extents(c).x+padding;
    }
    const A=rect(a),B=rect(b),dot=(v,w)=>v[0]*w[0]+v[1]*w[1];
    const radius=(r,v)=>r.hw*Math.abs(dot(r.u,v))+r.hd*Math.abs(dot(r.v,v));
    return [A.u,A.v,B.u,B.v].every(v=>Math.abs(dx*v[0]+dz*v[1])<radius(A,v)+radius(B,v)+padding);
  }
  function insert(room,kind,shape){
    if(!Object.hasOwn(kinds,kind)||room.items.length>=LIMIT)return null;
    const ids=new Set(room.items.map(o=>o.id)),nums=new Set(room.items.filter(table).map(o=>o.number));
    let i=1,n=1;while(ids.has("e"+i))i++;while(nums.has(n))n++;
    const o=make(kind,"e"+i,n,shape),e=extents(o),spots=[];
    for(let x=-room.width/2+e.x+.12;x<=room.width/2-e.x;x+=.4){
      for(let z=-room.depth/2+e.z+.12;z<=room.depth/2-e.z;z+=.4)spots.push([x,z]);
    }
    spots.sort((a,b)=>a[0]**2+a[1]**2-b[0]**2-b[1]**2);
    for(const [x,z] of spots){
      o.x=round(x);o.z=round(z);
      if(!room.items.some(other=>intersects(o,other,.08))){room.items.push(o);return o}
    }return null;
  }
  function resize(room,width,depth){
    const rw=width/room.width, rd=depth/room.depth;
    room.width=width;room.depth=depth;
    room.items.forEach(o=>{o.x*=rw;o.z*=rd;keepInside(room,o)});
  }
  const numeric=(v,lo,hi)=>Number.isFinite(v)&&v>=lo&&v<=hi;
  function parse(raw){
    const r=JSON.parse(raw);
    if(r?.v!==1||!Object.hasOwn(presets,r.preset)||!numeric(r.width,10,32)||!numeric(r.depth,10,32)||
       !Array.isArray(r.items)||r.items.length>LIMIT||typeof r.reference!=="string"||r.reference.length>1800000||
       (r.reference&&!/^data:image\/(png|jpeg|webp);base64,[a-z\d+/=]+$/i.test(r.reference)))throw Error("Plano inválido");
    const ids=new Set(),numbers=new Set();
    for(const o of r.items){
      if(!o||typeof o.id!=="string"||!/^e\d{1,4}$/.test(o.id)||ids.has(o.id)||!Object.hasOwn(kinds,o.kind)||
         typeof o.name!=="string"||o.name.length>52||!numeric(o.x,-32,32)||!numeric(o.z,-32,32)||!numeric(o.angle,0,359))throw Error("Elemento inválido");
      ids.add(o.id);
      if(table(o)){if(!Number.isInteger(o.number)||!numeric(o.number,1,999)||numbers.has(o.number)||!["round","rect"].includes(o.shape)||
                       !Number.isInteger(o.seats)||!numeric(o.seats,2,16))throw Error("Mesa inválida");numbers.add(o.number)}
      else if(!numeric(o.w,.65,6)||!numeric(o.d,.65,6))throw Error("Medidas inválidas");
      keepInside(r,o);
    }return r;
  }
  function camera(room,view,w,h,yaw,elevation,zoom,pan){
    const flat=view==="2d", a=flat?0:yaw, e=flat?Math.PI/2:elevation;
    const c=Math.cos(a),s=Math.sin(a),se=Math.sin(e),ce=Math.cos(e),ty=flat?0:.95;
    const spanX=room.width*Math.abs(c)+room.depth*Math.abs(s);
    const spanY=(room.width*Math.abs(s)+room.depth*Math.abs(c))*se+2.4*ce;
    const scale=Math.max(.1,Math.min(w/(spanX+1.65),h/(spanY+1.65)))*zoom;
    function project(x,z,y=0){const X=x-pan.x,Z=z-pan.z;return {x:w/2+scale*(X*c-Z*s),y:h/2+scale*((X*s+Z*c)*se-(y-ty)*ce)}}
    function ground(px,py,y=0){const A=(px-w/2)/scale,B=((py-h/2)/scale+(y-ty)*ce)/se;
      return {x:pan.x+A*c+B*s,z:pan.z-A*s+B*c}}
    return {w,h,a,e,scale,ty,pan,project,ground};
  }
  const api={KEY,LIMIT,presets,kinds,clamp,round,rad,table,size,seats,extents,keepInside,preset,intersects,insert,resize,parse,camera};
  if(typeof module==="object"&&module.exports)module.exports=api;else window.KazaSalon=api;
})();
