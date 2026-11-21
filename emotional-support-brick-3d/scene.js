import * as T from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {mat,block,ellipsoid,createCharacter,animateCharacter} from './models.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';
import { woodTexture,masonryTexture,linenTexture } from './surface-textures.js';
import { createVoices } from './voices.js';
import { createActivities } from './activities.js';
const scene=new T.Scene();scene.background=new T.Color('#d2b7a0');
const camera=new T.PerspectiveCamera(50,innerWidth/innerHeight,.1,80);
const renderer=new T.WebGLRenderer({canvas:document.querySelector('#world'),antialias:true,preserveDrawingBuffer:new URLSearchParams(location.search).has('capture')});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.24;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
scene.add(new T.HemisphereLight('#fff6e7','#837467',1.75));
const sun=new T.DirectionalLight('#ffe1bd',2.8);sun.position.set(-4,8,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-9;sun.shadow.camera.right=9;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.radius=6;scene.add(sun);
const amber=new T.PointLight('#ffca8c',14,8);amber.position.set(-4,3,-4);scene.add(amber);
function fabricTexture(base){
const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
let state=71523;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
for(let i=0;i<12000;i++){const x=random()*256,y=random()*256;ctx.fillStyle=random()>.5?'#ffffff18':'#00000018';ctx.fillRect(x,y,1.8,1.8);}
const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);t.colorSpace=T.SRGBColorSpace;return t;
}
const woodMap=woodTexture('#916246'),beamMap=woodTexture('#503a2d');
const wood=mat('#ffffff',.79,{map:woodMap,bumpMap:woodMap,bumpScale:.012});
const beam=mat('#ffffff',.92,{map:beamMap,bumpMap:beamMap,bumpScale:.014});
const wall=mat('#a58a76',.94),stone=mat('#975b45');
const fabricMap=linenTexture('#7f7477'),rugMap=linenTexture('#b9a68c');
const sofa=mat('#ffffff',.99,{map:fabricMap,bumpMap:fabricMap,bumpScale:.006});
const cream=mat('#ffffff',1,{map:rugMap,bumpMap:rugMap,bumpScale:.01});
block(scene,15,.25,13,wood,0,-.2,-1);
const floorMaps=['#8b5c43','#785340','#99725a','#805a43'].map(c=>{const map=woodTexture(c);map.repeat.set(1,5);return mat('#ffffff',.82,{map,bumpMap:map,bumpScale:.01})});
for(let i=0;i<37;i++){block(scene,.38,.04,13,floorMaps[i%floorMaps.length],-7.3+i*.4,-.055,-1,.007)}

