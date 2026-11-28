(() => {
  "use strict";
  const root=document.getElementById("registro"), aviso=document.getElementById("aviso");
  const demo=document.documentElement.dataset.rsvp==="demo";
  if(demo){
    const estilo=new URLSearchParams(location.search).get("estilo");
    if(["cine","herbario","gaceta","verbena"].includes(estilo))document.documentElement.dataset.estilo=estilo;
    aviso.textContent="Vista de prueba · Usá nombres ficticios. No se envía ni se guarda ninguna respuesta.";
    montarRsvp(root,10);return;
  }
  aviso.textContent="Tu respuesta es privada. Solo pedimos edad para quienes tengan menos de 18 años el día del evento.";
  // The live form runs inside the event's own Apps Script. Personal information is never sent to a configurable URL.
  if(!window.google?.script?.run){root.textContent="El formulario no está disponible. Avisale a la pareja.";return;}
  function llamar(accion,...args){
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error("Sin respuesta")),25000);
      const api=google.script.run.withSuccessHandler(r=>{clearTimeout(timer);resolve(r);}).withFailureHandler(()=>{clearTimeout(timer);reject(Error("Sin respuesta"));});
      if(accion==="abrir")api.abrirInvitacion(...args);else api.confirmarInvitacion(...args);
    });
  }
  const form=document.createElement("form"),label=document.createElement("label"),input=document.createElement("input"),btn=document.createElement("button"),status=document.createElement("p");
  form.autocomplete="off";label.className="campo";label.textContent="Código de tu invitación";input.type="password";input.autocomplete="off";input.spellcheck=false;input.required=true;input.maxLength=80;
  const ayuda=document.createElement("small");ayuda.textContent="Es el código que te compartió la pareja junto con el enlace.";label.append(input,ayuda);
  btn.className="prim";btn.type="submit";btn.textContent="Abrir mi invitación";status.setAttribute("role","status");form.append(label,btn,status);root.append(form);
  form.onsubmit=async e=>{
    e.preventDefault();if(btn.disabled)return;const codigo=input.value.trim();btn.disabled=true;status.textContent="Verificando…";
    try{
      const r=await llamar("abrir",codigo);
      if(r?.ok!==true){status.textContent="No pudimos abrir esa invitación. Revisá el código o consultá con la pareja.";return;}
      input.value="";montarRsvp(root,kazaGrupo_().cupo(r.cupo),datos=>llamar("confirmar",codigo,datos));root.querySelector("input")?.focus();
    }catch{status.textContent="No se pudo conectar. Esperá un momento y volvé a intentar.";}finally{btn.disabled=false;}
  };
})();
