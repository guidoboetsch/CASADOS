// Chrome + Playwright. All registrations and the Apps Script bridge are simulated in memory; no Google traffic.
const {chromium}=require("playwright"),assert=require("node:assert/strict"),path=require("node:path"),{pathToFileURL}=require("node:url");
const {evento,PASE,PASE2}=require("../helpers/rsvp-ficticio.cjs"),{paquete}=require("../../tools/rsvp/build.cjs");
const entry=pathToFileURL(path.resolve(__dirname,"../../dist/editor/index.html")).href;
const endpoint="https://script.google.com/macros/s/ensayo-ficticio/exec",external="https://formularios.example/anterior",guest="https://invita.example/fiesta/";
async function download(page,selector="#download"){
  const wait=page.waitForEvent("download");await page.locator(selector).click();const stream=await(await wait).createReadStream();
  const chunks=[];for await(const c of stream)chunks.push(c);return Buffer.concat(chunks);
}
async function persona(p,i,nombre,tipo,edad){
  await p.locator('[name="nombre'+i+'"]').fill(nombre);await p.locator('[name="tipo'+i+'"]').selectOption(tipo);
  if(edad!==undefined)await p.locator('[name="edad'+i+'"]').fill(String(edad));
}
async function check(browser,width){
  const db=evento(3),ctx=await browser.newContext({viewport:{width,height:840},isMobile:width===390,hasTouch:width===390,acceptDownloads:true});
  try{
    const errors=[],unexpected=[];let lost=true,html="";
    ctx.on("page",p=>p.on("pageerror",e=>errors.push(e.message)));
    await ctx.exposeFunction("simularRegistro",(name,...args)=>{
      if(name==="abrir")return db.abrir(...args);
      const answer=db.registrar(...args);
      if(lost&&answer.ok){lost=false;throw Error("Corte de prueba después de guardar.");}return answer;
    });
    await ctx.addInitScript(({endpoint})=>{
      if(!location.href.startsWith(endpoint))return;
      window.google={script:{run:{withSuccessHandler(ok){return {withFailureHandler(fail){
        return {abrirInvitacion:(...a)=>window.simularRegistro("abrir",...a).then(ok,fail),confirmarInvitacion:(...a)=>window.simularRegistro("confirmar",...a).then(ok,fail)};
      }};}}}};
    },{endpoint});
    const bundle=paquete()["Index.html"];
    await ctx.route(/^https?:/,async r=>{
      const url=new URL(r.request().url());
      if(url.origin+url.pathname===endpoint&&r.request().method()==="GET"){
        const style=url.searchParams.get("estilo");assert.ok(["cine","herbario","gaceta","verbena"].includes(style));
        return r.fulfill({contentType:"text/html",body:bundle.replace("<?= estilo ?>",style)});
      }
      if(url.href===guest)return r.fulfill({contentType:"text/html",body:html});
      unexpected.push(url.href);return r.abort();
    });
    const editor=await ctx.newPage();let message="";editor.on("dialog",async d=>{message=d.message();await d.accept();});
    await editor.goto(entry);await editor.getByRole("button",{name:"Confirmar",exact:true}).click();
    assert.equal(await editor.locator("#modo-rsvp").inputValue(),"grupo");
    assert.ok((await download(editor)).toString().includes("La confirmación todavía no está abierta."));
    await editor.selectOption("#design","herbario");
    const demoWait=ctx.waitForEvent("page");await editor.getByRole("link",{name:"Probar confirmación en grupo"}).click();
    const demo=await demoWait;await demo.locator('[name="nombre0"]').waitFor();
    assert.equal(await demo.locator("html").getAttribute("data-estilo"),"herbario");
    await demo.getByLabel("Pareja",{exact:true}).check();assert.equal(await demo.locator("fieldset.persona").count(),2);
    await persona(demo,0,"Persona A","menor",17);await persona(demo,1,"Persona B","menor",0);
    await demo.locator('[name="tipo0"]').selectOption("adulta");assert.equal(await demo.locator('[name="edad0"]').inputValue(),"");assert.ok(await demo.locator('[name="edad0"]').isHidden());
    await demo.getByLabel("Familia o grupo").check();const add=demo.getByRole("button",{name:"+ Agregar persona"});
    for(let i=2;i<10;i++)await add.click();assert.ok(await add.isDisabled());
    await demo.getByRole("button",{name:"Quitar persona 10",exact:true}).click();assert.equal(await demo.locator(".persona").count(),9);
    await demo.getByLabel("Pareja",{exact:true}).check();await demo.getByRole("button",{name:"Revisar respuesta"}).click();
    assert.match(await demo.locator(".resumen").innerText(),/Menor de 1 año/);
    await demo.getByRole("button",{name:"Finalizar prueba"}).click();await demo.getByRole("heading",{name:"Prueba terminada"}).waitFor();
    assert.equal(db.writes,0);assert.notEqual(await demo.evaluate(()=>JSON.stringify(localStorage).includes("Persona B")),true);
    await demo.close();
    // Opening a pre-feature draft preserves its previous external form without adding a demo URL to the invitation.
    await editor.waitForFunction(()=>document.querySelector("#saved").textContent.includes("Guardado"));
    await editor.evaluate(external=>{const k="kaza:invitation-studio:v1",d=JSON.parse(localStorage[k]);delete d.blocks.confirm.modo;delete d.blocks.confirm.grupoUrl;d.blocks.confirm.url=external;localStorage[k]=JSON.stringify(d);},external);
    await editor.reload();await editor.getByRole("button",{name:"Confirmar",exact:true}).click();
    assert.equal(await editor.locator("#modo-rsvp").inputValue(),"externo");assert.ok((await download(editor)).toString().includes(external));
    await editor.locator("#modo-rsvp").selectOption("grupo");await editor.locator("#edit-grupoUrl").fill("https://docs.google.com/spreadsheets/d/ficticia");
    await editor.locator("#download").click();assert.match(message,/\/exec/);
    await editor.locator("#edit-grupoUrl").fill(endpoint);html=(await download(editor)).toString();assert.ok(html.includes(endpoint+"?estilo=herbario")&&!html.includes(external)&&!html.includes("rsvp/index.html"));
    await editor.locator(".publish-options summary").click();await editor.locator("#event-slug").fill("evento-prueba");
    const zip=await download(editor,"#publish-zip"),off=30+zip.readUInt16LE(26)+zip.readUInt16LE(28);assert.equal(zip.subarray(off,off+zip.readUInt32LE(18)).toString(),html);
    const g=await ctx.newPage();await g.goto(guest);const wait=ctx.waitForEvent("page");await g.getByRole("link",{name:"Confirmar asistencia"}).click();const live=await wait;
    await live.getByLabel("Código de tu invitación").fill(PASE);await live.getByRole("button",{name:"Abrir mi invitación"}).click();
    await live.getByLabel("Familia o grupo").check();await live.getByRole("button",{name:"+ Agregar persona"}).click();
    assert.ok(await live.getByRole("button",{name:"+ Agregar persona"}).isDisabled());
    await persona(live,0,"Persona A","adulta");await persona(live,1,"Persona B","menor",17);await persona(live,2,"Persona C","menor");
    await live.getByRole("button",{name:"Revisar respuesta"}).click();assert.ok(await live.locator('[name="edad2"]').evaluate(n=>n.validity.valueMissing));
    await live.locator('[name="edad2"]').fill("18");await live.getByRole("button",{name:"Revisar respuesta"}).click();assert.ok(await live.locator('[name="edad2"]').evaluate(n=>n.validity.rangeOverflow));
    await live.locator('[name="edad2"]').fill("0");await live.getByRole("button",{name:"Revisar respuesta"}).click();assert.equal(await live.locator(".resumen li").count(),3);
    await live.getByRole("button",{name:"Volver y corregir"}).click();assert.equal(await live.locator('[name="edad2"]').inputValue(),"0");
    await live.getByRole("button",{name:"Revisar respuesta"}).click();assert.equal(db.writes,0);
    await live.getByRole("button",{name:"Confirmar asistencia"}).click();await live.getByText("No pudimos verificar el envío.",{exact:false}).waitFor();
    await live.getByRole("button",{name:"Confirmar asistencia"}).click();await live.getByRole("heading",{name:"¡Recibimos tu respuesta!"}).waitFor();
    assert.equal(db.writes,1);assert.equal(db.filas[3][db.cols.indexOf("Edad al evento")],0);assert.deepEqual(db.contador(),{confirmados:4});
    assert.ok(!live.url().includes(PASE));assert.ok(await live.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await live.reload();await live.getByLabel("Código de tu invitación").fill(PASE2);await live.getByRole("button",{name:"Abrir mi invitación"}).click();
    await live.getByLabel("No puedo ir").check();assert.equal(await live.locator('select,[type="number"]').count(),0);
    await live.getByLabel("Nombre y apellido").fill("Sin asistencia");await live.getByRole("button",{name:"Revisar respuesta"}).click();await live.getByRole("button",{name:"Confirmar ausencia"}).click();
    await live.getByRole("heading",{name:"¡Recibimos tu respuesta!"}).waitFor();assert.deepEqual(db.contador(),{confirmados:4});
    assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);console.log(width+" px · prueba sin envíos, editor anterior, HTML/ZIP, alta privada, reintento y ausencia: OK");
  }finally{await ctx.close();}
}
(async()=>{const browser=await chromium.launch({channel:"chrome"});try{for(const w of [390,1440])await check(browser,w);}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
