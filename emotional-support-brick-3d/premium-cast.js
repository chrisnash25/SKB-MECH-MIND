/* Emotional Support Brick: reference-directed real-time 3D character pass.
   Separate articulated meshes for every body part, not billboard artwork.
   Works with existing animateCharacter() and never changes the room/game mechanics. */
import * as T from 'three';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/geometries/RoundedBoxGeometry.js';

const COLOURS={
 bricko:['#f56727','#bc252b','#ffda55'],rusty:['#ba783b','#795032','#55cfff'],
 pulse:['#121529','#31eaff','#dc48ff'],calm:['#29a6e8','#617c9b','#ffffff'],
 spark:['#f5bf21','#edacd1','#ffffff'],blocky:['#77797e','#2b3445','#fafafa'],
 cozy:['#f9a5b8','#fff2dc','#eb678c'],zapp:['#5bd815','#1b2930','#ffed29'],
 echo:['#9c4dde','#8df6ff','#f7b1ff'],gizmo:['#f3a326','#253e67','#b2bfc5']
};
const materials=new Map();
function material(hex,rough=.55,metal=0,glow=0){
 const key=hex+'|'+rough+'|'+metal+'|'+glow;
 if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({
  color:hex,roughness:rough,metalness:metal,
  emissive:glow?hex:'#000000',emissiveIntensity:glow
 }));
 return materials.get(key);
}
const standard=material('#fffdf5',.30),ink=material('#191b25'),white=material('#fff8eb'),
 leather=material('#4a322a',.85),black=material('#14151d',.63),pink=material('#f4758d'),
 gold=material('#e6b354',.32,.5),cyan=material('#6ceafc',.23,.15,.55);
