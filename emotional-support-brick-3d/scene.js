import * as T from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {mat,block,ellipsoid,createCharacter,animateCharacter} from './models.js';
const scene=new T.Scene();scene.background=new T.Color('#d2b7a0');
const camera=new T.PerspectiveCamera(59,innerWidth/innerHeight,.1,80);
const renderer=new T.WebGLRenderer({canvas:document.querySelector('#world'),antialias:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
scene.add(new T.HemisphereLight('#fff5e7','#837467',2.2));
const sun=new T.DirectionalLight('#ffddb5',3.5);sun.position.set(-4,8,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-9;sun.shadow.camera.right=9;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.radius=4;scene.add(sun);
const amber=new T.PointLight('#ffca8c',30,8);amber.position.set(-4,3,-4);scene.add(amber);
const wood=mat('#795742'),beam=mat('#51372b'),wall=mat('#a99282'),stone=mat('#975b45'),sofa=mat('#70696f'),cream=mat('#c6b69f');
block(scene,15,.25,13,wood,0,-.2,-1);
for(let i=0;i<37;i++){const color=mat(new T.Color().setHSL(.07,.2,.31+(i%7)*.013));block(scene,.38,.04,13,color,-7.3+i*.4,-.055,-1,.005)}
block(scene,15,7.3,.18,wall,0,3.5,-7.5);
block(scene,.22,7.3,13,wall,-7.4,3.5,-.9);
block(scene,.22,7.3,13,wall,7.4,3.5,-.9);
// Four instanced masonry materials: 4 draw calls instead of hundreds.
const colors=['#a05f49','#945542','#8b5140','#b06a52'];
const batches=colors.map(color=>new T.InstancedMesh(new T.BoxGeometry(.47,.2,.12),mat(color),240));
const counts=[0,0,0,0],pose=new T.Object3D();
for(let row=0;row<30;row++)for(let col=0;col<30;col++){
const x=-7.1+col*.49+(row%2)*.2,y=.18+row*.225;
if(x>1&&x<6&&y>2&&y<5.8)continue;
const index=(row+col)%4;
pose.position.set(x,y,-7.35);pose.updateMatrix();
batches[index].setMatrixAt(counts[index]++,pose.matrix);
}
batches.forEach((batch,i)=>{batch.count=counts[i];batch.receiveShadow=true;batch.instanceMatrix.needsUpdate=true;scene.add(batch)});
const sky=document.createElement('canvas');sky.width=512;sky.height=512;const ctx=sky.getContext('2d');
const grad=ctx.createLinearGradient(0,0,0,512);grad.addColorStop(0,'#8ca3b2');grad.addColorStop(.5,'#eac29f');grad.addColorStop(1,'#657b66');ctx.fillStyle=grad;ctx.fillRect(0,0,512,512);
ctx.fillStyle='#fff2b8';ctx.beginPath();ctx.arc(355,260,40,0,Math.PI*2);ctx.fill();
for(let i=0;i<3;i++){ctx.fillStyle=['#b3a293','#90927a','#64745e'][i];ctx.beginPath();ctx.moveTo(0,350+i*50);for(let x=0;x<512;x+=16)ctx.lineTo(x,350+i*50+Math.sin(x*.018+i)*19);ctx.lineTo(512,512);ctx.lineTo(0,512);ctx.fill()}
const sk=new T.CanvasTexture(sky);sk.colorSpace=T.SRGBColorSpace;
const view=new T.Mesh(new T.PlaneGeometry(4.7,3.7),new T.MeshBasicMaterial({map:sk}));view.position.set(3.5,4,-7.17);scene.add(view);
for(const x of [1.1,3.5,5.9])block(scene,.14,3.9,.22,beam,x,3.95,-7.05);
for(const y of [2.1,4,5.86])block(scene,5,.14,.22,beam,3.5,y,-7.05);
block(scene,5.3,.18,.62,wood,3.5,2,-6.78);
block(scene,4,.7,1.7,sofa,3.7,.5,-4.7,.19);
block(scene,4,1.35,.4,sofa,3.7,1.25,-5.45,.16);
for(const x of [1.88,5.52])block(scene,.4,1.08,1.65,sofa,x,.85,-4.7,.15);
for(let i=-1;i<=1;i++)block(scene,1.05,.2,1.2,mat(i===0?'#9d8c8b':'#8d8182'),3.7+i*1.17,.96,-4.58,.1);
for(let i=0;i<5;i++)block(scene,2.5,.11,.56,wood,-5.5,.5+i*.68,-6.75);
for(const x of [-6.75,-4.25])block(scene,.13,3.4,.6,beam,x,1.78,-6.75);
for(let row=0;row<4;row++)for(let i=0;i<11;i++){const x=-6.63+i*.2;block(scene,.13,.37+(i%3)*.06,.32,mat(['#847360','#ad8772','#64756b','#756d78'][i%4]),x,.76+row*.68,-6.7,.01)}
const carpet=block(scene,5.5,.09,4.1,cream,-.2,.03,-.55,.12);
const tuftGeom=new T.ConeGeometry(.012,.11,3),tuftMat=mat('#d3c3a7');const tufts=new T.InstancedMesh(tuftGeom,tuftMat,3200);
const o=new T.Object3D();let s=19;const rnd=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
for(let i=0;i<3200;i++){o.position.set(-2.8+rnd()*5.3,.105,-2.55+rnd()*3.9);o.rotation.set((rnd()-.5)*.4,0,(rnd()-.5)*.4);o.updateMatrix();tufts.setMatrixAt(i,o.matrix)}scene.add(tufts);
block(scene,2,.12,1.0,wood,-3.6,.7,-2,.04);
for(const x of [-4.43,-2.77])for(const z of [-2.37,-1.63])block(scene,.1,.65,.1,beam,x,.33,z);
const bag=ellipsoid(scene,2,.35,-1.48,1.13,.42,.97,mat('#605b61'));
// Living-room dressing: dimensional plants, throws, ceramics, and a sleeping cat.
const leafDark=mat('#3f6345'),leafMid=mat('#5f8155'),leafLight=mat('#789063');
let plantSeed=2781;const randomLeaf=()=>((plantSeed=(Math.imul(plantSeed,1664525)+1013904223)>>>0)/4294967296);
function plant(x,y,z,scale=1){
block(scene,.42*scale,.38*scale,.42*scale,mat('#a77d61'),x,y,z,.065);
for(let k=0;k<19;k++){
const angle=k*2.4,extent=(.25+randomLeaf()*.42)*scale,high=(.48+randomLeaf()*.82)*scale;
const start=new T.Vector3(x,y+.16*scale,z);
const end=new T.Vector3(x+Math.cos(angle)*extent,y+high,z+Math.sin(angle)*extent);
const stem=new T.Mesh(new T.CylinderGeometry(.007*scale,.013*scale,start.distanceTo(end),7),mat('#496044'));
stem.position.copy(start).add(end).multiplyScalar(.5);stem.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.clone().sub(start).normalize());scene.add(stem);
const f=ellipsoid(scene,end.x,end.y,end.z,.18*scale,.044*scale,.1*scale,[leafDark,leafMid,leafLight][k%3]);f.rotation.y=angle;f.rotation.z=(randomLeaf()-.5)*.7;
}}
plant(-3.7,.45,-5.5,1.2);plant(6.55,.35,-3.85,1.3);plant(-4.35,3.32,-6.45,.58);
block(scene,.7,.62,.16,mat('#a17660'),4.75,1.39,-5.2,.12).rotation.z=-.13;
block(scene,.7,.59,.16,mat('#a2a49b'),2.6,1.38,-5.2,.12).rotation.z=.11;
const mug=mat('#e9d8c4');const cup=new T.Mesh(new T.CylinderGeometry(.13,.12,.25,28),mug);cup.position.set(-3.95,.9,-1.81);cup.castShadow=true;scene.add(cup);
const handle=new T.Mesh(new T.TorusGeometry(.08,.021,7,20,Math.PI*1.7),mug);handle.rotation.y=Math.PI/2;handle.position.set(-3.8,.9,-1.81);scene.add(handle);
const tableCookie=new T.Mesh(new T.CylinderGeometry(.18,.18,.035,24),mat('#b58d62'));tableCookie.position.set(-3.28,.78,-1.76);scene.add(tableCookie);
const lampShade=new T.Mesh(new T.CylinderGeometry(.30,.42,.58,24,1,true),mat('#e0c4a1',.92,{side:T.DoubleSide}));lampShade.position.set(-3.8,2.85,-5.45);scene.add(lampShade);
block(scene,.05,1.2,.05,beam,-3.8,2.21,-5.45);
block(scene,.39,.06,.39,beam,-3.8,1.58,-5.45);
const catFur=mat('#77634f'),catStripes=mat('#514a40'),catPink=mat('#bc8d7a');
ellipsoid(scene,5.0,1.34,-5.0,.55,.19,.37,catFur);
ellipsoid(scene,4.64,1.4,-4.9,.19,.17,.18,catFur);
for(const x of [4.54,4.74]){const ear=new T.Mesh(new T.ConeGeometry(.095,.20,3),catFur);ear.position.set(x,1.61,-4.9);ear.rotation.y=.3;scene.add(ear)}
for(let i=0;i<4;i++){const stripe=ellipsoid(scene,4.81+i*.16,1.51,-5.03,.045,.012,.19,catStripes);stripe.rotation.z=.15}
ellipsoid(scene,4.62,1.41,-4.71,.07,.014,.012,catPink);

let player=createCharacter(false);player.root.position.set(-.6,0,1.1);scene.add(player.root);
const buddy=createCharacter(true);buddy.root.position.set(2,0,-1.4);buddy.root.rotation.y=-.3;scene.add(buddy.root);
let yaw=0,pitch=.1,drag=false,px=0,py=0,last=performance.now(),clock=0,speakingUntil=0;
const keys={},joy=new T.Vector2(),world=document.getElementById('world'),bubble=document.getElementById('speech');
function say(text){bubble.textContent=text;if('speechSynthesis'in window){speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(text);utter.lang='en-GB';utter.pitch=player.real?.8:1.15;utter.rate=player.real?.85:1.05;speakingUntil=performance.now()+text.length*65;speechSynthesis.speak(utter)}}
function select(real){scene.remove(player.root);player=createCharacter(real);player.root.position.set(-.6,0,1.1);scene.add(player.root);document.getElementById('name').textContent=real?'Rusty':'Bricko';bubble.textContent='Hello! Good to see you!'}
function interact(){say(player.real?'Careful, I am more than just a brick.':'That tickles! I think. Do bricks feel tickles?')}
function respond(){const input=document.getElementById('chatInput'),text=input.value.trim();if(!text)return;input.value='';const q=text.toLowerCase();say(q.includes('joke')?'What does a brick eat? Nothing. We have no mouths really.':q.includes('sad')?'I am here with you. Want to talk about it?':'I heard you say '+text+'. I am still learning how to chat.')}
document.getElementById('cartoon').onclick=()=>select(false);
document.getElementById('realistic').onclick=()=>select(true);
document.getElementById('interact').onclick=interact;
document.getElementById('chatButton').onclick=()=>{const c=document.getElementById('chat');c.hidden=!c.hidden};
document.getElementById('send').onclick=respond;
document.getElementById('chatInput').onkeydown=e=>{if(e.key==='Enter')respond()};
document.getElementById('mic').onclick=()=>{const Rec=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Rec){bubble.textContent='Microphone recognition is unavailable on this browser.';return}const rec=new Rec();rec.lang='en-GB';rec.onresult=e=>{document.getElementById('chatInput').value=e.results[0][0].transcript;respond()};rec.onerror=()=>bubble.textContent='Microphone unavailable. Try typing.';rec.start()};
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.code]=true;if(e.code==='KeyE')interact()});
addEventListener('keyup',e=>keys[e.code]=false);
world.addEventListener('pointerdown',e=>{drag=true;px=e.clientX;py=e.clientY;world.setPointerCapture(e.pointerId)});
world.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-px)*.004;pitch=T.MathUtils.clamp(pitch+(e.clientY-py)*.003,-.2,.55);px=e.clientX;py=e.clientY});
world.addEventListener('pointerup',()=>drag=false);
const stick=document.getElementById('stick'),nub=document.getElementById('nub');let pointer=null;
stick.addEventListener('pointerdown',e=>{pointer=e.pointerId;stick.setPointerCapture(pointer);moveStick(e)});
stick.addEventListener('pointermove',e=>{if(pointer===e.pointerId)moveStick(e)});
function moveStick(e){const r=stick.getBoundingClientRect();joy.set(T.MathUtils.clamp((e.clientX-r.left-r.width/2)/44,-1,1),T.MathUtils.clamp((e.clientY-r.top-r.height/2)/44,-1,1));nub.style.transform='translate('+joy.x*32+'px,'+joy.y*32+'px)'}
stick.addEventListener('pointerup',()=>{pointer=null;joy.set(0,0);nub.style.transform=''});
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.06,(now-last)/1000);last=now;clock+=dt;
let x=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x,z=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joy.y;
const movement=new T.Vector3(x,0,z),active=movement.length()>.12;
if(active){movement.normalize().applyAxisAngle(new T.Vector3(0,1,0),yaw);player.root.position.addScaledVector(movement,dt*2);
player.root.position.x=T.MathUtils.clamp(player.root.position.x,-6,6);player.root.position.z=T.MathUtils.clamp(player.root.position.z,-4.6,4.7);
player.root.rotation.y=T.MathUtils.lerp(player.root.rotation.y,Math.atan2(movement.x,movement.z),.14)}
animateCharacter(player,clock,dt,active,now<speakingUntil);
animateCharacter(buddy,clock+1.1,dt,false,false);
const target=player.root.position.clone().add(new T.Vector3(0,1.05,0));
camera.position.lerp(target.clone().add(new T.Vector3(Math.sin(yaw)*4.4,2.3+pitch*3,Math.cos(yaw)*4.4)),.08);camera.lookAt(target);renderer.render(scene,camera)}
requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
