// ============================================================
// KOTA ROOM FINDER - ROOMS MODULE
// Firebase listings, search, favorites and property cards
// ============================================================

import {
  auth,
  db,
  A,
  F,
  esc
} from "./app.js";


// ============================================================
// CONSTANTS
// ============================================================

export const AREAS = [
  "Talwandi",
  "Mahaveer Nagar",
  "Rajeev Gandhi Nagar",
  "Landmark City",
  "Kunhadi",
  "Vigyan Nagar",
  "Jawahar Nagar",
  "Dadabari",
  "Indra Vihar",
  "Borkhera",
  "Gumanpura",
  "Other"
];

export const TYPES = [
  "Single Room",
  "Double Sharing",
  "Triple Sharing",
  "PG",
  "Hostel",
  "1 BHK",
  "2 BHK",
  "Family Rental"
];


// ============================================================
// HELPERS
// ============================================================

const money = value => {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return "₹0";
  }

  return "₹" + n.toLocaleString("en-IN");
};

const norm = value =>
  String(value ?? "").trim().toLowerCase();

const currentPageUser = () => auth.currentUser;


// ============================================================
// TOAST MESSAGE
// ============================================================

export function toast(message, type = "info") {
  let box = document.getElementById("krf-room-toast");

  if (!box) {
    box = document.createElement("div");
    box.id = "krf-room-toast";

    Object.assign(box.style, {
      position: "fixed",
      bottom: "90px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "99999",
      width: "min(92%, 400px)"
    });

    document.body.appendChild(box);
  }

  const item = document.createElement("div");

  item.textContent = message;

  Object.assign(item.style, {
    padding: "13px 16px",
    marginTop: "8px",
    borderRadius: "12px",
    color: "#fff",
    background:
      type === "error"
        ? "#dc2626"
        : type === "success"
          ? "#15803d"
          : "#0f766e",
    fontSize: "14px",
    fontWeight: "700",
    boxShadow: "0 8px 25px rgba(0,0,0,.15)"
  });

  box.appendChild(item);

  setTimeout(() => item.remove(), 3500);
}


// ============================================================
// AUTH READY
// Wait for Firebase to determine the logged-in user.
// ============================================================

let authPromise = null;

export function authReady() {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  if (authPromise) {
    return authPromise;
  }

  authPromise = new Promise(resolve => {
    let unsubscribe = () => {};

    unsubscribe = A.onAuthStateChanged(
      auth,
      user => {
        unsubscribe();
        resolve(user || null);
      },
      error => {
        console.error("Auth state error:", error);
        unsubscribe();
        resolve(null);
      }
    );
  });

  return authPromise;
}


// ============================================================
// FAVORITES CACHE
// ============================================================

const favoriteIds = new Set();

let favoritesLoadedFor = null;

async function loadFavorites(user) {
  favoriteIds.clear();
  favoritesLoadedFor = user?.uid || null;

  if (!user) {
    return;
  }

  try {
    const snapshot = await F.getDocs(
      F.query(
        F.collection(db, "favorites"),
        F.where("uid", "==", user.uid)
      )
    );

    snapshot.forEach(document => {
      const data = document.data();

      if (data.listingId) {
        favoriteIds.add(String(data.listingId));
      }
    });

  } catch (error) {
    console.warn("Favorites load error:", error);
  }
}

export function isFav(listingId) {
  return favoriteIds.has(String(listingId));
}


// ============================================================
// FETCH PUBLIC LISTINGS
//
// Firestore rules require approved + available listings.
// Additional filters are applied after authorized documents
// have been fetched.
// ============================================================

export async function fetchApproved(options = {}) {
  const {
    area = "",
    propertyType = "",
    suitableFor = "",
    furnishing = "",
    min = 0,
    maxRent = 0,
    max = 200,
    sort = ""
  } = options;

  const user = await authReady();

  if (favoritesLoadedFor !== (user?.uid || null)) {
    await loadFavorites(user);
  }

  const constraints = [
    F.where("status", "==", "approved"),
    F.where("availability", "==", "available"),
    F.limit(Math.min(Math.max(Number(max) || 200, 1), 300))
  ];

  const snapshot = await F.getDocs(
    F.query(
      F.collection(db, "listings"),
      ...constraints
    )
  );

  let listings = snapshot.docs.map(document => ({
    id: document.id,
    ...document.data()
  }));

  // Locality filter
  if (area) {
    listings = listings.filter(item =>
      norm(item.area) === norm(area)
    );
  }

  // Property type filter
  if (propertyType) {
    listings = listings.filter(item =>
      norm(item.propertyType) === norm(propertyType)
    );
  }

  // Suitable tenant filter
  if (suitableFor) {
    listings = listings.filter(item => {
      const value = norm(item.suitableFor);
      const label = norm(item.suitableForLabel);

      return (
        value === norm(suitableFor) ||
        label === norm(suitableFor)
      );
    });
  }

  // Furnishing filter
  if (furnishing) {
    listings = listings.filter(item =>
      norm(item.furnishing) === norm(furnishing) ||
      norm(item.furnishingLabel) === norm(furnishing)
    );
  }

  // Rent filters
  if (Number(min) > 0) {
    listings = listings.filter(item =>
      Number(item.monthlyRent) >= Number(min)
    );
  }

  if (Number(maxRent) > 0) {
    listings = listings.filter(item =>
      Number(item.monthlyRent) <= Number(maxRent)
    );
  }

  // Sorting
  if (sort === "low") {
    listings.sort(
      (a, b) =>
        Number(a.monthlyRent || 0) -
        Number(b.monthlyRent || 0)
    );
  } else if (sort === "high") {
    listings.sort(
      (a, b) =>
        Number(b.monthlyRent || 0) -
        Number(a.monthlyRent || 0)
    );
  } else {
    listings.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;

      return bTime - aTime;
    });
  }

  return listings;
}


