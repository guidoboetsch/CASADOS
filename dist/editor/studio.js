"use strict";
(() => {
  const labels = {cover:"Portada",day:"El día",timeline:"Itinerario",confirm:"Confirmar",gifts:"Regalos",social:"Redes sociales",seats:"Buscá tu mesa"};
  const defaults = {
    cover:{names:"Guido y María",mark:"G&M",date:"2026-11-21",photo:"",logo:""},
    day:{title:"El día",venue:"",address:"",dress:"",map:""},
    timeline:{title:"Así se vivirá esta noche.",items:"Ceremonia\nRecepción\nFiesta"},
    confirm:{title:"¿Podés venir?",body:"Nos encantaría que nos acompañes. Avisanos si vas a poder venir.",url:""},
    gifts:{title:"Regalá un recuerdo.",body:"Lo más importante es compartir este día con vos.",url:""},
    social:{title:"Seguí la fiesta.",body:"Compartamos las fotos y los momentos de esta noche.",tag:"",url:""},
    seats:{title:"Buscá tu mesa.",rows:""}
  };
  const initial = Object.keys(labels).filter(k=>k!=="seats");
  const schema = {
    cover:[["names","Nombres"],["mark","Iniciales del logo"],["date","Fecha","date"],["photo","Foto principal","image"],["logo","Logo de la pareja","image"]],
    day:[["title","Título"],["venue","Salón o lugar"],["address","Dirección"],["dress","Dresscode"],["map","Enlace al mapa","url"]],
    timeline:[["title","Título"],["items","Momentos de la noche","area","Uno por línea. Para agregar un horario, escribí por ejemplo: 20:30 | Recepción."]],
    confirm:[["title","Título"],["body","Mensaje","area"],["url","Enlace al formulario de asistencia","url","Usá el formulario de este evento. KAZA no recibe confirmaciones."]],
    gifts:[["title","Título"],["body","Mensaje","area"],["url","Enlace a la lista de regalos","url"]],
    social:[["title","Título"],["body","Mensaje","area"],["tag","Usuario o hashtag"],["url","Enlace a las redes del evento","url","Podés usar Instagram u otra red."]],
    seats:[["title","Título"],["rows","Asignaciones de mesas","area","Un código o nombre por línea, seguido de | y su mesa. Ejemplo: INV-042 | Mesa 3. Usá códigos individuales si la lista no debe ser pública."]]
  };
  const key="kaza:invitation-studio:v1";
  const $=id=>document.getElementById(id);
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
  const designs=window.KazaDesigns;
  const state={design:"cine",order:[...initial],blocks:structuredClone(defaults)};
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
      state.order=[...data.order];
      if(designs.some(d=>d.id===data.design))state.design=data.design;
    }
  } catch {loadWarning="No se pudo recuperar el borrador anterior."}
  let selected=state.order[0],dragged=null,saveTimer;
  function save(){clearTimeout(saveTimer);try{localStorage.setItem(key,JSON.stringify(state));$("saved").textContent="Guardado en este navegador"}catch{$("saved").textContent="No se pudo guardar en este navegador. Descargá la invitación."}}
  function changed(){preview();$("saved").textContent="Guardando…";clearTimeout(saveTimer);saveTimer=setTimeout(save,300)}
  function safeUrl(value){try{const u=new URL(value);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:""}catch{return ""}}
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
    if(k==="day"){const dl=el("dl");for(const [label,value] of [["Fecha",prettyDate(state.blocks.cover.date)],["Lugar",b.venue],["Dirección",b.address],["Dresscode",b.dress]])if(value){const row=el("div");row.append(el("dt",label),el("dd",value));dl.append(row)}inner.append(dl);link(b.map,"Cómo llegar")}
    else if(k==="timeline"){const list=el("ol",undefined,"schedule");
      for(const line of b.items.split("\n").map(l=>l.trim()).filter(Boolean)){const li=el("li"),i=line.indexOf("|");if(i>0)li.append(el("strong",line.slice(0,i).trim()),el("span",line.slice(i+1).trim()));else li.append(el("span",line));list.append(li)}inner.append(list)}
    else if(k==="seats"){
      const rows=seatRows().filter(r=>r.length===2&&r.every(Boolean));
      if(!rows.length){inner.append(el("p",inEditor?"Cargá las asignaciones para habilitar la búsqueda.":"Las mesas todavía no están definidas.","hint"));return s}
      const form=el("form",undefined,"table-search"),label=el("label","Nombre completo o código"),input=el("input"),button=el("button","Buscar mesa","invite-action"),out=el("p"),data=el("template");
      input.name="query";input.required=true;input.autocomplete="off";label.append(input);button.type="submit";out.setAttribute("role","status");
      for(const [name,table] of rows){const row=el("span",name);row.dataset.table=table;data.content.append(row)}
      form.append(label,button,out,data);inner.append(form);
    }else{if(b.body)inner.append(el("p",b.body,"copy"));if(k==="social"&&b.tag)inner.append(el("p",b.tag));
      link(b.url,{confirm:"Confirmar asistencia",gifts:"Ver lista de regalos",social:"Ver las redes de la fiesta"}[k]);
      if(inEditor&&!safeUrl(b.url))inner.append(el("p","Agregá el enlace en el editor para mostrar el botón.","hint"));
    }
    return s;
  }
  function render(root,inEditor){root.dataset.design=state.design;root.replaceChildren(...state.order.map(k=>section(k,inEditor)));bindSearch(root)}
  function preview(){render($("preview"),true)}
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
    });$("toggle-seats").textContent=state.order.includes("seats")?"Quitar bloque de mesas":"+ Agregar bloque de mesas";
  }
  async function pickImage(file,prop){
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>16*1024*1024)throw Error("Elegí un JPG, PNG o WebP de hasta 16 MB.");
    const image=new Image(),url=URL.createObjectURL(file);
    try{image.src=url;await image.decode();const side=prop==="logo"?440:1500,scale=Math.min(1,side/Math.max(image.naturalWidth,image.naturalHeight));const c=document.createElement("canvas");
      c.width=Math.max(1,Math.round(image.naturalWidth*scale));c.height=Math.max(1,Math.round(image.naturalHeight*scale));c.getContext("2d").drawImage(image,0,0,c.width,c.height);return c.toDataURL(prop==="logo"?"image/png":"image/jpeg",.82)}
    finally{URL.revokeObjectURL(url)}
  }
  function fields(){const root=$("fields"),k=selected,b=state.blocks[k];root.replaceChildren();$("editing").textContent=labels[k];
    for(const [prop,title,type,help] of schema[k]){
      const id="edit-"+prop,label=el("label",title),input=el(type==="area"?"textarea":"input");label.htmlFor=id;input.id=id;root.append(label,input);
      if(help){const note=el("small",help);note.id=id+"-help";input.setAttribute("aria-describedby",note.id);root.append(note)}
      if(type==="image"){input.type="file";input.accept="image/jpeg,image/png,image/webp";input.onchange=async()=>{const f=input.files[0];if(!f)return;try{b[prop]=await pickImage(f,prop);changed();if(selected===k)fields()}catch(e){input.value="";$("saved").textContent=e.message||"No se pudo leer la imagen."}};
        if(b[prop]){const remove=el("button","Quitar "+title.toLowerCase());remove.onclick=()=>{b[prop]="";changed();fields()};root.append(remove)}continue}
      if(type&&type!=="area")input.type=type;if(type==="url")input.placeholder="https://…";input.value=b[prop];
      input.oninput=()=>{b[prop]=input.value;changed();if(type==="url"){input.setCustomValidity(input.value&&!safeUrl(input.value)?"Ingresá un enlace completo https:// o http://.":"");if(!input.validity.valid)input.reportValidity()}};
    }
  }
  $("toggle-seats").onclick=()=>{const i=state.order.indexOf("seats");if(i<0)state.order.push("seats");else state.order.splice(i,1);changed();select(i<0?"seats":state.order[Math.min(i,state.order.length-1)])};
  $("download").onclick=()=>{
    for(const k of state.order){for(const [p,,type] of schema[k])if(type==="url"&&state.blocks[k][p]&&!safeUrl(state.blocks[k][p])){select(k);$("edit-"+p).focus();alert("Revisá el enlace de "+labels[k]+".");return}}
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
    const url=URL.createObjectURL(new Blob(["<!doctype html>\n",doc.documentElement.outerHTML],{type:"text/html;charset=utf-8"}));
    const a=el("a");a.href=url;a.download="invitacion.html";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  };
  window.addEventListener("pagehide",()=>{if(saveTimer)save()});
  $("new-invite").onclick=()=>{
    if(!window.confirm("¿Empezar otra invitación? Se reemplazará el borrador de este navegador. Descargá antes la invitación actual si querés conservarla."))return;
    state.order=[...initial];state.blocks=structuredClone(defaults);changed();select("cover");save();
  };
  const selector=$("design");
  designs.forEach(d=>selector.add(new Option(d.name,d.id)));
  selector.value=state.design;
  function designNote(){$("design-note").textContent=designs.find(d=>d.id===state.design).note}
  selector.onchange=()=>{state.design=selector.value;designNote();changed()};
  designNote();list();fields();preview();$("saved").textContent=loadWarning||"Borrador en este navegador";
})();
