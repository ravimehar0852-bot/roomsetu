// Kota Room Finder — shared core. Import from every page:
// import { auth, db, A, F, getRole, renderChrome, home, esc } from "./app.js";
import { firebaseConfig } from "./firebase-config.js";
import { ADMIN_EMAIL } from "./site.js";
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import * as A from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import * as F from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as S from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// One Firebase app for the whole site (never re-initialised per page).
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = A.getAuth(app);
export const db = F.getFirestore(app);
export const storage = S.getStorage(app);
// A = full Auth SDK namespace (signInWithEmailAndPassword, createUserWithEmailAndPassword,
// sendPasswordResetEmail, updateProfile, signOut, onAuthStateChanged, getAuth ...).
// F = full Firestore namespace, S = full Storage namespace.
export { A, F, S };

export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---- Roles -------------------------------------------------------------
// Canonical stored roles: "customer" | "owner" | "admin".
// Legacy values map safely: student/worker/unknown -> customer. Nothing is rewritten.
export function normalizeRole(r) {
  r = String(r || "").toLowerCase();
  if (r === "admin") return "admin";
  if (r === "owner" || r === "worker") return "owner"; // legacy "worker" accounts = property owners
  return "customer";
}
export function isAdminEmail(u) { return !!u && String(u.email || "").toLowerCase() === String(ADMIN_EMAIL).toLowerCase(); }
export async function getRole(user = auth.currentUser) {
  if (!user) return null;
  if (isAdminEmail(user)) return "admin"; // admin = the reserved Gmail only
  try {
    const snap = await F.getDoc(F.doc(db, "users", user.uid));
    const r = normalizeRole(snap.exists() ? snap.data().role : "customer");
    return r === "admin" ? "customer" : r;
  } catch (e) {
    console.warn("getRole failed", e);
    return "customer";
  }
}
export function home(role) {
  return role === "admin" ? "./admin.html"
    : role === "owner" ? "./owner-dashboard.html"
    : "./customer-dashboard.html";
}

// ---- Shared chrome (centered brand header + bottom nav) ----
const CSS = `
:root{--krf-teal:#0f766e;--krf-cream:#fdf9f1;--krf-ink:#1f2937;--krf-line:#e7e1d3}
body.krf-has-chrome{padding-bottom:calc(76px + env(safe-area-inset-bottom,0px));background:var(--krf-cream)}
#krfHeader{position:sticky;top:0;z-index:1000;background:#fff;border-bottom:1px solid var(--krf-line);padding-top:env(safe-area-inset-top,0px);box-shadow:0 2px 10px rgba(0,0,0,.05)}
#krfHeader .krf-bar{max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:center;position:relative;padding:10px 16px;min-height:60px}
#krfHeader .krf-brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:21px;color:var(--krf-ink);text-decoration:none}
#krfHeader .krf-logo{width:36px;height:36px;border-radius:10px;background:var(--krf-teal);color:#fff;display:grid;place-items:center}
.krf-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:12px;font-weight:700;text-decoration:none;border:1.5px solid var(--krf-teal);color:var(--krf-teal);background:#fff;cursor:pointer;font-size:15px}
.krf-btn.fill{background:var(--krf-teal);color:#fff}
#krfBottom{position:fixed;left:0;right:0;bottom:0;z-index:900;background:#fff;border-top:1px solid var(--krf-line);display:flex;justify-content:center;padding:6px 4px calc(6px + env(safe-area-inset-bottom,0px));box-shadow:0 -4px 16px rgba(0,0,0,.06)}
#krfBottom a{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;text-decoration:none;color:#6b7280;font-size:11px;font-weight:600;border-radius:12px}
#krfBottom a.active{color:var(--krf-teal)}
`;
const I = (d) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  home: I('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
  saved: I('<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z"/>'),
  enq: I('<path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>'),
  user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
};
const here = () => (location.pathname.split("/").pop() || "index.html").toLowerCase();
function build(user) {
  const p = here(), act = (n) => (n.includes(p) ? "active" : ""), saved = location.search.includes("saved=1"), srch = location.search.includes("search=1");
  return `<header id="krfHeader"><div class="krf-bar"><a class="krf-brand" href="./index.html"><span class="krf-logo">${ICON.home}</span><span>RoomSetu</span></a>${isAdminEmail(user) ? '<button class="krf-btn" id="krfOut" type="button" style="position:absolute;right:12px;min-height:38px;padding:0 14px">Logout</button>' : ""}</div></header>
<nav id="krfBottom" aria-label="App navigation">
  <a href="./index.html" class="${srch ? "" : act(["index.html", ""])}">${ICON.home}<span>Home</span></a>
  <a href="./index.html?search=1" class="${srch ? "active" : ""}">${ICON.search}<span>Search</span></a>
  <a href="./rooms.html?saved=1" class="${saved ? "active" : ""}">${ICON.saved}<span>Saved</span></a>
  <a href="${user ? "./chat.html" : "./login.html?next=chat.html"}" class="${act(["chat.html"])}">${ICON.enq}<span>Chats</span></a>
  <a href="${user ? "./profile.html" : "./login.html"}" class="${act(["profile.html","login.html","register.html","owner-dashboard.html","customer-dashboard.html","admin.html","about.html","contact.html","privacy.html","terms.html"])}">${ICON.user}<span>Profile</span></a>
</nav>`;
}
let _unsub = null;
export function renderChrome() {
  if (!document.getElementById("krfStyle")) {
    const s = document.createElement("style"); s.id = "krfStyle"; s.textContent = CSS; document.head.appendChild(s);
  }
  document.body.classList.add("krf-has-chrome");
  if (_unsub) return; // once per page: no duplicate headers
  const draw = (user) => {
    const adm = isAdminEmail(user);
    if (adm && here() !== "admin.html") { location.replace("./admin.html"); return; } // admin account: only the admin panel
    document.querySelectorAll("#krfHeader,#krfDrawer,#krfBottom,header.site-header,.hs-header,#siteHeader").forEach((n) => n.remove());
    const w = document.createElement("div"); w.innerHTML = build(user);
    document.body.prepend(w.querySelector("#krfHeader"));
    if (!adm) document.body.appendChild(w.querySelector("#krfBottom"));
    const lo = document.getElementById("krfOut");
    if (lo) lo.onclick = async () => { await A.signOut(auth); location.replace("./login.html"); };
  };
  draw(auth.currentUser);
  _unsub = A.onAuthStateChanged(auth, draw);
}

// ---- small shared helpers ----
export const safeNext = (n, d) => (/^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(n || "") ? "./" + n : d);
export const authMsg = (e) => ({
  "auth/invalid-credential": "Email ya password galat hai.", "auth/wrong-password": "Email ya password galat hai.",
  "auth/user-not-found": "Is email ka account nahi mila.", "auth/invalid-email": "Email sahi format mein likhein.",
  "auth/email-already-in-use": "Ye email pehle se registered hai. Login karein.", "auth/weak-password": "Password kam se kam 6 characters ka rakhein.",
  "auth/too-many-requests": "Bahut attempts ho gaye. Thodi der baad try karein.", "auth/network-request-failed": "Internet check karein."
}[e && e.code] || "Kuch galat ho gaya. Dobara try karein.");
