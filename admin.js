/* =========================================================
   ADMIN.JS
   APS ROBOTICS CHAMPIONSHIP 2026

   COMPLETE CORRECTED VERSION

   FEATURES:
   - Firebase Authentication
   - /admins/{uid} authorization
   - ADMIN_UID fallback
   - Registration loading
   - Correct database field compatibility
   - Correct Team/Solo detection
   - TeamSize support
   - Member 2-5 / extended member support
   - Team member Class + Section display
   - Dashboard statistics
   - Search
   - Type/Event/Status filtering
   - Registration details
   - Edit registration
   - Delete registration
   - Approve registration
   - Reject registration
   - Status lookup
   - CSV export
   - Website content editor
   - Leadership content editor
   - Mobile sidebar
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
    onValue,
    update,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    mainFirebaseConfig,
    ADMIN_UID
} from "./firebase-config.js";


/* =========================================================
   FIREBASE
========================================================= */

const app = initializeApp(mainFirebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


/* =========================================================
   DATABASE PATHS
========================================================= */

const REGISTRATIONS_PATH = "registrations";
const ADMINS_PATH = "admins";
const STATUS_LOOKUP_PATH = "registrationStatusLookup";


/* =========================================================
   ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const appShell =
    document.getElementById("app");

const adminName =
    document.getElementById("adminName");

const adminEmail =
    document.getElementById("adminEmail");

const logoutBtn =
    document.getElementById("logoutBtn");

const refreshBtn =
    document.getElementById("refreshBtn");

const exportBtn =
    document.getElementById("exportBtn");

const search =
    document.getElementById("search");

const clearSearch =
    document.getElementById("clearSearch");

const typeFilter =
    document.getElementById("typeFilter");

const eventFilter =
    document.getElementById("eventFilter");

const statusFilter =
    document.getElementById("statusFilter");

const registrationBody =
    document.getElementById("registrationBody");

const mobileRegistrations =
    document.getElementById("mobileRegistrations");

const status =
    document.getElementById("status");


/* =========================================================
   DASHBOARD STATS
========================================================= */

const totalRegistrations =
    document.getElementById("totalRegistrations");

const soloCount =
    document.getElementById("soloCount");

const teamCount =
    document.getElementById("teamCount");

const eventEntries =
    document.getElementById("eventEntries");

const raceCount =
    document.getElementById("raceCount");

const warCount =
    document.getElementById("warCount");

const tugCount =
    document.getElementById("tugCount");

const soccerCount =
    document.getElementById("soccerCount");


/* =========================================================
   MESSAGE TARGET
========================================================= */

const messageTarget =
    document.getElementById("messageTarget");


if (messageTarget) {

    messageTarget.addEventListener(
        "change",
        () => {

            document
                .querySelectorAll("[data-message-panel]")
                .forEach(panel => {

                    panel.classList.toggle(
                        "hidden",
                        panel.dataset.messagePanel !==
                        messageTarget.value
                    );

                });

        }
    );

}


/* =========================================================
   DETAIL MODAL
========================================================= */

const detailOverlay =
    document.getElementById("detailOverlay");

const closeDetail =
    document.getElementById("closeDetail");

const detailId =
    document.getElementById("detailId");

const detailContent =
    document.getElementById("detailContent");


/* =========================================================
   EDIT MODAL
========================================================= */

const editOverlay =
    document.getElementById("editOverlay");

const closeEdit =
    document.getElementById("closeEdit");

const cancelEdit =
    document.getElementById("cancelEdit");

const editForm =
    document.getElementById("editForm");

const editKey =
    document.getElementById("editKey");

const editStudentName =
    document.getElementById("editStudentName");

const editStudentClass =
    document.getElementById("editStudentClass");

const editStudentSection =
    document.getElementById("editStudentSection");

const editMobileNumber =
    document.getElementById("editMobileNumber");

const editEmailAddress =
    document.getElementById("editEmailAddress");

const editTeamName =
    document.getElementById("editTeamName");

const editMembers =
    document.getElementById("editMembers");

const editRemarks =
    document.getElementById("editRemarks");

const editMessage =
    document.getElementById("editMessage");


/* =========================================================
   DELETE MODAL
========================================================= */

const confirmOverlay =
    document.getElementById("confirmOverlay");

const confirmMessage =
    document.getElementById("confirmMessage");

const cancelDeleteBtn =
    document.getElementById("cancelDelete");

const confirmDeleteBtn =
    document.getElementById("confirmDeleteBtn");

let pendingDeleteKey = null;


/* =========================================================
   TOAST
========================================================= */

const toast =
    document.getElementById("toast");

const toastText =
    document.getElementById("toastText");


/* =========================================================
   DATA
========================================================= */

let registrations = {};
let firebaseListener = null;
let authCheckFinished = false;


/* =========================================================
   WEBSITE CONTENT
========================================================= */

const saveContentBtn =
    document.getElementById("saveContentBtn");

const contentStatus =
    document.getElementById("contentStatus");


/* =========================================================
   STATUS
========================================================= */

function showStatus(message, type = "") {

    if (!status) {
        return;
    }

    status.textContent = message;
    status.className = "status " + type;

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    if (!toast || !toastText) {
        return;
    }

    toastText.textContent = message;

    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(
        () => {
            toast.classList.remove("show");
        },
        2500
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   VALUE HELPERS
========================================================= */

function valueOf(data, field, fallback = "") {

    if (
        data &&
        data[field] !== undefined &&
        data[field] !== null &&
        data[field] !== ""
    ) {
        return data[field];
    }

    return fallback;

}


function firstValue(data, fields, fallback = "") {

    for (const field of fields) {

        const value =
            valueOf(data, field, "");

        if (value !== "") {
            return value;
        }

    }

    return fallback;

}


/* =========================================================
   REGISTRATION ID
========================================================= */

function getRegistrationId(data, key) {

    return firstValue(
        data,
        [
            "registrationId",
            "registrationID",
            "regId",
            "id"
        ],
        key
    );

}


/* =========================================================
   LEADER NAME
   Current Rules use StudentName
========================================================= */

function getName(data) {

    return firstValue(
        data,
        [
            "StudentName",
            "studentName",
            "Student Name",
            "name",
            "leaderName",
            "teamLeaderName",
            "participantName"
        ],
        "—"
    );

}


/* =========================================================
   CLASS
========================================================= */

function getClassName(data) {

    return firstValue(
        data,
        [
            "Class",
            "studentClass",
            "className",
            "class"
        ],
        "—"
    );

}


/* =========================================================
   SECTION
========================================================= */

function getSection(data) {

    return firstValue(
        data,
        [
            "Section",
            "studentSection",
            "section"
        ],
        "—"
    );

}


/* =========================================================
   MOBILE
========================================================= */

function getMobile(data) {

    return firstValue(
        data,
        [
            "MobileNumber",
            "mobileNumber",
            "mobile",
            "phone",
            "phoneNumber"
        ],
        "—"
    );

}


/* =========================================================
   EMAIL
========================================================= */

function getEmail(data) {

    return firstValue(
        data,
        [
            "EmailAddress",
            "emailAddress",
            "email"
        ],
        "—"
    );

}


/* =========================================================
   TEAM NAME
========================================================= */

function getTeamName(data) {

    return firstValue(
        data,
        [
            "TeamName",
            "teamName",
            "team"
        ],
        "—"
    );

}


/* =========================================================
   STATUS
========================================================= */

function getRegistrationStatus(data) {

    return firstValue(
        data,
        [
            "status",
            "registrationStatus"
        ],
        "Pending Approval"
    );

}


/* =========================================================
   REMARKS
========================================================= */

function getRemarks(data) {

    return firstValue(
        data,
        [
            "remarks",
            "remark",
            "notes",
            "Remarks"
        ],
        ""
    );

}


/* =========================================================
   TIMESTAMP
========================================================= */

function getTimestamp(data) {

    return firstValue(
        data,
        [
            "timestamp",
            "createdAt",
            "created_at",
            "registeredAt",
            "registrationDate",
            "date"
        ],
        ""
    );

}


/* =========================================================
   EVENTS
   Rules require Events to have children.
========================================================= */

function getEvents(data) {

    const raw =
        firstValue(
            data,
            [
                "Events",
                "events",
                "selectedEvents",
                "event"
            ],
            []
        );


    if (Array.isArray(raw)) {
        return raw
            .map(value => String(value).trim())
            .filter(Boolean);
    }


    if (
        raw &&
        typeof raw === "object"
    ) {

        /*
         * Handles:
         *
         * Events:
         * {
         *   "Robo Race": true,
         *   "Robo War": true
         * }
         *
         * and:
         *
         * Events:
         * {
         *   "0": "Robo Race",
         *   "1": "Robo War"
         * }
         */

        const values = [];

        Object.entries(raw).forEach(
            ([key, value]) => {

                if (
                    typeof value === "boolean"
                ) {

                    if (value) {
                        values.push(key);
                    }

                    return;
                }


                if (
                    value &&
                    typeof value === "object"
                ) {

                    const eventName =
                        firstValue(
                            value,
                            [
                                "name",
                                "event",
                                "title"
                            ],
                            ""
                        );

                    if (eventName) {
                        values.push(eventName);
                    }

                    return;
                }


                if (
                    value !== null &&
                    value !== undefined &&
                    String(value).trim()
                ) {

                    values.push(
                        String(value).trim()
                    );

                }

            }
        );

        return values;
    }


    if (
        typeof raw === "string"
    ) {

        return raw
            .split(/\r?\n|,/)
            .map(value => value.trim())
            .filter(Boolean);

    }


    return [];

}


/* =========================================================
   EVENT NORMALIZATION
========================================================= */

function normalizeEventName(value) {

    const text =
        String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ");


    const aliases = {

        "robo race":
            "Robo Race",

        "race":
            "Robo Race",

        "roborace":
            "Robo Race",

        "robo war":
            "Robo War",

        "war":
            "Robo War",

        "robowar":
            "Robo War",

        "robo tug of war":
            "Robo Tug of War",

        "robo tug":
            "Robo Tug of War",

        "tug of war":
            "Robo Tug of War",

        "tug":
            "Robo Tug of War",

        "robot tug of war":
            "Robo Tug of War",

        "robo soccer":
            "Robo Soccer",

        "soccer":
            "Robo Soccer",

        "robosoccer":
            "Robo Soccer"

    };


    return aliases[text] || String(value).trim();

}


/* =========================================================
   EVENT CHECK
========================================================= */

function hasEvent(data, eventName) {

    const target =
        normalizeEventName(eventName)
            .toLowerCase();


    return getEvents(data)
        .some(event =>
            normalizeEventName(event)
                .toLowerCase() === target
        );

}


/* =========================================================
   TEAM MEMBERS
========================================================= */

function getMembers(data) {

    if (
        !data ||
        typeof data !== "object"
    ) {
        return [];
    }


    const members = [];


    function addMember(member) {

        if (
            member &&
            typeof member === "object"
        ) {

            const name =
                firstValue(
                    member,
                    [
                        "name",
                        "studentName",
                        "memberName",
                        "MemberName",
                        "Name"
                    ],
                    ""
                );


            if (name) {
                members.push({
                    name,
                    class:
                        firstValue(
                            member,
                            [
                                "class",
                                "Class",
                                "studentClass",
                                "className"
                            ],
                            ""
                        ),
                    section:
                        firstValue(
                            member,
                            [
                                "section",
                                "Section",
                                "studentSection"
                            ],
                            ""
                        )
                });
            }

            return;
        }


        if (
            member !== undefined &&
            member !== null &&
            String(member).trim()
        ) {

            members.push({
                name: String(member).trim(),
                class: "",
                section: ""
            });

        }

    }


    /* -----------------------------------------------------
       members / teamMembers / memberList
    ----------------------------------------------------- */

    [
        "members",
        "teamMembers",
        "memberList"
    ].forEach(field => {

        const value = data[field];


        if (Array.isArray(value)) {

            value.forEach(addMember);

        }
        else if (
            value &&
            typeof value === "object"
        ) {

            Object.values(value)
                .forEach(addMember);

        }

    });


    /* -----------------------------------------------------
       Member 2-10 flat fields
    ----------------------------------------------------- */

    for (
        let i = 2;
        i <= 10;
        i++
    ) {

        const name =
            firstValue(
                data,
                [
                    `Member${i}Name`,
                    `member${i}Name`,
                    `member${i}name`,
                    `Member${i}_Name`
                ],
                ""
            );


        if (!name) {
            continue;
        }


        members.push({
            name,
            class:
                firstValue(
                    data,
                    [
                        `Member${i}Class`,
                        `member${i}Class`,
                        `member${i}class`,
                        `Member${i}_Class`
                    ],
                    ""
                ),
            section:
                firstValue(
                    data,
                    [
                        `Member${i}Section`,
                        `member${i}Section`,
                        `member${i}section`,
                        `Member${i}_Section`
                    ],
                    ""
                )
        });

    }


    /* -----------------------------------------------------
       member2 / Member2 object
    ----------------------------------------------------- */

    for (
        let i = 2;
        i <= 10;
        i++
    ) {

        const fields = [
            `member${i}`,
            `Member${i}`,
            `member_${i}`,
            `Member_${i}`
        ];


        for (const field of fields) {

            const value = data[field];


            if (
                value &&
                typeof value === "object" &&
                !Array.isArray(value)
            ) {

                addMember(value);

            }

        }

    }


    /* -----------------------------------------------------
       memberNames
    ----------------------------------------------------- */

    const memberNames =
        firstValue(
            data,
            [
                "memberNames",
                "teamMemberNames",
                "membersNames"
            ],
            ""
        );


    if (
        typeof memberNames === "string" &&
        memberNames.trim()
    ) {

        memberNames
            .split(/\r?\n|,/)
            .map(value => value.trim())
            .filter(Boolean)
            .forEach(name => {

                members.push({
                    name,
                    class: "",
                    section: ""
                });

            });

    }


    /* -----------------------------------------------------
       REMOVE DUPLICATES
    ----------------------------------------------------- */

    const unique = [];
    const seen = new Set();


    members.forEach(member => {

        const name =
            String(
                member?.name ||
                ""
            )
                .trim();


        const key =
            name.toLowerCase();


        if (
            key &&
            !seen.has(key)
        ) {

            seen.add(key);
            unique.push(member);

        }

    });


    return unique;

}


/* =========================================================
   TEAM SIZE
========================================================= */

function getTeamSize(data) {

    if (
        !data ||
        typeof data !== "object"
    ) {
        return 1;
    }


    const fields = [
        "TeamSize",
        "teamSize",
        "team_size",
        "membersCount",
        "memberCount",
        "numberOfMembers",
        "numberOfTeamMembers",
        "teamMembersCount",
        "participantCount"
    ];


    for (const field of fields) {

        const value = data[field];


        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {
            continue;
        }


        const number =
            parseInt(
                String(value).match(/\d+/)?.[0] || "",
                10
            );


        if (
            Number.isFinite(number) &&
            number >= 1
        ) {

            return number;

        }

    }


    const members =
        getMembers(data);


    if (members.length > 0) {
        return Math.min(
            Math.max(
                members.length + 1,
                1
            ),
            5
        );
    }


    return 1;

}


/* =========================================================
   REGISTRATION TYPE
========================================================= */

function normalizeType(data) {

    const teamSize =
        getTeamSize(data);


    if (teamSize > 1) {
        return "team";
    }


    if (
        getMembers(data).length > 0
    ) {
        return "team";
    }


    const rawType =
        String(
            firstValue(
                data,
                [
                    "type",
                    "registrationType",
                    "participantType",
                    "ParticipationType"
                ],
                ""
            )
        )
            .trim()
            .toLowerCase();


    if (
        rawType.includes("team")
    ) {
        return "team";
    }


    const teamName =
        String(
            getTeamName(data)
        )
            .trim()
            .toLowerCase();


    const soloValues = [
        "",
        "—",
        "solo",
        "solo participant",
        "individual",
        "individual participant",
        "n/a",
        "na",
        "none"
    ];


    if (
        teamName &&
        !soloValues.includes(teamName)
    ) {
        return "team";
    }


    return "solo";

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {

    if (!value) {
        return "—";
    }


    let date;


    if (value instanceof Date) {
        date = value;
    }
    else if (
        typeof value === "number"
    ) {
        date = new Date(value);
    }
    else if (
        !Number.isNaN(Number(value)) &&
        String(value).trim() !== ""
    ) {
        date = new Date(Number(value));
    }
    else {
        date = new Date(value);
    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }


    return date.toLocaleString(
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
   SEARCH
========================================================= */

function matchesSearch(data, key) {

    const query =
        search?.value
            ?.trim()
            .toLowerCase() ||
        "";


    if (!query) {
        return true;
    }


    const members =
        getMembers(data)
            .flatMap(member => [
                member.name,
                member.class,
                member.section
            ]);


    const searchable = [
        key,
        getRegistrationId(data, key),
        getName(data),
        getClassName(data),
        getSection(data),
        getMobile(data),
        getEmail(data),
        getTeamName(data),
        getRemarks(data),
        getRegistrationStatus(data),
        normalizeType(data),
        getTeamSize(data),
        ...getEvents(data),
        ...members
    ]
        .join(" ")
        .toLowerCase();


    return searchable.includes(query);

}


/* =========================================================
   FILTERS
========================================================= */

function matchesFilters(data) {

    const selectedType =
        typeFilter?.value || "all";

    const selectedEvent =
        eventFilter?.value || "all";

    const selectedStatus =
        statusFilter?.value || "all";


    if (
        selectedType !== "all" &&
        normalizeType(data) !== selectedType
    ) {
        return false;
    }


    if (
        selectedEvent !== "all" &&
        !hasEvent(data, selectedEvent)
    ) {
        return false;
    }


    if (
        selectedStatus !== "all" &&
        getRegistrationStatus(data)
            .toLowerCase() !==
        selectedStatus.toLowerCase()
    ) {
        return false;
    }


    return true;

}


/* =========================================================
   FILTERED ENTRIES
========================================================= */

function filteredEntries() {

    return Object
        .entries(registrations)
        .filter(([key, data]) =>
            matchesSearch(data, key)
        )
        .filter(([, data]) =>
            matchesFilters(data)
        )
        .sort((a, b) => {

            const aTime =
                getTimestamp(a[1]);

            const bTime =
                getTimestamp(b[1]);


            const aDate =
                new Date(aTime).getTime() || 0;

            const bDate =
                new Date(bTime).getTime() || 0;


            return bDate - aDate;

        });

}


/* =========================================================
   DASHBOARD STATS
========================================================= */

function renderStats() {

    const entries =
        Object.entries(registrations);


    const solo =
        entries.filter(
            ([, data]) =>
                normalizeType(data) === "solo"
        ).length;


    const team =
        entries.filter(
            ([, data]) =>
                normalizeType(data) === "team"
        ).length;


    const race =
        entries.filter(
            ([, data]) =>
                hasEvent(data, "Robo Race")
        ).length;


    const war =
        entries.filter(
            ([, data]) =>
                hasEvent(data, "Robo War")
        ).length;


    const tug =
        entries.filter(
            ([, data]) =>
                hasEvent(
                    data,
                    "Robo Tug of War"
                )
        ).length;


    const soccer =
        entries.filter(
            ([, data]) =>
                hasEvent(
                    data,
                    "Robo Soccer"
                )
        ).length;


    const totalEventEntries =
        entries.reduce(
            (total, [, data]) =>
                total +
                getEvents(data).length,
            0
        );


    if (totalRegistrations) {
        totalRegistrations.textContent =
            entries.length;
    }


    if (soloCount) {
        soloCount.textContent = solo;
    }


    if (teamCount) {
        teamCount.textContent = team;
    }


    if (eventEntries) {
        eventEntries.textContent =
            totalEventEntries;
    }


    if (raceCount) {
        raceCount.textContent = race;
    }


    if (warCount) {
        warCount.textContent = war;
    }


    if (tugCount) {
        tugCount.textContent = tug;
    }


    if (soccerCount) {
        soccerCount.textContent = soccer;
    }

}


/* =========================================================
   STATUS UPDATE
========================================================= */

async function setRegistrationStatus(
    key,
    newStatus
) {

    const data =
        registrations[key];


    if (!data) {
        return;
    }


    const registrationId =
        getRegistrationId(data, key);


    const note =
        newStatus === "Approved"
            ? "Registration approved. Our team will contact you soon with the next steps."
            : newStatus === "Rejected"
                ? "Registration was not approved. Please contact the Help Center if you need assistance."
                : "Our team will review your registration and contact you soon.";


    try {

        const now = Date.now();


        const updates = {

            [`${REGISTRATIONS_PATH}/${key}/status`]:
                newStatus,

            [`${REGISTRATIONS_PATH}/${key}/statusNote`]:
                note,

            [`${REGISTRATIONS_PATH}/${key}/statusUpdatedAt`]:
                now

        };


        /*
         * Keep lookup synchronized.
         *
         * IMPORTANT:
         * The current supplied registration Rules do not
         * define registrationStatusLookup.
         *
         * Therefore this secondary write can be denied by
         * Firebase Rules without preventing the actual
         * registration status update.
         */

        updates[
            `${STATUS_LOOKUP_PATH}/${registrationId}`
        ] = {
            registrationId,
            status: newStatus,
            statusNote: note,
            updatedAt: now
        };


        try {

            await update(
                ref(db),
                updates
            );

        }
        catch (error) {

            /*
             * If only the lookup path is denied,
             * retry the actual registration update.
             */

            console.warn(
                "Status lookup update failed. Retrying registration status only.",
                error
            );


            await update(
                ref(
                    db,
                    `${REGISTRATIONS_PATH}/${key}`
                ),
                {
                    status: newStatus,
                    statusNote: note,
                    statusUpdatedAt: now
                }
            );

        }


        showToast(
            `Registration ${newStatus.toLowerCase()}.`
        );

    }
    catch (error) {

        console.error(
            "Status update error:",
            error
        );


        showStatus(
            "Could not update registration status. Check Firebase Rules.",
            "error"
        );

    }

}


/* =========================================================
   ROW ACTION
========================================================= */

function handleRowAction(button) {

    const key =
        button.dataset.key;


    if (!key) {
        return;
    }


    if (
        button.classList.contains("edit-btn")
    ) {

        openEdit(key);

    }
    else if (
        button.classList.contains("delete-btn")
    ) {

        openConfirmDelete(key);

    }
    else if (
        button.classList.contains("approve-btn")
    ) {

        setRegistrationStatus(
            key,
            "Approved"
        );

    }
    else if (
        button.classList.contains("reject-btn")
    ) {

        setRegistrationStatus(
            key,
            "Rejected"
        );

    }
    else {

        openDetail(key);

    }

}


/* =========================================================
   MEMBER HTML
========================================================= */

function memberHTML(member, index) {

    const name =
        member?.name || "Member";

    const className =
        member?.class || "";

    const section =
        member?.section || "";


    return `

        <div
            class="team-member-item"
            style="
                padding:14px;
                margin:8px 0;
                border:1px solid rgba(255,255,255,.1);
                border-radius:12px;
                background:rgba(255,255,255,.03);
            "
        >

            <strong
                style="
                    display:block;
                    margin-bottom:5px;
                "
            >
                Member ${index + 2}
            </strong>

            <span
                style="
                    display:block;
                    font-weight:600;
                "
            >
                ${escapeHTML(name)}
            </span>

            ${
                className
                    ? `
                        <small
                            style="
                                display:inline-block;
                                margin-top:5px;
                                margin-right:10px;
                                opacity:.75;
                            "
                        >
                            Class:
                            ${escapeHTML(className)}
                        </small>
                    `
                    : ""
            }

            ${
                section
                    ? `
                        <small
                            style="
                                display:inline-block;
                                margin-top:5px;
                                opacity:.75;
                            "
                        >
                            Section:
                            ${escapeHTML(section)}
                        </small>
                    `
                    : ""
            }

        </div>

    `;

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderTable() {

    if (!registrationBody) {
        return;
    }


    const entries =
        filteredEntries();


    if (!entries.length) {

        registrationBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    style="
                        text-align:center;
                        padding:50px 20px;
                    "
                >

                    <div style="font-size:35px;">
                        🤖
                    </div>

                    <div
                        style="
                            margin-top:10px;
                            font-weight:600;
                        "
                    >
                        No registrations found.
                    </div>

                    <div
                        style="
                            margin-top:5px;
                            opacity:.6;
                            font-size:11px;
                        "
                    >
                        Try changing the search
                        or filters.
                    </div>

                </td>

            </tr>

        `;


        if (mobileRegistrations) {
            mobileRegistrations.innerHTML = "";
        }


        return;

    }


    registrationBody.innerHTML =
        entries
            .map(
                ([key, data]) => {

                    const id =
                        getRegistrationId(data, key);

                    const name =
                        getName(data);

                    const team =
                        getTeamName(data);

                    const type =
                        normalizeType(data);

                    const mobile =
                        getMobile(data);

                    const email =
                        getEmail(data);

                    const events =
                        getEvents(data);

                    const teamSize =
                        getTeamSize(data);

                    const registrationStatus =
                        getRegistrationStatus(data);

                    const statusClass =
                        registrationStatus
                            .toLowerCase()
                            .replace(/\s+/g, "-");


                    return `

                        <tr>

                            <td>

                                <strong>
                                    ${escapeHTML(id)}
                                </strong>

                                <small>
                                    ${escapeHTML(key)}
                                </small>

                            </td>

                            <td>

                                <strong>
                                    ${escapeHTML(name)}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        getClassName(data)
                                    )}
                                    -
                                    ${escapeHTML(
                                        getSection(data)
                                    )}
                                </small>

                            </td>

                            <td>
                                ${escapeHTML(team)}
                            </td>

                            <td>

                                <span
                                    class="type-badge ${type}"
                                >
                                    ${
                                        type === "team"
                                            ? "Team"
                                            : "Solo"
                                    }
                                </span>

                            </td>

                            <td>
                                ${teamSize}
                            </td>

                            <td>

                                <strong>
                                    ${escapeHTML(mobile)}
                                </strong>

                                <small>
                                    ${escapeHTML(email)}
                                </small>

                            </td>

                            <td>

                                <div
                                    class="event-list"
                                >

                                    ${
                                        events.length
                                            ? events
                                                .map(
                                                    event =>
                                                        `
                                                            <span
                                                                class="event-pill"
                                                            >
                                                                ${escapeHTML(
                                                                    event
                                                                )}
                                                            </span>
                                                        `
                                                )
                                                .join("")
                                            : "—"
                                    }

                                </div>

                            </td>

                            <td>

                                <div
                                    class="status-badge ${escapeHTML(statusClass)}"
                                >
                                    ${escapeHTML(
                                        registrationStatus
                                    )}
                                </div>

                                <div
                                    class="action-buttons"
                                >

                                    ${
                                        registrationStatus !==
                                        "Approved"
                                            ? `
                                                <button
                                                    type="button"
                                                    class="approve-btn"
                                                    data-key="${escapeHTML(key)}"
                                                >
                                                    Approve
                                                </button>
                                            `
                                            : ""
                                    }

                                    ${
                                        registrationStatus !==
                                        "Rejected"
                                            ? `
                                                <button
                                                    type="button"
                                                    class="reject-btn"
                                                    data-key="${escapeHTML(key)}"
                                                >
                                                    Reject
                                                </button>
                                            `
                                            : ""
                                    }

                                    <button
                                        type="button"
                                        class="view-btn"
                                        data-key="${escapeHTML(key)}"
                                    >
                                        View
                                    </button>

                                    <button
                                        type="button"
                                        class="edit-btn"
                                        data-key="${escapeHTML(key)}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="delete-btn"
                                        data-key="${escapeHTML(key)}"
                                        title="Delete registration"
                                    >
                                        <i
                                            class="fa-solid fa-trash"
                                        ></i>
                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    registrationBody
        .querySelectorAll("[data-key]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => handleRowAction(button)
            );

        });


    renderMobile(entries);

}


/* =========================================================
   MOBILE REGISTRATION CARDS
========================================================= */

function renderMobile(entries) {

    if (!mobileRegistrations) {
        return;
    }


    mobileRegistrations.innerHTML =
        entries
            .map(
                ([key, data]) => {

                    const id =
                        getRegistrationId(data, key);

                    const name =
                        getName(data);

                    const type =
                        normalizeType(data);

                    const team =
                        getTeamName(data);

                    const teamSize =
                        getTeamSize(data);

                    const events =
                        getEvents(data);

                    const registrationStatus =
                        getRegistrationStatus(data);


                    return `

                        <article
                            class="registration-card"
                        >

                            <div
                                class="registration-card-head"
                            >

                                <div>

                                    <small>
                                        REGISTRATION
                                    </small>

                                    <strong>
                                        ${escapeHTML(id)}
                                    </strong>

                                </div>

                                <span
                                    class="type-badge ${type}"
                                >
                                    ${
                                        type === "team"
                                            ? "Team"
                                            : "Solo"
                                    }
                                </span>

                            </div>

                            <div
                                class="registration-card-body"
                            >

                                <strong>
                                    ${escapeHTML(name)}
                                </strong>

                                <span>
                                    Class:
                                    ${escapeHTML(
                                        getClassName(data)
                                    )}
                                    •
                                    Section:
                                    ${escapeHTML(
                                        getSection(data)
                                    )}
                                </span>

                                <span>
                                    Team:
                                    ${escapeHTML(team)}
                                </span>

                                <span>
                                    Team Size:
                                    ${teamSize}
                                    Member${
                                        teamSize === 1
                                            ? ""
                                            : "s"
                                    }
                                </span>

                                <span>
                                    ${escapeHTML(
                                        getEmail(data)
                                    )}
                                </span>

                                <span>
                                    ${escapeHTML(
                                        getMobile(data)
                                    )}
                                </span>

                                <span>
                                    ${escapeHTML(
                                        events.join(", ") ||
                                        "No events"
                                    )}
                                </span>

                                <span>
                                    Status:
                                    ${escapeHTML(
                                        registrationStatus
                                    )}
                                </span>

                            </div>

                            <div
                                class="registration-card-actions"
                            >

                                ${
                                    registrationStatus !==
                                    "Approved"
                                        ? `
                                            <button
                                                type="button"
                                                class="approve-btn"
                                                data-key="${escapeHTML(key)}"
                                            >
                                                Approve
                                            </button>
                                        `
                                        : ""
                                }

                                ${
                                    registrationStatus !==
                                    "Rejected"
                                        ? `
                                            <button
                                                type="button"
                                                class="reject-btn"
                                                data-key="${escapeHTML(key)}"
                                            >
                                                Reject
                                            </button>
                                        `
                                        : ""
                                }

                                <button
                                    type="button"
                                    class="view-btn"
                                    data-key="${escapeHTML(key)}"
                                >
                                    View
                                </button>

                                <button
                                    type="button"
                                    class="edit-btn"
                                    data-key="${escapeHTML(key)}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="delete-btn"
                                    data-key="${escapeHTML(key)}"
                                >
                                    <i
                                        class="fa-solid fa-trash"
                                    ></i>
                                </button>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");


    mobileRegistrations
        .querySelectorAll("[data-key]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => handleRowAction(button)
            );

        });

}


/* =========================================================
   RENDER
========================================================= */

function render() {

    renderStats();
    renderTable();

}


/* =========================================================
   DETAIL MODAL
========================================================= */

function openDetail(key) {

    const data =
        registrations[key];


    if (!data) {

        showStatus(
            "Registration no longer exists.",
            "error"
        );

        return;

    }


    const id =
        getRegistrationId(data, key);

    const members =
        getMembers(data);

    const events =
        getEvents(data);

    const type =
        normalizeType(data);

    const teamSize =
        getTeamSize(data);

    const registrationStatus =
        getRegistrationStatus(data);


    if (detailId) {
        detailId.textContent = id;
    }


    if (detailContent) {

        detailContent.innerHTML = `

            <div class="detail-grid">

                <div class="detail-item">
                    <span>REGISTRATION ID</span>
                    <strong>
                        ${escapeHTML(id)}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>STATUS</span>
                    <strong>
                        ${escapeHTML(
                            registrationStatus
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>LEADER NAME</span>
                    <strong>
                        ${escapeHTML(
                            getName(data)
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>CLASS</span>
                    <strong>
                        ${escapeHTML(
                            getClassName(data)
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>SECTION</span>
                    <strong>
                        ${escapeHTML(
                            getSection(data)
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>MOBILE</span>
                    <strong>
                        ${escapeHTML(
                            getMobile(data)
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>EMAIL</span>
                    <strong>
                        ${escapeHTML(
                            getEmail(data)
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>TEAM</span>
                    <strong>
                        ${escapeHTML(
                            getTeamName(data)
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>TYPE</span>
                    <strong>
                        ${
                            type === "team"
                                ? "TEAM"
                                : "SOLO"
                        }
                    </strong>
                </div>

                <div class="detail-item">
                    <span>TEAM SIZE</span>
                    <strong>
                        ${teamSize}
                        Member${
                            teamSize === 1
                                ? ""
                                : "s"
                        }
                    </strong>
                </div>

                <div class="detail-item">
                    <span>SUBMITTED</span>
                    <strong>
                        ${escapeHTML(
                            formatDate(
                                getTimestamp(data)
                            )
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>CREATED BY</span>
                    <strong>
                        ${escapeHTML(
                            firstValue(
                                data,
                                ["createdBy"],
                                "—"
                            )
                        )}
                    </strong>
                </div>

            </div>

            <div class="detail-block">

                <span>EVENTS</span>

                <p>
                    ${
                        events.length
                            ? events
                                .map(
                                    event =>
                                        escapeHTML(event)
                                )
                                .join(", ")
                            : "—"
                    }
                </p>

            </div>

            <div class="detail-block">

                <span>TEAM MEMBERS</span>

                ${
                    members.length
                        ? `
                            <div
                                class="team-member-list"
                            >
                                ${
                                    members
                                        .map(
                                            (
                                                member,
                                                index
                                            ) =>
                                                memberHTML(
                                                    member,
                                                    index
                                                )
                                        )
                                        .join("")
                                }
                            </div>
                        `
                        : `
                            <p>
                                ${
                                    teamSize > 1
                                        ? "Team size indicates a team registration, but additional member information was not found."
                                        : "No additional members."
                                }
                            </p>
                        `
                }

            </div>

            <div class="detail-block">

                <span>STATUS MESSAGE</span>

                <p>
                    ${escapeHTML(
                        firstValue(
                            data,
                            ["statusNote"],
                            "Our team will review your registration and contact you soon."
                        )
                    )}
                </p>

            </div>

            <div class="detail-block">

                <span>REMARKS</span>

                <p>
                    ${escapeHTML(
                        getRemarks(data) || "—"
                    )}
                </p>

            </div>

        `;

    }


    detailOverlay
        ?.classList
        .remove("hidden");

}


/* =========================================================
   CLOSE DETAIL
========================================================= */

function closeDetailModal() {

    detailOverlay
        ?.classList
        .add("hidden");

}


closeDetail?.addEventListener(
    "click",
    closeDetailModal
);


detailOverlay?.addEventListener(
    "click",
    event => {

        if (
            event.target === detailOverlay
        ) {
            closeDetailModal();
        }

    }
);


/* =========================================================
   EDIT
========================================================= */

function openEdit(key) {

    const data =
        registrations[key];


    if (!data) {
        return;
    }


    if (editKey) {
        editKey.value = key;
    }


    if (editStudentName) {
        editStudentName.value =
            getName(data) === "—"
                ? ""
                : getName(data);
    }


    if (editStudentClass) {
        editStudentClass.value =
            getClassName(data) === "—"
                ? ""
                : getClassName(data);
    }


    if (editStudentSection) {
        editStudentSection.value =
            getSection(data) === "—"
                ? ""
                : getSection(data);
    }


    if (editMobileNumber) {

        const value =
            getMobile(data);

        editMobileNumber.value =
            value === "—"
                ? ""
                : value;

    }


    if (editEmailAddress) {

        const value =
            getEmail(data);

        editEmailAddress.value =
            value === "—"
                ? ""
                : value;

    }


    if (editTeamName) {

        const value =
            getTeamName(data);

        editTeamName.value =
            value === "—"
                ? ""
                : value;

    }


    if (editRemarks) {
        editRemarks.value =
            getRemarks(data);
    }


    if (editMembers) {

        const members =
            getMembers(data);


        editMembers.value =
            members
                .map(member => {

                    return [
                        member.name || "",
                        member.class || "",
                        member.section || ""
                    ].join(" | ");

                })
                .join("\n");

    }


    if (editMessage) {
        editMessage.textContent = "";
    }


    editOverlay
        ?.classList
        .remove("hidden");

}


/* =========================================================
   EDIT SUBMIT
========================================================= */

editForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const key =
            editKey?.value;


        if (!key) {
            return;
        }


        const original =
            registrations[key];


        if (!original) {
            return;
        }


        try {

            const updates = {};


            /*
             * IMPORTANT:
             *
             * These are the actual field names used by
             * your current Firebase registration Rules.
             */

            if (editStudentName) {

                updates.StudentName =
                    editStudentName.value.trim();

            }


            if (editStudentClass) {

                updates.Class =
                    editStudentClass.value.trim();

            }


            if (editStudentSection) {

                updates.Section =
                    editStudentSection.value.trim();

            }


            if (editMobileNumber) {

                updates.MobileNumber =
                    editMobileNumber.value.trim();

            }


            if (editEmailAddress) {

                updates.EmailAddress =
                    editEmailAddress.value.trim();

            }


            /*
             * TeamName is optional in your Rules.
             * Keep it if the admin UI has the field.
             */

            if (editTeamName) {

                updates.TeamName =
                    editTeamName.value.trim();

            }


            if (editRemarks) {

                updates.remarks =
                    editRemarks.value.trim();

            }


            /*
             * Preserve required registration fields.
             */

            updates.registrationId =
                getRegistrationId(
                    original,
                    key
                );

            updates.Events =
                original.Events ??
                original.events ??
                [];

            updates.TeamSize =
                getTeamSize(original);

            updates.status =
                getRegistrationStatus(original);

            updates.createdBy =
                original.createdBy || "";


            /*
             * Keep original data and replace only
             * the editable fields.
             */

            const updatedRegistration = {
                ...original,
                ...updates
            };


            /*
             * If the database currently stores the
             * canonical fields, update the complete
             * registration object.
             */

            await update(
                ref(
                    db,
                    `${REGISTRATIONS_PATH}/${key}`
                ),
                updatedRegistration
            );


            showToast(
                "Registration updated successfully."
            );


            closeEditModal();

        }
        catch (error) {

            console.error(
                "Edit error:",
                error
            );


            if (editMessage) {

                editMessage.textContent =
                    "Could not update registration. Check Firebase Rules and the required fields.";

            }


            showStatus(
                "Firebase denied the registration update.",
                "error"
            );

        }

    }
);


/* =========================================================
   CLOSE EDIT
========================================================= */

function closeEditModal() {

    editOverlay
        ?.classList
        .add("hidden");

}


closeEdit?.addEventListener(
    "click",
    closeEditModal
);


cancelEdit?.addEventListener(
    "click",
    closeEditModal
);


editOverlay?.addEventListener(
    "click",
    event => {

        if (
            event.target === editOverlay
        ) {
            closeEditModal();
        }

    }
);


/* =========================================================
   DELETE
========================================================= */

function openConfirmDelete(key) {

    const data =
        registrations[key];


    if (!data) {
        return;
    }


    pendingDeleteKey = key;


    if (confirmMessage) {

        confirmMessage.textContent =
            `This will permanently delete registration ${
                getRegistrationId(data, key)
            } (${getName(data)}) from the database.`;

    }


    confirmOverlay
        ?.classList
        .remove("hidden");

}


/* =========================================================
   CLOSE DELETE
========================================================= */

function closeConfirmModal() {

    confirmOverlay
        ?.classList
        .add("hidden");

    pendingDeleteKey = null;

}


cancelDeleteBtn?.addEventListener(
    "click",
    closeConfirmModal
);


/* =========================================================
   CONFIRM DELETE
========================================================= */

confirmDeleteBtn?.addEventListener(
    "click",
    async () => {

        const key =
            pendingDeleteKey;


        if (!key) {
            return;
        }


        const originalLabel =
            confirmDeleteBtn.innerHTML;


        try {

            confirmDeleteBtn.disabled = true;

            confirmDeleteBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Deleting...
            `;


            const deleteUpdates = {

                [`${REGISTRATIONS_PATH}/${key}`]:
                    null

            };


            /*
             * registrationStatusLookup is not included
             * in the supplied registration Rules.
             *
             * Try to remove it, but retry registration
             * deletion alone if Rules deny that path.
             */

            const registration =
                registrations[key];


            const registrationId =
                registration
                    ? getRegistrationId(
                        registration,
                        key
                    )
                    : "";


            if (registrationId) {

                deleteUpdates[
                    `${STATUS_LOOKUP_PATH}/${registrationId}`
                ] = null;

            }


            try {

                await update(
                    ref(db),
                    deleteUpdates
                );

            }
            catch (error) {

                console.warn(
                    "Lookup deletion failed. Retrying registration deletion only.",
                    error
                );


                await update(
                    ref(
                        db,
                        `${REGISTRATIONS_PATH}/${key}`
                    ),
                    null
                );

            }


            showToast(
                "Registration deleted successfully."
            );


            closeConfirmModal();

        }
        catch (error) {

            console.error(
                "Delete error:",
                error
            );


            showStatus(
                "Firebase denied the registration delete.",
                "error"
            );

        }
        finally {

            confirmDeleteBtn.disabled = false;

            confirmDeleteBtn.innerHTML =
                originalLabel;

        }

    }
);


/* =========================================================
   LOAD REGISTRATIONS
========================================================= */

function loadRegistrations() {

    showStatus(
        "Connecting to Firebase registrations..."
    );


    if (firebaseListener) {

        firebaseListener();
        firebaseListener = null;

    }


    firebaseListener =
        onValue(
            ref(
                db,
                REGISTRATIONS_PATH
            ),

            snapshot => {

                const data =
                    snapshot.val();


                registrations =
                    data &&
                    typeof data === "object"
                        ? data
                        : {};


                render();


                showStatus(
                    `${
                        Object.keys(
                            registrations
                        ).length
                    } registration(s) loaded.`,
                    "success"
                );

            },

            error => {

                console.error(
                    "Firebase registration error:",
                    error
                );


                registrations = {};

                render();


                showStatus(
                    "Firebase could not load registrations. Check admin authorization and Firebase Rules.",
                    "error"
                );

            }
        );

}


/* =========================================================
   WEBSITE CONTENT
========================================================= */

function loadWebsiteContent() {

    get(
        ref(
            db,
            "siteContent/messages"
        )
    )
        .then(snapshot => {

            if (!snapshot.exists()) {
                return;
            }


            const data =
                snapshot.val();


            const fields = {

                editPrincipalText:
                    data.principalText || "",

                editPrincipalName:
                    data.principalName ||
                    "Sadhna Devi",

                editMentorText:
                    data.mentorText || "",

                editMentorName:
                    data.mentorName ||
                    "Akansha Rani",

                editCoordText:
                    data.coordText || "",

                editCoordName:
                    data.coordName ||
                    "Championship Coordination Team",

                editTeamText:
                    data.teamText || "",

                editTeamName:
                    data.teamName ||
                    "APS Robotics Championship Team"

            };


            Object.entries(fields)
                .forEach(
                    ([id, value]) => {

                        const element =
                            document.getElementById(id);


                        if (element) {
                            element.value = value;
                        }

                    }
                );

        })
        .catch(error => {

            console.error(
                "Website content error:",
                error
            );

        });


    get(
        ref(
            db,
            "siteContent/leadership"
        )
    )
        .then(snapshot => {

            const data =
                snapshot.exists()
                    ? snapshot.val()
                    : {};


            const fields = {

                editPrincipalPhoto:
                    data.principalPhoto || "",

                editMentorPhoto:
                    data.mentorPhoto || "",

                editCoordinatorPhoto:
                    data.coordinatorPhoto || ""

            };


            Object.entries(fields)
                .forEach(
                    ([id, value]) => {

                        const element =
                            document.getElementById(id);


                        if (element) {
                            element.value = value;
                        }

                    }
                );

        })
        .catch(error => {

            console.error(
                "Leadership content error:",
                error
            );

        });

}


/* =========================================================
   SAVE WEBSITE CONTENT
========================================================= */

saveContentBtn?.addEventListener(
    "click",
    async () => {

        if (contentStatus) {
            contentStatus.textContent =
                "Saving...";
        }


        try {

            await update(
                ref(
                    db,
                    "siteContent/messages"
                ),
                {

                    principalText:
                        document.getElementById(
                            "editPrincipalText"
                        )?.value || "",

                    principalName:
                        document.getElementById(
                            "editPrincipalName"
                        )?.value ||
                        "Sadhna Devi",

                    mentorText:
                        document.getElementById(
                            "editMentorText"
                        )?.value || "",

                    mentorName:
                        document.getElementById(
                            "editMentorName"
                        )?.value ||
                        "Akansha Rani",

                    coordText:
                        document.getElementById(
                            "editCoordText"
                        )?.value || "",

                    coordName:
                        document.getElementById(
                            "editCoordName"
                        )?.value ||
                        "Championship Coordination Team",

                    teamText:
                        document.getElementById(
                            "editTeamText"
                        )?.value || "",

                    teamName:
                        document.getElementById(
                            "editTeamName"
                        )?.value ||
                        "APS Robotics Championship Team"

                }
            );


            await update(
                ref(
                    db,
                    "siteContent/leadership"
                ),
                {

                    principalPhoto:
                        document.getElementById(
                            "editPrincipalPhoto"
                        )?.value.trim() ||
                        "assets/principal.svg",

                    mentorPhoto:
                        document.getElementById(
                            "editMentorPhoto"
                        )?.value.trim() ||
                        "assets/mentor.svg",

                    coordinatorPhoto:
                        document.getElementById(
                            "editCoordinatorPhoto"
                        )?.value.trim() ||
                        "assets/coordinator.svg",

                    principalName:
                        document.getElementById(
                            "editPrincipalName"
                        )?.value.trim() ||
                        "Sadhna Devi",

                    mentorName:
                        document.getElementById(
                            "editMentorName"
                        )?.value.trim() ||
                        "Akansha Rani",

                    coordinatorName:
                        document.getElementById(
                            "editCoordName"
                        )?.value.trim() ||
                        "Championship Coordination Team"

                }
            );


            if (contentStatus) {

                contentStatus.textContent =
                    "✓ Website content updated successfully.";

                contentStatus.style.color =
                    "#4ee7a1";

            }

        }
        catch (error) {

            console.error(
                "Content save error:",
                error
            );


            if (contentStatus) {

                contentStatus.textContent =
                    "Error saving content.";

                contentStatus.style.color =
                    "#ff6b6b";

            }

        }

    }
);


/* =========================================================
   CSV
========================================================= */

function csvEscape(value) {

    return `"${String(
        value ?? ""
    ).replaceAll(
        '"',
        '""'
    )}"`;

}


function exportCSV() {

    const entries =
        filteredEntries();


    if (!entries.length) {

        showToast(
            "There are no registrations to export."
        );

        return;

    }


    const headers = [

        "Registration ID",
        "Leader Name",
        "Class",
        "Section",
        "Mobile",
        "Email",
        "Team",
        "Type",
        "Team Size",
        "Members",
        "Events",
        "Remarks",
        "Status",
        "Submitted"

    ];


    const rows =
        entries.map(
            ([key, data]) => [

                getRegistrationId(
                    data,
                    key
                ),

                getName(data),

                getClassName(data),

                getSection(data),

                getMobile(data),

                getEmail(data),

                getTeamName(data),

                normalizeType(data),

                getTeamSize(data),

                getMembers(data)
                    .map(member =>
                        [
                            member.name || "",
                            member.class || "",
                            member.section || ""
                        ].join(" | ")
                    )
                    .join("; "),

                getEvents(data)
                    .join("; "),

                getRemarks(data),

                getRegistrationStatus(
                    data
                ),

                formatDate(
                    getTimestamp(data)
                )

            ]
        );


    const csv =
        [
            headers,
            ...rows
        ]
            .map(
                row =>
                    row
                        .map(csvEscape)
                        .join(",")
            )
            .join("\r\n");


    const blob =
        new Blob(
            [
                "\uFEFF" + csv
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;


    link.download =
        `aps-robotics-registrations-${
            new Date()
                .toISOString()
                .slice(0, 10)
        }.csv`;


    document
        .body
        .appendChild(link);


    link.click();


    link.remove();


    URL.revokeObjectURL(url);


    showToast(
        "CSV exported successfully."
    );

}


/* =========================================================
   SEARCH / FILTERS
========================================================= */

let searchTimeout;


search?.addEventListener(
    "input",
    () => {

        clearTimeout(searchTimeout);


        searchTimeout =
            setTimeout(
                renderTable,
                250
            );

    }
);


typeFilter?.addEventListener(
    "change",
    render
);


eventFilter?.addEventListener(
    "change",
    render
);


statusFilter?.addEventListener(
    "change",
    render
);


clearSearch?.addEventListener(
    "click",
    () => {

        if (search) {
            search.value = "";
        }


        renderTable();

        search?.focus();

    }
);


refreshBtn?.addEventListener(
    "click",
    loadRegistrations
);


exportBtn?.addEventListener(
    "click",
    exportCSV
);


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn?.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);


            window.location.replace(
                "admin-login.html"
            );

        }
        catch (error) {

            console.error(
                "Logout error:",
                error
            );


            showStatus(
                "Logout failed.",
                "error"
            );

        }

    }
);


/* =========================================================
   AUTH ERROR
========================================================= */

function showAuthError(message) {

    console.error(
        "ADMIN AUTH:",
        message
    );


    if (loadingScreen) {

        loadingScreen.classList.remove(
            "hidden"
        );


        const title =
            loadingScreen.querySelector(
                "h1, h2, .loading-title, [data-loading-title]"
            );


        const text =
            loadingScreen.querySelector(
                "p, .loading-text, [data-loading-text]"
            );


        if (title) {
            title.textContent =
                "Authentication Error";
        }


        if (text) {
            text.textContent =
                message;
        }

    }


    showStatus(
        message,
        "error"
    );

}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        console.log(
            "Firebase auth state:",
            user
                ? {
                    uid: user.uid,
                    email: user.email,
                    provider:
                        user.providerData?.[0]
                            ?.providerId
                }
                : "NO USER"
        );


        /* -------------------------------------------------
           NOT LOGGED IN
        ------------------------------------------------- */

        if (!user) {

            if (authCheckFinished) {
                return;
            }


            window.location.replace(
                "admin-login.html"
            );


            return;

        }


        /* -------------------------------------------------
           PREVENT DUPLICATE AUTH CHECK
        ------------------------------------------------- */

        if (authCheckFinished) {
            return;
        }


        try {

            showStatus(
                "Checking administrator authorization..."
            );


            /* ---------------------------------------------
               DATABASE ADMIN RECORD
            --------------------------------------------- */

            const adminRef =
                ref(
                    db,
                    `${ADMINS_PATH}/${user.uid}`
                );


            const adminSnapshot =
                await get(adminRef);


            console.log(
                "Admin authorization result:",
                {
                    uid: user.uid,
                    exists:
                        adminSnapshot.exists(),
                    value:
                        adminSnapshot.val()
                }
            );


            /*
             * Your Rules use:
             *
             * /admins/{uid} = true
             */

            const databaseAdmin =
                adminSnapshot.exists() &&
                adminSnapshot.val() === true;


            /* ---------------------------------------------
               OPTIONAL ADMIN UID
            --------------------------------------------- */

            const configuredAdmin =
                typeof ADMIN_UID === "string" &&
                ADMIN_UID.trim() !== "" &&
                ADMIN_UID !==
                    "REPLACE_WITH_MAIN_PROJECT_ADMIN_UID" &&
                user.uid === ADMIN_UID;


            /* ---------------------------------------------
               AUTHORIZATION
            --------------------------------------------- */

            const authorized =
                databaseAdmin ||
                configuredAdmin;


            /* ---------------------------------------------
               ACCESS DENIED
            --------------------------------------------- */

            if (!authorized) {

                showAuthError(
                    "Access denied. This account is not authorized as an administrator."
                );


                await signOut(auth)
                    .catch(error => {

                        console.error(
                            "Sign-out error:",
                            error
                        );

                    });


                setTimeout(
                    () => {

                        window.location.replace(
                            "admin-login.html"
                        );

                    },
                    1500
                );


                return;

            }


            /* ---------------------------------------------
               SUCCESS
            --------------------------------------------- */

            authCheckFinished = true;


            if (adminName) {

                adminName.textContent =
                    user.displayName ||
                    user.email?.split("@")[0] ||
                    "Administrator";

            }


            if (adminEmail) {

                adminEmail.textContent =
                    user.email ||
                    user.uid;

            }


            loadingScreen
                ?.classList
                .add("hidden");


            appShell
                ?.classList
                .remove("hidden");


            showStatus(
                `Administrator authenticated: ${
                    user.email ||
                    user.uid
                }`,
                "success"
            );


            loadRegistrations();

            loadWebsiteContent();

        }
        catch (error) {

            console.error(
                "Admin authorization error:",
                error
            );


            let message =
                "Unable to verify administrator access.";


            if (
                error?.code ===
                "PERMISSION_DENIED"
            ) {

                message =
                    "Firebase denied access to /admins/" +
                    user.uid +
                    ". Make sure this UID is authorized in /admins and Firebase Rules allow the read.";

            }
            else if (
                error?.code ===
                "NETWORK_ERROR"
            ) {

                message =
                    "Network error. Please check your internet connection.";

            }
            else if (
                error?.message
            ) {

                message =
                    error.message;

            }


            showAuthError(message);

        }

    }
);


/* =========================================================
   AUTH TIMEOUT
========================================================= */

setTimeout(
    () => {

        if (
            !authCheckFinished &&
            loadingScreen &&
            !loadingScreen.classList.contains(
                "hidden"
            )
        ) {

            showAuthError(
                "Authentication is taking too long. Check Firebase Authentication, Firebase configuration, Rules, and your internet connection."
            );

        }

    },
    15000
);


/* =========================================================
   TAB SWITCHING
========================================================= */

const navLinks =
    document.querySelectorAll(".nav-link");

const sections =
    document.querySelectorAll(".page-section");


navLinks.forEach(
    link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();


                navLinks.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                sections.forEach(
                    section => {

                        section.classList.add(
                            "hidden"
                        );

                    }
                );


                link.classList.add("active");


                const href =
                    link.getAttribute("href") ||
                    "";


                const targetId =
                    href.startsWith("#")
                        ? href.substring(1)
                        : href;


                const targetSection =
                    document.getElementById(
                        targetId
                    );


                targetSection
                    ?.classList
                    .remove("hidden");

            }
        );

    }
);


/* =========================================================
   ADMIN MOBILE SIDEBAR
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const menuBtn =
            document.getElementById(
                "menuToggle"
            );

        const sidebar =
            document.getElementById(
                "adminSidebar"
            );

        const sidebarOverlay =
            document.getElementById(
                "sidebarOverlay"
            );


        if (
            !menuBtn ||
            !sidebar ||
            !sidebarOverlay
        ) {

            console.warn(
                "Admin mobile menu elements not found."
            );

            return;

        }


        function openSidebar() {

            sidebar.classList.add(
                "mobile-open"
            );

            sidebarOverlay.classList.add(
                "active"
            );

            document.body.classList.add(
                "menu-open"
            );

            menuBtn.classList.add(
                "active"
            );

            menuBtn.innerHTML =
                '<i class="fa-solid fa-xmark"></i>';

            menuBtn.setAttribute(
                "aria-label",
                "Close menu"
            );

            menuBtn.setAttribute(
                "aria-expanded",
                "true"
            );

        }


        function closeSidebar() {

            sidebar.classList.remove(
                "mobile-open"
            );

            sidebarOverlay.classList.remove(
                "active"
            );

            document.body.classList.remove(
                "menu-open"
            );

            menuBtn.classList.remove(
                "active"
            );

            menuBtn.innerHTML =
                '<i class="fa-solid fa-bars"></i>';

            menuBtn.setAttribute(
                "aria-label",
                "Open menu"
            );

            menuBtn.setAttribute(
                "aria-expanded",
                "false"
            );

        }


        function toggleSidebar() {

            if (
                sidebar.classList.contains(
                    "mobile-open"
                )
            ) {

                closeSidebar();

            }
            else {

                openSidebar();

            }

        }


        menuBtn.addEventListener(
            "click",
            toggleSidebar
        );


        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );


        sidebar
            .querySelectorAll(".sidebar-link")
            .forEach(
                link => {

                    link.addEventListener(
                        "click",
                        () => {

                            if (
                                window.innerWidth <=
                                900
                            ) {

                                closeSidebar();

                            }

                        }
                    );

                }
            );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
                ) {

                    closeSidebar();

                }

            }
        );


        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth > 900
                ) {

                    closeSidebar();

                }

            }
        );


        menuBtn.setAttribute(
            "aria-expanded",
            "false"
        );


        menuBtn.setAttribute(
            "aria-label",
            "Open menu"
        );

    }
);


/* =========================================================
   END ADMIN.JS
========================================================= */
