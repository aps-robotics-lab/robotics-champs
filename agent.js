/* =========================================================
   AGENT.JS
   APS ROBOTICS CHAMPIONSHIP 2026
   ---------------------------------------------------------
   DATABASE:

       /agents
       /tickets
       /ticketStatusLookup

   AUTHORIZED STRUCTURE:

       agents/
           UID: true

   ALSO SUPPORTED:

       agents/
           UID:
               active: true
               name: "Support Agent"

   IMPORTANT:
   Firebase Rules are NOT changed by this file.
========================================================= */


import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getDatabase,
    ref,
    get,
    onValue,
    update
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
   PATHS
========================================================= */

const AGENTS_PATH =
    "agents";

const TICKETS_PATH =
    "tickets";

const LOOKUP_PATH =
    "ticketStatusLookup";


/* =========================================================
   STATE
========================================================= */

let tickets = {};

let selectedTicketKey =
    null;

let currentAgentProfile =
    null;

let unsubscribeTickets =
    null;


/* =========================================================
   ELEMENTS
========================================================= */

const ticketList =
    document.getElementById(
        "ticketList"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const statusMessage =
    document.getElementById(
        "statusMessage"
    );


const totalTickets =
    document.getElementById(
        "totalTickets"
    );

const openTickets =
    document.getElementById(
        "openTickets"
    );

const progressTickets =
    document.getElementById(
        "progressTickets"
    );

const closedTickets =
    document.getElementById(
        "closedTickets"
    );


const ticketOverlay =
    document.getElementById(
        "ticketOverlay"
    );

const closeModal =
    document.getElementById(
        "closeModal"
    );

const modalSubject =
    document.getElementById(
        "modalSubject"
    );

const modalTicketId =
    document.getElementById(
        "modalTicketId"
    );

const modalName =
    document.getElementById(
        "modalName"
    );

const modalRegistrationId =
    document.getElementById(
        "modalRegistrationId"
    );

const modalReferenceId =
    document.getElementById(
        "modalReferenceId"
    );

const modalClass =
    document.getElementById(
        "modalClass"
    );

const modalSection =
    document.getElementById(
        "modalSection"
    );

const modalEmail =
    document.getElementById(
        "modalEmail"
    );

const modalCategory =
    document.getElementById(
        "modalCategory"
    );

const problemSubject =
    document.getElementById(
        "problemSubject"
    );

const problemMessage =
    document.getElementById(
        "problemMessage"
    );

const modalStatus =
    document.getElementById(
        "modalStatus"
    );

const modalPriority =
    document.getElementById(
        "modalPriority"
    );

const modalProgress =
    document.getElementById(
        "modalProgress"
    );

const modalCreated =
    document.getElementById(
        "modalCreated"
    );

const modalUpdated =
    document.getElementById(
        "modalUpdated"
    );

const claimTicketBtn =
    document.getElementById(
        "claimTicketBtn"
    );

const agentReply =
    document.getElementById(
        "agentReply"
    );

const modalMessage =
    document.getElementById(
        "modalMessage"
    );

const setOpenBtn =
    document.getElementById(
        "setOpenBtn"
    );

const setProgressBtn =
    document.getElementById(
        "setProgressBtn"
    );

const saveReplyBtn =
    document.getElementById(
        "saveReplyBtn"
    );

const setClosedBtn =
    document.getElementById(
        "setClosedBtn"
    );


/* =========================================================
   HELPERS
========================================================= */

function firstValue(
    object,
    fields,
    fallback = ""
) {

    if (!object) {
        return fallback;
    }

    for (const field of fields) {

        const value =
            object[field];

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            return value;

        }

    }

    return fallback;

}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   TICKET DATA HELPERS
========================================================= */

function ticketId(
    ticket,
    key
) {

    return firstValue(
        ticket,
        [
            "ticketId",
            "ticketID",
            "TicketId",
            "TicketID",
            "id"
        ],
        key
    );

}


function registrationId(
    ticket
) {

    return firstValue(
        ticket,
        [
            "registrationId",
            "registrationID",
            "registrationReference",
            "registrationReferenceId",
            "registrationNumber",
            "registrationNo",
            "regId",
            "regID",
            "regNumber",
            "regNo"
        ],
        ""
    );

}


