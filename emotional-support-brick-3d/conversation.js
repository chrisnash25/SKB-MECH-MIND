// Lightweight, private, local conversational companion. No external API or chat uploads.
export function createConversation(){
 const memory={name:'',topic:'',lastQuestion:'',turn:0};
 const clean=s=>String(s||'').trim().slice(0,240);
 const pick=(arr,turn)=>arr[turn%arr.length];
 function reply(input,real=false){
  const raw=clean(input),q=raw.toLowerCase();memory.turn++;
  const name=real?'Rusty':'Bricko',pal=real?'mate':'pal';
  if(!raw)return '';
  if(/\b(?:suicide|kill myself|end my life|self.harm|hurt myself)\b/i.test(q))return "I'm really sorry you're going through this. Please tell someone you trust now. If you're in immediate danger call 999. In the UK, Samaritans are on 116 123. You deserve real support.";
  let m=q.match(/(?:my name is|call me|i'm called)\s+([a-z][a-z'-]{1,22})/i);
  if(m){memory.name=m[1][0].toUpperCase()+m[1].slice(1);return real?'Alright, '+memory.name+'. Good to meet you properly. What are we chatting about?':'Oh! '+memory.name+'! I love knowing who I am talking to. What should we do together?'}
  const address=memory.name?', '+memory.name:'';
  if(/\b(?:sad|depressed|down|upset|crying|miserable|heartbroken|grief|lost someone)\b/.test(q))return "I'm sorry you're feeling that way"+address+". Want to tell me what happened, or would you rather I distract you with a joke? I'm listening.";
  if(/\b(?:anxious|anxiety|worried|scared|panic|stressed|overwhelmed)\b/.test(q))return "That sounds like a lot to carry"+address+". We can slow down. What's the biggest thing on your mind right now? We can take it one bit at a time.";
  if(/\b(?:happy|excited|amazing|great news|good news|proud)\b/.test(q))return real?"Now that's what I like to hear"+address+"! Tell me the good bit, mate.":"YES! That's brilliant"+address+"! Come on, tell me everything! I'm practically bouncing!";
  if(/\b(?:angry|furious|annoyed|frustrated)\b/.test(q))return "Fair enough, "+pal+". Sounds frustrating. What set it off? You can tell me without worrying about being judged.";
  if(/\b(?:lonely|alone|no friends|miss someone)\b/.test(q))return "Feeling alone is rough"+address+". I'm here to chat, and it might help to reach out to someone you trust too. Who have you been missing?";
  if(/\b(?:joke|funny|laugh|cheer me up)\b/.test(q))return real?"I tried being a motivational speaker. They said my delivery was a bit concrete.":"Why was the brick so popular? Because everyone said it was a solid friend! Ha!";
  if(/\b(?:your name|who are you)\b/.test(q))return "I'm "+name+"! A brick with a personality and absolutely no idea how I got this chatty. What's your name?";
  if(/\b(?:how are you|how's it going|you okay)\b/.test(q))return real?"Not bad, mate. Bit weathered, still standing. How about yourself?":"Fantastic! A little dusty but full of energy. How are YOU?";
  if(/\b(?:hello|hey|hi|morning|evening)\b/.test(q))return "Hey"+address+"! It's "+name+". How's your day going?";
  if(/\b(?:dance|dancing)\b/.test(q))return real?"I can try, but don't laugh at my footwork. Hit Dance in Activities!":"YES! Let's dance! Tap Activities, then Dance. I'll show you my best moves!";
  if(/\b(?:play|game|games|jenga|stack|memory)\b/.test(q))return "Absolutely! Open Activities and choose Games. Fancy Jenga, stacking, or a memory challenge?";
  if(/\b(?:sleep|tired|rest)\b/.test(q))return "A little rest sounds good. Tap Activities and Sleep if you want me to have a nap. Are you getting enough rest too?";
  if(/\b(?:biscuit|food|hungry|feed)\b/.test(q))return "Biscuits! You've got my attention. Tap Activities and Feed. What's your favourite snack?";
  if(/\b(?:thank you|thanks|cheers)\b/.test(q))return real?"No worries, mate. That's what mates are for.":"You're welcome! You just made my little brick heart glow!";
  if(/\b(?:bye|goodnight|see you)\b/.test(q))return "See you soon"+address+"! I'll keep the room cosy until you're back.";
  if(/\b(?:what can you do|help|how do i)\b/.test(q))return "We can chat, share jokes, dance, feed me, rest, or play games. The Emotional Support page has breathing and grounding exercises too. What sounds good?";
  if(/\b(?:why|how|what|when|where|who|can you|do you)\b/.test(q)){
   memory.topic=raw;
   return pick(real?["That's a good question. I'm not sure I've got the answer, but I'd like to hear what you think. What's your take?","Hmm, I wouldn't want to make something up. Tell me a little more about what you mean."]:["Ooh, interesting question! I might not know for certain, but we can think it through together. What do you reckon?","Now you've got me curious! Can you tell me more so I don't guess wrong?"],memory.turn);
  }
  memory.topic=raw;
  return pick(real?["I hear you"+address+". What's the main thing about that for you?","Right, I'm with you. What happened next?","That sounds worth talking about. How do you feel about it?"]:["I'm listening"+address+"! Tell me more!","Ooh! What happened next? I'm all ears. Well, brick ears.","I want to understand! What was the best or hardest part of that?"],memory.turn);
 }
 return {reply,memory};
}
