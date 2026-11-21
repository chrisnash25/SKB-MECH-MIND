import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
let rng=9310;function rand(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296}
function tex(canvas){const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
function canvas(size=512){const c=document.createElement('canvas');c.width=c.height=size;return[c,c.getContext('2d')]}
export function woodTexture(base='#79513c'){
const [c,g]=canvas(512);g.fillStyle=base;g.fillRect(0,0,512,512);
for(let i=0;i<1250;i++){
const x=rand()*512,y=rand()*512,shade=rand()>.5?'rgba(33,16,7,.10)':'rgba(255,223,172,.08)';
g.strokeStyle=shade;g.lineWidth=.25+rand()*2.3;g.beginPath();
g.moveTo(x,y);g.bezierCurveTo(x+rand()*18-9,y+45,x+rand()*20-10,y+100,x+rand()*14-7,y+180+rand()*120);g.stroke();
}
for(let i=0;i<19000;i++){g.fillStyle=rand()>.5?'rgba(255,239,205,.065)':'rgba(32,16,11,.055)';g.fillRect(rand()*512,rand()*512,.5+rand()*1.5,1+rand()*4)}
for(let k=0;k<8;k++){const x=rand()*512,y=rand()*512;g.strokeStyle='rgba(42,20,12,.20)';g.lineWidth=1.5;g.beginPath();g.ellipse(x,y,3+rand()*7,8+rand()*18,(rand()-.5)*.8,0,Math.PI*2);g.stroke()}
return tex(c)
}
export function masonryTexture(base='#975b45'){
const [c,g]=canvas(512);g.fillStyle=base;g.fillRect(0,0,512,512);
const im=g.getImageData(0,0,512,512);for(let i=0;i<im.data.length;i+=4){
const dx=(rand()-.5)*36, p=(i/4|0),x=p%512,y=(p/512)|0;
const waves=6*Math.sin(x*.05+y*.043)+4*Math.sin(y*.11+x*.009);
for(let j=0;j<3;j++)im.data[i+j]=Math.max(0,Math.min(255,im.data[i+j]+dx+waves));
}g.putImageData(im,0,0);
for(let i=0;i<5300;i++){const x=rand()*512,y=rand()*512,r=.4+rand()*3;
g.fillStyle=rand()>.56?'rgba(46,20,13,.24)':'rgba(255,214,164,.19)';
g.beginPath();g.ellipse(x,y,r,r*(.25+rand()),0,0,Math.PI*2);g.fill()}
for(let i=0;i<70;i++){
const x=rand()*512,y=rand()*512;g.strokeStyle='rgba(62,35,28,.12)';g.lineWidth=.4+rand();g.beginPath();g.moveTo(x,y);g.lineTo(x+(rand()-.5)*23,y+(rand()-.5)*25);g.stroke();
}return tex(c)
}
export function linenTexture(base='#918179'){
const [c,g]=canvas(512);g.fillStyle=base;g.fillRect(0,0,512,512);
for(let y=0;y<512;y+=2){g.fillStyle=y%4===0?'rgba(255,255,255,.085)':'rgba(0,0,0,.055)';g.fillRect(0,y,512,.8)}
for(let x=0;x<512;x+=2){g.fillStyle=x%4===0?'rgba(250,245,225,.065)':'rgba(0,0,0,.035)';g.fillRect(x,0,.8,512)}
for(let i=0;i<2600;i++){g.fillStyle=rand()>.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.05)';g.fillRect(rand()*512,rand()*512,rand()*2+1,rand()*4+2)}
return tex(c)
}