function ticketName(
    ticket
) {

    return firstValue(
        ticket,
        [
            "name",
            "studentName",
            "student",
            "leaderName",
            "participantName",
            "fullName"
        ],
        "-"
    );

}


function ticketClass(
    ticket
) {

    return firstValue(
        ticket,
        [
            "className",
            "studentClass",
            "class",
            "Class"
        ],
        "-"
    );

}


function ticketSection(
    ticket
) {

    return firstValue(
        ticket,
        [
            "section",
            "studentSection",
            "Section"
        ],
        "-"
    );

}


function ticketEmail(
    ticket
) {

    return firstValue(
        ticket,
        [
            "email",
            "emailAddress",
            "Email",
            "EmailAddress"
        ],
        "-"
    );

}


function ticketCategory(
    ticket
) {

    return firstValue(
        ticket,
        [
            "category",
            "issueCategory",
            "type"
        ],
        "General"
    );

}


function ticketSubject(
    ticket
) {

    return firstValue(
        ticket,
        [
            "subject",
            "title",
            "problemSubject"
        ],
        "Support Ticket"
    );

}


function ticketMessage(
    ticket
) {

    return firstValue(
        ticket,
        [
            "message",
            "problemMessage",
            "description",
            "issue",
            "details"
        ],
        "No message provided."
    );

}


function ticketStatus(
    ticket
) {

    return firstValue(
        ticket,
        [
            "status",
            "ticketStatus"
        ],
        "Waiting for Approval"
    );

}


function ticketPriority(
    ticket
) {

    return firstValue(
        ticket,
        [
            "priority",
            "ticketPriority"
        ],
        "Normal"
    );

}


function createdAt(
    ticket
) {

    return firstValue(
        ticket,
        [
            "createdAt",
            "created_at",
            "timestamp",
            "submittedAt",
            "date"
        ],
        ""
    );

}


function updatedAt(
    ticket
) {

    return firstValue(
        ticket,
        [
            "updatedAt",
            "updated_at",
            "lastUpdated"
        ],
        createdAt(ticket)
    );

}


function timestampNumber(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }

    if (
        typeof value === "number"
    ) {

        return value;

    }

    if (
        typeof value === "object" &&
        value?.seconds
    ) {

        return Number(
            value.seconds
        ) * 1000;

    }

    const number =
        Number(value);

    if (
        Number.isFinite(number)
    ) {

        return number;

    }

    const date =
        new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? 0
        : date.getTime();

}


function formatDate(
    value
) {

    const timestamp =
        timestampNumber(value);

    if (!timestamp) {
        return "-";
    }

    return new Date(
        timestamp
    ).toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   STATUS
========================================================= */

function showStatus(
    text,
    type = ""
) {

    if (!statusMessage) {
        return;
    }

    statusMessage.textContent =
        text;

    statusMessage.className =
        `status-message ${type}`.trim();

}


/* =========================================================
   AGENT AUTHORIZATION
   ---------------------------------------------------------
   IMPORTANT:

   Your Rules:

   "agents": {
      "$uid": {
         ".read":
           "auth != null && auth.uid === $uid"
      }
   }

   Therefore this exact path is used:

       agents/<CURRENT USER UID>
========================================================= */

async function authorizeAgent(
    user
) {

    if (!user) {
        return false;
    }

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    `${AGENTS_PATH}/${user.uid}`
                )
            );


        if (!snapshot.exists()) {

            console.error(
                "No /agents entry for UID:",
                user.uid
            );

            return false;

        }


        const value =
            snapshot.val();


        /* UID: true */

        if (value === true) {

            currentAgentProfile = {

                uid:
                    user.uid,

                active:
                    true,

                name:
                    user.email ||
                    "Support Agent",

                role:
                    "Support Agent"

            };

            return true;

        }


        /* UID: { active: true } */

        if (
            typeof value === "object" &&
            value !== null &&
            value.active === true
        ) {

            currentAgentProfile = {

                uid:
                    user.uid,

                ...value

            };

            return true;

        }


        return false;

    }

    catch (error) {

        console.error(
            "Agent authorization failed:",
            error
        );

        return false;

    }

}


