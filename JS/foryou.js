import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

/* -----------------------------
   FIREBASE INITIALIZATION
------------------------------ */
const firebaseConfig = {
  apiKey: "AIzaSyCExki28m1NNepVQEIjmcQzR8z8O68LqIc",
  authDomain: "rinolski-notifications.firebaseapp.com",
  databaseURL: "https://rinolski-notifications-default-rtdb.firebaseio.com",
  projectId: "rinolski-notifications",
  storageBucket: "rinolski-notifications.firebasestorage.app",
  messagingSenderId: "355554579853",
  appId: "1:355554579853:web:3caa961653c0cdc0a359c4",
  measurementId: "G-WZ84970GST"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

/* -----------------------------
   CSS INJECTION
------------------------------ */
const style = document.createElement('style');
style.textContent = `
    .section { margin: 0 !important; padding: 0 !important; }
    .section-title { margin: 0 !important; padding: 2px 5px !important; font-size: 1rem; line-height: 1; color: #fff; }
    .movies { display: flex; overflow-x: auto; gap: 5px; margin: 10px !important; padding: 0 !important; scrollbar-width: none; }
    .movies::-webkit-scrollbar { display: none; }
    .movie { flex: 0 0 auto; margin: 0 !important; padding: 0 !important; }
    .movie img { display: block; margin: 0; width: 100%; border-radius: 4px; }
    .movie .title { margin: 0 !important; padding: 5px 0 40px 0 !important; font-size: 0.75rem; line-height: 1.1; color: #ccc; }
    .auth-banner { text-align: center; padding: 10px; font-size: 0.8rem; color: #ffab00; background: rgba(255,171,0,0.1); margin-bottom: 10px; }
`;
document.head.appendChild(style);

/* -----------------------------
   LOCAL STORAGE (IndexedDB)
------------------------------ */
const DB_NAME = "rinolskiDB";
const STORE = "meta";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function setLastGenre(value) {
    try {
        const dbInstance = await openDB();
        const tx = dbInstance.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, "lastGenre");
    } catch (e) { console.error("IDB Error:", e); }
}

async function getLastGenre() {
    try {
        const dbInstance = await openDB();
        return new Promise((resolve) => {
            const tx = dbInstance.transaction(STORE, "readonly");
            const req = tx.objectStore(STORE).get("lastGenre");
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch (e) { return null; }
}

/* -----------------------------
   CLOUD SYNC (Firestore Email-based)
------------------------------ */
async function syncGenreToCloud(genre) {
    const user = auth.currentUser;
    if (user && user.email) {
        try {
            const userRef = doc(db, "users", user.email);
            await setDoc(userRef, {
                lastGenre: genre,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (e) { console.error("Cloud Sync Error:", e); }
    }
}

async function getCloudGenre() {
    const user = auth.currentUser;
    if (user && user.email) {
        try {
            const userRef = doc(db, "users", user.email);
            const docSnap = await getDoc(userRef);
            return docSnap.exists() ? docSnap.data().lastGenre : null;
        } catch (e) { return null; }
    }
    return null;
}

/* -----------------------------
   CORE UI LOGIC
------------------------------ */
function getGenres(genres) {
    if (Array.isArray(genres)) return genres.map(g => g.toLowerCase());
    if (typeof genres === "string") return genres.split(",").map(g => g.trim().toLowerCase());
    return [];
}

function createMovieCard(m) {
    const div = document.createElement("div");
    div.className = "movie";
    div.innerHTML = `<a href="${m.link}"><img src="${m.image}"></a><p class="title">${m.title}</p>`;
    return div;
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

async function saveLastWatchedGenre(movie) {
    const genres = getGenres(movie.genres);
    if (genres.length) {
        const genre = genres[0];
        await setLastGenre(genre);
        await syncGenreToCloud(genre);
    }
}

/* -----------------------------
   RENDERING FUNCTIONS
------------------------------ */
function buildRandom() {
    const container = document.getElementById("randomContainer");
    if (!container) return;
    container.innerHTML = `<div class="section"><h2 class="section-title">Random Picks</h2><div class="movies"></div></div>`;
    const row = container.querySelector(".movies");
    shuffle(window.movies).slice(0, 20).forEach(m => {
        const card = createMovieCard(m);
        card.addEventListener("click", () => saveLastWatchedGenre(m));
        row.appendChild(card);
    });
}

async function buildAllGenreRows() {
    const container = document.getElementById("genreContainer") || document.body;
    container.innerHTML = "";

    const user = auth.currentUser;
    if (!user) {
        const banner = document.createElement("div");
        banner.className = "auth-banner";
        banner.innerText = "Not logged in: Personalized content isn't available.";
        container.prepend(banner);
    }

    const genreMap = {};
    window.movies.forEach(m => {
        getGenres(m.genres).forEach(g => {
            if (!genreMap[g]) genreMap[g] = [];
            genreMap[g].push(m);
        });
    });

    // Strategy: Try Cloud (by Email), fallback to Local, fallback to random
    let lastGenre = user ? await getCloudGenre() : null;
    if (!lastGenre) lastGenre = await getLastGenre();

    let genres = Object.keys(genreMap);
    if (lastGenre && genreMap[lastGenre]) {
        genres = [lastGenre, ...genres.filter(g => g !== lastGenre)];
    }

    const finalOrder = [genres[0], ...shuffle(genres.slice(1))];

    finalOrder.forEach(genre => {
        if (!genre) return;
        const section = document.createElement("div");
        section.className = "section";
        section.innerHTML = `
            <h2 class="section-title">${genre.charAt(0).toUpperCase() + genre.slice(1)}</h2>
            <div class="movies"></div>
        `;
        const row = section.querySelector(".movies");
        shuffle(genreMap[genre]).slice(0, 15).forEach(m => {
            const card = createMovieCard(m);
            card.addEventListener("click", () => saveLastWatchedGenre(m));
            row.appendChild(card);
        });
        container.appendChild(section);
    });
}

/* -----------------------------
   INITIALIZATION
------------------------------ */
onAuthStateChanged(auth, (user) => {
    const interval = setInterval(() => {
        if (window.movies && Array.isArray(window.movies) && window.movies.length > 0) {
            clearInterval(interval);
            buildRandom();
            buildAllGenreRows();
        }
    }, 50);
});

