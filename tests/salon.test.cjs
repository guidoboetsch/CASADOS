const test=require("node:test"),assert=require("node:assert/strict"),M=require("../dist/salon/model.js");

test("los salones de ejemplo no tienen invitados ni muebles encima de otros",()=>{
  for(const id of Object.keys(M.presets)){
    const r=M.preset(id);assert.deepEqual(M.parse(JSON.stringify(r)),r);
    assert.equal(r.items.length,id==="libre"?0:9);
    for(const [i,o] of r.items.entries()){
      assert.equal(M.seats(o).length,M.table(o)?o.seats:0);
      assert.ok(!r.items.slice(i+1).some(b=>M.intersects(o,b)),id+" / "+o.id);
    }
    assert.ok(M.insert(r,"table","round"));
    assert.deepEqual(M.parse(JSON.stringify(r)),r);
  }
});
test("agregar respeta el espacio, el número libre y el límite de muebles",()=>{
  const r=M.preset("libre");r.width=r.depth=10;
  while(M.insert(r,"table","rect")){}
  const data=JSON.stringify(r);assert.equal(M.insert(r,"table","rect"),null);assert.equal(JSON.stringify(r),data);
  assert.equal(new Set(r.items.map(o=>o.number)).size,r.items.length);
});
test("girar, mover y achicar respeta los bordes incluyendo las sillas",()=>{
  const r=M.preset(),o=r.items[0];o.shape="rect";o.seats=16;o.angle=45;o.x=21;o.z=-20;
  M.resize(r,10,10);
  const e=M.extents(o);assert.ok(o.x+e.x<=5.01&&o.z-e.z>=-5.01);
});
test("restaurar no acepta estados malformados, duplicados ni una URL remota como referencia",()=>{
  for(const alter of [r=>r.items.push(r.items[0]),r=>r.reference="https://example.org/imagen.png",r=>r.items[0].seats=100,r=>r.items[1].number=1]){
    const r=M.preset();alter(r);assert.throws(()=>M.parse(JSON.stringify(r)));
  }
});
test("proyección e intersección con el piso son inversas aun con zoom y órbita",()=>{
  const r=M.preset();
  for(const mode of ["2d","3d"])for(const a of [-1.2,.67,2.4])for(const zoom of [.65,1,3]){
    const c=M.camera(r,mode,891,525,a,.56,zoom,{x:2.7,z:-1.1});
    for(const y of [0,.85]){const screen=c.project(4,-2,y),p=c.ground(screen.x,screen.y,y);
      assert.ok(Math.hypot(p.x-4,p.z+2)<1e-9)}
  }
});