/* =========================================================
   SEARCH
========================================================= */

function matchesSearch(
    key,
    ticket
) {

    const query =
        searchInput?.value
            ?.trim()
            .toLowerCase() ||
        "";

    if (!query) {
        return true;
    }

    const searchable = [

        key,

        ticketId(
            ticket,
            key
        ),

        registrationId(
            ticket
        ),

        ticket.referenceId,

        ticketName(
            ticket
        ),

        ticketClass(
            ticket
        ),

        ticketSection(
            ticket
        ),

        ticketEmail(
            ticket
        ),

        ticketCategory(
            ticket
        ),

        ticketSubject(
            ticket
        ),

        ticketMessage(
            ticket
        ),

        ticketStatus(
            ticket
        ),

        ticketPriority(
            ticket
        ),

        ticket.agentReply

    ]
        .filter(
            value =>
                value !== undefined &&
                value !== null
        )
        .join(" ")
        .toLowerCase();

    return searchable.includes(
        query
    );

}


/* =========================================================
   FILTER
========================================================= */

function matchesFilter(
    ticket
) {

    const selected =
        statusFilter?.value ||
        "All";

    if (
        selected === "All"
    ) {

        return true;

    }

    return (
        ticketStatus(ticket) ===
        selected
    );

}


/* =========================================================
   STATS
========================================================= */

function updateStats() {

    const list =
        Object.values(
            tickets
        );

    const total =
        list.length;

    const open =
        list.filter(
            ticket => {

                const status =
                    ticketStatus(ticket);

                return (
                    status === "Open" ||
                    status === "Waiting for Approval"
                );

            }
        ).length;

    const progress =
        list.filter(
            ticket =>
                ticketStatus(ticket) ===
                "In Progress"
        ).length;

    const closed =
        list.filter(
            ticket =>
                ticketStatus(ticket) ===
                "Closed"
        ).length;


    if (totalTickets) {

        totalTickets.textContent =
            total;

    }

    if (openTickets) {

        openTickets.textContent =
            open;

    }

    if (progressTickets) {

        progressTickets.textContent =
            progress;

    }

    if (closedTickets) {

        closedTickets.textContent =
            closed;

    }

}


/* =========================================================
   RENDER TICKETS
========================================================= */

function renderTickets() {

    if (!ticketList) {
        return;
    }

    updateStats();


    const entries =
        Object.entries(
            tickets
        )
        .filter(
            ([key, ticket]) =>
                matchesSearch(
                    key,
                    ticket
                ) &&
                matchesFilter(
                    ticket
                )
        )
        .sort(
            ([, a], [, b]) =>
                timestampNumber(
                    updatedAt(b)
                ) -
                timestampNumber(
                    updatedAt(a)
                )
        );


    if (!entries.length) {

        ticketList.innerHTML = `

            <div class="empty-state">

                <div>🎫</div>

                <h3>
                    No tickets found
                </h3>

                <p>
                    There are no support requests
                    matching your search.
                </p>

            </div>

        `;

        return;

    }


    ticketList.innerHTML =
        entries
            .map(
                ([key, ticket]) => {

                    const status =
                        ticketStatus(ticket);

                    const statusClass =
                        status
                            .toLowerCase()
                            .replace(
                                /\s+/g,
                                "-"
                            );

                    const reference =
                        ticket.referenceId ||
                        registrationId(ticket) ||
                        "Not available";


                    return `

                        <button
                            type="button"
                            class="ticket-card"
                            data-key="${escapeHTML(key)}"
                        >

                            <div class="ticket-card-top">

                                <span class="ticket-number">

                                    #${escapeHTML(
                                        ticketId(
                                            ticket,
                                            key
                                        )
                                    )}

                                </span>

                                <span
                                    class="ticket-status ${escapeHTML(
                                        statusClass
                                    )}"
                                >

                                    ${escapeHTML(
                                        status
                                    )}

                                </span>

                            </div>


                            <h3>

                                ${escapeHTML(
                                    ticketSubject(
                                        ticket
                                    )
                                )}

                            </h3>


                            <p class="ticket-preview">

                                ${escapeHTML(
                                    ticketMessage(
                                        ticket
                                    )
                                )}

                            </p>


                            <div class="ticket-card-info">

                                <span>
                                    👤
                                    ${escapeHTML(
                                        ticketName(
                                            ticket
                                        )
                                    )}
                                </span>

                                <span>
                                    ✉
                                    ${escapeHTML(
                                        ticketEmail(
                                            ticket
                                        )
                                    )}
                                </span>

                                <span>
                                    🏷
                                    ${escapeHTML(
                                        ticketCategory(
                                            ticket
                                        )
                                    )}
                                </span>

                                <span>
                                    ⚡
                                    ${escapeHTML(
                                        ticketPriority(
                                            ticket
                                        )
                                    )}
                                </span>

                            </div>


                            <div class="ticket-card-bottom">

                                <span>

                                    Reference:
                                    ${escapeHTML(
                                        reference
                                    )}

                                </span>

                                <span>

                                    ${escapeHTML(
                                        formatDate(
                                            updatedAt(
                                                ticket
                                            )
                                        )
                                    )}

                                </span>

                            </div>

                        </button>

                    `;

                }
            )
            .join("");


    ticketList
        .querySelectorAll(
            ".ticket-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        openTicket(
                            card.dataset.key
                        );

                    }
                );

            }
        );

}


