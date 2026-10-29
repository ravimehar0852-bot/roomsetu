/* RoomSetu – category-wise room illustrations
   Pure inline SVG: no images, no network, no dependencies.
   Usage: import { roomArt } from "./illustrations.js";  roomArt("Single Room") -> <svg>…</svg> */

const P = {
  wall: "#f6efe0", wall2: "#ece3cf", accent: "#e6eee4",
  floor: "#dcbd93", floor2: "#c99f72", base: "#fffdf7",
  teal: "#0f766e", tealD: "#0c6962", tealL: "#5fa89f", tealP: "#cfe5e0",
  dark: "#183c37", wood: "#b0835a", woodD: "#8a6144", gold: "#e5b86a",
  sand: "#b9946a", ink: "#2b3a37"
};
const G = 232; // floor line (viewBox is 400 x 300)

const R = (x, y, w, h, f, r = 0, x2 = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}"${x2}/>`;
const E = (cx, cy, rx, ry, f, o = 1) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" opacity="${o}"/>`;
const STROKE = ' stroke="#dde3da" stroke-width="1.5"';

/* ---------- building blocks ---------- */

const shell = (extra = "") =>
  R(0, 0, 400, G, P.wall) + R(0, 0, 400, 70, P.wall2, 0, ' opacity=".45"') + extra +
  R(0, G, 400, 300 - G, P.floor) + R(0, G - 1, 400, 7, P.base) +
  `<path d="M0 ${G + 22}H400M0 ${G + 46}H400" stroke="${P.floor2}" stroke-width="2" opacity=".35"/>`;

const rug = (cx, cy, rx, ry, c) =>
  E(cx, cy, rx, ry, c, .5) +
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 10}" ry="${ry - 4}" fill="none" stroke="${P.base}" stroke-width="2" opacity=".7"/>`;

const win = (x, y, w, h) =>
  R(x - 6, y - 6, w + 12, h + 12, P.base, 5) +
  R(x, y, w, h, "#c3e1e7") + R(x, y + h * .55, w, h * .45, "#e9f2dc") +
  `<path d="M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}" stroke="${P.base}" stroke-width="4"/>` +
  `<circle cx="${x + w - 14}" cy="${y + 15}" r="8" fill="${P.gold}"/>` +
  R(x - 22, y - 12, 15, h + 46, P.teal, 6, ' opacity=".92"') +
  R(x + w + 7, y - 12, 15, h + 46, P.teal, 6, ' opacity=".92"') +
  `<path d="M${x} ${y + h + 6}L${x - 24} ${G}H${x + w + 24}L${x + w} ${y + h + 6}Z" fill="#fff" opacity=".16"/>`;

const bed = (x, y, w, c = P.teal) => {
  const pw = Math.min(w * .38, 46);
  return E(x + w / 2, y + 58, w / 2 + 8, 6, "#000", .13) +
    R(x - 5, y - 42, w + 10, 50, P.woodD, 9) + R(x + 2, y - 35, w - 4, 36, P.wood, 7) +
    R(x, y, w, 42, P.base, 9, STROKE) +
    R(x + 8, y - 9, pw, 22, "#fff", 10, STROKE) + R(x + w - 8 - pw, y - 9, pw, 22, "#fff", 10, STROKE) +
    R(x, y + 17, w, 28, c, 8) + R(x, y + 17, w, 7, P.base, 3, ' opacity=".4"') +
    R(x + 5, y + 42, 9, 14, P.woodD, 2) + R(x + w - 14, y + 42, 9, 14, P.woodD, 2);
};

const bunk = (x, w, c1, c2) =>
  E(x + w / 2, G + 3, w / 2 + 6, 6, "#000", .13) +
  R(x, G - 150, 7, 144, P.woodD, 2) + R(x + w - 7, G - 150, 7, 144, P.woodD, 2) +
  R(x + 7, G - 52, w - 14, 6, P.wood, 2) +
  R(x + 7, G - 66, w - 14, 14, P.base, 5, STROKE) + R(x + 7, G - 60, w - 14, 8, c1, 4) +
  R(x + 12, G - 74, 36, 11, "#fff", 5, STROKE) +
  R(x + 7, G - 112, w - 14, 6, P.wood, 2) +
  R(x + 7, G - 126, w - 14, 14, P.base, 5, STROKE) + R(x + 7, G - 120, w - 14, 8, c2, 4) +
  R(x + 12, G - 134, 36, 11, "#fff", 5, STROKE) +
  R(x, G - 150, w, 5, P.woodD, 2);

