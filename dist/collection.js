"use strict";
(() => {
  const designs=window.KazaDesigns;
  const get=id=>document.getElementById(id);
  const options=get("catalog-options");
  const inputs=new Map();
  let current;
  function display(id){
    current=designs.find(item=>item.id===id)||designs[0];
    inputs.get(current.id).checked=true;
    get("design-sample").dataset.design=current.id;
    get("sample-label").textContent=current.name;
    get("design-copy").textContent=current.note;
    get("choice-status").textContent="";
  }
  for(const [i,item] of designs.entries()){
    const label=document.createElement("label"),input=document.createElement("input");
    input.type="radio";input.name="catalog-style";input.value=item.id;
    const index=document.createElement("small");index.textContent="0"+(i+1);index.setAttribute("aria-hidden","true");
    const name=document.createElement("b");name.textContent=item.name;
    const palette=document.createElement("span");palette.className="swatches";palette.setAttribute("aria-hidden","true");
    item.swatches.forEach(color=>{const dot=document.createElement("i");dot.style.backgroundColor=color;palette.append(dot)});
    label.append(input,index,name,palette);options.append(label);inputs.set(item.id,input);
    input.addEventListener("change",()=>display(item.id));
  }
  const requested=new URL(location.href).searchParams.get("estilo");
  display(requested);
  get("copy-choice").onclick=async()=>{
    let message="Para nuestra invitación elegimos "+current.name+" de la colección KAZA.";
    if(/^https?:$/.test(location.protocol)){
      const link=new URL(location.pathname,location.origin);link.searchParams.set("estilo",current.id);link.hash="disenos";
      message+=" "+link.href;
    }
    try{await navigator.clipboard.writeText(message);get("choice-status").textContent="Elección copiada. Podés pegarla en un mensaje."}
    catch{get("choice-status").textContent=message}
  };
})();