/* =========================================================
   OPEN TICKET
========================================================= */

function openTicket(
    key
) {

    const ticket =
        tickets[key];

    if (!ticket) {

        showStatus(
            "Ticket could not be found.",
            "error"
        );

        return;

    }


    selectedTicketKey =
        key;


    if (modalSubject) {

        modalSubject.textContent =
            ticketSubject(ticket);

    }

    if (modalTicketId) {

        modalTicketId.textContent =
            ticketId(
                ticket,
                key
            );

    }

    if (modalName) {

        modalName.textContent =
            ticketName(ticket);

    }

    if (modalRegistrationId) {

        modalRegistrationId.textContent =
            registrationId(ticket) ||
            "Not provided";

    }

    if (modalReferenceId) {

        modalReferenceId.textContent =
            ticket.referenceId ||
            "Not available";

    }

    if (modalClass) {

        modalClass.textContent =
            ticketClass(ticket);

    }

    if (modalSection) {

        modalSection.textContent =
            ticketSection(ticket);

    }

    if (modalEmail) {

        modalEmail.textContent =
            ticketEmail(ticket);

    }

    if (modalCategory) {

        modalCategory.textContent =
            ticketCategory(ticket);

    }

    if (problemSubject) {

        problemSubject.textContent =
            ticketSubject(ticket);

    }

    if (problemMessage) {

        problemMessage.textContent =
            ticketMessage(ticket);

    }

    if (modalStatus) {

        modalStatus.textContent =
            ticketStatus(ticket);

    }

    if (modalPriority) {

        modalPriority.textContent =
            ticketPriority(ticket);

    }


    const progress =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    ticket.progress || 0
                )
            )
        );


    if (modalProgress) {

        modalProgress.textContent =
            `${progress}%`;

    }

    if (modalCreated) {

        modalCreated.textContent =
            formatDate(
                createdAt(ticket)
            );

    }

    if (modalUpdated) {

        modalUpdated.textContent =
            formatDate(
                updatedAt(ticket)
            );

    }

    if (agentReply) {

        agentReply.value =
            ticket.agentReply ||
            "";

    }

    if (modalMessage) {

        modalMessage.textContent =
            "";

    }


    if (claimTicketBtn) {

        const assigned =
            ticket.assignedAgentUid ||
            "";

        if (!assigned) {

            claimTicketBtn.textContent =
                "Claim Ticket";

            claimTicketBtn.disabled =
                false;

        }

        else if (
            assigned ===
            auth.currentUser?.uid
        ) {

            claimTicketBtn.textContent =
                "✓ Assigned to me";

            claimTicketBtn.disabled =
                true;

        }

        else {

            claimTicketBtn.textContent =
                "Assigned to another agent";

            claimTicketBtn.disabled =
                true;

        }

    }


    ticketOverlay?.classList.remove(
        "hidden"
    );

}


/* =========================================================
   CLOSE
========================================================= */

function closeTicketModal() {

    ticketOverlay?.classList.add(
        "hidden"
    );

    selectedTicketKey =
        null;

}


