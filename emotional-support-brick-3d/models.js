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
export function createCharacter(real=false){
const root=new T.Group(),body=new T.Group();root.add(body);
const surface=brickTexture(real);
const red=mat('#ffffff',real?.99:.98,{map:surface,bumpMap:surface,bumpScale:real?.075:.026});
const black=mat('#211e20'),glove=mat('#f6efe8',.45),sneaker=mat(real?'#9b733e':'#cc3e35',.55),sole=mat('#ece6de',.85);
const white=mat('#fff9f5',.12),iris=mat(real?'#292426':'#347aa2',.13),pink=mat('#e88b92',.62),mouthmat=mat('#461f25',.87);
const geo=rounded(1.82,1.13,.71,real?.065:.075);
if(real){
const pos=geo.getAttribute('position');
for(let i=0;i<pos.count;i++){
const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
const n=.008*Math.sin(x*47+y*53+z*37)*Math.cos(x*23-y*41+z*19);
const f=1+n;pos.setXYZ(i,x*f,y*f,z*f);
}
geo.computeVertexNormals();
}
const brick=object(body,geo,red,0,1.2,0);
if(real){for(let i=0;i<130;i++){const px=(random()-.5)*1.5,py=.72+random()*.96;
ellipsoid(body,px,py,.353,.007+random()*.022,.01+random()*.018,.005,mat(random()>.5?'#80432f':'#c88059'));}}
const eyes=[],arms=[],legs=[];
for(const a of [-1,1]){
const eye=new T.Group();body.add(eye);eye.position.set(a*.44,1.35,.315);eyes.push(eye);
ellipsoid(eye,0,0,0,.195,.21,.065,white);
ellipsoid(eye,a*.025,-.006,.056,.124,.144,.036,iris);
ellipsoid(eye,a*.024,-.01,.084,.093,.113,.028,black);
ellipsoid(eye,-.033,.052,.109,.042,.044,.012,white);
tube(body,[[a*.29,1.7,.37],[a*.42,1.735,.4],[a*.57,1.69,.37]],.026,black);
ellipsoid(body,a*.69,1.07,.344,.128,.07,.013,pink);
const arm=new T.Group();arm.position.set(a*.84,1.25,0);body.add(arm);arms.push(arm);
const upper=ellipsoid(arm,a*.11,-.19,.005,.095,.28,.094,black);upper.rotation.z=a*.18;
ellipsoid(arm,a*.20,-.43,.08,.145,.115,.13,glove);
ellipsoid(arm,a*.21,-.53,.145,.155,.14,.12,glove);
for(let f=0;f<4;f++)ellipsoid(arm,a*.21+(f-1.5)*.056,-.61,.18,.031,.057,.043,glove);
const thumb=ellipsoid(arm,a*.365,-.52,.19,.065,.105,.06,glove);thumb.rotation.z=-a*.55;
const leg=new T.Group();leg.position.set(a*.41,.73,0);body.add(leg);legs.push(leg);
ellipsoid(leg,0,-.20,0,.11,.28,.12,black);
ellipsoid(leg,0,-.49,.18,.22,.18,.34,sneaker);
block(leg,.48,.10,.72,sole,0,-.63,.2,.045);
ellipsoid(leg,0,-.5,.46,.2,.08,.13,real?mat('#c4a17c'):sole);
const trim=tube(leg,[[-.22,-.61,-.09],[-.22,-.62,.48],[0,-.62,.56],[.22,-.62,.48],[.22,-.61,-.09]],.014,real?mat('#503a2d'):mat('#eee2dd'));
for(let k=0;k<3;k++)tube(leg,[[-.11,-.4+k*.039,.17+k*.046],[.11,-.4+k*.039,.17+k*.046]],.011,sole);
}
const mouth=new T.Group();body.add(mouth);mouth.position.set(0,1.06,.362);
const shape=new T.Shape();shape.moveTo(-.16,.10);shape.bezierCurveTo(-.2,-.13,-.1,-.24,0,-.24);shape.bezierCurveTo(.1,-.24,.2,-.11,.16,.10);shape.quadraticCurveTo(0,.015,-.16,.10);
object(mouth,new T.ShapeGeometry(shape,20),mouthmat,0,0,.03);
ellipsoid(mouth,0,-.16,.04,.09,.04,.008,mat('#ed8589'));
const shadow=object(root,new T.CircleGeometry(.81,32),new T.MeshBasicMaterial({color:'#22201d',transparent:true,opacity:.16,depthWrite:false}),0,.025,0);shadow.rotation.x=-Math.PI/2;
return {root,body,eyes,arms,legs,mouth,real,step:0};
}
export function animateCharacter(c,t,dt,walking=false,talking=false){
c.step+=dt*(walking?9:1.5);const s=c.step;
c.body.position.y=walking?Math.abs(Math.sin(s))*.08:Math.sin(t*1.5)*.016;
c.body.rotation.z=walking?Math.sin(s)*.025:Math.sin(t*.72)*.009;
for(let i=0;i<2;i++){c.legs[i].rotation.x=walking?Math.sin(s+i*Math.PI)*.48:0;c.arms[i].rotation.x=walking?Math.sin(s+i*Math.PI+Math.PI)*.4:Math.sin(t*1.2+i)*.04;}
const blink=(t%4.6>3.92&&t%4.6<4.05)?.10:1;
for(const eye of c.eyes)eye.scale.y=T.MathUtils.lerp(eye.scale.y,blink,.28);
c.mouth.scale.y=T.MathUtils.lerp(c.mouth.scale.y,talking?(Math.sin(t*17)**2)*.8+.55:1,.22);
}