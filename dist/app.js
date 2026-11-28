"use strict";
const $ = id => document.getElementById(id);
$("quote").addEventListener("submit",e=>{
  e.preventDefault();const data=new FormData(e.currentTarget), name=String(data.get("nombres")||"").trim();
  if(!name){e.currentTarget.elements.nombres.focus();return;}
  const date=data.get("fecha"); const options=data.getAll("funcion");
  $("draft").value=["Hola, soy "+name+". Quiero consultar por una web de casamiento.","Fecha estimada: "+(date?date.split("-").reverse().join("/"):"por definir")+".","Me interesa: "+(options.length?options.join(", "):"conocer las opciones")+".","¿Me cuentan cómo trabajan y cuánto cuesta?"].join("\n");
  $("email-draft").href="mailto:gboetsch93+kaza@gmail.com?subject=Consulta%20KAZA&body="+encodeURIComponent($("draft").value);
  $("quote-result").hidden=false;$("copy-status").textContent="";$("draft").focus();
});
$("copy").addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText($("draft").value);$("copy-status").textContent=" Consulta copiada.";}
  catch{$("draft").focus();$("draft").select();$("copy-status").textContent=" Seleccioné el texto para que lo copies.";}
});
