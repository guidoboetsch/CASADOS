// Optional, separate Apps Script project per event. No roster, ages or passes are returned to the browser.
function doGet(e) {
  const page=HtmlService.createTemplateFromFile("Index"), style=e?.parameter?.estilo;
  page.estilo=["cine","herbario","gaceta","verbena"].includes(style)?style:"cine";
  return page.evaluate().setTitle("Confirmar asistencia · KAZA").addMetaTag("viewport","width=device-width,initial-scale=1");
}
function libro_(){
  const id=PropertiesService.getScriptProperties().getProperty("KAZA_REGISTRO_ID");
  if(!id || !/^[\w-]+$/.test(id))throw Error("Registro no configurado");return id;
}
function clave_(s){return String(s??"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function pases_(libro){
  const filas=Sheets.Spreadsheets.Values.get(libro,"'Pases RSVP'!A:C").values||[];
  if(["codigo","grupo","cupo"].some((v,i)=>clave_(filas[0]?.[i])!==v))throw Error("Faltan las columnas de pases");
  return filas.slice(1);
}
function pase_(libro,codigo){
  if(typeof codigo!=="string" || !/^[\w-]{16,64}$/.test(codigo))throw Error("Pase inválido");
  const filas=pases_(libro),coinciden=filas.filter(f=>f[0]===codigo);
  if(coinciden.length!==1)throw Error("Pase inválido");
  const grupo=clave_(coinciden[0][1]);
  if(!/^[a-z0-9_-]{1,48}$/.test(grupo) || filas.filter(f=>clave_(f[1])===grupo).length!==1)throw Error("Grupo inválido");
  return {grupo,cupo:kazaGrupo_().cupo(coinciden[0][2])};
}
function abrirInvitacion(codigo){
  try{return {ok:true,cupo:pase_(libro_(),codigo).cupo};}catch(_){return {ok:false};}
}
function letra_(idx){
  let n=idx+1,s="";while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;
}
function columnas_(libro){
  const titulos=(Sheets.Spreadsheets.Values.get(libro,"'Invitados'!1:1").values?.[0]||[]).map(clave_),cols={};
  for(const k of ["id","nombre","grupo","asistencia","modalidad rsvp","menor","edad al evento","recibo rsvp"]){
    const i=titulos.indexOf(k);if(i<0||i!==titulos.lastIndexOf(k))throw Error("Revisar encabezados");
    cols[k]=i;
  }return cols;
}
function grabar_(libro,pase,d,codigo){
  const api=Sheets.Spreadsheets, cols=columnas_(libro), grupo=pase.grupo,prefijo="rsvp:"+grupo+":";
  // A receipt is not a pass. Bind it to the normalized request without storing another copy of the names.
  const firma=Utilities.computeHmacSha256Signature(JSON.stringify(d),codigo);
  const recibo=firma.map(b=>(b&255).toString(16).padStart(2,"0")).join("");
  const ranges=["id","grupo","recibo rsvp"].map(k=>{const c=letra_(cols[k]);return "'Invitados'!"+c+"2:"+c;});
  const existentes=api.Values.batchGet(libro,{ranges,majorDimension:"COLUMNS"}).valueRanges;
  const [ids,grupos,recibos]=existentes.map(r=>r.values?.[0]||[]);
  const previas=[];
  for(let i=0;i<Math.max(ids.length,grupos.length);i++){
    if(clave_(grupos[i])===grupo || clave_(ids[i]).startsWith(prefijo))previas.push(i);
  }
  if(previas.length){
    const esperados=new Set(d.personas.map((_,i)=>prefijo+(i+1)));
    const mismo=previas.length===esperados.size && previas.every(i=>clave_(grupos[i])===grupo && recibos[i]===recibo && esperados.delete(clave_(ids[i])));
    return mismo?{ok:true}:{ok:false,motivo:"registrado"}; // No sobrescribir rectificaciones, mesas ni filas preexistentes.
  }
  const meta=api.get(libro,{fields:"sheets(properties(sheetId,title))"});
  const hoja=meta.sheets.find(s=>s.properties.title==="Invitados");
  if(!hoja)throw Error("Registro no disponible");
  const modalidades=kazaGrupo_().modalidades,si=d.respuesta==="si";
  const rows=d.personas.map((p,i)=>{
    const values=Array.from({length:Math.max(...Object.values(cols))+1},()=>({}));
    const set=(k,v)=>{if(v!=null)values[cols[k]]={userEnteredValue:typeof v==="number"?{numberValue:v}:{stringValue:String(v)}};};
    set("id",prefijo+(i+1));set("nombre",p.nombre);set("grupo",grupo);set("asistencia",si?"Sí":"No");
    set("modalidad rsvp",si?modalidades[d.modalidad]:null);set("menor",si?(p.tipo==="menor"?"Sí":"No"):null);
    set("edad al evento",p.edad);set("recibo rsvp",recibo);
    return {values};
  });
  // One append, with typed cells, for the entire group. The public counter can read ID + Asistencia as before.
  api.batchUpdate({requests:[{appendCells:{sheetId:hoja.properties.sheetId,rows,fields:"userEnteredValue"}}]},libro);
  return {ok:true};
}
function confirmarInvitacion(codigo,datos){
  try{
    const libro=libro_(),modelo=kazaGrupo_();
    const preliminar=modelo.validar(datos,20), lock=LockService.getScriptLock();
    if(!lock.tryLock(4000))return {ok:false};
    try{
      const pase=pase_(libro,codigo);
      return grabar_(libro,pase,modelo.validar(preliminar,pase.cupo),codigo);
    }finally{lock.releaseLock();}
  }catch(_){return {ok:false};}
}
// Private operator action, never called by the site. Only fill blank pass cells on explicitly prepared group rows.
function completarCodigos_(){
  const libro=libro_(),filas=pases_(libro),cambios=[],grupos=new Set();
  filas.forEach((f,i)=>{
    if(!f.length || !f.some(x=>String(x).trim()))return;
    const grupo=clave_(f[1]);if(!/^[a-z0-9_-]{1,48}$/.test(grupo)||grupos.has(grupo))throw Error("Revisá los IDs de grupo antes de generar pases.");
    grupos.add(grupo);kazaGrupo_().cupo(f[2]);
    if(!f[0])cambios.push({range:"'Pases RSVP'!A"+(i+2),values:[[Utilities.getUuid().replace(/-/g,"")]]});
  });
  if(cambios.length)Sheets.Spreadsheets.Values.batchUpdate({valueInputOption:"RAW",data:cambios},libro);
}
