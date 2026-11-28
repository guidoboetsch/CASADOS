/* Assemble the event-owned form from the same files used by the local demo. Never deploys or connects to Google. */
"use strict";
const fs=require("node:fs"),path=require("node:path");
function paquete(){
  const dir=path.resolve(__dirname,"../../dist/rsvp"),leer=(base,f)=>fs.readFileSync(path.join(base,f),"utf8");
  let html=leer(dir,"index.html").replace('data-rsvp="demo" data-estilo="cine"','data-rsvp="evento" data-estilo="<?= estilo ?>"');
  html=html.replace('<link rel="stylesheet" href="rsvp.css">',()=>"<style>"+leer(dir,"rsvp.css")+"</style>");
  for(const js of ["modelo","form","inicio"])html=html.replace('<script src="'+js+'.js"></script>',()=>"<script>"+leer(dir,js+".js")+"</script>");
  return {"Index.html":html,"Modelo.gs":leer(dir,"modelo.js"),"Code.gs":leer(__dirname,"Code.gs"),"appsscript.json":leer(__dirname,"appsscript.json")};
}
module.exports={paquete};
if(require.main===module){
  if(!process.argv[2])throw Error("Indicá una carpeta nueva para el paquete del evento.");
  const out=path.resolve(process.argv[2]),files=paquete();
  fs.mkdirSync(out); // Fails for an existing directory, before writing any file.
  for(const [name,content] of Object.entries(files))fs.writeFileSync(path.join(out,name),content,{flag:"wx"});
  console.log("Paquete para revisar (sin publicar): "+out);
}
