"use strict";
(() => {
  const labels = {cover:"Portada",day:"El día",timeline:"Itinerario",confirm:"Confirmar",gifts:"Regalos",social:"Redes sociales",seats:"Buscá tu mesa",countdown:"Cuenta regresiva",attendance:"Asistencia confirmada"};
  const defaults = {
    cover:{names:"Guido y María",mark:"G&M",date:"2026-11-21",photo:"",logo:""},
    day:{title:"El día",venue:"",address:"",dress:"",map:""},
    timeline:{title:"Así se vivirá esta noche.",items:"Ceremonia\nRecepción\nFiesta"},
    confirm:{title:"¿Podés venir?",body:"Nos encantaría que nos acompañes. Avisanos si vas a poder venir.",modo:"grupo",url:"",grupoUrl:""},
    gifts:{title:"Regalá un recuerdo.",body:"Lo más importante es compartir este día con vos.",url:"",items:""},
    social:{title:"Seguí la fiesta.",body:"Compartamos las fotos y los momentos de esta noche.",tag:"",url:""},
    seats:{title:"Buscá tu mesa.",rows:""},
    countdown:{title:"Nuestro gran día.",time:"",offset:"-03:00"},
    attendance:{title:"La fiesta toma forma.",source:""}
  };
  const initial = ["cover","day","timeline","confirm","gifts","social"];
  const optional = {seats:"bloque de mesas",countdown:"cuenta regresiva",attendance:"contador de confirmados"};
  const schema = {
    cover:[["names","Nombres"],["mark","Iniciales del logo"],["date","Fecha","date"],["photo","Foto principal","image"],["logo","Logo de la pareja","image"]],
    day:[["title","Título"],["venue","Salón o lugar"],["address","Dirección"],["dress","Dresscode"],["map","Enlace al mapa","url"]],
    timeline:[["title","Título"],["items","Momentos de la noche","area","Uno por línea. Para agregar un horario, escribí por ejemplo: 20:30 | Recepción."]],
    confirm:[["title","Título"],["body","Mensaje","area"],["url","Enlace al formulario externo","url","Se conserva el formulario que elijas para este evento."],["grupoUrl","Formulario de grupos de este evento","url","Pegá la dirección del formulario KAZA activado para esta pareja (terminada en /exec), no la planilla ni un código familiar. Sin conectar, la invitación no recibe respuestas."]],
    gifts:[["title","Título"],["body","Mensaje","area"],["items","Regalos de la pareja","area","Uno por línea. Podés escribir solo el nombre o usar: Nombre del regalo | https://…"],["url","Enlace a la lista de regalos","url"]],
    social:[["title","Título"],["body","Mensaje","area"],["tag","Usuario o hashtag"],["url","Enlace a las redes del evento","url","Podés usar Instagram u otra red."]],
    seats:[["title","Título"],["rows","Asignaciones de mesas","area","Un código o nombre por línea, seguido de | y su mesa. Ejemplo: INV-042 | Mesa 3. Usá códigos individuales si la lista no debe ser pública."]],
    countdown:[["title","Título"],["date","Fecha del casamiento","date","Es la misma fecha de la portada y del bloque El día."],["time","Hora de inicio","time","Si no indicás una hora, la cuenta termina a las 00:00 del día del casamiento."],["offset","Huso horario del salón","offset","Elegí el que corresponde en esa fecha. Para Argentina, UTC−03:00."]],
    attendance:[["title","Título"],["source","Enlace público del recuento","url","Usá el enlace que entrega solo el total de este evento. No pegues un formulario, la planilla de invitados ni una clave. Cada persona confirmada cuenta una vez, incluidos los acompañantes."]]
  };
  const key="kaza:invitation-studio:v1";
  const $=id=>document.getElementById(id);
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
  const designs=window.KazaDesigns;
  const publish=window.KazaPublish;
  const live=window.KazaEventLive();
  let verified=null;
  const ideas={"Para la casa":["Desayuno para dos","Una cena en casa","Nuestro rincón de café"],"Luna de miel":["Una noche de viaje","Un paseo de a dos","Una cena en el destino"],"Experiencias":["Entradas al cine","Una clase de cocina","Una escapada de fin de semana"]};
  const giftRows=text=>text.split(/\r?\n/).filter(l=>l.trim()).map(l=>l.split("|").map(s=>s.trim()));
  const state={design:"cine",slug:"",order:[...initial],blocks:structuredClone(defaults)};
  const imageOK = value=>/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value);
  let loadWarning="";
  try {
    const raw=localStorage.getItem(key);
    if(raw){const data=JSON.parse(raw);
      if(!Array.isArray(data.order)||!initial.every(k=>data.order.includes(k))||!data.order.every(k=>Object.hasOwn(labels,k))||new Set(data.order).size!==data.order.length||!data.blocks)throw Error();
      for(const [k,fields] of Object.entries(defaults))for(const prop of Object.keys(fields)){
        const v=data.blocks[k]?.[prop];
        if(typeof v==="string"&&(!["photo","logo"].includes(prop)||!v||imageOK(v)))state.blocks[k][prop]=v;
      }
      if(data.blocks.confirm?.modo!=="grupo")state.blocks.confirm.modo="externo"; // Conservar los enlaces de borradores anteriores.
      state.order=[...data.order];
      if(typeof data.slug==="string")state.slug=data.slug.slice(0,60);
      if(designs.some(d=>d.id===data.design))state.design=data.design;
    }
  } catch {loadWarning="No se pudo recuperar el borrador anterior."}
  let selected=state.order[0],dragged=null,saveTimer;
  function save(){clearTimeout(saveTimer);saveTimer=null;try{localStorage.setItem(key,JSON.stringify(state));$("saved").textContent="Guardado en este navegador"}catch{$("saved").textContent="No se pudo guardar en este navegador. Descargá la invitación."}}
  function changed(){preview();$("saved").textContent="Guardando…";clearTimeout(saveTimer);saveTimer=setTimeout(save,300)}
  function safeUrl(value){try{const u=new URL(value);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:""}catch{return ""}}
  function grupoUrl(value){try{const u=new URL(value);if(u.origin!=="https://script.google.com"||u.search||u.hash||u.username||u.password||!/^\/macros\/s\/[\w-]+\/exec$/.test(u.pathname))return "";u.searchParams.set("estilo",state.design);return u.href}catch{return ""}}
  function campoActivo(k,p){return k!=="confirm" || (p!=="url"||state.blocks.confirm.modo==="externo") && (p!=="grupoUrl"||state.blocks.confirm.modo==="grupo");}
  function prettyDate(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return "";const d=new Date(date+"T12:00:00Z");return Number.isNaN(+d)?"":new Intl.DateTimeFormat("es-AR",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(d)}
  function seatRows(){return state.blocks.seats.rows.split(/\r?\n/).filter(l=>l.trim()).map(l=>l.split("|").map(s=>s.trim()))}
  // This function also runs in the downloaded standalone page. Only exact matches are shown.
  function bindSearch(root){
    const form=root.querySelector(".table-search");if(!form)return;
    const normalize=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().replace(/\s+/g," ").toLowerCase();
    const rows=Array.from(form.querySelector("template").content.querySelectorAll("[data-table]"));
    form.addEventListener("submit",event=>{event.preventDefault();const q=normalize(form.elements.query.value);
      const results=rows.filter(n=>q&&normalize(n.textContent)===q);
      form.querySelector("[role=status]").textContent=results.length===1?"Tu mesa: "+results[0].dataset.table:results.length?"Hay más de una coincidencia. Consultá con la organización.":"No encontramos esa asignación. Revisá el nombre o código completo.";
    });
  }
  function section(k,inEditor){
    const b=state.blocks[k],s=el("section",undefined,"invite-section "+k);s.dataset.block=k;
    const inner=el("div");s.append(inner);
    if(k==="cover"){
      if(b.photo){const img=el("img",undefined,"cover-image");img.src=b.photo;img.alt="";s.prepend(img)}
      if(b.logo){const logo=el("img",undefined,"image-mark");logo.src=b.logo;logo.alt="Logo de la pareja";inner.append(logo)}
      else if(b.mark)inner.append(el("div",b.mark,"mark"));
      inner.append(el("h1",b.names||"Nuestro casamiento"));
      if(prettyDate(b.date)){const time=el("time",prettyDate(b.date));time.dateTime=b.date;inner.append(time)}return s;
    }
    inner.append(el("p",labels[k],"kicker"),el("h2",b.title||labels[k]));
    const link=(url,label)=>{if(safeUrl(url)){const a=el("a",label,"invite-action");a.href=safeUrl(url);a.target="_blank";a.rel="noopener noreferrer";inner.append(a)}};
    if(k==="countdown"){
      const date=state.blocks.cover.date, times=live.eventTimes(date,b.time,b.offset);
      if(!times){inner.append(el("p","Elegí la fecha del casamiento para iniciar la cuenta.","hint"));return s}
      const clock=el("div"),strip=el("div",undefined,"clock-values");clock.dataset.eventStart=times.start;clock.dataset.eventEnd=times.end;
      strip.setAttribute("role","timer");strip.setAttribute("aria-live","off");strip.setAttribute("aria-label","Tiempo hasta el casamiento");strip.hidden=true;
      for(const unit of ["días","horas","min","seg"]){const part=el("span");part.append(el("strong","—"),el("small",unit));strip.append(part)}
      const target=el("time",prettyDate(date)+" · "+(b.time||"00:00")+" (UTC"+b.offset+")","metric-foot");
      target.dateTime=date+"T"+(b.time||"00:00")+":00"+b.offset;
      clock.append(strip,el("p",undefined,"clock-message"),target);inner.append(clock);
    }else if(k==="attendance"){
      const tally=el("div"),figure=el("p",undefined,"tally-figure");
      tally.dataset.countSource=live.source(b.source);figure.append(el("strong","—","tally-number"),el("span","personas confirmadas","tally-unit"));
      const note=el("p",inEditor?(tally.dataset.countSource?"Probá la conexión antes de descargar la invitación.":"Conectá el registro de este evento para ver el total."):"Consultando el total…","metric-foot tally-status");note.setAttribute("role","status");tally.append(figure,note);
      if(inEditor&&verified?.url===tally.dataset.countSource){figure.firstChild.textContent=verified.n.toLocaleString("es-AR");figure.lastChild.textContent=verified.n===1?"persona confirmada":"personas confirmadas";note.textContent="Última comprobación: "+new Date(verified.at).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})+"."}
      if(inEditor){const test=el("button","Probar conexión","invite-action");test.type="button";test.disabled=!tally.dataset.countSource;tally.append(test)}
      inner.append(tally);
    }else if(k==="day"){const dl=el("dl");for(const [label,value] of [["Fecha",prettyDate(state.blocks.cover.date)],["Lugar",b.venue],["Dirección",b.address],["Dresscode",b.dress]])if(value){const row=el("div");row.append(el("dt",label),el("dd",value));dl.append(row)}inner.append(dl);link(b.map,"Cómo llegar")}
    else if(k==="timeline"){const list=el("ol",undefined,"schedule");
      for(const line of b.items.split("\n").map(l=>l.trim()).filter(Boolean)){const li=el("li"),i=line.indexOf("|");if(i>0)li.append(el("strong",line.slice(0,i).trim()),el("span",line.slice(i+1).trim()));else li.append(el("span",line));list.append(li)}inner.append(list)}
    else if(k==="seats"){
      const rows=seatRows().filter(r=>r.length===2&&r.every(Boolean));
      if(!rows.length){inner.append(el("p",inEditor?"Cargá las asignaciones para habilitar la búsqueda.":"Las mesas todavía no están definidas.","hint"));return s}
      const form=el("form",undefined,"table-search"),label=el("label","Nombre completo o código"),input=el("input"),button=el("button","Buscar mesa","invite-action"),out=el("p"),data=el("template");
      input.name="query";input.required=true;input.autocomplete="off";label.append(input);button.type="submit";out.setAttribute("role","status");
      for(const [name,table] of rows){const row=el("span",name);row.dataset.table=table;data.content.append(row)}
      form.append(label,button,out,data);inner.append(form);
    }else if(k==="confirm"&&b.modo==="grupo"){
      if(b.body)inner.append(el("p",b.body,"copy"));
      if(inEditor){
        const prueba=el("a","Probar confirmación en grupo","invite-action");prueba.href="../rsvp/index.html?estilo="+state.design;prueba.target="_blank";prueba.rel="noopener noreferrer";inner.append(prueba);
        inner.append(el("p",grupoUrl(b.grupoUrl)?"Acá se abre la prueba sin envíos. La invitación descargada abre el formulario del evento.":"Prueba con datos ficticios. Conectá el formulario de este evento para recibir respuestas.","hint"));
      }else if(grupoUrl(b.grupoUrl))link(grupoUrl(b.grupoUrl),"Confirmar asistencia");
      else inner.append(el("p","La confirmación todavía no está abierta.","hint"));
    }else{if(b.body)inner.append(el("p",b.body,"copy"));if(k==="social"&&b.tag)inner.append(el("p",b.tag));
      if(k==="gifts"&&b.items.trim()){
        const list=el("ul",undefined,"gift-list");for(const [name,url] of giftRows(b.items)){const row=el("li");
          if(safeUrl(url)){const a=el("a",name);a.href=safeUrl(url);a.rel="noopener noreferrer";a.target="_blank";row.append(a)}else row.textContent=name;
          list.append(row)}inner.append(list);
      }
      link(b.url,{confirm:"Confirmar asistencia",gifts:"Ver lista de regalos",social:"Ver las redes de la fiesta"}[k]);
      if(inEditor&&!safeUrl(b.url)&&!(k==="gifts"&&b.items.trim()))inner.append(el("p","Agregá el enlace en el editor para mostrar el botón.","hint"));
    }
    return s;
  }
  function render(root,inEditor){root.dataset.design=state.design;root.replaceChildren(...state.order.map(k=>section(k,inEditor)));bindSearch(root)}
  let stopPreview=()=>{};
  function preview(){stopPreview();render($("preview"),true);stopPreview=live.mount($("preview"),true,(url,n,at)=>{verified=n===null?null:{url,n,at}})}
  function focusBlock(){const frame=document.querySelector(".viewport"),block=$("preview").querySelector('[data-block="'+selected+'"]');
    frame.scrollTop+=block.getBoundingClientRect().top-frame.getBoundingClientRect().top}
  function select(k){selected=k;list();fields();focusBlock();$("blocks").querySelector('[data-key="'+k+'"] .choose').focus({preventScroll:true})}
  function move(from,to){const i=state.order.indexOf(from);if(i<0||to<0||to>=state.order.length||i===to)return;
    state.order.splice(i,1);state.order.splice(to,0,from);changed();select(from)}
  function list(){
    const root=$("blocks");root.replaceChildren();
    state.order.forEach((k,i)=>{
      const li=el("li"),name=el("button",labels[k],"choose"),handle=el("span","⠿","grip");
      li.dataset.key=k;if(k===selected)li.className="current";name.type="button";name.setAttribute("aria-pressed",String(k===selected));name.onclick=()=>select(k);
      handle.setAttribute("aria-hidden","true");handle.title="Arrastrar "+labels[k];handle.draggable=true;
      handle.ondragstart=e=>{dragged=k;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",k)};
      handle.ondragend=()=>{dragged=null;root.querySelectorAll(".over").forEach(n=>n.classList.remove("over"))};
      li.ondragover=e=>{if(dragged){e.preventDefault();li.classList.add("over")}};li.ondragleave=()=>li.classList.remove("over");
      li.ondrop=e=>{e.preventDefault();li.classList.remove("over");if(dragged)move(dragged,i);dragged=null};
      li.append(handle,name);for(const [arrow,step,verb] of [["↑",-1,"Subir"],["↓",1,"Bajar"]]){const button=el("button",arrow,"move");button.type="button";button.setAttribute("aria-label",verb+" "+labels[k]);button.disabled=i+step<0||i+step>=state.order.length;button.onclick=()=>move(k,i+step);li.append(button)}root.append(li);
    });for(const [k,name] of Object.entries(optional)){
      const enabled=state.order.includes(k),toggle=$("toggle-"+k);
      toggle.textContent=(enabled?"Quitar ":"+ Agregar ")+name;
    }
  }
  async function pickImage(file,prop){
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>16*1024*1024)throw Error("Elegí un JPG, PNG o WebP de hasta 16 MB.");
    const image=new Image(),url=URL.createObjectURL(file);
    try{image.src=url;await image.decode();const side=prop==="logo"?440:1500,scale=Math.min(1,side/Math.max(image.naturalWidth,image.naturalHeight));const c=document.createElement("canvas");
      c.width=Math.max(1,Math.round(image.naturalWidth*scale));c.height=Math.max(1,Math.round(image.naturalHeight*scale));c.getContext("2d").drawImage(image,0,0,c.width,c.height);return c.toDataURL(prop==="logo"?"image/png":"image/jpeg",.82)}
    finally{URL.revokeObjectURL(url)}
  }
  function fields(){const root=$("fields"),k=selected,b=state.blocks[k];root.replaceChildren();$("editing").textContent=labels[k];
    if(k==="confirm"){
      const label=el("label","Cómo se confirma"),sel=el("select");sel.id="modo-rsvp";label.htmlFor=sel.id;
      sel.add(new Option("Formulario de KAZA · individual, pareja o familia","grupo"));sel.add(new Option("Mantener un formulario externo","externo"));sel.value=b.modo;
      sel.onchange=()=>{b.modo=sel.value;changed();fields();$("modo-rsvp").focus()};root.append(label,sel);
    }
    if(k==="gifts"){const box=el("div",undefined,"gift-presets"),label=el("label","Ideas para empezar"),select=el("select"),add=el("button","Sumar ideas a mi lista");
      select.id="gift-preset";label.htmlFor=select.id;Object.keys(ideas).forEach(name=>select.add(new Option(name)));
      add.type="button";add.onclick=()=>{const names=new Set(giftRows(b.items).map(([s])=>s.toLocaleLowerCase()));
        const rows=ideas[select.value].filter(s=>!names.has(s.toLocaleLowerCase()));if(rows.length){b.items=[b.items.trim(),...rows].filter(Boolean).join("\n");$("edit-items").value=b.items;changed()}};
      box.append(label,select,add);root.append(box);
    }
    for(const [prop,title,type,help] of schema[k]){
      if(!campoActivo(k,prop))continue;
      const id="edit-"+prop,label=el("label",title),input=el(type==="area"?"textarea":type==="offset"?"select":"input");label.htmlFor=id;input.id=id;root.append(label,input);
      const record=k==="countdown"&&prop==="date"?state.blocks.cover:b;
      if(help){const note=el("small",help);note.id=id+"-help";input.setAttribute("aria-describedby",note.id);root.append(note)}
      if(type==="image"){input.type="file";input.accept="image/jpeg,image/png,image/webp";input.onchange=async()=>{const f=input.files[0];if(!f)return;try{b[prop]=await pickImage(f,prop);changed();if(selected===k)fields()}catch(e){input.value="";$("saved").textContent=e.message||"No se pudo leer la imagen."}};
        if(b[prop]){const remove=el("button","Quitar "+title.toLowerCase());remove.onclick=()=>{b[prop]="";changed();fields()};root.append(remove)}continue}
      if(type==="offset"){
        const offsets=[...Array.from({length:27},(_,i)=>(i-12)*60),-570,-210,210,270,330,345,390,525,570,630,765,825].sort((a,b)=>a-b);
        for(const minutes of offsets){const n=Math.abs(minutes),v=(minutes<0?"-":"+")+String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
          input.add(new Option("UTC"+v+(v==="-03:00"?" · Argentina":""),v))}
      }else if(type&&type!=="area")input.type=type;
      if(type==="url")input.placeholder="https://…";input.value=record[prop];
      input.oninput=()=>{record[prop]=input.value;changed();if(type==="url"){const counter=k==="attendance",group=prop==="grupoUrl",ok=group?grupoUrl(input.value):counter?live.source(input.value):safeUrl(input.value);
        input.setCustomValidity(input.value&&!ok?(group?"Usá el /exec del formulario de grupos de este evento.":counter?"Ingresá la dirección HTTPS del total, no la planilla ni el formulario.":"Ingresá un enlace completo https:// o http://."):"");
        if(!group&&!counter&&!input.validity.valid)input.reportValidity()}};
    }
    if(k==="attendance"){
      const guide=el("details",undefined,"count-guide"),steps=el("ol");
      for(const step of ["Usá el registro donde se actualizan las confirmaciones de esta pareja. El titular y cada acompañante cuentan por separado.","Pedile a quien administra el formulario o la planilla un enlace de solo lectura que devuelva únicamente el total. La lista de invitados queda privada.","Pegá ese enlace arriba y tocá «Probar conexión» en la vista previa. Si todavía no tenés el enlace, podés quitar el bloque y agregarlo más adelante."])steps.append(el("li",step));
      guide.append(el("summary","¿De dónde sale el número?"),steps);root.append(guide);
    }
  }
  for(const k of Object.keys(optional))$("toggle-"+k).onclick=()=>{
    const idx=state.order.indexOf(k),anchor={countdown:"cover",attendance:"confirm"}[k];
    if(idx<0)state.order.splice(anchor?state.order.indexOf(anchor)+1:state.order.length,0,k);
    else state.order.splice(idx,1);
    changed();select(idx<0?k:state.order[Math.min(idx,state.order.length-1)]);
  };
  function exportInvite(asZip){
    if(asZip&&!publish.slugOK(state.slug))return;
    const c=state.blocks.countdown;
    if(state.order.includes("countdown")&&!live.eventTimes(state.blocks.cover.date,c.time,c.offset)){
      select("countdown");$("edit-date").focus();alert("Elegí una fecha válida para la cuenta regresiva.");return}
    if(state.order.includes("attendance")&&!live.source(state.blocks.attendance.source)){
      select("attendance");$("edit-source").focus();alert("Conectá un enlace HTTPS que publique solo el total de confirmados, o quitá el bloque hasta tenerlo.");return}
    if(state.order.includes("attendance")&&verified?.url!==live.source(state.blocks.attendance.source)){
      select("attendance");const test=$("preview").querySelector(".attendance button");test.focus();alert("Antes de descargar, tocá «Probar conexión» en la vista previa. Así comprobamos que el enlace entrega solo el total.");return}
    if(giftRows(state.blocks.gifts.items).some(([name,url,...extra])=>!name||extra.length||(url!==undefined&&!safeUrl(url)))){select("gifts");$("edit-items").focus();alert("Revisá la lista: escribí el nombre del regalo y, si agregás |, un enlace completo.");return}
    for(const k of state.order){for(const [p,,type] of schema[k])if(campoActivo(k,p)&&type==="url"&&state.blocks[k][p]&&!(p==="grupoUrl"?grupoUrl:safeUrl)(state.blocks[k][p])){select(k);$("edit-"+p).focus();alert(p==="grupoUrl"?"Usá el enlace /exec del formulario de grupos, sin códigos ni datos de invitados.":"Revisá el enlace de "+labels[k]+".");return}}
    if(state.order.includes("seats")){const rows=seatRows();
      if(!rows.length||rows.some(r=>r.length!==2||!r.every(Boolean))){select("seats");$("edit-rows").focus();alert("Completá las asignaciones con el formato código o nombre | mesa, o quitá el bloque hasta tenerlas.");return}
      if(!window.confirm("La invitación descargada incluirá las asignaciones de mesas. Quien reciba el archivo podrá leer la lista completa. ¿Querés incluirla?"))return;
    }
    save();const doc=document.implementation.createHTMLDocument(state.blocks.cover.names||"Nuestro casamiento");doc.documentElement.lang="es-AR";
    const charset=doc.createElement("meta");charset.setAttribute("charset","utf-8");doc.head.prepend(charset);
    const meta=doc.createElement("meta");meta.name="viewport";meta.content="width=device-width,initial-scale=1";doc.head.append(meta);
    const stock=state.blocks.cover.photo||state.design!=="cine"?"none":getComputedStyle(document.documentElement).getPropertyValue("--cinema-photo");
    const css=doc.createElement("style");css.textContent=":root{--cinema-photo:"+(stock||"none")+"}body{margin:0;background:#090909}"+$("invitation-style").textContent;doc.head.append(css);
    const main=el("main",undefined,"invitation");render(main,false);doc.body.append(main);
    if(state.order.includes("seats")){const script=doc.createElement("script");script.textContent="("+bindSearch.toString()+")(document);";doc.body.append(script)}
    if(state.order.includes("countdown")||state.order.includes("attendance")){const script=doc.createElement("script");
      script.textContent="("+window.KazaEventLive.toString()+")().mount(document);";doc.body.append(script)}
    const html="<!doctype html>\n"+doc.documentElement.outerHTML;
    const url=URL.createObjectURL(asZip?publish.zip(state.slug,html):new Blob([html],{type:"text/html;charset=utf-8"}));
    const a=el("a");a.href=url;a.download=asZip?state.slug+".zip":"invitacion.html";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  $("download").onclick=()=>exportInvite(false);$("publish-zip").onclick=()=>exportInvite(true);
  function slugNote(){const ok=publish.slugOK(state.slug);$("publish-zip").disabled=!ok;
    $("url-preview").textContent=ok?"Dirección prevista: "+publish.url(state.slug):state.slug?"Usá entre 2 y 60 caracteres: minúsculas sin acentos, números y guiones entre palabras.":"Sin enlace elegido. La descarga HTML común sigue disponible."}
  $("event-slug").value=state.slug;slugNote();
  $("event-slug").oninput=e=>{state.slug=e.target.value;slugNote();changed()};
  window.addEventListener("pagehide",()=>{if(saveTimer)save()});
  $("new-invite").onclick=()=>{
    if(!window.confirm("¿Empezar otra invitación? Se reemplazará el borrador de este navegador. Descargá antes la invitación actual si querés conservarla."))return;
    state.order=[...initial];state.blocks=structuredClone(defaults);state.slug="";verified=null;$("event-slug").value="";slugNote();changed();select("cover");save();
  };
  const selector=$("design");
  designs.forEach(d=>selector.add(new Option(d.name,d.id)));
  selector.value=state.design;
  function designNote(){$("design-note").textContent=designs.find(d=>d.id===state.design).note}
  selector.onchange=()=>{state.design=selector.value;designNote();changed()};
  designNote();list();fields();preview();$("saved").textContent=loadWarning||"Borrador en este navegador";
})();
