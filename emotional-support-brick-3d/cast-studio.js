import * as T from 'three';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import {GLTFExporter} from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/exporters/GLTFExporter.js';
import {createCharacter,BRICK_CAST} from './models.js';
import {upgradeCharacter} from './premium-cast.js';

const select=document.getElementById('character'),button=document.getElementById('download');
const state=document.getElementById('state'),host=document.getElementById('viewport');
for(const c of BRICK_CAST){const o=document.createElement('option');o.value=c.id;o.textContent=c.name;select.append(o)}
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.30;renderer.shadowMap.enabled=true;
host.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#191a30');
scene.add(new T.HemisphereLight('#f5f2ff','#68525c',2.1));
const key=new T.DirectionalLight('#fff5df',3.2);key.position.set(-2,5,5);scene.add(key);
const rim=new T.DirectionalLight('#a06aff',2.0);rim.position.set(3,3,-3);scene.add(rim);
const floor=new T.Mesh(new T.CircleGeometry(1.55,64),new T.MeshStandardMaterial({color:'#3e3762',roughness:.72}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.02;scene.add(floor);
const camera=new T.PerspectiveCamera(37,1,.1,40);camera.position.set(2.2,2.15,4.5);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.15,0);
orbit.enableDamping=true;orbit.minDistance=2.5;orbit.maxDistance=9;
function resize(){let w=host.clientWidth,h=host.clientHeight;if(w<1||h<1)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
addEventListener('resize',resize);resize();
let current=null,phase=0;
function view(id){if(current)scene.remove(current.root);current=upgradeCharacter(createCharacter(id));current.body.name='mainBody';current.root.name='Character_'+id;current.root.position.set(0,0,0);scene.add(current.root);state.textContent=BRICK_CAST.find(c=>c.id===id).name+' — detailed 3D preview ready';}
select.addEventListener('change',()=>view(select.value));
function quats(values){
 const out=[];for(const x of values){const q=new T.Quaternion().setFromEuler(new T.Euler(x,0,0));out.push(q.x,q.y,q.z,q.w)}
 return out;
}
function clip(name,poses,duration){
 const tracks=[],times=poses.map((_,i)=>i*duration/(poses.length-1));
 for(const [key,node] of [['leftArm',current.arms[0]],['rightArm',current.arms[1]],['leftLeg',current.legs[0]],['rightLeg',current.legs[1]]]){
  node.name=key;
  const vals=poses.map(p=>p[key]||0);
  tracks.push(new T.QuaternionKeyframeTrack(key+'.quaternion',times,quats(vals)));
 }
 return new T.AnimationClip(name,duration,tracks);
}
function animationClips(){
 current.mouth.name='mouth';
 return [
  clip('Idle',[{}, {leftArm:.06,rightArm:-.06},{}],2),
  clip('Walk',[
   {leftArm:.25,rightArm:-.25,leftLeg:-.36,rightLeg:.36},
   {leftArm:-.25,rightArm:.25,leftLeg:.36,rightLeg:-.36},
   {leftArm:.25,rightArm:-.25,leftLeg:-.36,rightLeg:.36}
  ],1),
  clip('Wave',[{}, {rightArm:-1.15},{rightArm:-.75},{rightArm:-1.15},{}],1.8),
  clip('Cheer',[{}, {leftArm:-.8,rightArm:-.8},{}],1.3)
 ];
}
async function exportModel(){
 button.disabled=true;state.textContent='Exporting animated 3D '+current.name+'…';
 try{
  const exporter=new GLTFExporter();
  const result=await new Promise((resolve,reject)=>exporter.parse(current.body,resolve,reject,{
   binary:true,animations:animationClips(),onlyVisible:true,trs:true,
   includeCustomExtensions:false,maxTextureSize:1024
  }));
  if(!(result instanceof ArrayBuffer)||result.byteLength<10000)throw Error('GLB was empty or incomplete');
  const blob=new Blob([result],{type:'model/gltf-binary'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=current.id+'-animated.glb';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),15000);
  state.textContent=current.name+' animated GLB ready ('+Math.round(blob.size/1024)+' KB)';
 }catch(err){state.textContent='Export failed: '+String(err.message||err);throw err}
 finally{button.disabled=false}
}
button.addEventListener('click',()=>exportModel().catch(console.error));
function frame(){requestAnimationFrame(frame);phase+=.012;
 if(current){current.body.position.y=Math.sin(phase)*.016;
  for(let i=0;i<2;i++){current.arms[i].rotation.x=Math.sin(phase*1.5+i*3.14)*.045;current.legs[i].rotation.x=0}
  current.mouth.scale.y=.9;
 }
 orbit.update();renderer.render(scene,camera);}
view('bricko');window.__studioReady=true;frame();