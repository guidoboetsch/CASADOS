/* Browser integration, with Playwright + Chrome installed for QA. No live Sheets, guest writes, or remote hosts. */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const {pathToFileURL}=require("node:url");
const path=require("node:path");
const editor=pathToFileURL(path.resolve(__dirname,"../../dist/editor/index.html")).href;
const endpoint="https://recuento.example/fiesta/total", published="https://invitacion.example/i/prueba/";
async function download(page,button){
  const done=page.waitForEvent("download");await page.locator(button).click();const d=await done;
  const stream=await d.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);
  return Buffer.concat(chunks);
}
async function run(browser,width){
  const ctx=await browser.newContext({viewport:{width,height:850},timezoneId:"Asia/Tokyo",acceptDownloads:true});
  try{
    const page=await ctx.newPage(),errors=[],requests=[];
    ctx.on("page",p=>p.on("pageerror",e=>errors.push(e.message)));
    page.on("pageerror",e=>errors.push(e.message));
    let payload={confirmados:5,nombres:["no incluir"]},http=200;
    await ctx.route(endpoint,async route=>{
      const req=route.request();requests.push(req.method());
      assert.equal(req.headers().cookie,undefined);assert.equal(req.headers().referer,undefined);
      await route.fulfill({status:http,contentType:"application/json",headers:{"Access-Control-Allow-Origin":"*"},body:JSON.stringify(payload)});
    });
    let lastAlert="";page.on("dialog",async d=>{lastAlert=d.message();await d.accept()});
    await page.goto(editor);
    await page.locator("#edit-names").fill("Pareja de prueba");
    await page.waitForFunction(()=>document.querySelector("#saved").textContent.includes("Guardado"));
    // Simulate a draft from before the addition of either block.
    await page.evaluate(()=>{const key="kaza:invitation-studio:v1",s=JSON.parse(localStorage.getItem(key));delete s.blocks.countdown;delete s.blocks.attendance;localStorage.setItem(key,JSON.stringify(s))});
    await page.reload();assert.equal(await page.locator("#edit-names").inputValue(),"Pareja de prueba");
    assert.equal(await page.locator("#preview section").count(),6);
    await page.locator("#toggle-countdown").click();
    await page.locator("#edit-date").fill("2028-11-22");await page.locator("#edit-time").fill("18:00");
    assert.equal(await page.locator("#preview .cover time").getAttribute("datetime"),"2028-11-22");
    await page.locator("#toggle-attendance").click();await page.locator("#download").click();assert.match(lastAlert,/HTTPS/);
    await page.getByText("¿De dónde sale el número?",{exact:true}).click();assert.match(await page.locator(".count-guide ol").innerText(),/La lista de invitados queda privada/);
    await page.locator("#edit-source").fill(endpoint);assert.equal(requests.length,0);
    await page.locator("#download").click();assert.match(lastAlert,/Probar conexión/);
    await page.getByRole("button",{name:"Probar conexión"}).click();
    await page.waitForFunction(()=>document.querySelector(".tally-status").textContent.includes("No se pudo"));
    assert.equal(await page.locator(".tally-number").innerText(),"—");
    payload={confirmados:5};await page.getByRole("button",{name:"Probar conexión"}).click();
    await page.waitForFunction(()=>document.querySelector(".tally-number").textContent==="5");
    await page.getByRole("button",{name:"Bajar Asistencia confirmada",exact:true}).click();
    const html=(await download(page,"#download")).toString();
    assert.ok(html.includes(endpoint)&&!html.includes("Probar conexión")&&!html.includes("no incluir"));
    assert.ok(html.includes('class="tally-number">—<'));
    await page.locator(".publish-options summary").click();await page.locator("#event-slug").fill("evento-prueba");
    const zip=await download(page,"#publish-zip"),at=30+zip.readUInt16LE(26)+zip.readUInt16LE(28);
    assert.equal(zip.subarray(at,at+zip.readUInt32LE(18)).toString(),html);
    await ctx.route(published,r=>r.fulfill({contentType:"text/html",body:html}));
    const guest=await ctx.newPage();
    await guest.clock.install({time:new Date("2028-11-21T10:00:00Z")});
    await guest.clock.pauseAt(new Date("2028-11-21T21:00:00Z"));
    await guest.goto(published);
    const n=guest.locator(".tally-number"),parts=guest.locator(".clock-values strong");
    await n.filter({hasText:"5"}).waitFor();assert.deepEqual(await parts.allTextContents(),["01","00","00","00"]);
    await guest.clock.runFor(1000);assert.deepEqual(await parts.allTextContents(),["00","23","59","59"]);
    // Changes originate in the shared source, not clicks or a browser-local count.
    for(const count of [7,1,0]){
      payload={confirmados:count};await guest.clock.fastForward(61000);
      await guest.waitForFunction(n=>document.querySelector(".tally-number").textContent===String(n),count);
      assert.equal(await guest.locator(".tally-unit").innerText(),count===1?"persona confirmada":"personas confirmadas");
    }
    http=503;await guest.clock.fastForward(61000);await guest.waitForFunction(()=>document.querySelector(".tally-number").textContent==="—");
    http=200;payload={confirmados:3};await guest.clock.fastForward(61000);await n.filter({hasText:"3"}).waitFor();
    await guest.clock.fastForward(24*3600000);assert.match(await guest.locator(".clock-message").innerText(),/gran día/);
    await guest.clock.fastForward(24*3600000);assert.match(await guest.locator(".clock-message").innerText(),/ya pasó/);
    assert.ok(await guest.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.bringToFront();await page.locator("#toggle-attendance").click();
    const without=(await download(page,"#download")).toString();assert.ok(!without.includes(endpoint));
    await page.locator("#toggle-countdown").click();await page.reload();assert.equal(await page.locator("#preview section").count(),6);
    assert.deepEqual(errors,[]);assert.ok(requests.length>=7&&requests.every(m=>m==="GET"));
    console.log(width+" px · editor, HTML, ZIP, cambio de huso, recuento simulado y recuperación: OK");
  }finally{await ctx.close()}
}
(async()=>{const browser=await chromium.launch({channel:"chrome"});try{for(const width of [390,1440])await run(browser,width)}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
