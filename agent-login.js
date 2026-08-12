/* =========================================================
   AGENT-LOGIN.JS
   APS ROBOTICS CHAMPIONSHIP 2026
   ---------------------------------------------------------
   Firebase:
       helpFirebaseConfig

   Agent authorization:
       /agents/{UID}

   Supported:

       UID: true

   OR:

       UID:
           active: true
           name: "Support Agent"

   IMPORTANT:
   This file does NOT modify Firebase Rules.
========================================================= */


import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getDatabase,
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    helpFirebaseConfig
} from "./firebase-config.js";


/* =========================================================
   FIREBASE
========================================================= */

const app =
    initializeApp(
        helpFirebaseConfig
    );

const auth =
    getAuth(
        app
    );

const db =
    getDatabase(
        app
    );


/* =========================================================
   ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );

const loginMain =
    document.getElementById(
        "loginMain"
    );

const loginForm =
    document.getElementById(
        "loginForm"
    );

const loginEmail =
    document.getElementById(
        "loginEmail"
    );

const loginPassword =
    document.getElementById(
        "loginPassword"
    );

const loginMessage =
    document.getElementById(
        "loginMessage"
    );

const loginBtn =
    document.getElementById(
        "loginBtn"
    );

const loginBtnText =
    document.getElementById(
        "loginBtnText"
    );

const loginBtnLoading =
    document.getElementById(
        "loginBtnLoading"
    );

const togglePassword =
    document.getElementById(
        "togglePassword"
    );

const forgotPasswordBtn =
    document.getElementById(
        "forgotPasswordBtn"
    );


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    text,
    type = ""
) {

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent =
        text;

    loginMessage.className =
        `login-message ${type}`.trim();

}


/* =========================================================
   LOADING
========================================================= */

function setLoginLoading(
    loading
) {

    if (loginBtn) {
        loginBtn.disabled =
            loading;
    }

    loginBtnText?.classList.toggle(
        "hidden",
        loading
    );

    loginBtnLoading?.classList.toggle(
        "hidden",
        !loading
    );

}


/* =========================================================
   FRIENDLY FIREBASE ERRORS
========================================================= */

function friendlyError(
    error
) {

    const code =
        error?.code || "";

    switch (code) {

        case "auth/invalid-email":

            return "That email address doesn't look right.";

        case "auth/user-disabled":

            return "This account has been disabled.";

        case "auth/user-not-found":

        case "auth/wrong-password":

        case "auth/invalid-credential":

            return "Incorrect email or password.";

        case "auth/too-many-requests":

            return "Too many attempts. Please wait a moment and try again.";

        case "auth/network-request-failed":

            return "Network error. Check your internet connection.";

        case "auth/operation-not-allowed":

            return "Email/password sign-in is not enabled in Firebase Authentication.";

        default:

            return (
                error?.message ||
                "Unable to sign in. Please try again."
            );

    }

}


/* =========================================================
   CHECK AGENT
   ---------------------------------------------------------
   Your Rules allow the agent to READ only:

       /agents/{their-own-UID}

   Therefore we check exactly that location.
========================================================= */

async function checkAgent(
    user
) {

    if (!user) {
        return false;
    }

    const agentRef =
        ref(
            db,
            `agents/${user.uid}`
        );

    const snapshot =
        await get(
            agentRef
        );

    if (!snapshot.exists()) {
        return false;
    }

    const value =
        snapshot.val();


    /* ---------------------------------------------
       CURRENT STRUCTURE

       agents/
           UID: true
    --------------------------------------------- */

    if (value === true) {

        return true;

    }


    /* ---------------------------------------------
       FUTURE STRUCTURE

       agents/
           UID:
               active: true
    --------------------------------------------- */

    if (
        typeof value === "object" &&
        value !== null &&
        value.active === true
    ) {

        return true;

    }


    return false;

}


/* =========================================================
   TOGGLE PASSWORD
========================================================= */

