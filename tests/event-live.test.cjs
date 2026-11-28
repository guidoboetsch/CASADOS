const test=require("node:test"), assert=require("node:assert/strict"), vm=require("node:vm");
const fs=require("node:fs"), path=require("node:path");
const {eventTimes,remaining,source,totalFrom}=require("../dist/editor/event-live.js")();
const script=fs.readFileSync(path.join(__dirname,"../tools/confirmados/Code.gs"),"utf8");

test("la cuenta usa el huso del evento y no el del visitante, aun cuando cambia el día UTC",()=>{
  const t=eventTimes("2028-02-29","23:30","-03:00");
  assert.equal(new Date(t.start).toISOString(),"2028-03-01T02:30:00.000Z");
  assert.equal(new Date(t.end).toISOString(),"2028-03-01T03:00:00.000Z");
  assert.equal(new Date(eventTimes("2028-02-29","","+05:45").start).toISOString(),"2028-02-28T18:15:00.000Z");
  assert.deepEqual(remaining(t.start,t.start-90061000),[1,1,1,1]);
  assert.deepEqual(remaining(t.start,t.start-1),[0,0,0,1]);
  assert.deepEqual(remaining(t.start,t.end),[0,0,0,0]);
});
test("rechaza fechas, horas y husos inválidos",()=>{
  for(const args of [["2027-02-29","","-03:00"],["2028-02-29","24:00","-03:00"],["2028-04-31","11:10","+01:00"],["2028-01-01","","-15:00"]])assert.equal(eventTimes(...args),null);
});
test("el bloque solo acepta un total agregado, también cuando es cero",()=>{
  assert.equal(totalFrom({confirmados:0}),0);assert.equal(totalFrom({confirmados:21}),21);
  for(const data of [[],null,{confirmados:"2"},{confirmados:2.5},{confirmados:-1},{confirmados:2,personas:[]},{error:"total_no_disponible"}])assert.throws(()=>totalFrom(data));
  assert.equal(source("https://rsvp.example/evento/total"),"https://rsvp.example/evento/total");
  for(const u of ["http://inseguro.example","https://docs.google.com/spreadsheets/d/123/edit","https://forms.gle/abc","https://x:y@rsvp.example","https://rsvp.example/?token=abc","https://script.google.com/macros/s/demo/dev"])assert.equal(source(u),"");
});
function service(){
  const env={rows:[["P01","Sí"],["P02","Confirmada"],["P02","Confirmada"],["P03","Pendiente"],["P04","No"]],store:new Map(),calls:[]};
  const ctx=vm.createContext({
    PropertiesService:{getScriptProperties:()=>({getProperty:()=>"evento_ficticio"})},
    CacheService:{getScriptCache:()=>({get:k=>env.store.get(k)??null,put:(k,v,seconds)=>{assert.equal(seconds,20);env.store.set(k,v)}})},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
    Sheets:{Spreadsheets:{Values:{
      get:(id,r)=>{assert.equal(id,"evento_ficticio");assert.equal(r,"'Invitados'!1:1");return {values:[["ID","Nombre","Grupo","Asistencia"]]};},
      batchGet:(id,req)=>{env.calls.push([...req.ranges]);assert.equal(id,"evento_ficticio");
        return {valueRanges:[{values:[["ID",...env.rows.map(r=>r[0])]]},{values:[["Asistencia",...env.rows.map(r=>r[1])]]}]};}
    }}},
    ContentService:{MimeType:{JSON:"application/json"},createTextOutput:body=>({setMimeType:type=>{assert.equal(type,"application/json");return JSON.parse(body)}})}
  });
  vm.runInContext(script,ctx);env.read=()=>ctx.doGet({parameter:{id:"otro-evento"}});
  return env;
}
test("fuente aislada por evento: solo ID y asistencia, no cuenta envíos ni grupos",()=>{
  const db=service();assert.deepEqual(db.read(),{confirmados:2});assert.deepEqual(db.read(),{confirmados:2});
  assert.deepEqual(db.calls,[["'Invitados'!A1:A","'Invitados'!D1:D"]]); // No lee nombres ni datos de contacto.
  db.rows[3][1]="Sí";db.store.clear();assert.deepEqual(db.read(),{confirmados:3});
  db.rows[0][1]="No";db.store.clear();assert.deepEqual(db.read(),{confirmados:2});
  db.rows=[];db.store.clear();assert.deepEqual(db.read(),{confirmados:0});
});
test("un registro contradictorio o inválido nunca se publica como cero ni revela datos",()=>{
  const db=service();
  for(const row of [["P01","No"],["","Sí"],["P99","dato no reconocido"]]){db.rows.push(row);assert.deepEqual(db.read(),{error:"total_no_disponible"});db.rows.pop()}
});
