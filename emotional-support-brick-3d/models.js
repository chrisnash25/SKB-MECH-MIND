import * as T from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/geometries/RoundedBoxGeometry.js';
export const mat=(color,roughness=.8,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
export const rounded=(w,h,d,r=.07)=>new RoundedBoxGeometry(w,h,d,7,r);
export function object(parent,geometry,material,x=0,y=0,z=0){
const a=new T.Mesh(geometry,material);a.castShadow=true;a.receiveShadow=true;a.position.set(x,y,z);parent.add(a);return a;
}
export function block(parent,w,h,d,material,x,y,z,r=.04){return object(parent,rounded(w,h,d,r),material,x,y,z)}
export function ellipsoid(parent,x,y,z,sx,sy,sz,material){
const a=object(parent,new T.SphereGeometry(1,24,16),material,x,y,z);a.scale.set(sx,sy,sz);return a;
}
export function tube(parent,coords,radius,material){const curve=new T.CatmullRomCurve3(coords.map(p=>new T.Vector3(...p)));return object(parent,new T.TubeGeometry(curve,20,radius,8,false),material)}
let seed=8371;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
export function brickTexture(real){
const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
const ctx=canvas.getContext('2d');ctx.fillStyle=real?'#984a32':'#c95b3e';ctx.fillRect(0,0,512,512);
const img=ctx.getImageData(0,0,512,512),d=img.data;
for(let y=0;y<512;y++)for(let x=0;x<512;x++){
const i=(y*512+x)*4;const noise=(random()-.5)*(real?72:34)+Math.sin(x*.018)*Math.sin(y*.019)*8;
d[i]=Math.max(0,Math.min(255,d[i]+noise));d[i+1]=Math.max(0,Math.min(255,d[i+1]+noise));d[i+2]=Math.max(0,Math.min(255,d[i+2]+noise));
}ctx.putImageData(img,0,0);
for(let i=0;i<(real?5100:1700);i++){const x=random()*512,y=random()*512,r=(real?2.8:1.1)*random()+.5;ctx.fillStyle=random()>.4?'#86402f73':'#f7a77a59';ctx.beginPath();ctx.ellipse(x,y,r,r*.7,0,0,Math.PI*2);ctx.fill()}
const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;return tex;
}
export const BRICK_CAST=[
 {id:'bricko',name:'Bricko',color:'#df4536',style:'cap',trait:'Friendly leader'},
 {id:'rusty',name:'Rusty',color:'#a95a36',style:'goggles',trait:'Witty inventor'},
 {id:'pulse',name:'Pulse',color:'#262b52',style:'neon',trait:'Music lover'},
 {id:'calm',name:'Calm',color:'#77b7dd',style:'beanie',trait:'Chill companion'},
 {id:'spark',name:'Spark',color:'#f4ba3f',style:'stars',trait:'Cheerful entertainer'},
 {id:'blocky',name:'Blocky',color:'#8f9194',style:'glasses',trait:'Curious thinker'},
 {id:'cozy',name:'Cozy',color:'#e98aa9',style:'scarf',trait:'Caring friend'},
 {id:'zapp',name:'Zapp',color:'#81c52b',style:'band',trait:'Energetic athlete'},
 {id:'echo',name:'Echo',color:'#8c57ca',style:'space',trait:'Thoughtful dreamer'},
 {id:'gizmo',name:'Gizmo',color:'#e98737',style:'tools',trait:'Helpful builder'}
];
export function createCharacter(identity='bricko'){
 const cfg=BRICK_CAST.find(c=>c.id===identity)||BRICK_CAST[0];
 const root=new T.Group(),body=new T.Group();root.add(body);
 const shell=mat(cfg.color,.48,{metalness:cfg.style==='neon'?.24:.035});
 const dark=mat('#26212b',.65),white=mat('#fff9ef',.26),iris=mat(cfg.id==='calm'?'#4b769c':'#383344',.2),glove=mat('#f7e7d7',.5);
 const sneaker=mat(cfg.style==='space'?'#392d61':'#373441',.55);
 block(body,1.72,1.25,.77,shell,0,1.22,0,.17);
 // Embossed studs keep the body unmistakably brick-shaped.
 for(const x of [-.49,0,.49]){
 const stud=object(body,new T.CylinderGeometry(.21,.21,.11,24),shell,x,1.89,0);
 stud.castShadow=true;
 }
 const eyes=[],pupils=[],arms=[],legs=[];
 for(const sign of [-1,1]){
  const eye=new T.Group();eye.position.set(sign*.4,1.39,.40);body.add(eye);eyes.push(eye);
  ellipsoid(eye,0,0,0,.195,.20,.05,white);
  const pupil=new T.Group();eye.add(pupil);pupils.push(pupil);
  ellipsoid(pupil,0,-.018,.048,.108,.12,.034,iris);
  ellipsoid(pupil,-.03,.047,.075,.038,.045,.012,white);
  const arm=new T.Group();arm.position.set(sign*.87,1.38,0);body.add(arm);arms.push(arm);
  ellipsoid(arm,sign*.07,-.22,0,.125,.29,.13,shell);
  ellipsoid(arm,sign*.10,-.48,.04,.17,.16,.15,glove);
  const leg=new T.Group();leg.position.set(sign*.39,.68,0);body.add(leg);legs.push(leg);
  ellipsoid(leg,0,-.2,0,.14,.24,.14,dark);
  ellipsoid(leg,0,-.46,.17,.24,.17,.34,sneaker);
  block(leg,.50,.09,.68,white,0,-.57,.18,.04);
 }
 const mouth=new T.Group();mouth.position.set(0,1.03,.415);body.add(mouth);
 ellipsoid(mouth,0,0,0,.21,.075,.025,dark);
 ellipsoid(mouth,0,-.035,.025,.115,.026,.015,mat('#df8290'));
 const accessories=new T.Group();body.add(accessories);
 const cloth=mat(cfg.id==='cozy'?'#f6d5c3':'#343650',.9),accent=mat(cfg.id==='pulse'?'#3fe8fc':'#f4e6d7',.45);
 const cap=(color)=>{const m=mat(color,.8);block(accessories,1.6,.18,.8,m,0,1.97,0,.09);block(accessories,.85,.07,.53,m,0,1.94,.52,.045)};
 if(cfg.style==='cap')cap('#b92e2c');
 if(cfg.style==='tools'){cap('#31354c');block(accessories,.8,.16,.12,cloth,0,.78,.43,.04)}
 if(cfg.style==='goggles'){
  for(const x of [-.38,.38]){const g=object(accessories,new T.TorusGeometry(.24,.065,10,28),dark,x,1.94,.38);g.rotation.x=0;ellipsoid(accessories,x,1.94,.37,.16,.14,.03,mat('#70c4d7',.19,{metalness:.28}));}
 }
 if(cfg.style==='glasses')for(const x of [-.4,.4]){const g=object(accessories,new T.TorusGeometry(.21,.045,8,28),dark,x,1.39,.49);g.scale.y=.8}
 if(cfg.style==='beanie'){ellipsoid(accessories,0,1.96,0,.87,.26,.48,cloth);block(accessories,1.73,.16,.85,cloth,0,1.88,0,.06)}
 if(cfg.style==='scarf'){block(accessories,1.58,.18,.87,cloth,0,.77,0,.09);block(accessories,.21,.5,.12,cloth,.48,.51,.47,.04)}
 if(cfg.style==='band'){block(accessories,1.72,.18,.8,dark,0,1.76,0,.045);block(accessories,.18,.14,.06,accent,0,1.77,.44,.025)}
 if(cfg.style==='neon'||cfg.style==='space'){
  for(const x of [-.89,.89])ellipsoid(accessories,x,1.48,0,.17,.34,.27,mat(cfg.style==='neon'?'#794fe1':'#7e91dd',.3,{emissive:cfg.style==='neon'?'#271456':'#100a24',emissiveIntensity:.35}));
  if(cfg.style==='space')ellipsoid(accessories,0,.93,.43,.29,.24,.018,mat('#ad82f3',.28,{emissive:'#37155c',emissiveIntensity:.5}));
 }
 if(cfg.style==='stars')for(const x of [-.4,.4])ellipsoid(accessories,x,1.4,.48,.27,.22,.025,dark);
 const shadow=object(root,new T.CircleGeometry(.8,28),new T.MeshBasicMaterial({color:'#221b1c',transparent:true,opacity:.15,depthWrite:false}),0,.026,0);shadow.rotation.x=-Math.PI/2;
 return {root,body,eyes,pupils,arms,legs,mouth,real:cfg.id==='rusty',id:cfg.id,name:cfg.name,step:0};
}
export function animateCharacter(c,t,dt,walking=false,talking=false){
c.step+=dt*(walking?6.8:1.5);const s=c.step;
c.body.position.y=walking?Math.abs(Math.sin(s))*.028:Math.sin(t*1.5)*.009;
c.body.rotation.z=walking?Math.sin(s)*.009:Math.sin(t*.72)*.004;
for(let i=0;i<2;i++){
c.legs[i].rotation.x=T.MathUtils.damp(c.legs[i].rotation.x,c.seated?-1.08:(walking?Math.sin(s+i*Math.PI)*.31:0),11,dt);
c.arms[i].rotation.x=T.MathUtils.damp(c.arms[i].rotation.x,c.seated?-.30:(walking?Math.sin(s+i*Math.PI+Math.PI)*.15:Math.sin(t*1.2+i)*.025),11,dt);
}
const blink=(t%4.6>3.92&&t%4.6<4.05)?.10:1;
for(const eye of c.eyes)eye.scale.y=T.MathUtils.damp(eye.scale.y,blink,18,dt);
// A shared, occasional glance makes the eyes feel alive without constant darting.
const gazeX=Math.sin(t*.72+Math.sin(t*.19))*.055,gazeY=Math.sin(t*.48)*.023;
for(const pupil of c.pupils||[]){pupil.position.x=T.MathUtils.damp(pupil.position.x,gazeX,4,dt);pupil.position.y=T.MathUtils.damp(pupil.position.y,gazeY,4,dt)}
c.mouth.scale.y=T.MathUtils.damp(c.mouth.scale.y,talking?.55+Math.abs(Math.sin(t*12.8))*.8:.8,14,dt);
}