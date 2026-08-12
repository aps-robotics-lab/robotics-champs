/* =========================================================
   FIREBASE CENTRAL CONFIGURATION
   APS Robotics Championship 2026

   TWO SEPARATE FIREBASE PROJECTS:

   1) HELP + AGENT
      Project: robotics-championship-ab248
      Database: asia-southeast1

   2) REGISTRATION + ADMIN + HOME CONTENT
      Project: aps-robotics-championship
      Database: default (us-central style URL)
========================================================= */

export const helpFirebaseConfig = {
    apiKey: "AIzaSyCVfkLAc5EKDRUoHf4LgVhBFwTNmq2GMI0",
    authDomain: "robotics-championship-ab248.firebaseapp.com",
    databaseURL: "https://robotics-championship-ab248-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "robotics-championship-ab248",
    storageBucket: "robotics-championship-ab248.firebasestorage.app",
    messagingSenderId: "521981495733",
    appId: "1:521981495733:web:ecec2bc677a4450f19f1fc",
    measurementId: "G-NTBPB3MJ0E"
};

export const mainFirebaseConfig = {
    apiKey: "AIzaSyCucXDNlA86tU9ACdPm-oZGsAP_keBZ_uo",
    authDomain: "aps-robotics-championship.firebaseapp.com",
    databaseURL: "https://aps-robotics-championship-default-rtdb.firebaseio.com",
    projectId: "aps-robotics-championship",
    storageBucket: "aps-robotics-championship.firebasestorage.app",
    messagingSenderId: "1063542904891",
    appId: "1:1063542904891:web:82ff9bb3fba0b87384a41e",
    measurementId: "G-MJSYYZS50Z"
};

/* IMPORTANT:
   Replace this with the UID of the administrator account that
   exists in Firebase Authentication of aps-robotics-championship.
*/
export const ADMIN_UID = "REPLACE_WITH_MAIN_PROJECT_ADMIN_UID";

/* Only this Firebase Auth UID may access /tickets as an agent. */
export const AGENT_UID = "HgWiHPRx9gcXZtDTl0pDCpZlokt2";

/* Multi-agent support: Firebase /agents is the source of truth. */
export const AGENT_UIDS = [AGENT_UID];