togglePassword?.addEventListener(
    "click",
    () => {

        if (!loginPassword) {
            return;
        }

        const hidden =
            loginPassword.type === "password";

        loginPassword.type =
            hidden
                ? "text"
                : "password";

        togglePassword.innerHTML =
            hidden
                ? '<i class="fa-solid fa-eye-slash"></i>'
                : '<i class="fa-solid fa-eye"></i>';

        togglePassword.title =
            hidden
                ? "Hide password"
                : "Show password";

    }
);


/* =========================================================
   LOGIN
========================================================= */

loginForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const email =
            loginEmail?.value
                ?.trim()
                .toLowerCase() ||
            "";

        const password =
            loginPassword?.value ||
            "";


        if (!email || !password) {

            showMessage(
                "Enter both your email and password.",
                "error"
            );

            return;

        }


        setLoginLoading(true);

        showMessage(
            "Signing in..."
        );


        try {

            /* -----------------------------------------
               FIREBASE LOGIN
            ----------------------------------------- */

            const credential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                credential.user;


            console.log(
                "Firebase login successful:",
                user.uid
            );


            /* -----------------------------------------
               CHECK /agents/{UID}
            ----------------------------------------- */

            const authorized =
                await checkAgent(
                    user
                );


            if (!authorized) {

                console.error(
                    "Agent UID is not authorized:",
                    user.uid
                );


                await signOut(
                    auth
                );


                showMessage(
                    "Login successful, but this account is not authorized as a support agent.",
                    "error"
                );


                setLoginLoading(false);

                return;

            }


            /* -----------------------------------------
               AUTHORIZED
            ----------------------------------------- */

            showMessage(
                "Login successful. Opening dashboard...",
                "success"
            );


            console.log(
                "AUTHORIZED AGENT:",
                user.uid
            );


            /*
             * DIRECT REDIRECT
             *
             * This is intentionally done here instead
             * of waiting for onAuthStateChanged().
             */

            window.location.replace(
                "./agent.html"
            );

        }

        catch (error) {

            console.error(
                "Agent login error:",
                error
            );


            showMessage(
                friendlyError(
                    error
                ),
                "error"
            );


            setLoginLoading(false);

        }

    }
);


/* =========================================================
   FORGOT PASSWORD
========================================================= */

forgotPasswordBtn?.addEventListener(
    "click",
    async () => {

        const email =
            loginEmail?.value
                ?.trim()
                .toLowerCase() ||
            "";


        if (!email) {

            showMessage(
                "Enter your email address first.",
                "error"
            );

            loginEmail?.focus();

            return;

        }


        try {

            await sendPasswordResetEmail(
                auth,
                email
            );


            showMessage(
                "Password reset email sent. Check your inbox.",
                "success"
            );

        }

        catch (error) {

            console.error(
                "Password reset error:",
                error
            );


            showMessage(
                friendlyError(
                    error
                ),
                "error"
            );

        }

    }
);


/* =========================================================
   INITIAL AUTH CHECK
   ---------------------------------------------------------
   If an already-authenticated user opens login page,
   verify the UID before redirecting.
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        try {

            if (!user) {

                loadingScreen?.classList.add(
                    "hidden"
                );

                loginMain?.classList.remove(
                    "hidden"
                );

                return;

            }


            console.log(
                "Existing Firebase session:",
                user.uid
            );


            const authorized =
                await checkAgent(
                    user
                );


            if (authorized) {

                window.location.replace(
                    "./agent.html"
                );

                return;

            }


            await signOut(
                auth
            );


            loadingScreen?.classList.add(
                "hidden"
            );

            loginMain?.classList.remove(
                "hidden"
            );

        }

        catch (error) {

            console.error(
                "Initial auth check error:",
                error
            );


            loadingScreen?.classList.add(
                "hidden"
            );

            loginMain?.classList.remove(
                "hidden"
            );

        }

    }
);