const stand = x => {
  const y = G - 44;
  return R(x, y, 36, 40, P.wood, 4) + R(x + 4, y + 6, 28, 12, P.woodD, 2) + R(x + 4, y + 22, 28, 12, P.woodD, 2) +
    `<path d="M${x + 18} ${y}V${y - 14}" stroke="${P.woodD}" stroke-width="3"/>` +
    `<path d="M${x + 5} ${y - 12}L${x + 11} ${y - 34}H${x + 25}L${x + 31} ${y - 12}Z" fill="${P.gold}"/>` +
    E(x + 18, y - 22, 22, 22, P.gold, .18);
};

const plant = (x, s = 1) =>
  `<g transform="translate(${x} ${G - 26 * s}) scale(${s})">` +
  `<path d="M-12 0H12L9 26H-9Z" fill="#c8885a"/>` +
  `<ellipse cx="-10" cy="-14" rx="7" ry="18" fill="#2f8f6b" transform="rotate(-28 -10 -14)"/>` +
  `<ellipse cx="10" cy="-14" rx="7" ry="18" fill="#3aa57a" transform="rotate(28 10 -14)"/>` +
  `<ellipse cx="0" cy="-22" rx="7" ry="22" fill="#26805f"/></g>`;

const frame = (x, y, w, h) =>
  R(x, y, w, h, P.base, 3, ' stroke="#d9d3c2" stroke-width="2"') + R(x + 6, y + 6, w - 12, h - 12, P.tealP, 2) +
  `<path d="M${x + 6} ${y + h - 6}L${x + w * .38} ${y + h * .5}L${x + w * .55} ${y + h * .7}L${x + w * .72} ${y + h * .42}L${x + w - 6} ${y + h - 6}Z" fill="${P.tealL}"/>` +
  `<circle cx="${x + w * .7}" cy="${y + h * .28}" r="${w * .09}" fill="${P.gold}"/>`;

const wardrobe = (x, w, h) => {
  const y = G - h - 2;
  return E(x + w / 2, G + 2, w / 2 + 4, 4, "#000", .12) + R(x, y, w, h, P.wood, 5) +
    R(x + 4, y + 4, w / 2 - 6, h - 8, "#bf9468", 3) + R(x + w / 2 + 2, y + 4, w / 2 - 6, h - 8, "#bf9468", 3) +
    R(x + w / 2 - 8, y + h / 2 - 10, 4, 20, P.woodD, 2) + R(x + w / 2 + 4, y + h / 2 - 10, 4, 20, P.woodD, 2);
};

const desk = (x, w) => {
  const t = G - 60, m = x + w / 2;
  return E(m, G + 2, w / 2, 5, "#000", .12) +
    R(m - 20, t - 26, 40, 26, P.ink, 3) + R(m - 16, t - 22, 32, 18, "#8fc9c0", 2) + R(m - 26, t - 2, 52, 4, "#9aa7a3", 2) +
    R(x, t, w, 8, P.wood, 3) + R(x + 6, t + 8, 6, 52, P.woodD) + R(x + w - 12, t + 8, 6, 52, P.woodD) +
    R(m - 16, t + 24, 32, 9, P.teal, 5) + R(m - 3, t + 33, 6, 24, P.dark);
};

const shelf = (x, y, w) =>
  R(x, y, w, 6, P.wood, 2) +
  [0, 1, 2, 3].map(i => R(x + 6 + i * 14, y - (14 + (i % 2) * 8), 10, 14 + (i % 2) * 8, [P.teal, P.gold, P.tealL, P.woodD][i], 2)).join("");

const sofa = (x, w) => {
  const y = G - 54;
  return E(x + w / 2, G + 3, w / 2 + 10, 6, "#000", .13) +
    R(x, y - 28, w, 40, P.teal, 14) + R(x - 8, y, w + 16, 34, P.tealD, 12) +
    R(x + 10, y - 20, w / 2 - 12, 28, P.tealL, 9) + R(x + w / 2 + 2, y - 20, w / 2 - 12, 28, P.tealL, 9) +
    R(x, y + 34, 8, 10, P.woodD) + R(x + w - 8, y + 34, 8, 10, P.woodD);
};

const tv = (x, y, w) => {
  const h = w * .56;
  return R(x, y, w, h, P.ink, 4) + R(x + 4, y + 4, w - 8, h - 8, "#26413d", 2) +
    `<path d="M${x + 10} ${y + h - 8}L${x + w * .4} ${y + 8}" stroke="#fff" opacity=".12" stroke-width="6"/>`;
};

const lockers = x =>
  [0, 1, 2].map(i => {
    const lx = x + i * 34;
    return R(lx, G - 124, 32, 122, i === 1 ? P.tealL : P.teal, 3) +
      R(lx + 6, G - 112, 20, 4, "#fff", 1, ' opacity=".5"') + R(lx + 6, G - 104, 20, 4, "#fff", 1, ' opacity=".5"') +
      `<circle cx="${lx + 16}" cy="${G - 60}" r="3" fill="${P.base}"/>`;
  }).join("");

