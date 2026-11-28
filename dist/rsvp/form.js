/* Mounted only on the form page, never inside an exported invite or a stored editor draft. */
function montarRsvp(root, limite, enviar) {
  "use strict";
  const model=kazaGrupo_(), max=model.cupo(limite), demo=!enviar;
  const el=(tag,text,cl)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;if(cl)node.className=cl;return node;};
  const button=(text,cl)=>{const b=el("button",text,cl);b.type="button";return b;};
  const campo=(title,input)=>{const label=el("label",title,"campo");label.append(input);return label;};
  const nuevo=()=>({nombre:"",tipo:"",edad:""});
  let personas=[nuevo()], respuesta="si", modo="individual", enviando=false;
  function datos(){
    if(respuesta==="no")return {respuesta,modalidad:null,personas:[{nombre:personas[0].nombre}]};
    return {respuesta,modalidad:modo,personas:visibles().map(p=>{
      const v={nombre:p.nombre,tipo:p.tipo};if(p.tipo==="menor")v.edad=p.edad===""?null:Number(p.edad);return v;
    })};
  }
  function visibles(){return personas.slice(0, respuesta==="no"||modo==="individual"?1:modo==="pareja"?2:personas.length);}
  function radios(title, name, options, value, change){
    const group=el("fieldset",null,"opciones");group.append(el("legend",title));
    for (const [key,text] of options){
      const input=el("input");input.type="radio";input.name=name;input.value=key;input.checked=key===value;
      const label=el("label");label.append(input,el("span",text));group.append(label);
      input.onchange=()=>{if(input.checked){change(key);root.querySelector('input[name="'+name+'"]:checked')?.focus();}};
    }return group;
  }
  function reubicar(selector){root.querySelector(selector)?.focus();}
  function editar(){
    const form=el("form");form.autocomplete="off";
    form.append(radios("¿Vas a asistir?","respuesta",[["si","Sí, voy"],["no","No puedo ir"]],respuesta,v=>{respuesta=v;editar();}));
    if(respuesta==="si" && max>1)form.append(radios("¿A quiénes vas a anotar?","modalidad",Object.entries(model.modalidades),modo,v=>{
      modo=v;if(modo!=="individual" && personas.length<2)personas.push(nuevo());editar();
    }));
    if(respuesta==="si")form.append(el("p",max===1?"Esta invitación es para una persona.":visibles().length+" de "+max+" lugares de esta invitación, contándote a vos.","nota"));
    else form.append(el("p","Así avisás que no asistirá nadie de esta invitación. Si alguien sí va, elegí «Sí, voy» y anotá solo a quienes asistirán.","nota"));
    const list=el("div",null,"personas");form.append(list);
    visibles().forEach((p,i)=>{
      const card=el("fieldset",null,"persona");card.append(el("legend",respuesta==="no"?"Quién avisa":"Persona "+(i+1)+(i===0?" · vos":"")));
      const name=el("input");name.type="text";name.maxLength=100;name.required=true;name.name="nombre"+i;name.value=p.nombre;
      name.oninput=()=>{p.nombre=name.value;name.setCustomValidity("");};
      card.append(campo("Nombre y apellido",name));
      if(respuesta==="si"){
        const tipo=el("select");tipo.name="tipo"+i;tipo.required=true;
        for(const [k,t] of [["","Elegí una opción"],["adulta","18 años o más"],["menor","Menor de 18 años"]])tipo.add(new Option(t,k));
        tipo.value=p.tipo;card.append(campo("Al día del casamiento",tipo));
        const age=el("input");age.type="number";age.min="0";age.max="17";age.step="1";age.inputMode="numeric";age.name="edad"+i;age.value=p.edad;
        const wrap=campo("Edad el día de la fiesta (años cumplidos)",age);
        const help=el("small","Si todavía no cumplió un año, poné 0.");help.id="edad-ayuda-"+i;age.setAttribute("aria-describedby",help.id);wrap.append(help);card.append(wrap);
        function toggle(){const menor=p.tipo==="menor";wrap.hidden=!menor;age.required=menor;age.disabled=!menor;if(!menor){p.edad="";age.value="";}}
        tipo.onchange=()=>{p.tipo=tipo.value;toggle();};age.oninput=()=>{p.edad=age.value;};toggle();
        if(modo==="familia" && i>0 && personas.length>2){
          const quitar=button("Quitar persona "+(i+1),"sec quitar");
          quitar.onclick=()=>{personas.splice(i,1);editar();reubicar('[name="nombre'+Math.min(i,personas.length-1)+'"]');};card.append(quitar);
        }
      }
      list.append(card);
    });
    if(respuesta==="si" && modo==="familia"){
      const add=button("+ Agregar persona","sec");add.disabled=personas.length>=max;
      add.onclick=()=>{if(personas.length>=max)return;personas.push(nuevo());editar();reubicar('[name="nombre'+(personas.length-1)+'"]');};
      form.append(add);if(add.disabled)form.append(el("small","Llegaste al cupo de tu invitación.","nota"));
    }
    const err=el("p",null,"error");err.setAttribute("role","alert");
    const revisar=button("Revisar respuesta","prim");revisar.type="submit";form.append(err,revisar);
    form.onsubmit=e=>{
      e.preventDefault();
      for(const input of form.querySelectorAll('input[type="text"]'))if(!input.value.trim()){input.setCustomValidity("Completá el nombre y apellido.");input.reportValidity();return;}
      try{revision(model.validar(datos(),max));}catch(ex){err.textContent=ex.message;}
    };
    root.replaceChildren(form);
  }
  function revision(payload){
    const title=el("h2","¿Está todo bien?");title.tabIndex=-1;
    const si=payload.respuesta==="si", group=el("p",si?model.modalidades[payload.modalidad]+" · "+payload.personas.length+(payload.personas.length===1?" persona":" personas"):"No asistiremos");
    const list=el("ul",null,"resumen");
    for(const p of payload.personas){const item=el("li");item.append(el("strong",p.nombre));
      if(si)item.append(el("span",p.tipo==="adulta"?"18 años o más":p.edad===0?"Menor de 1 año":p.edad===1?"1 año":p.edad+" años"));list.append(item);}
    const volver=button("Volver y corregir","sec"), confirmar=button(demo?"Finalizar prueba":si?"Confirmar asistencia":"Confirmar ausencia","prim");
    const acciones=el("div",null,"acciones"), msg=el("p","","estado");msg.setAttribute("role","status");
    acciones.append(volver,confirmar);volver.onclick=()=>{if(!enviando){editar();reubicar('[name="nombre0"]');}};
    confirmar.onclick=async()=>{
      if(enviando)return;enviando=true;confirmar.disabled=volver.disabled=true;
      try{
        if(!demo){
          msg.textContent="Enviando respuesta…";const r=await enviar(payload);
          if(r?.ok!==true){msg.textContent=r?.motivo==="registrado"?"Esta invitación ya tiene una respuesta. Para corregirla, hablá con la pareja.":"No pudimos confirmar la recepción. Revisá el cupo o volvé a intentar.";return;}
        }
        personas=[];const fin=el("h2",demo?"Prueba terminada":"¡Recibimos tu respuesta!");fin.tabIndex=-1;
        root.replaceChildren(fin,el("p",demo?"No se guardó ni se envió ningún dato.":si?"Gracias por confirmar. La organización ya tiene los datos de quienes van.":"Gracias por avisarnos."));
        if(demo){const otra=button("Hacer otra prueba","sec");otra.onclick=()=>montarRsvp(root,max);root.append(otra);}fin.focus();
      }catch{msg.textContent="No pudimos verificar el envío. Podés reintentar sin duplicar tu respuesta.";}
      finally{enviando=false;confirmar.disabled=volver.disabled=false;}
    };
    root.replaceChildren(title,group,list,acciones,msg);title.focus();
  }
  editar();
}
