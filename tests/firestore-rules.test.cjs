// Real Firestore Security Rules tests using the LOCAL Firebase emulator.
// No production credentials, billing or Firebase project connection required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {initializeTestEnvironment,assertFails,assertSucceeds} = require('@firebase/rules-unit-testing');
const {doc,collection,getDocs,getDoc,setDoc,writeBatch,serverTimestamp,Timestamp} = require('firebase/firestore');

async function main() {
  const testEnv=await initializeTestEnvironment({
    projectId:'demo-mech-mind-rules',
    firestore:{rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}
  });
  const id='A'.repeat(24);
  const base='matches/'+id;
  const host='test-host-uid',guest='test-guest-uid',outsider='stranger';
  const hostDb=testEnv.authenticatedContext(host).firestore();
  const guestDb=testEnv.authenticatedContext(guest).firestore();
  const outsiderDb=testEnv.authenticatedContext(outsider).firestore();
  const anonymousDb=testEnv.unauthenticatedContext().firestore();
  const sealedPath=base+'/sealedAnswers';
  const sealed=(db,round,uid)=>doc(db,sealedPath,round+'_'+uid);

  try {
    await testEnv.withSecurityRulesDisabled(async ctx=>{
      await setDoc(doc(ctx.firestore(),base),{
        hostUid:host,guestUid:guest,hostName:'Host',guestName:'Guest',
        mode:'independent',protocol:'sealed-v1',status:'playing',
        createdAt:Timestamp.fromMillis(Date.now()-60000),
        expiresAt:Timestamp.fromMillis(Date.now()+86400000),
        questionIds:Array.from({length:10},(_,i)=>i)
      });
    });

    await assertFails(getDocs(collection(hostDb,sealedPath)));
    await assertFails(getDocs(collection(guestDb,sealedPath)));
    await assertFails(setDoc(sealed(guestDb,0,host),{
      uid:host,round:0,answer:'impersonation',createdAt:serverTimestamp()
    }));
    await assertFails(setDoc(sealed(hostDb,2,host),{
      uid:host,round:2,answer:'out-of-order',createdAt:serverTimestamp()
    }));

    async function submitTen(db,uid,answer) {
      for(let round=0;round<10;round++){
        const batch=writeBatch(db);
        batch.set(sealed(db,round,uid),{
          uid,round,answer,createdAt:serverTimestamp()
        });
        batch.set(doc(db,base+'/commits',round+'_'+uid),{
          uid,round,hash:'b'.repeat(64),createdAt:serverTimestamp()
        });
        await assertSucceeds(batch.commit());
      }
    }
    await submitTen(hostDb,host,'ratchet and pawl');
    await assertFails(getDocs(collection(hostDb,sealedPath)));
    await assertFails(getDocs(collection(guestDb,sealedPath)));
    await submitTen(guestDb,guest,'banana spaceship nonsense');

    const hostAnswers=await assertSucceeds(getDocs(collection(hostDb,sealedPath)));
    const guestAnswers=await assertSucceeds(getDocs(collection(guestDb,sealedPath)));
    assert.equal(hostAnswers.size,20);
    assert.equal(guestAnswers.size,20);
    await assertFails(getDocs(collection(outsiderDb,sealedPath)));
    await assertFails(getDocs(collection(anonymousDb,sealedPath)));
    await assertFails(setDoc(sealed(hostDb,0,host),{
      uid:host,round:0,answer:'edited after lock',createdAt:serverTimestamp()
    }));
    await assertFails(getDoc(doc(outsiderDb,base+'/commits','0_'+host)));

    console.log('PASS: REAL Firestore rules emulator — locked until both players finish, host can disconnect, outsider denied, owner-only ordered immutable writes.');
  } finally {
    await testEnv.cleanup();
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
