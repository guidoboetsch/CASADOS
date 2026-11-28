(() => {
  "use strict";
  const M=window.KazaSalon, $=id=>document.getElementById(id),stage=$("stage"),plan=$("plan"),ctx=plan.getContext("2d");
  let room=M.preset(),selected=null,mode="3d",engine=null,available=true,camera,raf=0,reference=null,referenceSrc=null;
  let yaw=.46,elevation=.69,zoom=1,pan={x:0,z:0},gesture=null,modalAction=null;
  const before=[],after=[],fingers=new Map(),labels=new Map(),snap=()=>structuredClone(room);
  let warning="";
  try{const raw=localStorage.getItem(M.KEY);if(raw)room=M.parse(raw)}
  catch{warning="No se pudo leer el borrador anterior. Se muestra el ejemplo; no se guardará hasta que lo edites."}
  const say=t=>{$("notice").textContent=t};
  const item=()=>room.items.find(o=>o.id===selected);
  const title=o=>M.table(o)?(o.kind==="main"?"Principal ":"Mesa ")+o.number+(o.name!==M.kinds[o.kind]?" · "+o.name:""):o.name;
  function commit(old){
    before.push(old);if(before.length>30)before.shift();after.length=0;save();sync();
  }
  function save(){try{localStorage.setItem(M.KEY,JSON.stringify(room));$("save-state").textContent="Guardado aquí"}
    catch{$("save-state").textContent="Sin guardar";say("Tu navegador no pudo guardar este borrador. No cierres la pestaña; probá quitar la imagen de referencia.")}}
  function history(back){if(gesture)return;const from=back?before:after,to=back?after:before;if(!from.length)return;
    to.push(snap());room=from.pop();if(!item())selected=null;say(back?"Cambio deshecho.":"Cambio rehecho.");save();sync()}
  function ask(heading,body,fn){$("ask-title").textContent=heading;$("ask-text").textContent=body;modalAction=fn;const d=$("confirm");d.returnValue="";d.showModal()}
  $("confirm").addEventListener("close",()=>{const fn=modalAction;modalAction=null;if($("confirm").returnValue==="ok"&&fn)fn()});
  function resetCamera(){zoom=1;pan={x:0,z:0};yaw=.46;elevation=.69;invalidate()}
  function switchMode(next){
    if(next==="3d"&&!engine&&available){try{engine=window.KazaMaqueta.create($("volume"),M)}
      catch{available=false;say("Este equipo no pudo abrir la vista 3D. Podés seguir editando todo en la planta 2D.")}}
    mode=next==="3d"&&engine&&available?"3d":"2d";$("volume").hidden=mode!=="3d";plan.hidden=mode!=="2d";
    $("view2").setAttribute("aria-pressed",String(mode==="2d"));$("view3").setAttribute("aria-pressed",String(mode==="3d"));$("view3").disabled=!available;
    $("left").disabled=$("right").disabled=mode!=="3d";
    $("drawing-caption").textContent=mode==="2d"?"FIG. 02 / PLANTA":"FIG. 01 / AXONOMETRÍA";
    $("gestures").textContent="Arrastrá una mesa para moverla. "+(mode==="3d"?"Arrastrá el fondo para orbitar.":"Arrastrá el fondo para recorrer el plano.")+" Ruedita o dos dedos: zoom.";
    invalidate();
  }
  $("volume").addEventListener("webglcontextlost",e=>{e.preventDefault();available=false;engine=null;switchMode("2d");say("La vista 3D se interrumpió. Tu distribución sigue disponible en 2D.")});
  function getCamera(){return M.camera(room,mode,Math.max(1,stage.clientWidth),Math.max(1,stage.clientHeight),yaw,elevation,zoom,pan)}
  function invalidate(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;draw()})}
  function draw(){
    camera=getCamera();if(mode==="3d"&&engine)engine.draw(room,camera,selected);else drawPlan(camera);
    const live=new Set();stage.style.setProperty("--label",M.clamp(camera.scale*.34,9,15)+"px");
    for(const o of room.items){
      live.add(o.id);let tag=labels.get(o.id);
      if(!tag){tag=document.createElement("span");tag.dataset.id=o.id;$("labels").append(tag);labels.set(o.id,tag)}
      tag.className="tag"+(o.id===selected?" active":"");tag.textContent=M.table(o)?String(o.number).padStart(2,"0"):o.kind==="floor"?"Pista":"DJ";
      const p=camera.project(o.x,o.z,mode==="2d"?0:M.table(o)?1.04:o.kind==="floor"?.13:1.1);
      tag.style.left=p.x+"px";tag.style.top=p.y+"px";
    }
    for(const [id,tag] of labels)if(!live.has(id)){tag.remove();labels.delete(id)}
  }
  function drawPlan(c){
    const ratio=Math.min(devicePixelRatio||1,2),W=Math.round(c.w*ratio),H=Math.round(c.h*ratio);
    if(plan.width!==W||plan.height!==H){plan.width=W;plan.height=H}
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle="#dedbd5";ctx.fillRect(0,0,c.w,c.h);
    const center=c.project(0,0),w=room.width,d=room.depth;
    ctx.translate(center.x,center.y);ctx.scale(c.scale,c.scale);ctx.lineWidth=1/c.scale;
    ctx.fillStyle="#f2eee5";ctx.fillRect(-w/2,-d/2,w,d);
    if(reference){const s=Math.min(w/reference.naturalWidth,d/reference.naturalHeight),iw=s*reference.naturalWidth,ih=s*reference.naturalHeight;
      ctx.globalAlpha=.55;ctx.drawImage(reference,-iw/2,-ih/2,iw,ih);ctx.globalAlpha=1}
    ctx.strokeStyle="#67594b25";ctx.beginPath();for(let x=-w/2+1;x<w/2;x++) {ctx.moveTo(x,-d/2);ctx.lineTo(x,d/2)}
    for(let z=-d/2+1;z<d/2;z++){ctx.moveTo(-w/2,z);ctx.lineTo(w/2,z)}ctx.stroke();
    ctx.lineWidth=.075;ctx.strokeStyle="#615b52";ctx.strokeRect(-w/2,-d/2,w,d);
    const path=(round,w,d)=>{ctx.beginPath();if(round)ctx.ellipse(0,0,w/2,d/2,0,0,Math.PI*2);else ctx.rect(-w/2,-d/2,w,d)};
    for(const o of room.items){const {w,d}=M.size(o);ctx.save();ctx.translate(o.x,o.z);ctx.rotate(M.rad(o.angle));
      ctx.lineWidth=.035;
      for(const ch of M.seats(o)){ctx.save();ctx.translate(ch.x,ch.z);ctx.rotate(-ch.a);ctx.fillStyle="#846366";ctx.fillRect(-.21,-.19,.42,.38);ctx.restore()}
      path(M.table(o)&&o.shape==="round",w,d);ctx.fillStyle=M.table(o)?"#fff9ed":o.kind==="floor"?"#d7bfa3":"#5f5456";ctx.fill();
      ctx.strokeStyle=o.id===selected?"#b52539":"#786e62";ctx.lineWidth=o.id===selected?.09:.04;ctx.stroke();
      if(o.kind==="floor"){ctx.strokeStyle="#7c60473a";ctx.lineWidth=.025;ctx.beginPath();for(let x=-w/2+.55;x<w/2;x+=.55){ctx.moveTo(x,-d/2);ctx.lineTo(x,d/2)}for(let y=-d/2+.55;y<d/2;y+=.55){ctx.moveTo(-w/2,y);ctx.lineTo(w/2,y)}ctx.stroke()}
      ctx.restore();
    }
  }
  function pickFlat(x,y){const p=getCamera().ground(x,y);for(const o of [...room.items].reverse()){
    const dx=p.x-o.x,dz=p.z-o.z,c=Math.cos(M.rad(o.angle)),s=Math.sin(M.rad(o.angle)),{w,d}=M.size(o),g=M.table(o)?.53:.05;
    if(M.table(o)&&o.shape==="round"?Math.hypot(dx,dz)<=w/2+g:Math.abs(dx*c+dz*s)<=w/2+g&&Math.abs(-dx*s+dz*c)<=d/2+g)return o.id;
  }return null}
  function refImage(){
    if(referenceSrc===room.reference)return;referenceSrc=room.reference;reference=null;if(!referenceSrc)return;
    const src=referenceSrc,img=new Image();img.onload=()=>{if(referenceSrc===src){reference=img;invalidate()}};img.src=src;
  }
  function sync(){
    const o=item(),tables=room.items.filter(M.table);
    $("num-tables").textContent=tables.length;$("num-seats").textContent=tables.reduce((a,t)=>a+t.seats,0);
    $("room-name").textContent=M.presets[room.preset];$("room-size").textContent=room.width+" × "+room.depth+" m";
    $("undo").disabled=!before.length;$("redo").disabled=!after.length;
    $("room-w").value=room.width;$("room-d").value=room.depth;$("preset").value=room.preset;
    $("selection").replaceChildren(new Option("Elegir en el plano…",""),...room.items.map(o=>new Option(title(o),o.id)));$("selection").value=o?.id||"";
    $("properties").hidden=!o;$("empty-help").hidden=Boolean(o);$("ref-remove").hidden=!room.reference;
    if(o){$("table-fields").hidden=!M.table(o);$("fixture-fields").hidden=M.table(o);
      $("object-name").value=o.name;$("pos-x").value=o.x;$("pos-z").value=o.z;
      if(M.table(o)){$("number").value=o.number;$("seats").value=o.seats;$("shape").value=o.shape}
      else{$("obj-w").value=o.w;$("obj-d").value=o.d}
      const other=room.items.find(t=>t!==o&&M.intersects(t,o));$("overlap").textContent=other?"Revisá el espacio: se superpone con "+title(other)+".":"";
    }refImage();invalidate();
  }
  function select(id){selected=id||null;sync()}
  $("selection").onchange=e=>select(e.target.value);
  $("add").onclick=()=>{const old=snap(),v=$("new-type").value,shape=["round","rect"].includes(v)?v:null;
    const o=M.insert(room,shape?"table":v,shape);if(!o){say(room.items.length>=M.LIMIT?"Se alcanzó el límite de esta maqueta.":"No hay un espacio libre para ese elemento. Mové otras mesas o ampliá el salón.");return}
    selected=o.id;say("Se agregó: "+title(o)+".");commit(old)};
  function edit(id,prop,type,lo,hi){$(id).onchange=e=>{const o=item();if(!o)return;
    const val=e.target.value;let v=type==="number"?Number(val):val.trim();
    if(type==="number"&&(val===""||!Number.isFinite(v)||v<lo||v>hi||(["seats","number"].includes(prop)&&!Number.isInteger(v)))){sync();say("Ingresá un valor entre "+lo+" y "+hi+".");return}
    if(prop==="number"&&room.items.some(t=>t!==o&&M.table(t)&&t.number===v)){sync();say("Ese número ya está asignado a otra mesa.");return}
    if(prop==="name"&&!v)v=M.kinds[o.kind];if(o[prop]===v)return;
    const old=snap();o[prop]=v;M.keepInside(room,o);say("");commit(old);
  }}
  edit("object-name","name","text");edit("shape","shape","text");edit("number","number","number",1,999);edit("seats","seats","number",2,16);
  edit("obj-w","w","number",.65,6);edit("obj-d","d","number",.65,6);edit("pos-x","x","number",-32,32);edit("pos-z","z","number",-32,32);
  $("turn").onclick=()=>{const o=item();if(!o)return;const old=snap();o.angle=(o.angle+45)%360;M.keepInside(room,o);commit(old)};
  $("remove").onclick=()=>{const id=selected;if(!item())return;ask("¿Quitar este elemento?",title(item())+" dejará de aparecer en ambas vistas. Podés deshacerlo.",()=>{
    const old=snap();room.items=room.items.filter(o=>o.id!==id);selected=null;commit(old)})};
  $("load-preset").onclick=()=>{const id=$("preset").value;ask("¿Cargar "+M.presets[id]+"?","Se reemplazará la distribución actual, incluida su referencia. Podés deshacerlo.",()=>{
    const old=snap();room=M.preset(id);selected=null;resetCamera();say("Distribución cargada.");commit(old)})};
  $("resize").onclick=()=>{const w=+$("room-w").value,d=+$("room-d").value;if(![w,d].every(v=>v>=10&&v<=32)){say("Usá medidas de entre 10 y 32 metros.");return}
    if(room.width===w&&room.depth===d)return;const old=snap();M.resize(room,w,d);resetCamera();say("Medidas aplicadas. Revisá la separación entre mesas.");commit(old)};
  let uploadSerial=0;
  $("ref-file").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;
    if(!["image/png","image/jpeg","image/webp"].includes(f.type)||f.size>12*1024*1024){say("Elegí un PNG, JPG o WebP de hasta 12 MB.");return}
    const url=URL.createObjectURL(f),ticket=++uploadSerial,original=room;
    try{const im=new Image();im.src=url;await im.decode();if(ticket!==uploadSerial||room!==original)return;
      const s=Math.min(1,1280/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));const g=c.getContext("2d");
      g.fillStyle="white";g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);const src=c.toDataURL("image/jpeg",.76);
      if(src.length>1800000)throw Error();const old=snap();room.reference=src;switchMode("2d");say("Referencia cargada y centrada sin deformar. La maqueta no cambió.");commit(old)
    }catch{say("No se pudo leer la imagen. Probá con otro archivo.")}finally{URL.revokeObjectURL(url)}
  };
  $("ref-remove").onclick=()=>{++uploadSerial;const old=snap();room.reference="";commit(old)};
  $("view2").onclick=()=>switchMode("2d");$("view3").onclick=()=>switchMode("3d");$("fit").onclick=resetCamera;
  $("left").onclick=()=>{yaw-=Math.PI/8;invalidate()};$("right").onclick=()=>{yaw+=Math.PI/8;invalidate()};
  function zoomAt(f,x,y){const a=getCamera().ground(x,y);zoom=M.clamp(zoom*f,.55,3.8);const b=getCamera().ground(x,y);pan={x:pan.x+a.x-b.x,z:pan.z+a.z-b.z};invalidate()}
  $("zoom-in").onclick=()=>zoomAt(1.2,stage.clientWidth/2,stage.clientHeight/2);$("zoom-out").onclick=()=>zoomAt(1/1.2,stage.clientWidth/2,stage.clientHeight/2);
  $("undo").onclick=()=>history(true);$("redo").onclick=()=>history(false);
  const local=e=>{const r=stage.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}};
  stage.addEventListener("wheel",e=>{e.preventDefault();const {x,y}=local(e);zoomAt(Math.exp(-M.clamp(e.deltaY*(e.deltaMode===1?16:1),-200,200)*.002),x,y)},{passive:false});
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  stage.oncontextmenu=e=>e.preventDefault();
  stage.onpointerdown=e=>{if(e.button>2)return;e.preventDefault();stage.focus({preventScroll:true});stage.setPointerCapture(e.pointerId);const p=local(e);fingers.set(e.pointerId,p);
    if(fingers.size===2){if(gesture?.type==="item"&&gesture.moved)commit(gesture.old);
      const [a,b]=[...fingers.values()],m=mid(a,b);gesture={type:"pinch",dist:distance(a,b)||1,zoom,anchor:getCamera().ground(m.x,m.y)};return}
    if(fingers.size>2)return;
    const panMode=e.button!==0||e.shiftKey,id=panMode?null:e.target.dataset?.id||(mode==="3d"?engine.pick(p.x,p.y):pickFlat(p.x,p.y));
    if(id){select(id);const o=item();gesture={type:"item",old:snap(),id,start:p,anchor:getCamera().ground(p.x,p.y),x:o.x,z:o.z,moved:false}}
    else gesture={type:panMode||mode==="2d"?"pan":"orbit",start:p,prev:p,moved:false,clear:!panMode};
  };
  stage.onpointermove=e=>{if(!fingers.has(e.pointerId)||!gesture)return;const p=local(e);fingers.set(e.pointerId,p);const g=gesture;
    if(g.type==="pinch"){if(fingers.size<2)return;const [a,b]=[...fingers.values()],m=mid(a,b);zoom=M.clamp(g.zoom*distance(a,b)/g.dist,.55,3.8);
      const b2=getCamera().ground(m.x,m.y);pan={x:pan.x+g.anchor.x-b2.x,z:pan.z+g.anchor.z-b2.z};invalidate();return}
    if(!g.moved&&distance(p,g.start)<3)return;g.moved=true;
    if(g.type==="item"){const o=item();if(!o)return;const b=getCamera().ground(p.x,p.y);o.x=g.x+b.x-g.anchor.x;o.z=g.z+b.z-g.anchor.z;M.keepInside(room,o);$("pos-x").value=o.x;$("pos-z").value=o.z}
    else if(g.type==="pan"){const c=getCamera(),a=c.ground(g.prev.x,g.prev.y),b=c.ground(p.x,p.y);pan={x:pan.x+a.x-b.x,z:pan.z+a.z-b.z}}
    else{yaw-=(p.x-g.prev.x)*.009;elevation=M.clamp(elevation+(p.y-g.prev.y)*.006,.37,1.35)}
    g.prev=p;invalidate();
  };
  function end(e,cancel){if(!fingers.has(e.pointerId))return;fingers.delete(e.pointerId);const g=gesture;
    if(g?.type==="item"&&g.moved){if(cancel){room=g.old;sync()}else commit(g.old)}
    else if(g?.clear&&!g.moved&&!cancel)select(null);
    gesture=null;
  }
  stage.onpointerup=e=>end(e,false);stage.onpointercancel=e=>end(e,true);stage.onlostpointercapture=e=>end(e,true);
  document.addEventListener("keydown",e=>{if($("confirm").open||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();history(!e.shiftKey)}
    else if(e.key.toLowerCase()==="h"&&!e.ctrlKey&&!e.metaKey)resetCamera();else if(e.key==="Escape")select(null)});
  new ResizeObserver(invalidate).observe(stage);
  if(warning)say(warning);switchMode("3d");sync();
})();
