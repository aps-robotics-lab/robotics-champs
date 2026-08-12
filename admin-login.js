/* =========================================================
   ADMIN-LOGIN.JS
   APS ROBOTICS CHAMPIONSHIP 2026

   Firebase Project:
       aps-robotic-champs-2026

   IMPORTANT:
   - Uses mainFirebaseConfig
   - Only ADMIN_UID can access admin.html
   - Unauthorized Firebase users are signed out
   - Password reset supported
   - Mobile/tablet friendly
========================================================= */


/* =========================================================
   FIREBASE APP
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

import {
    mainFirebaseConfig,
    ADMIN_UID
} from "./firebase-config.js";


/* =========================================================
   FIREBASE AUTH
========================================================= */

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

let app;
let auth;

try {

    app = initializeApp(
        mainFirebaseConfig
    );

    auth = getAuth(
        app
    );

} catch (error) {

    console.error(
        "Firebase initialization error:",
        error
    );

}


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


const togglePassword =
    document.getElementById(
        "togglePassword"
    );


const forgotPasswordBtn =
    document.getElementById(
        "forgotPasswordBtn"
    );


/* =========================================================
   CONSTANTS
========================================================= */

const PLACEHOLDER_ADMIN_UID =
    "REPLACE_WITH_MAIN_PROJECT_ADMIN_UID";


/* =========================================================
   ADMIN UID CHECK
========================================================= */

function isAdminUIDConfigured() {

    return (
        typeof ADMIN_UID === "string" &&
        ADMIN_UID.trim() !== "" &&
        ADMIN_UID !== PLACEHOLDER_ADMIN_UID
    );

}


/* =========================================================
   CHECK ADMIN USER
========================================================= */

function isAuthorizedAdmin(user) {

    if (!user) {
        return false;
    }

    if (!isAdminUIDConfigured()) {

        console.error(
            "ADMIN_UID is not configured in firebase-config.js"
        );

        return false;

    }

    return (
        user.uid ===
        ADMIN_UID
    );

}


/* =========================================================
   MESSAGE HELPER
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
   LOADING STATE
========================================================= */

function setLoginLoading(
    loading
) {

    if (loginBtn) {

        loginBtn.disabled =
            loading;

        loginBtn.classList.toggle(
            "is-loading",
            loading
        );

    }

}


/* =========================================================
   SHOW LOGIN SCREEN
========================================================= */

function showLoginScreen() {

    loadingScreen?.classList.add(
        "hidden"
    );

    loginMain?.classList.remove(
        "hidden"
    );

}


/* =========================================================
   SHOW LOADING SCREEN
========================================================= */

function showLoadingScreen() {

    loadingScreen?.classList.remove(
        "hidden"
    );

    loginMain?.classList.add(
        "hidden"
    );

}


/* =========================================================
   FRIENDLY FIREBASE AUTH ERRORS
========================================================= */

function friendlyError(
    error
) {

    if (!error) {

        return (
            "Unable to sign in. " +
            "Please try again."
        );

    }


    switch (error.code) {


        /* -------------------------------------------------
           INVALID EMAIL
        ------------------------------------------------- */

        case "auth/invalid-email":

            return (
                "That email address doesn't " +
                "look right."
            );


        /* -------------------------------------------------
           USER DISABLED
        ------------------------------------------------- */

        case "auth/user-disabled":

            return (
                "This account has been disabled."
            );


        /* -------------------------------------------------
           USER NOT FOUND / WRONG PASSWORD
        ------------------------------------------------- */

        case "auth/user-not-found":

        case "auth/wrong-password":

        case "auth/invalid-credential":

            return (
                "Incorrect email or password."
            );


        /* -------------------------------------------------
           TOO MANY REQUESTS
        ------------------------------------------------- */

        case "auth/too-many-requests":

            return (
                "Too many login attempts. " +
                "Please wait a moment and try again."
            );


        /* -------------------------------------------------
           NETWORK
        ------------------------------------------------- */

        case "auth/network-request-failed":

            return (
                "Network error. " +
                "Check your internet connection and try again."
            );


        /* -------------------------------------------------
           OPERATION NOT ALLOWED
        ------------------------------------------------- */

        case "auth/operation-not-allowed":

            return (
                "Email/password login is not enabled " +
                "in Firebase Authentication."
            );


        /* -------------------------------------------------
           DEFAULT
        ------------------------------------------------- */

        default:

            return (
                "Unable to sign in. " +
                "Please try again."
            );

    }

}


/* =========================================================
   TOGGLE PASSWORD VISIBILITY
========================================================= */

togglePassword?.addEventListener(
    "click",
    () => {

        if (!loginPassword) {
            return;
        }


        const passwordHidden =
            loginPassword.type === "password";


        loginPassword.type =
            passwordHidden
                ? "text"
                : "password";


        if (togglePassword) {

            togglePassword.innerHTML =
                passwordHidden

                    ? '<i class="fa-solid fa-eye-slash"></i>'

                    : '<i class="fa-solid fa-eye"></i>';


            togglePassword.title =
                passwordHidden
                    ? "Hide password"
                    : "Show password";

            togglePassword.setAttribute(
                "aria-label",
                passwordHidden
                    ? "Hide password"
                    : "Show password"
            );

        }

    }
);


