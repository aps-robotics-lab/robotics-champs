import { AI_CHAT_ENDPOINT } from "./firebase-config.js";

const root=document.getElementById("apsChatbot");
if(root){
root.innerHTML=`<button class="aps-chat-launch" id="apsChatLaunch" aria-label="Open APS AI Assistant">🤖</button>
<div class="aps-chat-panel" id="apsChatPanel" hidden><div class="aps-chat-head"><div><b>APS AI Assistant</b><small>Robotics Championship 2026</small></div><button id="apsChatClose">×</button></div><div class="aps-chat-messages" id="apsChatMessages"></div><form id="apsChatForm"><input id="apsChatInput" maxlength="500" autocomplete="off" placeholder="Ask about registration, events or help…"><button>➤</button></form></div>`;
const panel=document.getElementById("apsChatPanel"), messages=document.getElementById("apsChatMessages"), form=document.getElementById("apsChatForm"), input=document.getElementById("apsChatInput");
const add=(text,who="bot")=>{const d=document.createElement("div");d.className=`aps-msg ${who}`;d.textContent=text;messages.appendChild(d);messages.scrollTop=messages.scrollHeight};
const faq=[
  [/registration|register|approval/i,"Registration is open. Submit the form, then your status will be Pending Approval. Our team will review it and contact you soon."],
  [/event|race|war|soccer|tug/i,"The championship has Robo Race, Robo War, Robo Tug of War and Robo Soccer. You can select multiple events during registration."],
  [/team|member|solo/i,"You can register solo or as a team of up to 5 participants. Team members need their name, class and section."],
  [/help|ticket|support|progress/i,"Use Help to submit a support request. You will receive an APS-XXXXX reference ID and can track progress with your reference ID plus email."],
  [/rule|regulation/i,"Please open the Rules page from the main menu for the latest competition rules."],
  [/principal|mentor|coordinator/i,"The Home page contains the Principal, Mentor and Coordinator section for the championship team."]
];
async function ask(q){
 if(AI_CHAT_ENDPOINT){
   try{const r=await fetch(AI_CHAT_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q})});if(r.ok){const x=await r.json();if(x.reply)return x.reply}}catch(e){console.warn("AI endpoint unavailable",e)}
 }
 return faq.find(([re])=>re.test(q))?.[1] || "I can help with registration, team size, events, rules and support tracking. Try asking one of those.";
}
document.getElementById("apsChatLaunch").onclick=()=>{panel.hidden=false;if(!messages.children.length)add("Hi! I’m the APS AI Assistant. How can I help with the Robotics Championship?")};
document.getElementById("apsChatClose").onclick=()=>panel.hidden=true;
form.onsubmit=async e=>{e.preventDefault();const q=input.value.trim();if(!q)return;add(q,"user");input.value="";add("Thinking…");const last=messages.lastElementChild;last.textContent=await ask(q);last.className="aps-msg bot"};
}
