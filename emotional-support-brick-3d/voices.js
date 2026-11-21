import { dialogue } from './dialogue.js';
// Recorded natural character greetings, with an accessible fallback for unscripted dialogue.
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
    if(!('speechSynthesis' in window)){onEnd?.();return}
    const v=new SpeechSynthesisUtterance(text);v.lang='en-GB';v.rate=who==='cartoon'?1.02:.9;v.pitch=who==='cartoon'?1.09:.88;
    const preferred=preferredVoices.filter(voice=>/en[-_]GB/i.test(voice.lang));
    const pool=preferred.length?preferred:preferredVoices;
    const rank=voice=>{
      const name=voice.name.toLowerCase();
      let n=/(natural|neural|online|premium|enhanced)/.test(name)?100:0;
      n+=/british|united kingdom|en-gb|uk english/.test(name)?15:0;
      if(who==='cartoon')n+=/maisie|libby|sonia|female|jenny|zara/.test(name)?30:0;
      else n+=/ryan|thomas|george|male|daniel/.test(name)?30:0;
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
    const who=getPlayer().real?'realistic':'cartoon';
    const key=opts.key|| (lines[who][input]||dialogue[who]?.[input]?''+input:null);
    const hasRecording=!!recorded[who]?.[key]&&opts.recorded!==false;
    const text=(hasRecording?lines[who][key]:null)|| (key?varied(who,key):null)||lines[who][key]||input;
    cancel();const myToken=token;
    onStart?.(text,Math.max(1300,text.length*75));spokenAt=performance.now();
    const url=recorded[who][key];
    if(url&&opts.recorded!==false){
      const a=new Audio(url);audio=a;a.preload='auto';a.volume=.94;
      a.onended=()=>{if(token===myToken){audio=null;end()}};
      a.onerror=()=>{if(token===myToken){audio=null;synth(text,who,myToken)}};
      const promise=a.play();if(promise&&promise.catch)promise.catch(()=>{if(token===myToken){audio=null;synth(text,who,myToken)}});
    }else synth(text,who,myToken);
    return text;
  }
  return {speak,cancel,lines,dialogue,getCurrentVoice:()=>getPlayer().real?'Rusty':'Bricko',hasRecorded:key=>!!recorded[getPlayer().real?'realistic':'cartoon'][key],elapsed:()=>performance.now()-spokenAt};
}