block(scene,15,7.3,.18,wall,0,3.5,-7.5);
block(scene,.22,7.3,13,wall,-7.4,3.5,-.9);
block(scene,.22,7.3,13,wall,7.4,3.5,-.9);
// Four instanced masonry materials: 4 draw calls instead of hundreds.
const colors=['#a05f49','#945542','#8b5140','#b06a52'];
const brickMaterials=colors.map(c=>{const map=masonryTexture(c);return mat('#ffffff',.99,{map,bumpMap:map,bumpScale:.025})});
const batches=colors.map((color,i)=>new T.InstancedMesh(new T.BoxGeometry(.47,.2,.12),brickMaterials[i],240));
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
const tuftGeom=new T.ConeGeometry(.008,.052,3),tuftMat=mat('#bfae92');const tufts=new T.InstancedMesh(tuftGeom,tuftMat,16000);
const o=new T.Object3D();let s=19;const rnd=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
for(let i=0;i<16000;i++){o.position.set(-2.8+rnd()*5.3,.084,-2.55+rnd()*3.9);o.rotation.set((rnd()-.5)*.4,0,(rnd()-.5)*.4);o.updateMatrix();tufts.setMatrixAt(i,o.matrix)}scene.add(tufts);
block(scene,2,.12,1.0,wood,-3.6,.7,-2,.04);
for(const x of [-4.43,-2.77])for(const z of [-2.37,-1.63])block(scene,.1,.65,.1,beam,x,.33,z);
const bag=ellipsoid(scene,1.3,.35,-1.25,1.13,.42,.97,mat('#605b61'));
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
let buddy=createCharacter(true);buddy.seated=true;buddy.root.position.set(1.3,.18,-1.2);buddy.root.rotation.y=-.3;scene.add(buddy.root);
// Production asset art pass: independently generated textured three-dimensional GLBs.
const templates={cartoon:null,realistic:null};
function dressWithModel(character,template){
if(!template)return;
if(character.model3d){character.root.remove(character.model3d);character.model3d=null;}
const model=template.clone(true);
model.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;node.frustumCulled=false;}});
const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
model.position.set(-center.x,-bounds.min.y,-center.z);
const pivot=new T.Group();pivot.add(model);
const scl=1.93/Math.max(size.x,.01);pivot.scale.setScalar(scl);
character.root.add(pivot);character.model3d=pivot;character.body.visible=false;
character.rig={};for(const part of ['body','leftArm','rightArm','leftLeg','rightLeg'])character.rig[part]=model.getObjectByName(part);
character.waveUntil=0;
}
function refreshGeneratedModels(){
if(templates[player.real?'realistic':'cartoon'])dressWithModel(player,templates[player.real?'realistic':'cartoon']);
if(templates[buddy.real?'realistic':'cartoon'])dressWithModel(buddy,templates[buddy.real?'realistic':'cartoon']);
}
const loader=new GLTFLoader();
for(const [key,file] of [['cartoon','bricko.glb'],['realistic','rusty.glb']]){
loader.load('./assets/'+file,asset=>{templates[key]=asset.scene;window.__brickModelStatus=window.__brickModelStatus||{};window.__brickModelStatus[key]={loaded:true,meshes:0};asset.scene.traverse(n=>{if(n.isMesh)window.__brickModelStatus[key].meshes++});refreshGeneratedModels();},undefined,e=>{window.__brickModelStatus=window.__brickModelStatus||{};window.__brickModelStatus[key]={loaded:false,error:String(e)};console.warn('Asset not ready; using fallback character',file,e)});
}

let yaw=0,pitch=.1,drag=false,px=0,py=0,last=performance.now(),clock=0,speakingUntil=0;
camera.position.set(-.6,2.40,4.75);camera.lookAt(-.6,1.05,1.1);
const keys={},joy=new T.Vector2(),world=document.getElementById('world'),bubble=document.getElementById('speech');
const voiceSystem=createVoices({getPlayer:()=>player,onStart:(text,duration)=>{bubble.textContent=text;speakingUntil=performance.now()+duration;},onEnd:()=>{speakingUntil=0}});
function say(text,opts={}){return voiceSystem.speak(text,opts)}
const activities=createActivities({scene,camera,canvas:world,getPlayer:()=>player,speak:key=>say(key,{key})});window.__brickActivities=activities;
function select(real){scene.remove(player.root);player=createCharacter(real);player.root.position.set(-.6,0,1.1);scene.add(player.root);
scene.remove(buddy.root);buddy=createCharacter(!real);buddy.seated=true;buddy.root.position.set(1.3,.18,-1.2);buddy.root.rotation.y=-.3;scene.add(buddy.root);
document.getElementById('name').textContent=real?'Rusty':'Bricko';activities.stop();refreshGeneratedModels();say('hello',{key:'hello'})}
function interact(){player.waveUntil=performance.now()+1250;say(player.real?'Careful, I am more than just a brick.':'That tickles! I think. Do bricks feel tickles?')}
function respond(){const input=document.getElementById('chatInput'),text=input.value.trim();if(!text)return;input.value='';const q=text.toLowerCase();
if(/feed|biscuit|hungry|eat/.test(q)){activities.feed();return}
if(/nap|sleep|tired/.test(q)){activities.sleep();return}
if(/dance|music|song/.test(q)){activities.dance();return}
if(/jenga/.test(q)){activities.jenga();return}
if(/stack|tower|building/.test(q)){activities.stack();return}
if(/memory|pairs/.test(q)){activities.memory();return}
const answer=/joke|funny/.test(q)?"I went to a party last night. I was the cornerstone of the conversation.":/sad|lonely|upset/.test(q)?"I'm sorry. Want to tell me about it, or shall we play something together?":/name|who are you/.test(q)?(player.real?"I'm Rusty, a well-weathered brick with a surprisingly big heart.":"I'm Bricko, the friendliest brick in the building!"):/hello|hey|hi/.test(q)?"Hello again! Shall we have some fun?":/how are you/.test(q)?"Quite solid, thanks for asking. That's brick humour for you.":"I heard you say "+text+". We could try a game, a dance or a biscuit.";say(answer)}
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
function animateRig(c,time,isMoving){
if(!c.rig||!c.rig.leftArm||!c.rig.rightArm||!c.rig.leftLeg||!c.rig.rightLeg)return;
const step=time*9.5;
const leftSwing=isMoving?Math.sin(step)*.55:Math.sin(time*1.1)*.045;
const rightSwing=isMoving?-Math.sin(step)*.55:Math.sin(time*1.2+1.8)*.055;
const wave=c===player&&performance.now()<c.waveUntil;
c.rig.leftArm.rotation.x=leftSwing;
c.rig.rightArm.rotation.x=rightSwing;
c.rig.leftArm.rotation.z=Math.sin(time*.9)*.028;
c.rig.rightArm.rotation.z=wave?.95+Math.sin(time*13)*.17:Math.sin(time*.85+2)*.035;
c.rig.leftLeg.rotation.x=isMoving?Math.sin(step+Math.PI)*.43:0;
c.rig.rightLeg.rotation.x=isMoving?Math.sin(step)*.43:0;
if(c.rig.body)c.rig.body.rotation.z=Math.sin(time*.75)*.012;
}

