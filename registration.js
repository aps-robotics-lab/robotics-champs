import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getDatabase, ref, push, set, update } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import { mainFirebaseConfig } from "./firebase-config.js";

const app = initializeApp(mainFirebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const form = document.getElementById("registrationForm");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");
const successOverlay = document.getElementById("successOverlay");
const successRegistrationId = document.getElementById("successRegistrationId");
const continueBtn = document.getElementById("continueBtn");
const eventError = document.getElementById("eventError");
const membersSection = document.getElementById("membersSection");
const memberCards = document.getElementById("memberCards");
const memberInstruction = document.getElementById("memberInstruction");

const getValue = id => document.getElementById(id)?.value.trim() || "";
const getTeamSize = () => Number(document.querySelector('input[name="TeamSize"]:checked')?.value || 1);
const getSelectedEvents = () => [...document.querySelectorAll('input[name="Events"]:checked')].map(x => x.value);
const generateId = () => `APS-RBC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
const showMessage = (msg, type="error") => { formMessage.textContent = msg; formMessage.className = `form-message ${type}`; };

function createMemberCard(number) {
  const card = document.createElement("div");
  card.className = "member-card additional-member";
  card.dataset.member = number;
  card.innerHTML = `<div class="member-card-title"><span>MEMBER ${number}</span><strong>Participant ${number}</strong></div>
  <div class="field-grid">
    <div class="field full-field"><label for="member${number}Name">Full Name <span>*</span></label><input type="text" id="member${number}Name"></div>
    <div class="field"><label for="member${number}Class">Class <span>*</span></label><select id="member${number}Class"><option value="">Select</option><option>VI</option><option>VII</option><option>VIII</option><option>IX</option><option>X</option><option>XI</option><option>XII</option></select></div>
    <div class="field"><label for="member${number}Section">Section <span>*</span></label><input type="text" id="member${number}Section" maxlength="5"></div>
  </div>`;
  return card;
}

function updateMembers() {
  const size = getTeamSize();
  document.getElementById("participationType").value = size === 1 ? "Solo" : `Team of ${size}`;
  const team = size > 1;
  membersSection.hidden = !team;
  memberInstruction.textContent = team ? `This team has ${size} participants. Enter details for members 2–${size}.` : "Solo participation selected.";
  memberCards.replaceChildren();
  for (let i = 2; i <= size; i++) {
    const card = createMemberCard(i);
    memberCards.appendChild(card);
    ["Name","Class","Section"].forEach(part => { const el = document.getElementById(`member${i}${part}`); if (el) el.required = true; });
  }
}

document.querySelectorAll('input[name="TeamSize"]').forEach(input => input.addEventListener("change", updateMembers));
document.getElementById("mobileNumber")?.addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g, "").slice(0,10));
document.getElementById("emailAddress")?.addEventListener("blur", e => e.target.value = e.target.value.trim().toLowerCase());

document.querySelectorAll('input[name="Events"]').forEach(input => input.addEventListener("change", () => { if (getSelectedEvents().length) eventError.textContent = ""; }));

form?.addEventListener("submit", async e => {
  e.preventDefault();
  eventError.textContent = "";
  showMessage("");
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const events = getSelectedEvents();
  if (!events.length) { eventError.textContent = "Please select at least one event."; document.getElementById("eventsSection").scrollIntoView({behavior:"smooth"}); return; }
  const phone = getValue("mobileNumber");
  if (!/^[6-9]\d{9}$/.test(phone)) { showMessage("Enter a valid 10-digit Indian mobile number."); return; }
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
  try {
    if (!auth.currentUser) await signInAnonymously(auth);
    const teamSize = getTeamSize();
    const registrationId = generateId();
    const data = {
      registrationId,
      TeamSize: teamSize,
      ParticipationType: teamSize === 1 ? "Solo" : `Team of ${teamSize}`,
      StudentName: getValue("studentName"),
      Class: getValue("studentClass"),
      Section: getValue("studentSection").toUpperCase(),
      MobileNumber: phone,
      EmailAddress: getValue("emailAddress").toLowerCase(),
      TeamName: getValue("teamName"),
      Events: events,
      Remarks: getValue("remarks"),
      status: "Pending Approval",
      statusNote: "Our team will review your registration and contact you soon.",
      createdBy: auth.currentUser.uid,
      createdAt: Date.now(),
      timestamp: Date.now()
    };
    for (let i=2;i<=teamSize;i++) {
      data[`Member${i}Name`] = getValue(`member${i}Name`);
      data[`Member${i}Class`] = getValue(`member${i}Class`);
      data[`Member${i}Section`] = getValue(`member${i}Section`).toUpperCase();
    }
    const registrationRef = push(ref(db,"registrations"));
    const lookup = {
      registrationId,
      status: "Pending Approval",
      statusNote: "Our team will review your registration and contact you soon.",
      updatedAt: Date.now()
    };
    await update(ref(db), {
      [`registrations/${registrationRef.key}`]: data,
      [`registrationStatusLookup/${registrationId}`]: lookup
    });
    if (window.emailjs) emailjs.send("service_5m4uzhb","template_5qb8b2p",data).catch(()=>{});
    sessionStorage.setItem("apsRegistrationId", data.registrationId);
    sessionStorage.setItem("apsRegistrationName", data.StudentName);
    successRegistrationId.textContent = data.registrationId;
    successOverlay.classList.remove("hidden");
  } catch (err) {
    showMessage("Registration could not be submitted. Please check your internet connection and try again.");
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Submit Registration <i class="fa-solid fa-arrow-right"></i>';
  }
});
continueBtn?.addEventListener("click", () => location.href="thankyou.html");
updateMembers();
