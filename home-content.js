import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import { mainFirebaseConfig } from "./firebase-config.js";

const app = initializeApp(mainFirebaseConfig);
const db = getDatabase(app);
const setText = (selector,value) => { const el=document.querySelector(selector); if(el && value) el.textContent=value; };

onValue(ref(db,"siteContent/home"), snapshot => {
  if(!snapshot.exists()) return;
  const home=snapshot.val();
  setText("#adminHomeEyebrow",home.eyebrow);
  setText("#adminHomeTitle",home.title);
  setText("#adminHomeDescription",home.description);
  setText("#adminAboutTitle",home.aboutTitle);
  setText("#adminAboutDescription",home.aboutDescription);
  const button=document.querySelector("#adminHomeButton");
  if(button){ if(home.buttonText) button.textContent=home.buttonText; if(home.buttonLink) button.href=home.buttonLink; }
});

onValue(ref(db,"siteContent/messages"), snapshot => {
  const msgs=snapshot.exists()?snapshot.val():{};
  setText("#msgPrincipalText",msgs.principalText || "Welcome to a championship where curiosity becomes engineering. I encourage every student to participate with discipline, creativity and confidence.");
  setText("#msgPrincipalName","Sadhna Devi");
  setText("#msgMentorText",msgs.mentorText || "Design boldly, test patiently and learn from every failure. Your robot is not only a machine; it is a record of your teamwork and problem-solving.");
  setText("#msgMentorName","Akansha Rani");
  setText("#msgCoordText",msgs.coordText || "Please follow the schedule, arena instructions and judge decisions. We look forward to a safe, fair and exciting championship for every team.");
  setText("#msgCoordName",(msgs.coordName && msgs.coordName !== "Ayush Kumar Singh") ? msgs.coordName : "Championship Coordination Team");
  setText("#msgTeamText",msgs.teamText || "We are excited to welcome every participant to APS Robotics Championship 2026. Build responsibly, compete respectfully and enjoy the experience.");
  setText("#msgTeamName",msgs.teamName || "APS Robotics Championship Team");
});


onValue(ref(db,"siteContent/leadership"), snapshot => {
  if(!snapshot.exists()) return;
  const data=snapshot.val();
  const apply=(id,value,fallback)=>{ const el=document.getElementById(id); if(el && value) el.src=value; else if(el && fallback) el.src=fallback; };
  const setName=(id,value)=>{ const el=document.getElementById(id); if(el && value) el.textContent=value; };
  apply("principalPhoto",data.principalPhoto,"assets/principal.svg");
  apply("mentorPhoto",data.mentorPhoto,"assets/mentor.svg");
  apply("coordinatorPhoto",data.coordinatorPhoto,"assets/coordinator.svg");
  setName("principalName",data.principalName);
  setName("mentorName",data.mentorName);
  setName("coordinatorName",data.coordinatorName);
});
