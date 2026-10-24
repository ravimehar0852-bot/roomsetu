// Kota Room Finder — shared core. Import from every page:
// import { auth, db, A, F, getRole, renderChrome, home, esc } from "./app.js";
import { firebaseConfig } from "./firebase-config.js";
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
export async function getRole(user = auth.currentUser) {
  if (!user) return null;
  try {
    const snap = await F.getDoc(F.doc(db, "users", user.uid));
    return normalizeRole(snap.exists() ? snap.data().role : "customer");
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

// ---- Shared chrome (header + drawer + bottom nav) ----------------------
const CSS = `
:root{--krf-teal:#0f766e;--krf-teal-d:#0b5a54;--krf-cream:#fdf9f1;--krf-ink:#1f2937;--krf-line:#e7e1d3}
body.krf-has-chrome{padding-bottom:calc(72px + env(safe-area-inset-bottom,0px));background:var(--krf-cream)}
#krfHeader{position:sticky;top:0;z-index:1000;background:#fff;border-bottom:1px solid var(--krf-line);padding-top:env(safe-area-inset-top,0px);box-shadow:0 2px 10px rgba(0,0,0,.05)}
#krfHeader .krf-bar{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:12px;padding:10px 16px;min-height:60px}
#krfHeader .krf-brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;color:var(--krf-ink);text-decoration:none;margin-right:auto}
#krfHeader .krf-logo{width:36px;height:36px;border-radius:10px;background:var(--krf-teal);color:#fff;display:grid;place-items:center}
#krfHeader nav.krf-links{display:none;gap:4px;align-items:center}
#krfHeader nav.krf-links a{padding:10px 12px;border-radius:10px;color:var(--krf-ink);text-decoration:none;font-weight:600;font-size:15px}
#krfHeader nav.krf-links a:hover{background:#f1f5f4}
.krf-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:12px;font-weight:700;text-decoration:none;border:1.5px solid var(--krf-teal);color:var(--krf-teal);background:#fff;cursor:pointer;font-size:15px}
.krf-btn.fill{background:var(--krf-teal);color:#fff}
#krfBurger{width:44px;height:44px;border:0;background:#f1f5f4;border-radius:12px;display:grid;place-items:center;cursor:pointer}
#krfDrawer{position:fixed;inset:0;z-index:1100;display:none}
#krfDrawer.open{display:block}
#krfDrawer .krf-scrim{position:absolute;inset:0;background:rgba(15,23,42,.45)}
#krfDrawer .krf-panel{position:absolute;top:0;right:0;bottom:0;width:min(84vw,320px);background:#fff;padding:calc(16px + env(safe-area-inset-top,0px)) 16px 16px;display:flex;flex-direction:column;gap:6px;box-shadow:-8px 0 30px rgba(0,0,0,.15);animation:krfIn .2s ease}
#krfDrawer .krf-panel a,#krfDrawer .krf-panel button.lnk{padding:14px 12px;border-radius:12px;color:var(--krf-ink);text-decoration:none;font-weight:600;background:none;border:0;text-align:left;font-size:16px;cursor:pointer}
#krfDrawer .krf-panel a:hover{background:#f1f5f4}
@keyframes krfIn{from{transform:translateX(30px);opacity:0}to{transform:none;opacity:1}}
#krfBottom{position:fixed;left:0;right:0;bottom:0;z-index:900;background:#fff;border-top:1px solid var(--krf-line);display:flex;justify-content:space-around;padding:6px 4px calc(6px + env(safe-area-inset-bottom,0px));box-shadow:0 -4px 16px rgba(0,0,0,.06)}
#krfBottom a{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;text-decoration:none;color:#6b7280;font-size:11px;font-weight:600;border-radius:12px}
#krfBottom a.active{color:var(--krf-teal)}
#krfBottom a.active svg{stroke:var(--krf-teal)}
@media(min-width:900px){#krfHeader nav.krf-links{display:flex}#krfBurger{display:none}#krfBottom{display:none}body.krf-has-chrome{padding-bottom:0}}
`;
const I = (d) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  home: I('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
  saved: I('<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z"/>'),
  enq: I('<path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>'),
  user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
  burger: I('<path d="M3 6h18M3 12h18M3 18h18"/>'),
};
const here = () => (location.pathname.split("/").pop() || "index.html").toLowerCase();

function build(user, role) {
  const dash = home(role);
  const links = [["./index.html", "Home"], ["./rooms.html", "Find Rooms"], ["./join.html", "List Property"],
    ["./about.html", "About"], ["./contact.html", "Contact"]];
  const authLinks = user
    ? `<a class="krf-btn" href="${dash}">Dashboard</a><button class="krf-btn fill" id="krfOut" type="button">Logout</button>`
    : `<a class="krf-btn" href="./login.html">Login</a><a class="krf-btn fill" href="./register.html">Register</a>`;
  const drawerAuth = user
    ? `<a href="${dash}">My Dashboard</a><button class="lnk" id="krfOut2" type="button">Logout</button>`
    : `<a href="./login.html">Login</a><a href="./register.html">Register</a>`;
  const p = here();
  const act = (names) => (names.includes(p) ? "active" : "");
  const profileHref = user ? dash : "./login.html?next=" + encodeURIComponent(location.pathname.split("/").pop() || "index.html");

  return `
<header id="krfHeader"><div class="krf-bar">
  <a class="krf-brand" href="./index.html"><span class="krf-logo">${I('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>')}</span><span>RoomSetu</span></a>
  <nav class="krf-links" aria-label="Main">${links.map(([h, t]) => `<a href="${h}">${t}</a>`).join("")}</nav>
  <div class="krf-links" style="display:none"></div>
  <span class="krf-desk" style="display:none"></span>
  <button id="krfBurger" type="button" aria-label="Open menu" aria-expanded="false">${ICON.burger}</button>
</div></header>
<div id="krfDrawer" aria-hidden="true"><div class="krf-scrim"></div><div class="krf-panel">
  ${links.map(([h, t]) => `<a href="${h}">${t}</a>`).join("")}<hr style="border:0;border-top:1px solid var(--krf-line);width:100%">${drawerAuth}
</div></div>
<nav id="krfBottom" aria-label="App navigation">
  <a href="./index.html" class="${act(["index.html", ""])}">${ICON.home}<span>Home</span></a>
  <a href="./rooms.html" class="${act(["rooms.html", "room-details.html"])}">${ICON.search}<span>Search</span></a>
  <a href="./rooms.html?saved=1" class="${location.search.includes("saved=1") ? "active" : ""}">${ICON.saved}<span>Saved</span></a>
  <a href="${user ? "./chat.html" : "./login.html?next=chat.html"}" class="${act(["chat.html"])}">${ICON.enq}<span>Chats</span></a>
  <a href="${profileHref}" class="${act(["login.html", "register.html", "owner-dashboard.html", "admin.html"])}">${ICON.user}<span>Profile</span></a>
</nav>`;
}

let _chromeUnsub = null;
export function renderChrome() {
  if (!document.getElementById("krfStyle")) {
    const s = document.createElement("style");
    s.id = "krfStyle"; s.textContent = CSS; document.head.appendChild(s);
  }
  document.body.classList.add("krf-has-chrome");
  if (_chromeUnsub) return; // initialised once; avoids duplicate headers
  const draw = async (user) => {
    const role = user ? await getRole(user) : null;
    // remove old header/chrome, including legacy ones from the previous project
    document.querySelectorAll("#krfHeader,#krfDrawer,#krfBottom,header.site-header,.hs-header,#siteHeader").forEach((n) => n.remove());
    const wrap = document.createElement("div");
    wrap.innerHTML = build(user, role);
    // header/drawer first in body, bottom nav last
    const header = wrap.querySelector("#krfHeader"), drawer = wrap.querySelector("#krfDrawer"), bottom = wrap.querySelector("#krfBottom");
    // desktop auth buttons
    const bar = header.querySelector(".krf-bar");
    const authBox = document.createElement("div");
    authBox.style.cssText = "display:none;gap:8px";
    authBox.className = "krf-authbox";
    authBox.innerHTML = user
      ? `<a class="krf-btn" href="${home(role)}">Dashboard</a><button class="krf-btn fill" id="krfOut" type="button">Logout</button>`
      : `<a class="krf-btn" href="./login.html">Login</a><a class="krf-btn fill" href="./register.html">Register</a>`;
    bar.insertBefore(authBox, bar.querySelector("#krfBurger"));
    bar.querySelectorAll(".krf-desk,div.krf-links").forEach((n) => n.remove());
    document.body.prepend(drawer); document.body.prepend(header); document.body.appendChild(bottom);
    const mq = window.matchMedia("(min-width:900px)");
    const sync = () => (authBox.style.display = mq.matches ? "flex" : "none");
    sync(); mq.addEventListener("change", sync);

    const burger = header.querySelector("#krfBurger");
    const setOpen = (o) => { drawer.classList.toggle("open", o); burger.setAttribute("aria-expanded", o); drawer.setAttribute("aria-hidden", !o); };
    burger.onclick = () => setOpen(!drawer.classList.contains("open"));
    drawer.querySelector(".krf-scrim").onclick = () => setOpen(false);
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.querySelectorAll("#krfOut,#krfOut2").forEach((b) => (b.onclick = async () => { await A.signOut(auth); location.href = "./index.html"; }));
  };
  draw(auth.currentUser);
  _chromeUnsub = A.onAuthStateChanged(auth, draw);
}

// ---- small shared helpers ----
export const safeNext = (n, d) => (/^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(n || "") ? "./" + n : d);
export const authMsg = (e) => ({
  "auth/invalid-credential": "Email ya password galat hai.", "auth/wrong-password": "Email ya password galat hai.",
  "auth/user-not-found": "Is email ka account nahi mila.", "auth/invalid-email": "Email sahi format mein likhein.",
  "auth/email-already-in-use": "Ye email pehle se registered hai. Login karein.", "auth/weak-password": "Password kam se kam 6 characters ka rakhein.",
  "auth/too-many-requests": "Bahut attempts ho gaye. Thodi der baad try karein.", "auth/network-request-failed": "Internet check karein."
}[e && e.code] || "Kuch galat ho gaya. Dobara try karein.");