closeModal?.addEventListener(
    "click",
    closeTicketModal
);


ticketOverlay?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            ticketOverlay
        ) {

            closeTicketModal();

        }

    }
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeTicketModal();

        }

    }
);


/* =========================================================
   UPDATE TICKET
========================================================= */

async function updateTicket(
    changes,
    successMessage
) {

    if (!selectedTicketKey) {

        return;

    }

    const user =
        auth.currentUser;

    if (!user) {

        showStatus(
            "Your login session has expired.",
            "error"
        );

        return;

    }

    const ticket =
        tickets[
            selectedTicketKey
        ];

    if (!ticket) {

        return;

    }


    try {

        if (modalMessage) {

            modalMessage.textContent =
                "Saving...";

        }


        const now =
            Date.now();


        const next = {

            ...ticket,

            ...changes,

            updatedAt:
                now,

            updatedBy:
                user.uid

        };


        let progress =
            Number(
                next.progress
            );


        if (
            !Number.isFinite(
                progress
            )
        ) {

            progress = 0;

        }


        progress =
            Math.max(
                0,
                Math.min(
                    100,
                    progress
                )
            );


        const status =
            next.status ||
            "Waiting for Approval";


        /*
         * IMPORTANT:
         *
         * The lookup key MUST be the ticket's
         * referenceId, because your Rules use:
         *
         * $referenceId
         */

        const referenceId =
            next.referenceId;


        if (!referenceId) {

            throw new Error(
                "Ticket does not contain a referenceId."
            );

        }


        const lookup = {

            referenceId,

            status,

            progress,

            statusNote:
                next.statusNote ||
                "Our team will review your request and contact you soon.",

            updatedAt:
                now

        };


        /*
         * Your Rules allow authorized agents
         * to update both locations.
         */

        await update(
            ref(db),
            {

                [`${TICKETS_PATH}/${selectedTicketKey}`]:
                    {
                        ...next,
                        progress
                    },

                [`${LOOKUP_PATH}/${referenceId}`]:
                    lookup

            }
        );


        if (modalMessage) {

            modalMessage.textContent =
                successMessage;

        }


        showStatus(
            successMessage,
            "success"
        );


        /*
         * Refresh the currently open ticket
         * from local state.
         */

        tickets[
            selectedTicketKey
        ] = {

            ...next,

            progress

        };


        renderTickets();

        openTicket(
            selectedTicketKey
        );

    }

    catch (error) {

        console.error(
            "Ticket update failed:",
            error
        );


        if (modalMessage) {

            modalMessage.textContent =
                error?.message ||
                "Unable to save changes.";

        }


        showStatus(
            "Unable to update ticket. Check Firebase Rules and the ticket reference ID.",
            "error"
        );

    }

}


/* =========================================================
   SAVE REPLY
========================================================= */

saveReplyBtn?.addEventListener(
    "click",
    async () => {

        const reply =
            agentReply?.value
                ?.trim() ||
            "";

        if (!selectedTicketKey) {
            return;
        }

        if (!reply) {

            if (modalMessage) {

                modalMessage.textContent =
                    "Please write a reply first.";

            }

            return;

        }


        await updateTicket(
            {
                agentReply:
                    reply
            },
            "✓ Agent reply saved."
        );

    }
);


/* =========================================================
   SET OPEN
========================================================= */

setOpenBtn?.addEventListener(
    "click",
    async () => {

        await updateTicket(
            {

                status:
                    "Open",

                progress:
                    0,

                statusNote:
                    "Your request is in the support queue. Our team will contact you soon."

            },
            "✓ Ticket marked Open."
        );

    }
);


/* =========================================================
   SET IN PROGRESS
========================================================= */

setProgressBtn?.addEventListener(
    "click",
    async () => {

        await updateTicket(
            {

                status:
                    "In Progress",

                progress:
                    50,

                statusNote:
                    "A support agent is currently reviewing your request."

            },
            "✓ Ticket marked In Progress."
        );

    }
);


/* =========================================================
   SET CLOSED
========================================================= */