function frame(now){requestAnimationFrame(frame);const dt=Math.min(.06,(now-last)/1000);last=now;clock+=dt;
let x=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x,z=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joy.y;
const movement=new T.Vector3(x,0,z),active=movement.length()>.12;
if(active){movement.normalize().applyAxisAngle(new T.Vector3(0,1,0),yaw);player.root.position.addScaledVector(movement,dt*2);
player.root.position.x=T.MathUtils.clamp(player.root.position.x,-6,6);player.root.position.z=T.MathUtils.clamp(player.root.position.z,-4.6,4.7);
player.root.rotation.y=T.MathUtils.lerp(player.root.rotation.y,Math.atan2(movement.x,movement.z),.14)}
animateCharacter(player,clock,dt,active,now<speakingUntil);
animateCharacter(buddy,clock+1.1,dt,false,false);
animateRig(player,clock,active);animateRig(buddy,clock+1.1,false);
if(player.model3d){player.model3d.position.y=active?Math.abs(Math.sin(clock*9))*.063:Math.sin(clock*1.6)*.014;player.model3d.rotation.z=active?Math.sin(clock*9)*.025:Math.sin(clock*.6)*.012;}
if(buddy.model3d){buddy.model3d.position.y=Math.sin(clock*.9)*.012;buddy.model3d.rotation.z=Math.sin(clock*.7)*.012;}
activities.tick(now,dt);
const playMode=activities.getMode(),inGame=playMode==='jenga'||playMode==='stack'||playMode==='memory';
const target=inGame?new T.Vector3(1.4,playMode==='memory'?.40:1.15,.5):player.root.position.clone().add(new T.Vector3(0,1.05,0));
const offset=inGame?new T.Vector3(Math.sin(yaw)*3.8,2.1+pitch*2.3,Math.cos(yaw)*3.8):new T.Vector3(Math.sin(yaw)*3.65,1.15+pitch*2.3,Math.cos(yaw)*3.65);
camera.position.lerp(target.clone().add(offset),.12);camera.lookAt(target);renderer.render(scene,camera);window.__brickFrames=(window.__brickFrames||0)+1;window.__brickDrawCalls=renderer.info.render.calls;}
requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
