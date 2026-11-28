// Optional, read-only Apps Script deployment. One project and fixed private roster per event.
// No doPost, request-selected events, names or guest rows in the public response.
function doGet() {
  let payload;
  try {
    const id = PropertiesService.getScriptProperties().getProperty("KAZA_REGISTRO_ID");
    if (!id || !/^[\w-]+$/.test(id)) throw new Error();
    const key = "confirmados-v1:" + id, cache = CacheService.getScriptCache();
    let value = cache.get(key);
    if (value === null) {
      const lock = LockService.getScriptLock();
      if (!lock.tryLock(2500)) throw new Error();
      try {
        value = cache.get(key);
        if (value === null) { value = String(readRoster_(id)); cache.put(key,value,20); }
      } finally { lock.releaseLock(); }
    }
    payload = {confirmados:Number(value)};
  } catch (_) { payload = {error:"total_no_disponible"}; }
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function readRoster_(id) {
  const api=Sheets.Spreadsheets.Values;
  const titles=api.get(id,"'Invitados'!1:1").values?.[0] || [];
  function column(name) {
    const matches=titles.map((s,i)=>String(s).trim().toLowerCase()===name?i+1:0).filter(Boolean);
    if(matches.length!==1)throw new Error();
    let n=matches[0], letters="";
    while(n){ n--; letters=String.fromCharCode(65+n%26)+letters; n=Math.floor(n/26); }
    return "'Invitados'!"+letters+"1:"+letters;
  }
  const result=api.batchGet(id,{ranges:[column("id"),column("asistencia")],majorDimension:"COLUMNS"});
  const [ids,states]=result.valueRanges.map(r=>r.values?.[0]||[]);
  if(String(ids[0]).trim().toLowerCase()!=="id" || String(states[0]).trim().toLowerCase()!=="asistencia")throw new Error();
  return confirmedPeople_(ids.slice(1),states.slice(1));
}

function confirmedPeople_(ids,states) {
  const seen=new Map(), yes=new Set(["si","si, obvio","confirmado","confirmada","asiste"]);
  const no=new Set(["","no","no puedo","ausente","pendiente","sin respuesta","no asiste","cancelado","cancelada"]);
  for(let i=0;i<Math.max(ids.length,states.length);i++){
    const person=String(ids[i]??"").trim();
    const state=String(states[i]??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
    if(!person && !state)continue;
    if(!person || (!yes.has(state)&&!no.has(state)))throw new Error();
    const attending=yes.has(state);
    if(seen.has(person)&&seen.get(person)!==attending)throw new Error();
    seen.set(person,attending);
  }
  return [...seen.values()].filter(Boolean).length;
}
