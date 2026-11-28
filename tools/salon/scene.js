import {Scene,Color,OrthographicCamera,WebGLRenderer,HemisphereLight,DirectionalLight,PCFShadowMap,
  BoxGeometry,CylinderGeometry,SphereGeometry,Shape,ShapeGeometry,Mesh,ShadowMaterial,MeshStandardMaterial,
  Group,Object3D,InstancedMesh,Vector2,Raycaster} from "three";

// Architectural model built from shared instanced primitives; one render per interaction.
export function create(canvas,model) {
  const renderer=new WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=PCFShadowMap;
  const scene=new Scene(),camera=new OrthographicCamera(-1,1,1,-1,.1,160);
  scene.background=new Color("#dbd9d4");
  scene.add(new HemisphereLight(0xfffaf2,0xbcb0a3,2.0));
  const sun=new DirectionalLight(0xfff3dd,2.4);sun.position.set(-12,22,10);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-27,right:27,top:27,bottom:-27,far:72});
  sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.032;sun.shadow.bias=-.00035;scene.add(sun);
  const arch=new Shape();arch.moveTo(-.5,0);arch.lineTo(.5,0);arch.lineTo(.5,.6);
  arch.absellipse(0,.6,.5,.4,0,Math.PI,false,0);arch.closePath();
  const geo={box:new BoxGeometry(1,1,1),cyl:new CylinderGeometry(.5,.5,1,32),sphere:new SphereGeometry(.5,9,6),arch:new ShapeGeometry(arch)};
  const mat=new MeshStandardMaterial({roughness:.91,metalness:0});
  const ground=new Mesh(geo.box,new ShadowMaterial({opacity:.16}));
  ground.scale.set(180,.1,180);ground.position.y=-.48;ground.receiveShadow=true;scene.add(ground);
  const scratch=new Object3D(),color=new Color(),ray=new Raycaster(),point=new Vector2();
  function batch(pieces){
    const by=new Map();for(const p of pieces){if(!by.has(p[0]))by.set(p[0],[]);by.get(p[0]).push(p)}
    const group=new Group();
    for(const [type,parts] of by){
      const mesh=new InstancedMesh(geo[type],mat,parts.length);
      parts.forEach(([,x,y,z,w,h,d,hex,ry=0],i)=>{
        scratch.position.set(x,y,z);scratch.rotation.set(0,ry,0);scratch.scale.set(w,h,d);scratch.updateMatrix();
        mesh.setMatrixAt(i,scratch.matrix);mesh.setColorAt(i,color.set(hex));
      });mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    }return group;
  }
  const root=new Group(),pieces=new Map();scene.add(root);let hall=null,hallKey="",walls=[],lastWidth=0,lastHeight=0;
  const remove=g=>{g.traverse(m=>{if(m.isInstancedMesh)m.dispose()});g.removeFromParent()};
  function wall(len){
    const p=[],h=2.35;
    p.push(["box",0,h/2,0,len,h,.15,"#dfdacd"],["box",0,.16,.09,len,.31,.08,"#b9ac99"],
      ["box",0,h+.045,0,len+.1,.09,.22,"#eae2d3"]);
    const n=Math.max(3,Math.round(len/3)),step=len/n;
    for(let i=0;i<n;i++){const x=-len/2+step*(i+.5),w=Math.min(step*.62,1.65);
      p.push(["arch",x,.42,.081,w,1.62,1,"#8d9994"],["arch",x,.46,.092,w-.12,1.51,1,"#bccac4"],
        ["box",x,1.17,.11,.034,1.4,.035,"#e7dfcf"],["box",x,1.26,.11,w-.13,.034,.035,"#e7dfcf"],
        ["box",x,.40,.12,w+.12,.07,.17,"#eee7d8"]);
    }return batch(p);
  }
  function buildHall(room){
    if(hall)remove(hall);hall=new Group();scene.add(hall);walls=[];
    const w=room.width,d=room.depth,p=[
      ["box",0,-.28,0,w+.45,.29,d+.45,"#968b7b"],["box",0,-.105,0,w+.29,.20,d+.29,"#e1d6bf"]
    ];
    for(let i=-w/2+1;i<w/2;i+=1)p.push(["box",i,-.002,0,.008,.009,d,"#bdb2a2"]);
    for(let i=-d/2+1;i<d/2;i+=1)p.push(["box",0,-.002,i,w,.009,.008,"#bdb2a2"]);
    for(const [x,z,len,a] of [[0,-d/2,w,0],[0,d/2,w,Math.PI],[-w/2,0,d,Math.PI/2],[w/2,0,d,-Math.PI/2]]){
      p.push(["box",x,.06,z,len,.12,.16,"#b4a68f",a]);
      const side=wall(len);side.rotation.y=a;side.position.set(x,0,z);hall.add(side);walls.push(side);
    }
    hall.add(batch(p));
  }
  function furniture(o,selected){
    const p=[],{w,d}=model.size(o),acc=selected?"#be263a":"#774749";
    if(model.table(o)){
      const round=o.shape==="round",top=round?"cyl":"box";
      p.push([top,0,.81,0,w,.13,d,selected?"#f5dcc6":"#fff3db"],[top,0,.66,0,w*.85,.16,d*.85,"#c6baa7"]);
      if(round)p.push(["cyl",0,.34,0,.34,.65,.34,"#675b4e"],["cyl",0,.06,0,.80,.10,.80,"#84796a"]);
      else for(const x of [-1,1])for(const z of [-1,1])p.push(["box",x*w*.39,.36,z*d*.33,.095,.70,.095,"#716251"]);
      if(o.kind==="main")p.push(["box",0,.882,0,w*.91,.012,.23,acc]);
      for(const ch of model.seats(o)){
        const sx=Math.sin(ch.a),cz=Math.cos(ch.a);
        const part=(x,y,z,bw,bh,bd,col)=>p.push(["box",ch.x+x*cz+z*sx,y,ch.z-x*sx+z*cz,bw,bh,bd,col,ch.a]);
        part(0,.45,0,.42,.11,.40,acc);part(0,.68,.19,.40,.34,.075,"#695450");
        for(const x of [-.15,.15])for(const z of [-.14,.14])part(x,.20,z,.045,.40,.045,"#64594f");
        p.push(["cyl",ch.x-sx*.56,.89,ch.z-cz*.56,.28,.018,.28,"#ece4d6"]);
      }
      p.push(["cyl",0,.978,0,.16,.21,.16,"#ae8162"],["sphere",0,1.13,0,.38,.25,.30,"#73816c"]);
    }else if(o.kind==="floor"){
      p.push(["box",0,.04,0,w,.08,d,selected?"#b52537":"#776454"]);
      const nx=Math.max(2,Math.round(w/.55)),nz=Math.max(2,Math.round(d/.55)),sx=(w-.16)/nx,sz=(d-.16)/nz;
      for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)p.push(["box",(i+.5-nx/2)*sx,.087,(j+.5-nz/2)*sz,sx-.012,.025,sz-.012,(i+j)%2?"#b6a08a":"#d9c5a9"]);
    }else{
      p.push(["box",0,.5,0,w*.92,.96,d*.88,selected?"#823b49":"#493e42"],["box",0,1,0,w,.1,d,"#312d31"]);
      for(const side of [-1,1])p.push(["cyl",side*w*.26,1.06,0,d*.45,.04,d*.45,"#746d6b"],["cyl",side*w*.26,1.09,0,d*.14,.02,d*.14,"#b59d82"]);
    }
    const group=batch(p);group.children.forEach(m=>{m.userData.id=o.id});root.add(group);return group;
  }
  function draw(room,c,selected){
    if(c.w!==lastWidth||c.h!==lastHeight){renderer.setSize(c.w,c.h,false);lastWidth=c.w;lastHeight=c.h}
    const key=room.width+":"+room.depth;if(key!==hallKey){buildHall(room);hallKey=key}
    const ca=Math.cos(c.a),sa=Math.sin(c.a),ce=Math.cos(c.e),se=Math.sin(c.e);
    walls.forEach((g,i)=>g.visible=[ca>.15,ca<-.15,sa>.15,sa<-.15][i]);
    const span=c.h/c.scale,aspect=c.w/c.h;
    Object.assign(camera,{left:-span*aspect/2,right:span*aspect/2,top:span/2,bottom:-span/2});
    camera.position.set(c.pan.x+sa*ce*54,c.ty+se*54,c.pan.z+ca*ce*54);camera.lookAt(c.pan.x,c.ty,c.pan.z);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    const live=new Set(room.items.map(o=>o.id));for(const [id,old] of pieces)if(!live.has(id)){remove(old.group);pieces.delete(id)}
    for(const o of room.items){
      const key=[o.kind,o.shape,o.seats,o.w,o.d,o.id===selected].join("/");
      let v=pieces.get(o.id);if(v?.key!==key){if(v)remove(v.group);v={key,group:furniture(o,o.id===selected)};pieces.set(o.id,v)}
      v.group.position.set(o.x,0,o.z);v.group.rotation.y=-model.rad(o.angle);
    }
    renderer.render(scene,camera);
  }
  function pick(px,py){point.set(2*px/lastWidth-1,1-2*py/lastHeight);ray.setFromCamera(point,camera);return ray.intersectObjects(root.children,true)[0]?.object.userData.id||null}
  return {draw,pick};
}