setClosedBtn?.addEventListener(
    "click",
    async () => {

        await updateTicket(
            {

                status:
                    "Closed",

                progress:
                    100,

                statusNote:
                    "Your support request has been resolved. Please contact the Help Center again if you need further assistance.",

                resolvedAt:
                    Date.now(),

                resolvedBy:
                    auth.currentUser?.uid ||
                    ""

            },
            "✓ Ticket marked as solved."
        );

    }
);


/* =========================================================
   CLAIM
========================================================= */

claimTicketBtn?.addEventListener(
    "click",
    async () => {

        const user =
            auth.currentUser;

        if (
            !user ||
            !selectedTicketKey
        ) {

            return;

        }


        const ticket =
            tickets[
                selectedTicketKey
            ];

        if (!ticket) {
            return;
        }


        const existing =
            ticket.assignedAgentUid ||
            "";


        if (
            existing &&
            existing !== user.uid
        ) {

            if (modalMessage) {

                modalMessage.textContent =
                    "This ticket is already assigned to another agent.";

            }

            return;

        }


        const name =
            currentAgentProfile?.name ||
            user.email ||
            "Support Agent";


        await updateTicket(
            {

                assignedAgentUid:
                    user.uid,

                assignedAgentName:
                    name

            },
            "✓ Ticket assigned to you."
        );


        if (claimTicketBtn) {

            claimTicketBtn.textContent =
                "✓ Assigned to me";

            claimTicketBtn.disabled =
                true;

        }

    }
);


/* =========================================================
   LOAD TICKETS
========================================================= */

function loadTickets() {

    if (unsubscribeTickets) {

        unsubscribeTickets();

        unsubscribeTickets =
            null;

    }


    showStatus(
        "Loading support tickets..."
    );


    const ticketsRef =
        ref(
            db,
            TICKETS_PATH
        );


    unsubscribeTickets =
        onValue(

            ticketsRef,

            snapshot => {

                const data =
                    snapshot.val();


                tickets =
                    data &&
                    typeof data === "object"
                        ? data
                        : {};


                console.log(
                    "Tickets loaded:",
                    tickets
                );


                renderTickets();


                showStatus(
                    `${Object.keys(tickets).length} support ticket(s) loaded.`,
                    "success"
                );

            },

            error => {

                console.error(
                    "Ticket read error:",
                    error
                );


                tickets = {};


                renderTickets();


                showStatus(
                    "Unable to load tickets. Firebase denied access.",
                    "error"
                );

            }

        );

}


/* =========================================================
   SEARCH
========================================================= */

searchInput?.addEventListener(
    "input",
    renderTickets
);


/* =========================================================
   FILTER
========================================================= */

statusFilter?.addEventListener(
    "change",
    renderTickets
);


/* =========================================================
   REFRESH
========================================================= */

refreshBtn?.addEventListener(
    "click",
    () => {

        loadTickets();

    }
);


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn?.addEventListener(
    "click",
    async () => {

        try {

            if (unsubscribeTickets) {

                unsubscribeTickets();

                unsubscribeTickets =
                    null;

            }


            await signOut(
                auth
            );


            window.location.replace(
                "./agent-login.html"
            );

        }

        catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        console.log(
            "Agent auth state:",
            user
                ? user.uid
                : "SIGNED OUT"
        );


        /* ---------------------------------------------
           NOT LOGGED IN
        --------------------------------------------- */

        if (!user) {

            window.location.replace(
                "./agent-login.html"
            );

            return;

        }


        /* ---------------------------------------------
           VERIFY AGENT
        --------------------------------------------- */

        const authorized =
            await authorizeAgent(
                user
            );


        if (!authorized) {

            console.error(
                "Unauthorized agent UID:",
                user.uid
            );


            await signOut(
                auth
            ).catch(
                () => {}
            );


            window.location.replace(
                "./agent-login.html"
            );

            return;

        }


        /* ---------------------------------------------
           AUTHORIZED
        --------------------------------------------- */

        console.log(
            "AUTHORIZED AGENT:",
            user.uid
        );

        console.log(
            "AGENT PROFILE:",
            currentAgentProfile
        );


        const agentName =
            currentAgentProfile?.name ||
            user.email ||
            "Support Agent";


        showStatus(
            `Agent authenticated: ${agentName}`,
            "success"
        );


        loadTickets();

    }
);
