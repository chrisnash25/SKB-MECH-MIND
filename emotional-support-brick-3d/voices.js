import { dialogue } from './dialogue.js';
// Voice casting is based on each fictional character's personality and presentation,
// never inferred from colour. Actual installed speech voices vary by device/browser.
export const VOICE_CAST={
 bricko:{name:'Bricko',presentation:'bright youthful masculine',rate:1.07,pitch:1.12,preferred:/ryan|george|daniel|male|oliver/i,hello:"Hey! Bricko here! What's the plan today?"},
 rusty:{name:'Rusty',presentation:'dry mature masculine',rate:.91,pitch:.79,preferred:/ryan|thomas|george|daniel|male/i,hello:"Alright mate. Rusty here. What's on your mind?"},
 pulse:{name:'Pulse',presentation:'upbeat rhythmic masculine',rate:1.14,pitch:1.04,preferred:/ryan|george|male|jenny/i,hello:"Yo! Pulse in the house! Ready to turn this day around?"},
 calm:{name:'Calm',presentation:'gentle reassuring masculine',rate:.84,pitch:.90,preferred:/ryan|george|daniel|male|oliver/i,hello:"Hello. I'm Calm. We can take things at your pace."},
 spark:{name:'Spark',presentation:'playful lively masculine',rate:1.17,pitch:1.18,preferred:/ryan|george|daniel|male|oliver/i,hello:"Hiya! Spark here! Oh, I'm so happy to see you!"},
 blocky:{name:'Blocky',presentation:'measured scholarly masculine',rate:.95,pitch:.9,preferred:/thomas|daniel|george|male/i,hello:"Ah, hello! Blocky here. What shall we discover today?"},
 cozy:{name:'Cozy',presentation:'warm reassuring feminine',rate:.88,pitch:1.04,preferred:/sonia|libby|susan|female/i,hello:"Hi, lovely. I'm Cozy. Fancy a gentle chat?"},
 zapp:{name:'Zapp',presentation:'energetic sporty masculine',rate:1.2,pitch:1.16,preferred:/ryan|george|male/i,hello:"Hey! Zapp here! Let's make today a good one!"},
 echo:{name:'Echo',presentation:'soft dreamy feminine',rate:.9,pitch:1.2,preferred:/libby|sonia|maisie|female/i,hello:"Hello there. I'm Echo. What have you been thinking about?"},
 gizmo:{name:'Gizmo',presentation:'friendly practical masculine',rate:1.03,pitch:.93,preferred:/george|ryan|daniel|male/i,hello:"Alright! Gizmo here. What can we build together?"}
};

