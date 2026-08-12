import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { helpFirebaseConfig, AGENT_UIDS } from "./firebase-config.js";

const app = initializeApp(helpFirebaseConfig);
const auth = getAuth(app);

const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const message = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");

const allowed = new Set((AGENT_UIDS || []).filter(Boolean));

function setMessage(text, type="") {
    if (!message) return;
    message.textContent = text;
    message.className = `message ${type}`.trim();
}

togglePassword?.addEventListener("click", () => {
    if (!password) return;
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    togglePassword.textContent = show ? "🙈" : "👁";
});

form?.addEventListener("submit", async e => {
    e.preventDefault();
    const evalue = email?.value.trim() || "";
    const pvalue = password?.value || "";
    if (!evalue || !pvalue) return setMessage("Enter your email and password.", "error");

    setMessage("Authenticating...");
    try {
        const credential = await signInWithEmailAndPassword(auth, evalue, pvalue);
        if (allowed.size && !allowed.has(credential.user.uid)) {
            await signOut(auth);
            return setMessage("Access denied. This account is not an authorized agent.", "error");
        }
        window.location.replace("agent.html");
    } catch (err) {
        console.error(err);
        setMessage("Invalid agent credentials or Firebase Authentication is unavailable.", "error");
    }
});

onAuthStateChanged(auth, user => {
    if (user && (!allowed.size || allowed.has(user.uid))) {
        window.location.replace("agent.html");
    }
});
