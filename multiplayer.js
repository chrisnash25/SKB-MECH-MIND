// SKB MECH MIND — Firebase Spark casual multiplayer.
// Firebase project configuration is public client configuration, NOT an admin secret.
// Scores are computed in the clients. Use a trusted backend for competitive anti-cheat.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js';
import { getFirestore, doc, collection, getDoc, setDoc, runTransaction, writeBatch, onSnapshot, serverTimestamp, Timestamp } from 'https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAvKeKMECGMZLgmLHNt6BmCYa70alp7haU',
  authDomain: 'mech-mind.firebaseapp.com',
  projectId: 'mech-mind',
  storageBucket: 'mech-mind.firebasestorage.app',
  messagingSenderId: '34228458070',
  appId: '1:34228458070:web:4752e5379ac1d6f27ba1f7',
  measurementId: 'G-QGF343R4ZJ'
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const ROUNDS = 10;
const MATCH_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
let env, user, activeMatchId = '', match = null, commits = {}, reveals = {}, sealedAnswers = {};
let unsubscribes = [], childSubscribed = false, sealedSubscribed = false, lastView = '', renderGeneration = 0;
let busy = false, revealing = new Set();

function h(text) {
  return env.esc(String(text ?? ''));
}
function clearListeners() {
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];
  childSubscribed = false;
  sealedSubscribed = false;
  match = null;
  commits = {};
  reveals = {};
  sealedAnswers = {};
  lastView = '';
  renderGeneration++;
}
function display(markup, signature = '') {
  if (signature && lastView === signature) return;
  lastView = signature;
  env.draw(markup);
}
function errorText(error) {
  const code = error?.code || '';
  if (code.includes('auth/operation-not-allowed')) return 'Anonymous sign-in is not enabled. In Firebase, open Authentication → Sign-in method → Anonymous → Enable.';
  if (code.includes('permission-denied')) return 'Firestore access was denied. Create the Firestore database in Production mode and publish the rules in firestore.rules.';
  if (code.includes('unavailable')) return 'The database is unavailable. Check your connection and Firebase project setup.';
  return (error?.message || 'Something went wrong. Please try again.').slice(0, 280);
}
function showError(error) {
  busy = false;
  display('<button class="alt" onclick="MechOnline.leave()">← Battle Arena</button><div class="panel"><h2>⚠️ Online battle setup</h2><p>' + h(errorText(error)) + '</p><button onclick="MechOnline.openAgain()">Retry</button><p class="muted small">Your offline Battle Arena still works normally.</p></div>');
}
async function ensureUser() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}
function inviteFromUrl() {
  return new URLSearchParams(location.search).get('battle') || '';
}
function inviteUrl(id) {
  const url = new URL(location.href);
  url.searchParams.set('battle', id);
  url.hash = '';
  return url.href;
}
function code() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function shuffledIndices(count) {
  const ids = Array.from({length: count}, (_, i) => i);
  for (let i = ids.length - 1; i > 0; i--) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [ids[i], ids[random]] = [ids[random], ids[i]];
  }
  return ids.slice(0, ROUNDS);
}
function roundKey(round, uid) { return round + '_' + uid; }
function independent() { return match?.mode === 'independent'; }
function sealedProtocol() { return independent() && match?.protocol === 'sealed-v1'; }
function nickname() { return (document.getElementById('onlineName')?.value || '').trim().slice(0, 32); }
function basePage(body) {
  return '<button class="alt" onclick="MechOnline.leave()">← Battle Arena</button><h1>🌐 Online Battle Arena</h1>' + body +
    '<p class="muted small">Casual play: scoring is calculated by players’ browsers. For prizes or ranked matches, a trusted scoring server is required.</p>';
}
function openWelcome(id) {
  if (id) {
    display(basePage('<div class="panel"><h2>⚔️ You have been invited!</h2><p>Join a ten-round engineering challenge from your own phone.</p><label for="onlineName">Your display name</label><input id="onlineName" maxlength="32" value="' + h(localStorage.getItem('mm_nickname') || 'Player 2') + '"><p><button onclick="MechOnline.join()">Join this battle</button></p></div>'));
  } else {
    display(basePage('<div class="panel"><h2>⚔️ Invite a friend</h2><p>Create a ten-round battle and share the invitation through WhatsApp, Messenger or any other app.</p><label for="onlineName">Your display name</label><input id="onlineName" maxlength="32" value="' + h(localStorage.getItem('mm_nickname') || 'Chris') + '"><p><label for="battleMode">Mode</label><select id="battleMode"><option value="live">Live Duel</option><option value="independent">Independent Battle</option></select></p><p><button onclick="MechOnline.create()">Create invitation link</button></p><p class="muted small">Links expire after seven days. Both players can close and reopen the match.</p></div>'));
  }
}
async function open(options) {
  if (options) env = options;
  if (!env) return;
  clearListeners();
  const id = inviteFromUrl();
  display(basePage('<div class="panel">Connecting securely to Mech Mind…</div>'));
  try {
    user = await ensureUser();
    if (!id) { openWelcome(''); return; }
    if (!/^[\w-]{24}$/.test(id)) throw new Error('This invitation link is invalid.');
    const snapshot = await getDoc(doc(db, 'matches', id));
    if (!snapshot.exists()) throw new Error('This invitation does not exist or has expired.');
    const m = snapshot.data();
    if (m.expiresAt?.toMillis() < Date.now()) throw new Error('This invitation has expired.');
    if (m.hostUid === user.uid || m.guestUid === user.uid) {
      listen(id);
    } else if (!m.guestUid && m.status === 'waiting') {
      openWelcome(id);
    } else {
      throw new Error('This battle already has two players. Ask the host for a new invitation.');
    }
  } catch (error) {
    showError(error);
  }
}
function setUrl(id) {
  const url = new URL(location.href);
  if (id) url.searchParams.set('battle', id);
  else url.searchParams.delete('battle');
  history.replaceState({}, '', url.pathname + url.search + url.hash);
}
async function create() {
  if (busy) return;
  const name = nickname();
  if (!name) return alert('Please enter your name.');
  busy = true;
  try {
    localStorage.setItem('mm_nickname', name);
    const id = code();
    const mode = document.getElementById('battleMode')?.value === 'independent' ? 'independent' : 'live';
    await setDoc(doc(db, 'matches', id), {
      hostUid: user.uid, guestUid: null, hostName: name, guestName: null,
      status: 'waiting', mode, ...(mode === 'independent' ? {protocol: 'sealed-v1'} : {}), questionIds: shuffledIndices(env.DB.length),
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + MATCH_LIFETIME_MS)
    });
    setUrl(id);
    listen(id);
  } catch (error) {
    showError(error);
  } finally { busy = false; }
}
async function join() {
  if (busy) return;
  const id = inviteFromUrl(), name = nickname();
  if (!name) return alert('Please enter your name.');
  busy = true;
  try {
    localStorage.setItem('mm_nickname', name);
    const ref = doc(db, 'matches', id);
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('This invitation does not exist.');
      const m = snapshot.data();
      if (m.expiresAt?.toMillis() < Date.now()) throw new Error('This invitation has expired.');
      if (m.guestUid || m.status !== 'waiting') throw new Error('This invitation has already been used.');
      if (m.hostUid === user.uid) throw new Error('Open this invitation on the other player’s phone.');
      tx.update(ref, {guestUid: user.uid, guestName: name, status: 'playing', joinedAt: serverTimestamp()});
    });
    listen(id);
  } catch (error) {
    showError(error);
  } finally { busy = false; }
}
function listen(id) {
  clearListeners();
  activeMatchId = id;
  const ref = doc(db, 'matches', id);
  unsubscribes.push(onSnapshot(ref, snapshot => {
    if (activeMatchId !== id) return;
    if (!snapshot.exists()) { showError(new Error('Match no longer exists.')); return; }
    match = snapshot.data();
    if (match.guestUid && !childSubscribed) {
      childSubscribed = true;
      unsubscribes.push(onSnapshot(collection(db, 'matches', id, 'commits'), snap => {
        commits = Object.fromEntries(snap.docs.map(d => [d.id, d.data()]));
        render();
      }, showError));
      unsubscribes.push(onSnapshot(collection(db, 'matches', id, 'reveals'), snap => {
        reveals = Object.fromEntries(snap.docs.map(d => [d.id, d.data()]));
        render();
      }, showError));
    }
    render();
  }, showError));
}
async function copy() {
  const url = inviteUrl(activeMatchId);
  try {
    await navigator.clipboard.writeText(url);
    const el = document.getElementById('shareStatus');
    if (el) el.textContent = 'Link copied! Send it to your friend.';
  } catch (_) {
    const el = document.getElementById('inviteLink');
    if (el) { el.focus(); el.select(); }
    const status = document.getElementById('shareStatus');
    if (status) status.textContent = 'Select and copy the link above.';
  }
}
async function share() {
  const url = inviteUrl(activeMatchId);
  if (navigator.share) {
    try {
      await navigator.share({title: 'SKB MECH MIND Battle', text: 'Join my Mech Mind engineering battle!', url});
      return;
    } catch (error) { if (error.name === 'AbortError') return; }
  }
  await copy();
}
async function digest(id, round, uid, nonce, answer) {
  const encoded = new TextEncoder().encode(JSON.stringify([id, round, uid, nonce, answer]));
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function savedAnswerKey(round) { return 'mm_pending_' + activeMatchId + '_' + round + '_' + user.uid; }
async function submit() {
  if (busy || !match?.guestUid) return;
  const round = independent() ? independentRound() : currentRound();
  if (round >= ROUNDS || commits[roundKey(round, user.uid)]) return;
  const answer = (document.getElementById('battleAnswer')?.value || '').trim().slice(0, 300);
  if (!answer) return alert('Enter your answer first.');
  busy = true;
  try {
    const nonce = [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join('');
    const hash = await digest(activeMatchId, round, user.uid, nonce, answer);
    const commitRef = doc(db, 'matches', activeMatchId, 'commits', roundKey(round, user.uid));
    const commitData = {uid: user.uid, round, hash, createdAt: serverTimestamp()};
    if (sealedProtocol()) {
      // Atomic write: a committed answer always has a sealed answer, even if
      // the other participant goes offline. Firestore rules forbid reading it
      // until each player's tenth sealed response has been saved.
      const batch = writeBatch(db);
      batch.set(doc(db, 'matches', activeMatchId, 'sealedAnswers', roundKey(round, user.uid)), {
        uid: user.uid, round, answer, createdAt: serverTimestamp()
      });
      batch.set(commitRef, commitData);
      await batch.commit();
    } else {
      localStorage.setItem(savedAnswerKey(round), JSON.stringify({nonce, answer}));
      await setDoc(commitRef, commitData);
    }
    await render();
  } catch (error) { showError(error); }
  finally { busy = false; }
}
function independentRound() {
  for(let r=0;r<ROUNDS;r++) if(!commits[roundKey(r,user.uid)]) return r;
  return ROUNDS;
}
function everyoneFinished() {
  return [match.hostUid,match.guestUid].every(uid=>Array.from({length:ROUNDS},(_,r)=>roundKey(r,uid)).every(k=>!!commits[k]));
}
function currentRound() {
  if (!match?.guestUid) return 0;
  for (let r = 0; r < ROUNDS; r++) {
    if (!reveals[roundKey(r, match.hostUid)] || !reveals[roundKey(r, match.guestUid)]) return r;
  }
  return ROUNDS;
}
async function tryReveal(round) {
  const key = roundKey(round, user.uid);
  if (reveals[key] || revealing.has(key)) return;
  const pair = [roundKey(round, match.hostUid), roundKey(round, match.guestUid)];
  if (!pair.every(k => commits[k])) return;
  if (sealedProtocol() || (independent() && !everyoneFinished())) return;
  const stored = localStorage.getItem(savedAnswerKey(round));
  if (!stored) return;
  revealing.add(key);
  try {
    const saved = JSON.parse(stored);
    await setDoc(doc(db, 'matches', activeMatchId, 'reveals', key), {
      uid: user.uid, round, answer: saved.answer, nonce: saved.nonce, createdAt: serverTimestamp()
    });
    localStorage.removeItem(savedAnswerKey(round));
  } catch (error) { showError(error); }
  finally { revealing.delete(key); }
}
async function forfeit() {
  if (!match?.guestUid) return;
  const round = currentRound();
  const mine = roundKey(round, user.uid);
  const pair = [roundKey(round, match.hostUid), roundKey(round, match.guestUid)];
  if (!commits[mine] || reveals[mine] || !pair.every(k => commits[k])) return;
  try {
    await setDoc(doc(db, 'matches', activeMatchId, 'reveals', mine), {
      uid: user.uid, round, answer: '', nonce: '000000000000000000000000',
      createdAt: serverTimestamp()
    });
    localStorage.removeItem(savedAnswerKey(round));
  } catch (error) { showError(error); }
}
async function scoreFor(round, uid) {
  const key = roundKey(round, uid), commitment = commits[key], reveal = reveals[key];
  if (!commitment || !reveal || commitment.uid !== uid || reveal.uid !== uid) return {points: 0, answer: '', valid: false};
  const actual = await digest(activeMatchId, round, uid, reveal.nonce, reveal.answer);
  if (actual !== commitment.hash) return {points: 0, answer: reveal.answer, valid: false};
  const question = env.DB[match.questionIds[round]];
  if (!question) return {points: 0, answer: reveal.answer, valid: false};
  const evaluated = env.evaluate(reveal.answer, question);
  return {points: evaluated.ok ? (evaluated.partial ? 70 : 140) : 0, answer: reveal.answer, valid: true};
}
async function renderIndependent(id, gen) {
  const round=independentRound();
  if (sealedProtocol() && everyoneFinished() && !sealedSubscribed) {
    sealedSubscribed = true;
    unsubscribes.push(onSnapshot(collection(db, 'matches', id, 'sealedAnswers'), snap => {
      sealedAnswers = Object.fromEntries(snap.docs.map(d => [d.id, d.data()]));
      render();
    }, showError));
  }
  if(!everyoneFinished()){
    if(round===ROUNDS) display(basePage('<div class="panel"><h2>🏁 Finished!</h2><p>Waiting for your opponent to finish all 10 questions.</p></div>'),'ind-wait:'+id);
    else {
      const q=env.DB[match.questionIds[round]];
      if(!q) return showError(new Error('Question unavailable'));
      display(basePage('<div class="panel"><span class="tag">INDEPENDENT · '+(round+1)+'/10</span><p>'+h(q.clue)+'</p><textarea id="battleAnswer" maxlength="300" placeholder="Your answer"></textarea><button onclick="MechOnline.submit()">Lock answer and continue</button><p class="muted small">Answers remain hidden until both players finish.</p></div>'),'ind-question:'+id+':'+round);
    }
    return;
  }
  if (!sealedProtocol()) for(let r=0;r<ROUNDS;r++) void tryReveal(r);
  const answers = sealedProtocol() ? sealedAnswers : reveals;
  const ready=[match.hostUid,match.guestUid].every(uid=>Array.from({length:ROUNDS},(_,r)=>roundKey(r,uid)).every(k=>!!answers[k]));
  if(!ready) {
    display(basePage('<div class="panel"><h2>🔐 Both finished</h2><p>Verifying answers. Keep this page open.</p></div>'),'ind-revealing:'+id);
    return;
  }
  let scores=[0,0], rows=[];
  for(let r=0;r<ROUNDS;r++){
    const score = async (uid) => {
      if (!sealedProtocol()) return scoreFor(r, uid);
      const entry = sealedAnswers[roundKey(r, uid)];
      if (!entry || entry.uid !== uid || entry.round !== r) return {points:0,answer:'',valid:false};
      const assessed = env.evaluate(entry.answer, env.DB[match.questionIds[r]]);
      return {points:assessed.ok?(assessed.partial?70:140):0,answer:entry.answer,valid:true};
    };
    const [a,b]=await Promise.all([score(match.hostUid),score(match.guestUid)]);
    if(gen!==renderGeneration)return;
    scores[0]+=a.points;scores[1]+=b.points;
    rows.push('<p><b>'+(r+1)+'. '+h(env.DB[match.questionIds[r]]?.name||'Question')+'</b><br>'+h(match.hostName)+': '+h(a.answer)+' ('+a.points+')<br>'+h(match.guestName)+': '+h(b.answer)+' ('+b.points+')</p>');
  }
  const winner=scores[0]===scores[1]?'Draw!':h(scores[0]>scores[1]?match.hostName:match.guestName)+' wins!';
  display(basePage('<div class="panel"><h2>🏆 '+winner+'</h2><p>'+h(match.hostName)+': '+scores[0]+' · '+h(match.guestName)+': '+scores[1]+'</p><h3>Answer breakdown</h3>'+rows.join('')+'<button onclick="MechOnline.leave()">Back to Arena</button></div>'),'ind-result:'+id+':'+scores.join('-'));
}
async function render() {
  if (!env || !match) return;
  const gen = ++renderGeneration;
  const id = activeMatchId;
  if (!match.guestUid) {
    const link = inviteUrl(id);
    display(basePage('<div class="panel"><h2>✅ Invitation created</h2><p>Waiting for your opponent to join.</p><label for="inviteLink">Your private battle link</label><input id="inviteLink" readonly value="' + h(link) + '"><div class="row"><button onclick="MechOnline.share()">Share invitation</button><button class="alt" onclick="MechOnline.copy()">Copy link</button></div><p id="shareStatus" class="muted small">Send through WhatsApp or Messenger using Share.</p><p class="muted small">Only the first person to join can claim the second player place. Link expires after seven days.</p></div>'), 'waiting:' + id);
    return;
  }
  if(independent()) { await renderIndependent(id,gen); return; }
  const completed = currentRound();
  const scores = [0, 0], roundScores = [];
  for (let r = 0; r < completed; r++) {
    const [a, b] = await Promise.all([scoreFor(r, match.hostUid), scoreFor(r, match.guestUid)]);
    if (gen !== renderGeneration) return;
    scores[0] += a.points; scores[1] += b.points;
    roundScores.push([a, b]);
  }
  if (gen !== renderGeneration) return;
  const scoreHeader = '<div class="row"><div><b>' + h(match.hostName) + '</b><div class="score">' + scores[0] + '</div></div><div style="text-align:center">VS</div><div style="text-align:right"><b>' + h(match.guestName) + '</b><div class="score">' + scores[1] + '</div></div></div>';
  const base = '<div class="panel">' + scoreHeader;
  const acknowledgedKey = 'mm_ack_' + id + '_' + user.uid;
  let ack = Math.max(0, Math.min(ROUNDS, Number(localStorage.getItem(acknowledgedKey) || 0)));
  if (ack < completed) {
    const [a, b] = roundScores[ack], q = env.DB[match.questionIds[ack]];
    display(basePage(base + '<span class="tag">ROUND ' + (ack + 1) + '/' + ROUNDS + ' · REVEAL</span><h2>' + h(q?.name || 'Engineering puzzle') + '</h2><p>' + h(match.hostName) + ': ' + h(a.answer || '(no answer)') + ' — <b>' + a.points + ' points</b>' + (a.valid ? '' : ' (invalid or forfeited)') + '</p><p>' + h(match.guestName) + ': ' + h(b.answer || '(no answer)') + ' — <b>' + b.points + ' points</b>' + (b.valid ? '' : ' (invalid or forfeited)') + '</p><button onclick="MechOnline.ack()">' + (ack === ROUNDS - 1 ? 'Final results' : 'Continue') + '</button></div>'), 'reveal:' + id + ':' + ack + ':' + completed + ':' + scores.join('-') + ':' + a.valid + ':' + b.valid);
    return;
  }
  if (completed >= ROUNDS) {
    const winner = scores[0] === scores[1] ? 'It’s a draw!' : (scores[0] > scores[1] ? match.hostName : match.guestName) + ' wins!';
    display(basePage(base + '<h2>🏆 ' + h(winner) + '</h2><p>Ten rounds completed. Match results are kept in Firestore until the match is deleted.</p><button onclick="MechOnline.leave()">Back to Battle Arena</button></div>'), 'finished:' + id + ':' + scores.join('-'));
    return;
  }
  const q = env.DB[match.questionIds[completed]];
  if (!q) { showError(new Error('Question unavailable for this match.')); return; }
  const mine = roundKey(completed, user.uid), theirs = roundKey(completed, user.uid === match.hostUid ? match.guestUid : match.hostUid);
  const bothCommitted = !!commits[mine] && !!commits[theirs];
  if (bothCommitted) void tryReveal(completed);
  if (!commits[mine]) {
    display(basePage(base + '<span class="tag">ROUND ' + (completed + 1) + '/' + ROUNDS + '</span><p>' + h(q.clue) + '</p><textarea id="battleAnswer" maxlength="300" placeholder="Name or describe the engineering subject"></textarea><p><button onclick="MechOnline.submit()">Lock my answer 🔒</button></p><p class="muted small">Your answer stays hidden until both players lock theirs. No hints in online mode yet.</p></div>'), 'answer:' + id + ':' + completed);
  } else if (!bothCommitted) {
    display(basePage(base + '<h2>🔒 Answer locked</h2><p>Waiting for your opponent to submit round ' + (completed + 1) + '.</p></div>'), 'waiting-for-opponent:' + id + ':' + completed);
  } else if (!reveals[mine] && !localStorage.getItem(savedAnswerKey(completed))) {
    display(basePage(base + '<h2>🔐 Restore your answer</h2><p>Your answer was locked, but this browser has lost its local copy. You can forfeit this round so the match can continue.</p><button onclick="MechOnline.forfeit()">Forfeit this round (0 points)</button></div>'), 'lost:' + id + ':' + completed);
  } else {
    display(basePage(base + '<h2>🔒 Answers locked</h2><p>Both players have submitted. Verifying and revealing answers…</p></div>'), 'revealing:' + id + ':' + completed);
  }
}
function ack() {
  if (!match?.guestUid) return;
  const key = 'mm_ack_' + activeMatchId + '_' + user.uid;
  localStorage.setItem(key, String(Number(localStorage.getItem(key) || 0) + 1));
  lastView = '';
  void render();
}
function leave() {
  clearListeners();
  activeMatchId = '';
  setUrl('');
  if (env) env.battleMenu();
}
window.MechOnline = {open, openAgain: () => open(), create, join, share, copy, submit, ack, forfeit, leave};
window.dispatchEvent(new Event('mech-online-ready'));