const table = (x, w) =>
  R(x, G - 20, w, 7, P.wood, 3) + R(x + 5, G - 13, 5, 14, P.woodD) + R(x + w - 10, G - 13, 5, 14, P.woodD);

const pendant = x =>
  `<path d="M${x} 0V34" stroke="${P.woodD}" stroke-width="3"/>` +
  `<path d="M${x - 22} 62L${x - 10} 34H${x + 10}L${x + 22} 62Z" fill="${P.gold}"/>` + E(x, 70, 36, 18, P.gold, .15);

/* ---------- scenes (one per category) ---------- */

const SCENES = {
  single: () =>
    shell() + frame(30, 56, 56, 72) + win(172, 44, 128, 64) + rug(248, G + 38, 150, 20, P.tealL) +
    stand(106) + bed(150, G - 64, 196) + plant(374),

  double: () =>
    shell() + win(158, 40, 84, 62) + rug(200, G + 38, 190, 20, P.tealL) +
    bed(14, G - 64, 150, P.teal) + bed(236, G - 64, 150, P.sand) + stand(182),

  triple: () =>
    shell() + frame(36, 60, 50, 60) + frame(314, 60, 50, 60) + win(170, 40, 60, 60) + rug(200, G + 40, 190, 18, P.tealL) +
    bed(12, G - 64, 100, P.teal) + bed(150, G - 64, 100, P.sand) + bed(288, G - 64, 100, P.tealL),

  pg: () =>
    shell() + win(60, 40, 86, 60) + rug(100, G + 40, 110, 16, P.tealL) +
    R(190, 44, 64, 30, P.teal, 8) + `<text x="222" y="66" text-anchor="middle" font-family="system-ui,sans-serif" font-size="19" font-weight="800" fill="#fff">PG</text>` +
    bed(14, G - 64, 140) + stand(160) + wardrobe(214, 70, 128) + shelf(300, 92, 84) + desk(296, 96),

  hostel: () =>
    shell() + win(170, 40, 60, 58) + rug(200, G + 40, 170, 18, P.tealL) +
    lockers(148) + bunk(14, 120, P.teal, P.sand) + bunk(266, 120, P.sand, P.teal),

  "1bhk": () =>
    shell(R(0, 0, 200, G, P.accent)) + R(198, 0, 4, G, P.base) +
    win(56, 44, 84, 56) + rug(80, G + 40, 80, 16, P.tealL) + bed(18, G - 64, 126) + stand(152) +
    rug(292, G + 40, 90, 16, P.tealL) + tv(236, 72, 100) + sofa(226, 130) + table(252, 76) + plant(380),

  "2bhk": () =>
    shell(R(0, 0, 134, G, P.accent) + R(266, 0, 134, G, P.accent)) + R(132, 0, 4, G, P.base) + R(264, 0, 4, G, P.base) +
    win(46, 46, 44, 42) + win(312, 46, 44, 42) +
    bed(16, G - 64, 100, P.teal) + bed(284, G - 64, 100, P.sand) +
    rug(200, G + 40, 56, 14, P.tealL) + tv(168, 72, 64) + sofa(160, 80),

  family: () =>
    shell() + pendant(330) + win(30, 46, 110, 66) + frame(190, 56, 44, 56) + frame(242, 56, 44, 56) +
    rug(150, G + 40, 140, 18, P.tealL) + sofa(176, 170) + table(84, 76) +
    R(36, G - 17, 16, 16, P.gold, 2) + R(54, G - 17, 16, 16, P.tealL, 2) + R(45, G - 33, 16, 16, P.sand, 2) + plant(376),

  room: () =>
    shell() + frame(40, 56, 54, 70) + win(150, 42, 100, 60) + rug(200, G + 38, 150, 20, P.tealL) +
    stand(76) + bed(120, G - 64, 160) + plant(350)
};

/* ---------- public API ---------- */

/* Safe category normaliser: ignores case, spaces and punctuation */
export function categoryKey(type) {
  const v = String(type || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (v.includes("triple")) return "triple";
  if (v.includes("double") || v.includes("sharing")) return "double";
  if (v.includes("single")) return "single";
  if (v.includes("pg") || v.includes("payingguest")) return "pg";
  if (v.includes("hostel")) return "hostel";
  if (v.includes("2bhk")) return "2bhk";
  if (v.includes("1bhk")) return "1bhk";
  if (v.includes("family")) return "family";
  return "room";
}

const cache = {};
const clean = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function roomArt(type) {
  const k = categoryKey(type);
  cache[k] = cache[k] || SCENES[k]();
  const label = clean(`${String(type || "").trim() || "Room"} illustration`);
  return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">${cache[k]}</svg>`;
}
