import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';
const canvas=document.getElementById('supportAvatar');
if(canvas){
 let renderer=null,model=null,rig=null,scene=null,camera=null,current='',speakingUntil=0,rotation=0;
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(170,170,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
  scene=new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff4e5,0x776a64,2.5));
  const light=new THREE.DirectionalLight(0xffe2bc,3.4);light.position.set(-3,6,4);scene.add(light);
  camera=new THREE.PerspectiveCamera(40,1,.1,40);
  camera.position.set(0,1.38,3.6);
  camera.lookAt(0,1.25,0);
  const loader=new GLTFLoader();
  function load(which){
   if(which===current)return;current=which;const file=which==='rusty'?'rusty.glb':'bricko.glb';
   loader.load('./assets/'+file,({scene:raw})=>{
     if(which!==current)return;
     if(model)scene.remove(model);
     const bb=new THREE.Box3().setFromObject(raw),size=bb.getSize(new THREE.Vector3()),center=bb.getCenter(new THREE.Vector3());
     raw.position.set(-center.x,-bb.min.y,-center.z);model=new THREE.Group();model.add(raw);
     model.scale.setScalar(2/Math.max(size.x,.01));model.position.y=.2;scene.add(model);
     rig={};for(const part of ['leftArm','rightArm','leftLeg','rightLeg','body'])rig[part]=raw.getObjectByName(part);
     raw.traverse(n=>{if(n.isMesh)n.frustumCulled=false});
     document.documentElement.dataset.avatarLoaded=which;
   },undefined,()=>{document.documentElement.dataset.avatarLoaded='fallback'});
  }
  window.addEventListener('brickchange',e=>load(e.detail?.rusty?'rusty':'bricko'));
  load(sessionStorage.getItem('esb-character')==='rusty'?'rusty':'bricko');
  window.__supportAvatarSpeak=ms=>{speakingUntil=performance.now()+ms};
  canvas.addEventListener('pointerdown',()=>{rotation+=.55});
  function frame(time){
    requestAnimationFrame(frame);
    if(document.hidden)return;
    const t=time*.001,spoken=performance.now()<speakingUntil;
    if(model){model.rotation.y=THREE.MathUtils.lerp(model.rotation.y,rotation+Math.sin(t*.33)*.07,.045);
      model.rotation.z=Math.sin(t*.8)*.018+(spoken?Math.sin(t*12)*.012:0);
      model.position.y=.19+Math.sin(t*1.6)*.014;
      if(rig){
        if(rig.leftArm)rig.leftArm.rotation.x=Math.sin(t*1.2)*.06;
        if(rig.rightArm){rig.rightArm.rotation.x=Math.sin(t*1.3+2)*.06;rig.rightArm.rotation.z=spoken?Math.sin(t*6)*.18:.01}
        if(rig.body)rig.body.rotation.z=Math.sin(t*.8)*.008;
      }
    }
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
 }catch(e){canvas.style.display='none';const fallback=document.getElementById('portrait');if(fallback)fallback.style.display='block';console.warn('3D portrait unavailable',e)}
}