function mesh(p,g,m,x=0,y=0,z=0){
 const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;
}
function box(p,w,h,d,m,x=0,y=0,z=0,r=.05){
 return mesh(p,new RoundedBoxGeometry(w,h,d,4,Math.min(r,w*.35,h*.35,d*.35)),m,x,y,z);
}
function ball(p,x,y,z,sx,sy,sz,m){
 const o=mesh(p,new T.SphereGeometry(1,24,16),m,x,y,z);o.scale.set(sx,sy,sz);return o;
}
function cylinder(p,x,y,z,rad,h,m){
 return mesh(p,new T.CylinderGeometry(rad,rad,h,24),m,x,y,z);
}
function ring(p,x,y,z,r,t,m,orient=0){
 const o=mesh(p,new T.TorusGeometry(r,t,9,32),m,x,y,z);o.rotation.y=orient;return o;
}
function path(p,coords,t,m){
 const curve=new T.CatmullRomCurve3(coords.map(a=>new T.Vector3(...a)));
 return mesh(p,new T.TubeGeometry(curve,Math.max(8,coords.length*4),t,7,false),m);
}
function shape(p,pts,depth,m,x,y,z){
 const s=new T.Shape();s.moveTo(...pts[0]);pts.slice(1).forEach(a=>s.lineTo(...a));s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2});
 return mesh(p,g,m,x,y,z);
}
function star(p,x,y,z,r,inner,m){
 const a=[];for(let i=0;i<10;i++){const t=Math.PI/2+i*Math.PI/5;const d=i%2?inner:r;a.push([Math.cos(t)*d,Math.sin(t)*d])}
 return shape(p,a,.024,m,x,y,z);
}
function textPatch(p,str,x,y,z,w=.40,h=.13,color='#ffffff',bg='#000000'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
 const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,512,128);
 c.font='900 70px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(str,256,67,485);
 const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;
 return mesh(p,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t,transparent:false,side:T.DoubleSide}),x,y,z);
}
const skinCache=new Map();
function surface(id){
 if(skinCache.has(id))return skinCache.get(id);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const ctx=canvas.getContext('2d');
 const base=COLOURS[id][0];ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
 const arr=ctx.getImageData(0,0,512,512),d=arr.data;
 let seed=id.split('').reduce((a,c)=>a*31+c.charCodeAt(0),12347)>>>0;
 function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
 const amplitude=id==='rusty'||id==='blocky'?41:15;
 for(let i=0;i<d.length;i+=4){let n=(rnd()-.5)*amplitude;
  d[i]=Math.max(0,Math.min(255,d[i]+n));d[i+1]=Math.max(0,Math.min(255,d[i+1]+n));
  d[i+2]=Math.max(0,Math.min(255,d[i+2]+n));
 }
 ctx.putImageData(arr,0,0);
 for(let i=0;i<1300;i++){
  const x=rnd()*512,y=rnd()*512,r=.5+rnd()*(id==='rusty'?3.5:1.25);
  ctx.fillStyle=rnd()>.5?'#fff5cc20':'#30120f27';
  ctx.beginPath();ctx.ellipse(x,y,r,r,0,0,Math.PI*2);ctx.fill();
 }
 if(id==='echo'){
  for(let i=0;i<230;i++){
   const x=rnd()*512,y=rnd()*512,r=.3+rnd()*2.4;
   ctx.fillStyle=i%4?'#e9cfff':'#78faff';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<15;i++){const x=rnd()*512,y=rnd()*512;
   const gr=ctx.createRadialGradient(x,y,0,x,y,28);gr.addColorStop(0,'#eeaaff88');gr.addColorStop(1,'#7707e100');
   ctx.fillStyle=gr;ctx.fillRect(x-28,y-28,56,56);
  }
 }
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
 skinCache.set(id,tex);return tex;
}
function shellMaterial(id){
 return new T.MeshStandardMaterial({
  color:'#ffffff',map:surface(id),roughness:id==='pulse'?.31:id==='rusty'?.91:.61,
  metalness:id==='pulse'?.30:0
 });
}
function cuff(parent,colour){const m=material(colour,.86);box(parent,.26,.21,.27,m,0,-.18,0,.07)}
function shoe(parent,main,detail){
 const m=material(main,.7),s=material(detail,.5);
 box(parent,.44,.24,.65,m,0,-.48,.10,.11);
 box(parent,.46,.085,.68,s,0,-.61,.12,.025);
 for(let i=0;i<3;i++)box(parent,.18,.015,.025,standard,0,-.37,.22+i*.09,.008);
}
function headphone(parent,x,y,z,cupColour,glow=.12){
 const m=material(cupColour,.25,.25,glow);
 const o=ball(parent,x,y,z,.18,.27,.32,black);
 ball(parent,x+Math.sign(x)*.08,y,z,.12,.24,.27,m);
 ring(parent,x+Math.sign(x)*.15,y,z,.19,.026,material('#a4b8d2',.22,.65),Math.PI/2);
 return o;
}
function daisy(p,x,y,z){
 const flower=material('#fffaf1',.82),centre=material('#edc12d',.43);
 for(let i=0;i<9;i++){const a=i*2*Math.PI/9;ball(p,x+Math.cos(a)*.17,y+Math.sin(a)*.17,z,.095,.11,.036,flower)}
 ball(p,x,y,z+.035,.095,.095,.04,centre);
}
function bolt(p,x,y,z,s,m){
 return shape(p,[[.02,.34],[-.16,.03],[0,.025],[-.08,-.31],[.23,.075],[.06,.075]],.02,m,x,y,z).scale.setScalar(s);
}
function glasses(p,style,z){
 const m=material('#0b1520',.35);
 for(const s of [-1,1]){
  if(style==='star'){star(p,s*.29,1.49,z,.29,.14,m);star(p,s*.29,1.49,z+.037,.22,.115,material('#324e91',.18,.25))}
  else {
   const f=box(p,.50,.37,.065,m,s*.30,1.43,z,.095);
   const lens=box(p,.42,.28,.022,material('#a8dafa',.16,.05),s*.30,1.43,z+.042,.07);
   lens.material.transparent=true;lens.material.opacity=.27;
   if(style==='big')f.scale.set(1.08,1.12,1);
  }
 }
 box(p,.18,.055,.075,m,0,1.48,z,.02);
}
function mug(p,x,y,z){
 const ceramic=material('#fff0d0',.27);
 cylinder(p,x,y,z,.20,.28,ceramic);
 const handle=ring(p,x+.20,y,z,.105,.025,ceramic,0);
 handle.scale.x=.75;
 const heart=material('#f46b94',.48);
 const h=shape(p,[[0,-.14],[-.16,.01],[-.15,.12],[-.06,.16],[0,.10],[.06,.16],[.15,.12],[.16,.01]],.02,heart,x,y,z+.204);
 h.scale.set(.58,.58,1);
}
export function upgradeCharacter(c){
 if(c.premium3d)return c;
 const id=c.id,palette=COLOURS[id];if(!palette)return c;
 const main=palette[0],accent=palette[1],detail=palette[2],body=c.body;
 while(body.children.length)body.remove(body.children[0]);
 const skin=shellMaterial(id),bright=material(detail,.42),a=material(accent,.70),dark=black;
 const torso=box(body,1.42,1.35,.79,skin,0,1.20,0,.18);
 for(const x of [-.45,0,.45])cylinder(body,x,1.94,0,.18,.13,skin);
 // Shape-matched, articulated feet and arms; each glove, cuff and trainer is actual geometry.
 const arms=[],legs=[];
 for(const s of [-1,1]){
  const arm=new T.Group();arm.position.set(s*.72,1.36,0);body.add(arm);arms.push(arm);
  const sleeve=id==='calm'||id==='spark'||id==='cozy'?a:dark;
  ball(arm,s*.08,-.19,0,.19,.30,.21,sleeve);
  cuff(arm,id==='calm'?'#416184':id==='spark'?'#e4a0c9':id==='cozy'?'#fff1dc':'#262833');
  ball(arm,s*.10,-.47,.055,.18,.17,.17,id==='cozy'?material('#f4abc0'):id==='pulse'?material('#1d244a'):skin);
  const leg=new T.Group();leg.position.set(s*.34,.68,0);body.add(leg);legs.push(leg);
  ball(leg,0,-.16,0,.18,.27,.17,id==='spark'?material('#f7ad3d'):id==='calm'?material('#7bb4df'):dark);
  shoe(leg,id==='bricko'||id==='gizmo'?'#c82f35':id==='zapp'?'#1a2c2a':id==='echo'?'#5a2796':id==='calm'?'#5e749c':'#404659',
   id==='spark'?'#fff5c6':'#f9f5ed');
 }
 const eyeGroups=[],pupils=[];
 const eyesHalf=id==='rusty'||id==='calm'||id==='blocky'||id==='echo';
 for(const s of [-1,1]){
  const eye=new T.Group();eye.position.set(s*.32,1.39,.415);body.add(eye);eyeGroups.push(eye);
  ball(eye,0,0,0,.205,.235,.06,white);
  const pup=new T.Group();eye.add(pup);pupils.push(pup);
  const iris=material(id==='pulse'?'#27d5ff':id==='cozy'?'#71316e':'#4d321f',.21);
  ball(pup,0,-.022,.055,.125,.148,.043,iris);
  ball(pup,0,-.024,.092,.075,.098,.025,black);
  ball(pup,-.042,.050,.117,.035,.043,.013,standard);
  if(eyesHalf)ball(eye,0,.18,.052,.204,.108,.040,id==='blocky'?skin:id==='rusty'?skin:material(main,.65));
  const brow=box(body,.30,.052,.065,material(id==='cozy'?'#95485b':'#36313c'),s*.33,1.70,.48,.023);
  brow.rotation.z=s*(id==='zapp'?.18:.07);
 }
 const mouth=new T.Group();mouth.position.set(0,1.075,.425);body.add(mouth);
 ball(mouth,0,-.01,.015,.29,.17,.049,material('#3f1220',.72));
 ball(mouth,0,.092,.061,.24,.048,.018,white);
 ball(mouth,0,-.105,.06,.15,.065,.018,pink);
 if(id==='calm'||id==='echo'||id==='blocky'){
  mouth.scale.y=.45;
 }
 const cheeks=material(id==='pulse'?'#4a3576':'#ff866f',.68);
 if(id==='bricko'||id==='cozy'||id==='spark')for(const s of [-1,1])ball(body,s*.54,1.17,.414,.11,.055,.026,cheeks);
 // Individual detailed clothing, hair/headgear, tools and identifying accessories.
 if(id==='bricko'){
  const cap=material('#ce252b',.81),visor=material('#b11e26',.75);
  ball(body,0,2.025,0,.68,.22,.41,cap);
  box(body,.68,.075,.50,visor,-.34,1.985,.39,.035);
  textPatch(body,'BRICKO',0,2.075,.40,.52,.14);
  for(const s of [-1,1])headphone(body,s*.52,.88,.30,'#373a44');
  path(body,[[-.53,.93,.25],[0,.83,.35],[.53,.93,.25]],.074,dark);
 }
 if(id==='rusty'){
  const bronze=material('#8b5a35',.34,.47),glass=material('#48c2fa',.18,.2,.15);
  for(const s of [-1,1]){
   ring(body,s*.33,1.91,.27,.22,.075,bronze);
   ball(body,s*.33,1.91,.315,.17,.16,.045,glass);
   for(let i=0;i<4;i++)cylinder(body,s*.33+Math.cos(i*Math.PI/2)*.24,1.91+Math.sin(i*Math.PI/2)*.24,.31,.018,.03,gold);
  }
  box(body,1.33,.19,.22,leather,0,.83,.42,.045);
  box(body,.30,.24,.13,bronze,0,.83,.55,.025);
  for(const s of [-1,1]){
   box(body,.34,.33,.20,leather,s*.49,.76,.52,.05);
   box(body,.27,.06,.22,gold,s*.49,.84,.64,.025);
  }
  for(let i=0;i<30;i++){
   const x=Math.sin(i*13.9)*.62,y=.72+(i%7)*.16;
   ball(body,x,y,.41,.018,.021,.018,leather);
  }
 }
 if(id==='pulse'){
  const e=material('#1fe8ff',.24,.3,.8),mag=material('#d23fff',.22,.2,.9);
  for(const s of [-1,1]){
   path(body,[[s*.47,1.68,.432],[s*.47,1.42,.445],[s*.30,1.23,.45],[s*.30,.77,.45]],.027,e);
   path(body,[[s*.55,.86,.44],[s*.57,1.02,.44],[s*.38,1.17,.45]],.021,mag);
   headphone(body,s*.76,1.48,0,s===1?'#ab44ff':'#29e6fa',.55);
  }
  path(body,[[-.72,1.94,0],[0,2.16,0],[.72,1.94,0]],.063,mag);
  bolt(body,0,1.06,.448,.68,e);
 }
 if(id==='calm'){
  const hoodie=material('#5b7ba0',.93);
  box(body,1.37,.65,.84,hoodie,0,.97,.012,.17);
  ball(body,0,1.87,0,.71,.29,.42,material('#91aecb',.90));
  box(body,1.50,.17,.84,material('#718eae',.94),0,1.87,0,.07);
  for(let i=0;i<16;i++){const x=-.65+i*.085;path(body,[[x,1.87,.41],[x,2.04,.38],[x,2.15,.28]],.009,material('#c4d4e2',.86))}
  for(const s of [-1,1]){
   path(body,[[s*.14,1.35,.48],[s*.14,1.13,.51]],.017,white);
   ball(body,s*.14,1.11,.52,.035,.041,.028,white);
  }
  // Petalled lotus emblem on knitted hoodie
  for(let i=0;i<5;i++){let ang=(i-2)*.55;const pet=ball(body,Math.sin(ang)*.16,.92+Math.cos(ang)*.06,.448,.09,.16,.026,white);pet.rotation.z=-ang}
 }
 if(id==='spark'){
  const sweater=material('#e6a7c9',.92);
  box(body,1.37,.70,.83,sweater,0,.92,.012,.15);
  daisy(body,0,.99,.455);glasses(body,'star',.52);
  for(const s of [-1,1]){
   for(let i=0;i<3;i++)ring(arms[s===-1?0:1],s*.12,-.35+i*.043,.03,.15,.013,material(i===1?'#e9ce46':'#7442b5'),Math.PI/2);
  }
 }
 if(id==='blocky'){
  glasses(body,'big',.49);
  const book=new T.Group();book.position.set(0,.80,.65);body.add(book);
  box(book,.48,.53,.065,material('#241f2b'),-.20,0,0,.015);
  box(book,.48,.53,.065,material('#241f2b'),.20,0,0,.015);
  box(book,.37,.46,.018,material('#ffe6bd'),-.20,0,.039,.008);
  box(book,.37,.46,.018,material('#ffe6bd'),.20,0,.039,.008);
  for(const s of [-1,1])for(let i=0;i<5;i++)
   box(book,.23,.006,.005,material('#927f67'),s*.19,-.15+i*.063,.055,.002);
  textPatch(book,'BRAIN',0,.05,.065,.41,.10,'#443a30','#fff1cd');
  box(body,1.37,.18,.78,material('#626d82'),0,.75,0,.06);
 }
 if(id==='cozy'){
  const cream=material('#ffebd6',.96);
  box(body,1.48,.62,.90,cream,0,.76,-.02,.20);
  for(let i=0;i<17;i++){
   const x=-.66+i*.084;
   ball(body,x,1.28,.38,.076,.12,.095,cream);
  }
  for(const s of [-1,1])for(let i=0;i<6;i++)
    ball(body,s*.74,.96-i*.09,.02,.09,.10,.10,cream);
  mug(body,.22,.89,.72);
  for(const s of [-1,1])for(let i=0;i<3;i++)
    ball(body,s*.35+(i-1)*.07,1.14,.49,.013,.030,.015,material('#4c303e'));
 }
 if(id==='zapp'){
  const headband=material('#18211e',.90),lightning=material('#ffdd21',.39);
  box(body,1.42,.16,.85,headband,0,1.79,0,.04);
  bolt(body,.22,1.81,.44,.55,lightning);
  bolt(body,0,.93,.45,.85,lightning);
  box(body,1.37,.13,.83,black,0,.73,.02,.05);
  for(const s of [-1,1])ball(arms[s===-1?0:1],s*.11,-.25,0,.19,.12,.21,material('#1a3022'));
 }
 if(id==='echo'){
  for(const s of [-1,1])headphone(body,s*.76,1.51,0,'#51dffe',.58);
  const purple=material('#db83fd',.26,.2,.48);
  const spiral=[];for(let i=0;i<40;i++){
   const theta=i*.40,r=.005+i*.0053;
   spiral.push([Math.cos(theta)*r,.95+Math.sin(theta)*r,.46]);
  }
  path(body,spiral,.018,purple);
  for(let i=0;i<36;i++){
   const x=Math.sin(i*11.9)*.57,y=.69+(i%9)*.11;
   ball(body,x,y,.425,.009,.012,.009,material(i%3?'#f7c7ff':'#78f3fc',.25,.15,.65));
  }
 }
 if(id==='gizmo'){
  const blue=material('#263d64',.84),brown=material('#69432d',.85),steel=material('#b3bec8',.35,.63);
  ball(body,0,2.04,0,.70,.21,.42,blue);
  box(body,.86,.07,.43,blue,0,1.985,.46,.04);
  textPatch(body,'⚙',0,2.064,.42,.22,.14,'#ffffff','#263d64');
  box(body,1.45,.17,.84,brown,0,.79,.02,.04);
  box(body,.29,.20,.13,gold,0,.80,.48,.028);
  for(const s of [-1,1]){
   box(body,.32,.35,.22,brown,s*.52,.73,.45,.05);
   box(body,.25,.08,.23,gold,s*.52,.82,.57,.025);
  }
  // A three-dimensional wrench carried in right hand.
  const tool=new T.Group();arms[1].add(tool);tool.position.set(.18,-.35,.20);tool.rotation.z=-.25;
  box(tool,.09,.57,.07,steel,0,.34,0,.018);
  ring(tool,0,.67,0,.13,.052,steel);box(tool,.15,.08,.07,steel,0,.75,0,.015);
 }
 c.eyes=eyeGroups;c.pupils=pupils;c.arms=arms;c.legs=legs;c.mouth=mouth;
 c.premium3d=true;c.premiumVersion='reference-pass-v1';
 return c;
}