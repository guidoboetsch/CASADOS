"use strict";
const $ = id => document.getElementById(id);
const tabs = [...document.querySelectorAll('[role="tab"]')];
function activate(tab, focus=false){
  for(const t of tabs){
    const active=t===tab; t.setAttribute("aria-selected", String(active)); t.tabIndex=active?0:-1;
    $(t.getAttribute("aria-controls")).hidden=!active;
  }
  if(focus)tab.focus();
}
tabs.forEach((tab,i)=>{
  tab.addEventListener("click",()=>activate(tab));
  tab.addEventListener("keydown",e=>{
    const indexes={ArrowLeft:(i-1+tabs.length)%tabs.length,ArrowRight:(i+1)%tabs.length,Home:0,End:tabs.length-1};
    if(Object.hasOwn(indexes,e.key)){e.preventDefault();activate(tabs[indexes[e.key]],true);}
  });
});
$("rsvp").addEventListener("submit",e=>{
  e.preventDefault();const choice=new FormData(e.currentTarget).get("respuesta");
  $("rsvp-result").textContent=choice?"Respuesta de prueba: "+choice+". No se guardó.":"Elegí una respuesta.";
});
$("mesas").addEventListener("submit",e=>{
  e.preventDefault();$("mesa-result").textContent=new FormData(e.currentTarget).get("invitado")||"Elegí un invitado de ejemplo.";
});
$("quote").addEventListener("submit",e=>{
  e.preventDefault();const data=new FormData(e.currentTarget), name=String(data.get("nombres")||"").trim();
  if(!name){e.currentTarget.elements.nombres.focus();return;}
  const date=data.get("fecha"); const options=data.getAll("funcion");
  $("draft").value=["Hola, soy "+name+". Quiero consultar por una web de casamiento.","Fecha estimada: "+(date?date.split("-").reverse().join("/"):"por definir")+".","Me interesa: "+(options.length?options.join(", "):"conocer las opciones")+".","¿Me cuentan cómo trabajan y cuánto cuesta?"].join("\n");
  $("quote-result").hidden=false;$("copy-status").textContent="";$("draft").focus();
});
$("copy").addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText($("draft").value);$("copy-status").textContent=" Consulta copiada.";}
  catch{$("draft").focus();$("draft").select();$("copy-status").textContent=" Seleccioné el texto para que lo copies.";}
});