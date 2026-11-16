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
export function writeBatch(db){
  const writes=[];
  return {
    set(ref,data){writes.push({path:ref.path,data});return this},
    async commit(){
      const response=await fetch('/mock/batch',{method:'POST',
        headers:{'content-type':'application/json'},body:JSON.stringify({writes})});
      if(!response.ok)throw Error('Mock batch failed');
    }
  };
}
export async function runTransaction(db, callback){
  let queued=[];
  let result=await callback({get:remote,update:(ref,data)=>queued.push([ref,data])});
  for(const [ref,data] of queued)await write(ref,data,true);
  return result;
}
const activeListeners=new Set();
window.__failMockListeners=()=>{for(const fail of [...activeListeners])fail()};
export function onSnapshot(ref,callback,onError){
  let stopped=false,previous='';
  const fail=()=>{if(!stopped&&onError)onError(Object.assign(new Error('Simulated listener failure'),{code:'unavailable'}))};
  activeListeners.add(fail);
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
  return ()=>{stopped=true;activeListeners.delete(fail);clearInterval(interval)};
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
    // Model the post-finish visibility invariant of Firestore rules.
    if(key?.endsWith('/sealedAnswers')){
      const matchId=key.split('/')[1],m=docs.get('matches/'+matchId);
      if(!m||!m.guestUid||
         !docs.has(key+'/9_'+m.hostUid)||
         !docs.has(key+'/9_'+m.guestUid)){
        res.writeHead(403,{'content-type':'text/plain'});return res.end('Answers locked');
      }
    }
    return json(res,{docs:[...docs.entries()].filter(([p])=>
      p.startsWith(key+'/')&&!p.slice(key.length+1).includes('/')).map(([p,data])=>({id:p.split('/').at(-1),data}))});
  }
  if(req.method==='POST'&&(url.pathname==='/mock/write'||url.pathname==='/mock/batch')){
    let chunks=[];
    req.on('data',c=>chunks.push(c));
    req.on('end',()=>{
      const request=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if(url.pathname==='/mock/batch'){
        // Apply both writes atomically for the simulated Firestore batch.
        for(const {path:p,data} of request.writes)docs.set(p,data);
      }else{
        const {path:p,data,patch}=request;
        docs.set(p,patch?{...docs.get(p),...data}:data);
      }
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
    // Simulate a terminal Firestore listener failure during an active match.
    // The error screen must remain visible, and Retry must reattach listeners
    // without losing the invitation or existing round state.
    await guest.evaluate(()=>window.__failMockListeners());
    await guest.getByText(/database is unavailable/i).waitFor({timeout:12000});
    await guest.waitForTimeout(300);
    assert.match(await guest.locator('#app').innerText(),/database is unavailable/i,
      'A stale snapshot replaced the listener error screen');
    await guest.getByRole('button',{name:'Retry'}).click();
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

    // Independent Battle: host can finish and close the browser before the
    // guest submits even their first response. Results cannot leak early.
    const host2Context=await browser.newContext();
    const guest2Context=await browser.newContext();
    const host2=await host2Context.newPage();
    const guest2=await guest2Context.newPage();
    for(const p of [host2,guest2]){
      p.on('pageerror',e=>errors.push(e.message));
      await p.route('https://www.gstatic.com/firebasejs/**',route=>{
        const name=new URL(route.request().url()).pathname.split('/').at(-1);
        const body=mockModules[name];
        return route.fulfill({status:body?200:404,contentType:'application/javascript',
          headers:{'access-control-allow-origin':'*'},body:body||'not found'});
      });
    }
    await host2.goto(base+'/');
    await host2.waitForFunction(()=>Boolean(window.MechOnline));
    await host2.getByRole('button',{name:/Battle Arena/}).click();
    await host2.getByRole('button',{name:/Online invitation setup/}).click();
    await host2.locator('#battleMode').selectOption('independent');
    await host2.getByRole('button',{name:/Create invitation link/}).click();
    await host2.locator('#inviteLink').waitFor({timeout:12000});
    const invite2=await host2.locator('#inviteLink').inputValue();
    const matchId2=new URL(invite2).searchParams.get('battle');
    const seeded=docs.get('matches/'+matchId2);
    assert.equal(seeded.mode,'independent');
    assert.equal(seeded.protocol,'sealed-v1');
    await guest2.goto(invite2);
    await guest2.getByRole('button',{name:/Join this battle/}).click();
    await host2.locator('#battleAnswer').waitFor({timeout:12000});
    await guest2.locator('#battleAnswer').waitFor({timeout:12000});

    for(let round=0;round<10;round++){
      await host2.locator('#battleAnswer').waitFor({timeout:12000});
      const answer=await host2.evaluate(idx=>DB[idx].name,seeded.questionIds[round]);
      await host2.locator('#battleAnswer').fill(answer);
      await host2.getByRole('button',{name:/Lock answer and continue/}).click();
      if(round<9) await host2.waitForFunction(
        r=>document.querySelector('#app')?.textContent.includes('INDEPENDENT · '+(r+2)+'/10'),
        round,{timeout:12000});
      else await host2.getByText(/Waiting for your opponent to finish/).waitFor({timeout:12000});
    }
    const locked=await guest2.evaluate(async id=>
      (await fetch('/mock/collection?path='+encodeURIComponent('matches/'+id+'/sealedAnswers'))).status,
      matchId2);
    assert.equal(locked,403,'Independent answers were readable before both players finished');
    assert.equal([...docs.keys()].filter(k=>k.startsWith('matches/'+matchId2+'/sealedAnswers/')).length,10);
    await host2.close(); // Host is now offline and cannot reveal anything.

    for(let round=0;round<10;round++){
      await guest2.locator('#battleAnswer').waitFor({timeout:12000});
      await guest2.locator('#battleAnswer').fill('banana spaceship nonsense');
      await guest2.getByRole('button',{name:/Lock answer and continue/}).click();
      // The host's ten completed answers must stay sealed even while the guest
      // is progressing through rounds 1–9. The previous test only checked
      // the boundary before the guest submitted any answer.
      if(round<9){
        const prematureRead=await guest2.evaluate(async id=>
          (await fetch('/mock/collection?path='+encodeURIComponent('matches/'+id+'/sealedAnswers'))).status,
          matchId2);
        assert.equal(prematureRead,403,'Independent answers leaked after guest round '+(round+1));
      }
      if(round<9) await guest2.waitForFunction(
        r=>document.querySelector('#app')?.textContent.includes('INDEPENDENT · '+(r+2)+'/10'),
        round,{timeout:12000});
    }
    await guest2.getByRole('heading',{name:/wins!/}).waitFor({timeout:12000});
    assert.match(await guest2.locator('#app').innerText(),/1400/);
    assert.equal([...docs.keys()].filter(k=>k.startsWith('matches/'+matchId2+'/sealedAnswers/')).length,20);
    assert.deepEqual(errors,[]);
    await guest2Context.close();
    await host2Context.close();
    console.log('PASS: Independent Battle 10+10 answers, no early answer reads, host disconnected, guest receives results.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
