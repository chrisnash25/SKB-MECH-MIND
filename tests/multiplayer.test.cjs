// Simulated TWO-BROWSER gameplay test. Uses an in-memory Firebase mock,
// not a live Firebase project. Production still needs Auth, Firestore and rules.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const files = {
  '/': {type:'text/html', body: fs.readFileSync(path.join(__dirname, '../index.html'))},
  '/multiplayer.js': {type:'application/javascript', body: fs.readFileSync(path.join(__dirname, '../multiplayer.js'))}
};
const docs = new Map();
const appMock = 'export function initializeApp(config){return {config}}';
const authMock = String.raw`let instance;
export function getAuth(){
  if (!instance) instance={currentUser:null};
  return instance;
}
export async function signInAnonymously(auth){
  if (!auth.currentUser) {
    let uid=sessionStorage.getItem('mockFirebaseUid');
    if (!uid){uid='test_'+Math.random().toString(36).slice(2);sessionStorage.setItem('mockFirebaseUid',uid)}
    auth.currentUser={uid};
  }
  return {user:auth.currentUser};
}`;
const firestoreMock = String.raw`export function getFirestore(){return {}}
export function doc(db,...segments){return {path:segments.join('/'),type:'doc'}}
export function collection(db,...segments){return {path:segments.join('/'),type:'collection'}}
export function serverTimestamp(){return {__timestamp:Date.now()}}
export const Timestamp={fromMillis(ms){return {__timestamp:ms}}};
function hydrate(v){
  if (v === null || typeof v !== 'object') return v;
  if (typeof v.__timestamp === 'number') return {toMillis:()=>v.__timestamp};
  if (Array.isArray(v)) return v.map(hydrate);
  return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,hydrate(x)]));
}
async function remote(ref){
  let target=ref.type==='doc'?'doc':'collection';
  let response=await fetch('/mock/'+target+'?path='+encodeURIComponent(ref.path));
  if(!response.ok) throw Error('Mock backend unavailable');
  let data=await response.json();
  if(target==='doc') return {exists:()=>data.exists,data:()=>hydrate(data.data)};
  return {docs:data.docs.map(d=>({id:d.id,data:()=>hydrate(d.data)}))};
}
export const getDoc=remote;
async function write(ref,data,patch=false){
  let response=await fetch('/mock/write',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({path:ref.path,data,patch})});
  if(!response.ok)throw Error('Mock write failed');
}
export function setDoc(ref,data){return write(ref,data)}
export async function runTransaction(db, callback){
  let queued=[];
  let result=await callback({get:remote,update:(ref,data)=>queued.push([ref,data])});
  for(const [ref,data] of queued)await write(ref,data,true);
  return result;
}
export function onSnapshot(ref,callback,onError){
  let stopped=false,previous='';
  async function poll(){
    try {
      let response=await fetch('/mock/'+(ref.type==='doc'?'doc':'collection')+'?path='+encodeURIComponent(ref.path));
      let raw=await response.text();
      if(!stopped&&raw!==previous) {
        previous=raw;
        let data=JSON.parse(raw);
        callback(ref.type==='doc'?{exists:()=>data.exists,data:()=>hydrate(data.data)}:
          {docs:data.docs.map(d=>({id:d.id,data:()=>hydrate(d.data)}))});
      }
    } catch(err){if(!stopped&&onError)onError(err)}
  }
  poll();
  const interval=setInterval(poll,90);
  return ()=>{stopped=true;clearInterval(interval)};
}`;
const mockModules = {
  'firebase-app.js':appMock,
  'firebase-auth.js':authMock,
  'firebase-firestore.js':firestoreMock
};
function json(res, data) {
  res.writeHead(200, {'content-type':'application/json', 'access-control-allow-origin':'*'});
  res.end(JSON.stringify(data));
}
const server = http.createServer((req,res)=>{
  const url=new URL(req.url, 'http://localhost');
  if(req.method==='GET'&&files[url.pathname]){
    res.writeHead(200,{'content-type':files[url.pathname].type});
    return res.end(files[url.pathname].body);
  }
  const key=url.searchParams.get('path');
  if(req.method==='GET'&&url.pathname==='/mock/doc'){
    return json(res,{exists:docs.has(key),data:docs.get(key)});
  }
  if(req.method==='GET'&&url.pathname==='/mock/collection'){
    return json(res,{docs:[...docs.entries()].filter(([p])=>
      p.startsWith(key+'/')&&!p.slice(key.length+1).includes('/')).map(([p,data])=>({id:p.split('/').at(-1),data}))});
  }
  if(req.method==='POST'&&url.pathname==='/mock/write'){
    let chunks=[];
    req.on('data',c=>chunks.push(c));
    req.on('end',()=>{
      const {path:p,data,patch}=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      docs.set(p,patch?{...docs.get(p),...data}:data);
      json(res,{ok:true});
    });
    return;
  }
  res.writeHead(404);res.end('Not found');
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_BIN});
  const hostContext=await browser.newContext();
  const guestContext=await browser.newContext();
  const host=await hostContext.newPage();
  const guest=await guestContext.newPage();
  const errors=[];
  for (const p of [host,guest]) {
    p.on('pageerror',e=>errors.push(e.message));
    await p.route('https://www.gstatic.com/firebasejs/**',route=>{
      const name=new URL(route.request().url()).pathname.split('/').at(-1);
      const body=mockModules[name];
      return route.fulfill({status:body?200:404,contentType:'application/javascript',
        headers:{'access-control-allow-origin':'*'},body:body||'not found'});
    });
  }
  try {
    await host.goto(base+'/');
    await host.waitForFunction(()=>Boolean(window.MechOnline));
    await host.getByRole('button',{name:/Battle Arena/}).click();
    await host.getByRole('button',{name:/Online invitation setup/}).click();
    await host.getByRole('button',{name:/Create invitation link/}).click();
    await host.locator('#inviteLink').waitFor({timeout:12000});
    const invite=await host.locator('#inviteLink').inputValue();
    assert.match(invite,/\?battle=[A-Za-z0-9_-]{24}/);
    await guest.goto(invite);
    await guest.getByRole('button',{name:/Join this battle/}).click();
    await host.locator('#battleAnswer').waitFor({timeout:12000});
    await guest.locator('#battleAnswer').waitFor({timeout:12000});
    const mid=new URL(invite).searchParams.get('battle');
    const questionIds=docs.get('matches/'+mid).questionIds;
    for(let round=0;round<10;round++){
      const correct=await host.evaluate(idx=>DB[idx].name,questionIds[round]);
      await host.locator('#battleAnswer').fill(correct);
      await host.getByRole('button',{name:/Lock my answer/}).click();
      await host.getByText(/Waiting for your opponent/).waitFor({timeout:12000});
      await guest.locator('#battleAnswer').fill('banana spaceship nonsense');
      await guest.getByRole('button',{name:/Lock my answer/}).click();
      const action=/Continue|Final results/;
      await host.getByRole('button',{name:action}).waitFor({timeout:12000});
      await guest.getByRole('button',{name:action}).waitFor({timeout:12000});
      await host.getByRole('button',{name:action}).click();
      await guest.getByRole('button',{name:action}).click();
      if(round<9){
        await host.locator('#battleAnswer').waitFor({timeout:12000});
        await guest.locator('#battleAnswer').waitFor({timeout:12000});
      }
    }
    assert.match(await host.locator('#app').innerText(),/wins!/);
    assert.match(await host.locator('#app').innerText(),/1400/);
    assert.match(await guest.locator('#app').innerText(),/1400/);
    assert.deepEqual(errors,[]);
    console.log('PASS: simulated two-browser join link, ten rounds, hidden answers, scoring and final winner.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
