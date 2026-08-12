import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { mainFirebaseConfig, ADMIN_UID } from "./firebase-config.js";

const app = initializeApp(mainFirebaseConfig);
const auth = getAuth(app);

const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const message = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");

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
        if (ADMIN_UID && !ADMIN_UID.startsWith("PASTE_") && credential.user.uid !== ADMIN_UID) {
            await signOut(auth);
            return setMessage("Access denied. This account is not the administrator.", "error");
        }
        window.location.replace("admin.html");
    } catch (err) {
        console.error(err);
        setMessage("Invalid credentials or Firebase Authentication is unavailable.", "error");
    }
});

onAuthStateChanged(auth, user => {
    if (!user) return;
    if (!ADMIN_UID || ADMIN_UID.startsWith("PASTE_") || user.uid === ADMIN_UID) {
        window.location.replace("admin.html");
    }
});