/* =========================================================
   FORGOT PASSWORD
========================================================= */

forgotPasswordBtn?.addEventListener(
    "click",
    async () => {

        if (!auth) {

            showMessage(
                "Firebase is not initialized.",
                "error"
            );

            return;

        }


        const email =
            loginEmail?.value
                ?.trim();


        /* -------------------------------------------------
           EMAIL REQUIRED
        ------------------------------------------------- */

        if (!email) {

            showMessage(
                "Enter your administrator email address first.",
                "error"
            );

            loginEmail?.focus();

            return;

        }


        /* -------------------------------------------------
           BASIC EMAIL VALIDATION
        ------------------------------------------------- */

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email
            )
        ) {

            showMessage(
                "Enter a valid email address.",
                "error"
            );

            loginEmail?.focus();

            return;

        }


        try {

            forgotPasswordBtn.disabled =
                true;


            showMessage(
                "Sending password reset email..."
            );


            await sendPasswordResetEmail(
                auth,
                email
            );


            showMessage(
                "Password reset email sent. Check your inbox.",
                "success"
            );


        } catch (error) {

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


        } finally {

            forgotPasswordBtn.disabled =
                false;

        }

    }
);


/* =========================================================
   LOGIN FORM
========================================================= */

loginForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!auth) {

            showMessage(
                "Firebase is not initialized. Please refresh the page.",
                "error"
            );

            return;

        }


        const email =
            loginEmail?.value
                ?.trim();


        const password =
            loginPassword?.value ||
            "";


        /* -------------------------------------------------
           VALIDATION
        ------------------------------------------------- */

        if (!email) {

            showMessage(
                "Enter your email address.",
                "error"
            );

            loginEmail?.focus();

            return;

        }


        if (!password) {

            showMessage(
                "Enter your password.",
                "error"
            );

            loginPassword?.focus();

            return;

        }


        /* -------------------------------------------------
           CHECK CONFIGURATION
        ------------------------------------------------- */

        if (!isAdminUIDConfigured()) {

            console.error(
                "ADMIN_UID is missing or still uses the placeholder value."
            );


            showMessage(
                "Administrator access is not configured. Check firebase-config.js.",
                "error"
            );

            return;

        }


        /* -------------------------------------------------
           START LOADING
        ------------------------------------------------- */

        showMessage(
            "Signing in..."
        );


        setLoginLoading(
            true
        );


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            /*
             * Do NOT redirect here.
             *
             * onAuthStateChanged()
             * performs the authorization check.
             */


        } catch (error) {

            console.error(
                "Administrator sign-in error:",
                error
            );


            showMessage(
                friendlyError(
                    error
                ),
                "error"
            );


            setLoginLoading(
                false
            );

        }

    }
);


/* =========================================================
   AUTH STATE
========================================================= */

if (auth) {

    onAuthStateChanged(
        auth,
        async user => {

            /* ---------------------------------------------
               NO USER
            --------------------------------------------- */

            if (!user) {

                showLoginScreen();

                setLoginLoading(
                    false
                );

                return;

            }


            /* ---------------------------------------------
               USER EXISTS
               CHECK ADMIN UID
            --------------------------------------------- */

            showLoadingScreen();


            if (
                !isAuthorizedAdmin(
                    user
                )
            ) {

                console.warn(
                    "Unauthorized admin login attempt:",
                    user.uid
                );


                try {

                    await signOut(
                        auth
                    );

                } catch (error) {

                    console.error(
                        "Unauthorized user sign-out error:",
                        error
                    );

                }


                showLoginScreen();


                showMessage(
                    "Access denied. This account is not authorized as the administrator.",
                    "error"
                );


                setLoginLoading(
                    false
                );


                return;

            }


            /* ---------------------------------------------
               AUTHORIZED ADMIN
            --------------------------------------------- */

            console.log(
                "Administrator authenticated:",
                user.uid
            );


            /*
             * Small delay is not required for security.
             * Firebase has already confirmed authentication.
             */

            window.location.replace(
                "admin.html"
            );

        }
    );

} else {

    /* ---------------------------------------------
       FIREBASE FAILED
    --------------------------------------------- */

    showLoginScreen();


    showMessage(
        "Firebase could not be initialized. Check firebase-config.js.",
        "error"
    );

}


/* =========================================================
   PREVENT ENTERING LOGIN WITH A STALE SESSION
========================================================= */

window.addEventListener(
    "pageshow",
    () => {

        /*
         * Firebase Auth automatically restores
         * the authenticated session.
         *
         * onAuthStateChanged() above handles
         * the actual authorization.
         */

    }
);


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        /*
         * No manual Firebase listener cleanup
         * is necessary here because this page
         * normally redirects immediately after
         * successful authentication.
         */

    }
);