// ============================================================
// PROPERTY CARD
// ============================================================

export function card(listing) {
  const item = listing || {};
  const id = String(item.id || "");
  const photos = Array.isArray(item.photos)
    ? item.photos.filter(Boolean)
    : [];

  const image = photos[0] || "";

  return `
    <article class="card room-card"
      style="overflow:hidden">

      ${
        image
          ? `
            <a href="./room-details.html?id=${encodeURIComponent(id)}">
              <img
                src="${esc(image)}"
                alt="${esc(item.title || "Room in Kota")}"
                loading="lazy"
                style="width:100%;height:210px;object-fit:cover"
              >
            </a>
          `
          : `
            <div
              style="height:180px;background:#e8f0ed;
              display:grid;place-items:center;font-size:48px">
              🏠
            </div>
          `
      }

      <div style="padding:14px">

        <div class="row"
          style="justify-content:space-between;align-items:center">

          <span class="tag">
            ${esc(item.propertyType || "Room")}
          </span>

          <button
            class="krf-btn"
            type="button"
            data-fav="${esc(id)}"
            aria-label="Save property"
          >
            ${isFav(id) ? "♥ Saved" : "♡ Save"}
          </button>

        </div>

        <h3 style="margin:12px 0 6px">
          ${esc(item.title || "Room in Kota")}
        </h3>

        <div class="rent">
          ${money(item.monthlyRent)}
          <span class="muted">/month</span>
        </div>

        <p class="muted">
          📍 ${esc(
            [item.area, item.landmark]
              .filter(Boolean)
              .join(", ") || "Kota, Rajasthan"
          )}
        </p>

        <p class="muted">
          ${esc(item.suitableForLabel || item.suitableFor || "")}
          ${item.furnishing
            ? " · " + esc(item.furnishingLabel || item.furnishing)
            : ""}
        </p>

        <a
          class="krf-btn fill"
          href="./room-details.html?id=${encodeURIComponent(id)}"
          style="width:100%"
        >
          View Details
        </a>

      </div>
    </article>
  `;
}


// ============================================================
// RENDER PROPERTY CARDS
// ============================================================

export function show(container, listings, emptyMessage) {
  if (!container) {
    console.error("Room listing container not found.");
    return;
  }

  if (!Array.isArray(listings) || listings.length === 0) {
    container.innerHTML = `
      <div class="empty"
        style="grid-column:1/-1;text-align:center;padding:28px">

        <div style="font-size:38px">🏠</div>

        <b>Koi room nahi mila</b>

        <p class="muted">
          ${esc(
            emptyMessage ||
            "Filters change karke dobara try karein."
          )}
        </p>

      </div>
    `;

    return;
  }

  container.innerHTML = listings
    .map(card)
    .join("");

  bindFav(container);
}


// ============================================================
// SAVE / REMOVE FAVORITE
// ============================================================

export function bindFav(container) {
  if (!container || container.dataset.favBound === "1") {
    return;
  }

  container.dataset.favBound = "1";

  container.addEventListener("click", async event => {
    const button = event.target.closest("[data-fav]");

    if (!button || !container.contains(button)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const listingId = button.dataset.fav;

    if (!listingId) {
      return;
    }

    const user = await authReady();

    if (!user) {
      location.href =
        "./login.html?next=" +
        encodeURIComponent(location.pathname.split("/").pop() || "index.html");

      return;
    }

    const key = user.uid + "_" + listingId;
    const ref = F.doc(db, "favorites", key);

    button.disabled = true;

    try {
      const existing = await F.getDoc(ref);

      if (existing.exists()) {
        await F.deleteDoc(ref);
        favoriteIds.delete(listingId);
        button.textContent = "♡ Save";

        toast("Saved rooms se hata diya.", "success");

      } else {
        await F.setDoc(ref, {
          uid: user.uid,
          listingId,
          createdAt: F.serverTimestamp()
        });

        favoriteIds.add(listingId);
        button.textContent = "♥ Saved";

        toast("Room save ho gaya!", "success");
      }

    } catch (error) {
      console.error("Favorite error:", error);

      toast(
        "Room save nahi ho paya. Firebase Rules check karein.",
        "error"
      );

    } finally {
      button.disabled = false;
    }
  });
}


// ============================================================
// TYPES / AREAS READY
// ============================================================

export const ROOMS_MODULE_VERSION = "1.0.0";
