// Private receiver and public counter executed against the same in-memory, fictitious workbook.
const assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {paquete}=require("../../tools/rsvp/build.cjs");
const PASE="pase_ficticio_solo_para_pruebas",PASE2="segundo_pase_ficticio_de_prueba";
const plain=x=>JSON.parse(JSON.stringify(x));
function evento(max=10){
  const cols=["Mesa","Grupo","Nombre","ID","Asistencia","Menor","Edad al evento","Modalidad RSVP","Recibo RSVP"];
  const filas=[["Mesa 5","otro-grupo","Persona de ejemplo","anterior","Sí"]],pases=[["Código","Grupo","Cupo"],[PASE,"grupo-a",max],[PASE2,"grupo-b",1]];
  const env={cols,filas,pases,writes:0,ocupado:false,falla:false},id="planilla_de_prueba";let lock=false;
  const api={
    Values:{
      get(book,r){assert.equal(book,id);if(r==="'Pases RSVP'!A:C")return {values:pases};
        assert.equal(r,"'Invitados'!1:1");return {values:[cols]};},
      batchGet(book,{ranges,majorDimension}){assert.equal(book,id);assert.equal(majorDimension,"COLUMNS");return {valueRanges:ranges.map(r=>{
        const match=/^'Invitados'!([A-Z])(1|2):\1$/.exec(r);assert.ok(match,r);
        const col=match[1].charCodeAt(0)-65,all=[cols,...filas];return {values:[all.slice(+match[2]-1).map(f=>f[col]??"")]};
      })};}
    },
    get(book){assert.equal(book,id);return {sheets:[{properties:{title:"Invitados",sheetId:11}}]};},
    batchUpdate({requests},book){assert.equal(book,id);assert.ok(lock);assert.equal(requests.length,1);
      if(env.falla)throw Error("No disponible");
      const x=requests[0].appendCells;assert.equal(x.sheetId,11);assert.equal(x.fields,"userEnteredValue");
      for(const row of x.rows)filas.push(Array.from(row.values,v=>{const c=v.userEnteredValue;if(!c)return "";assert.ok(!("formulaValue" in c));return c.numberValue??c.stringValue;}));env.writes++;
    }
  };
  const globals={Sheets:{Spreadsheets:api},PropertiesService:{getScriptProperties:()=>({getProperty:()=>id})},
    LockService:{getScriptLock:()=>({tryLock:()=>{if(lock||env.ocupado)return false;lock=true;return true;},releaseLock:()=>{lock=false;}})},
    Utilities:{computeHmacSha256Signature:(s,k)=>Array.from(crypto.createHmac("sha256",k).update(s).digest())}};
  const files=paquete(),svc=vm.createContext(globals);
  vm.runInContext(files["Modelo.gs"],svc);vm.runInContext(files["Code.gs"],svc);
  env.abrir=code=>plain(svc.abrirInvitacion(code));env.registrar=(code,d)=>plain(svc.confirmarInvitacion(code,d));
  const ctr=vm.createContext({...globals,CacheService:{getScriptCache:()=>({get:()=>null,put:()=>{}})},
    ContentService:{MimeType:{JSON:"json"},createTextOutput:body=>({setMimeType:()=>JSON.parse(body)})}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,"../../tools/confirmados/Code.gs"),"utf8"),ctr);
  env.contador=()=>plain(ctr.doGet());return env;
}
module.exports={evento,PASE,PASE2};
