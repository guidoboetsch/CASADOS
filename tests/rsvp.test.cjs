const test=require("node:test"),assert=require("node:assert/strict");
const model=require("../dist/rsvp/modelo.js")(),{evento,PASE,PASE2}=require("./helpers/rsvp-ficticio.cjs");
const adulta={nombre:"  Persona  de prueba ",tipo:"adulta"},bebe={nombre:"Bebé de prueba",tipo:"menor",edad:0},joven={nombre:"Joven de prueba",tipo:"menor",edad:17};
const asiste=(modalidad,...personas)=>({respuesta:"si",modalidad,personas});
const ausencia={respuesta:"no",modalidad:null,personas:[{nombre:"Quien avisa"}]};
test("individual, pareja y familia respetan cantidades y cupo contando al titular",()=>{
  assert.equal(model.cupo(""),10);assert.equal(model.cupo(1),1);assert.equal(model.cupo("20"),20);
  for(const n of [0,21,"2.5"," 4",true])assert.throws(()=>model.cupo(n));
  assert.equal(model.validar(asiste("individual",joven),1).personas[0].edad,17);
  assert.equal(model.validar(asiste("pareja",adulta,bebe),2).personas[0].nombre,"Persona de prueba");
  assert.equal(model.validar(asiste("familia",...Array(20).fill(adulta)),20).personas.length,20);
  for(const d of [asiste("familia",adulta),asiste("pareja",adulta),asiste("individual",adulta,bebe),asiste("familia",adulta,bebe,joven),asiste(["pareja"],adulta,bebe)])assert.throws(()=>model.validar(d,2));
});
test("edad obligatoria para cada menor, incluidos 0 y 17; nunca para mayores ni ausentes",()=>{
  for (const edad of [null,undefined,"",0.5,-1,18,"0",false])assert.throws(()=>model.validar(asiste("individual",{...bebe,edad}),1));
  assert.equal(model.validar(asiste("individual",bebe),1).personas[0].edad,0);
  assert.deepEqual(model.validar(asiste("individual",adulta),1).personas[0],{nombre:"Persona de prueba",tipo:"adulta"});
  for (const p of [{...adulta,edad:19},{nombre:"Sola"},{nombre:"  ",tipo:"adulta"}])assert.throws(()=>model.validar(asiste("individual",p),1));
  assert.deepEqual(model.validar(ausencia,1),ausencia);assert.throws(()=>model.validar({...ausencia,personas:[bebe]},2));
});
test("registro privado por persona, sin pisar otras filas; contador público solo del total",()=>{
  const e=evento(3),antes=structuredClone(e.filas[0]),d=asiste("familia",adulta,bebe,joven);
  assert.deepEqual(e.abrir(PASE),{ok:true,cupo:3});assert.deepEqual(e.contador(),{confirmados:1});
  assert.deepEqual(e.registrar(PASE,d),{ok:true});assert.deepEqual(e.filas[0],antes);assert.deepEqual(e.contador(),{confirmados:4});
  const v=(i,key)=>e.filas[i][e.cols.indexOf(key)];
  assert.deepEqual([1,2,3].map(i=>v(i,"Edad al evento")),["",0,17]);assert.deepEqual([1,2,3].map(i=>v(i,"Menor")),["No","Sí","Sí"]);
  assert.deepEqual([1,2,3].map(i=>v(i,"ID")),["rsvp:grupo-a:1","rsvp:grupo-a:2","rsvp:grupo-a:3"]);
  assert.ok(e.filas.flat().every(x=>x!==PASE));assert.equal(e.writes,1);
  assert.deepEqual(e.registrar(PASE,d),{ok:true});assert.deepEqual(e.registrar(PASE,asiste("individual",adulta)),{ok:false,motivo:"registrado"});assert.equal(e.writes,1);
  assert.deepEqual(e.registrar(PASE2,ausencia),{ok:true});assert.equal(v(4,"Asistencia"),"No");assert.equal(v(4,"Edad al evento"),"");assert.deepEqual(e.contador(),{confirmados:4});
});
test("un pase inválido, cupo excedido, grupo existente o error no escriben; reintento seguro",()=>{
  const e=evento(2),d=asiste("pareja",joven,bebe);
  assert.deepEqual(e.abrir("incorrecto"),{ok:false});assert.deepEqual(e.registrar("incorrecto",d),{ok:false});
  assert.deepEqual(e.registrar(PASE,asiste("familia",adulta,bebe,joven)),{ok:false});assert.deepEqual(e.registrar(PASE2,d),{ok:false});
  e.ocupado=true;assert.deepEqual(e.registrar(PASE,d),{ok:false});e.ocupado=false;
  e.falla=true;assert.deepEqual(e.registrar(PASE,d),{ok:false});e.falla=false;assert.equal(e.filas.length,1);
  e.filas[0][e.cols.indexOf("Grupo")]="grupo-a";assert.deepEqual(e.registrar(PASE,d),{ok:false,motivo:"registrado"});assert.equal(e.writes,0);
  e.filas[0][e.cols.indexOf("Grupo")]="otro-grupo";assert.deepEqual(e.registrar(PASE,d),{ok:true});assert.equal(e.writes,1);
});
test("las filas con nombres iguales no se fusionan; datos faltantes nunca se escriben como cero",()=>{
  const e=evento(2);
  assert.deepEqual(e.registrar(PASE,asiste("pareja",adulta,{...bebe,edad:null})),{ok:false});assert.equal(e.writes,0);
  assert.deepEqual(e.registrar(PASE,asiste("pareja",adulta,adulta)),{ok:true});assert.deepEqual(e.contador(),{confirmados:3});
});