// Recorded natural character greetings, with an accessible fallback for unscripted dialogue.
const recordedGreetings={"bricko":"./audio/cast/bricko-hello.mp3","rusty":"./audio/cast/rusty-hello.mp3","pulse":"./audio/cast/pulse-hello.mp3","calm":"./audio/cast/calm-hello.mp3","spark":"./audio/cast/spark-hello.mp3","blocky":"./audio/cast/blocky-hello.mp3","cozy":"./audio/cast/cozy-hello.mp3","zapp":"./audio/cast/zapp-hello.mp3","echo":"./audio/cast/echo-hello.mp3","gizmo":"./audio/cast/gizmo-hello.mp3"};
const recorded={
  cartoon:{hello:'./audio/bricko-greeting.wav'},
  realistic:{hello:'./audio/rusty-greeting.mp3'}
};
const lines={
  cartoon:{
    hello:"Hey! You're back! I'm Bricko. Fancy a game or a little dance?",
    feed:"Yum! A biscuit! You really know how to spoil a brick.",
    sleep:"Five more minutes, please. I've had a very hard day being a brick.",
    dance:"Music on! Watch me dance. I'm basically a disco wall!",
    jenga:"Brick Jenga! Be gentle, I know some of those bricks!",
    stack:"Let's stack some bricks. Aim for the sky!",
    play:"Right then! What are we playing?"
  },
  realistic:{
    hello:"Alright mate. Rusty here. Fancy a game?",
    feed:"Cheers for that. Can't beat a good biscuit.",
    sleep:"Ah, finally. A proper rest. Wake me when the builders go home.",
    dance:"Dancing, are we? Mind the boots. They're not made for ballet.",
    jenga:"Steady on! This is Jenga, not demolition day.",
    stack:"Easy does it. Keep those bricks straight.",
    play:"Go on then, let's give it a go."
  }
};
export function createVoices({getPlayer,onStart,onEnd}){
  let audio=null,token=0,spokenAt=0,preferredVoices=[];
  const available=()=>{if('speechSynthesis' in window)preferredVoices=speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang))};
  available();
  if('speechSynthesis' in window)speechSynthesis.addEventListener?.('voiceschanged',available);
  function end(){onEnd?.()}
  function cancel(){token++;if(audio){audio.pause();audio.currentTime=0;audio=null}if('speechSynthesis' in window)speechSynthesis.cancel();end()}
  function synth(text,who,myToken){
    const profile=VOICE_CAST[who]||VOICE_CAST.bricko;
    if(!('speechSynthesis' in window)){onEnd?.();return}
    const v=new SpeechSynthesisUtterance(text);v.lang='en-GB';v.rate=profile.rate;v.pitch=profile.pitch;
    const preferred=preferredVoices.filter(voice=>/en[-_]GB/i.test(voice.lang));
    const pool=preferred.length?preferred:preferredVoices;
    const rank=voice=>{
      const name=voice.name.toLowerCase();
      let n=/(natural|neural|online|premium|enhanced)/.test(name)?100:0;
      n+=/british|united kingdom|en-gb|uk english/.test(name)?15:0;
      n+=profile.preferred.test(name)?55:0;
      return n;
    };
    if(pool.length){const sorted=[...pool].sort((a,b)=>rank(b)-rank(a));v.voice=sorted[0];}
    v.onend=()=>{if(myToken===token)end()};v.onerror=()=>{if(myToken===token)end()};
    speechSynthesis.speak(v);
  }
  let cursor=0;
  const lastLines={cartoon:{},realistic:{}};
  function varied(who,key){
    const pool=dialogue[who]?.[key];
    if(!pool?.length)return null;
    const previous=lastLines[who][key];
    const list=pool.filter(line=>line!==previous);
    const text=list[(cursor++*7+pool.length)%list.length];
    lastLines[who][key]=text;
    return text;
  }
  function speak(input,opts={}){
    const who=getPlayer().id|| (getPlayer().real?'rusty':'bricko');
    const profile=VOICE_CAST[who]||VOICE_CAST.bricko;
    const legacy=who==='rusty'?'realistic':'cartoon';
    const key=opts.key|| (lines[legacy]?.[input]||dialogue[legacy]?.[input]?''+input:null);
    const hasRecording=!!recorded[legacy]?.[key]&&['bricko','rusty'].includes(who)&&opts.recorded!==false;
    const text=(key==='hello'?profile.hello:null)||(hasRecording?lines[legacy][key]:null)|| (key?varied(legacy,key):null)||lines[legacy]?.[key]||input;
    cancel();const myToken=token;
    onStart?.(text,Math.max(1300,text.length*75));spokenAt=performance.now();
    // Calm and Spark now use masculine live synthesis until matching recorded actor lines are supplied.
    const revoice=who==='calm'||who==='spark';
    const url=key==='hello'&&opts.recorded!==false&&!revoice?recordedGreetings[who]:(hasRecording?recorded[legacy]?.[key]:null);
    if(url&&opts.recorded!==false){
      const a=new Audio(url);audio=a;a.preload='auto';a.volume=.94;
      a.onended=()=>{if(token===myToken){audio=null;end()}};
      a.onerror=()=>{if(token===myToken){audio=null;synth(text,who,myToken)}};
      const promise=a.play();if(promise&&promise.catch)promise.catch(()=>{if(token===myToken){audio=null;synth(text,who,myToken)}});
    }else synth(text,who,myToken);
    return text;
  }
  return {speak,cancel,lines,dialogue,getCurrentVoice:()=>VOICE_CAST[getPlayer().id]?.name||'Bricko',hasRecorded:key=>!!recorded[getPlayer().real?'realistic':'cartoon'][key],elapsed:()=>performance.now()-spokenAt};
}
