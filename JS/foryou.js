/* -----------------------------
   FIREBASE & FIRESTORE SETUP
------------------------------ */
const db = firebase.firestore();
const auth = firebase.auth();

/* -----------------------------
   CSS INJECTION
------------------------------ */
const style = document.createElement('style');
style.textContent = `
    .section { margin: 0 !important; padding: 0 !important; }
    .section-title { margin: 0 !important; padding: 2px 5px !important; font-size: 1rem; line-height: 1; }
    .movies { display: flex; overflow-x: auto; gap: 5px; margin: 10px !important; padding: 0 !important; scrollbar-width: none; }
    .movies::-webkit-scrollbar { display: none; }
    .movie { flex: 0 0 auto; margin: 0 !important; padding: 0 !important; }
    .movie img { display: block; margin: 0; width: 100%; }
    .movie .title { margin: 0 !important; padding: 0px 0 50px 0 !important; font-size: 0.75rem; line-height: 1.1; }
    .auth-status-banner { text-align: center; padding: 10px; font-size: 0.8rem; color: #888; background: rgba(255,255,255,0.05); }
`;
document.head.appendChild(style);

/* -----------------------------
   STORAGE & SYNC (IndexedDB + Firestore)
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
        const db = await openDB();
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, "lastGenre");
    } catch (e) { console.log("IDB Error:", e); }
}

async function getLastGenre() {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE, "readonly");
            const req = tx.objectStore(STORE).get("lastGenre");
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch (e) { return null; }
}

async function syncGenreToCloud(genre) {
    const user = auth.currentUser;
    if (user && user.email) {
        try {
            await db.collection("users").doc(user.email).set({
                lastGenre: genre,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (e) { console.error("Cloud Sync Error:", e); }
    }
}

async function getCloudGenre() {
    const user = auth.currentUser;
    if (user && user.email) {
        const doc = await db.collection("users").doc(user.email).get();
        return doc.exists ? doc.data().lastGenre : null;
    }
    return null;
}

/* -----------------------------
   CORE LOGIC
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
   RENDERING
------------------------------ */
function buildRandom() {
    const container = document.getElementById("randomContainer");
    if (!container) return;
    container.innerHTML = `<div class="section"><h2 class="section-title">Random Picks</h2><div class="movies"></div></div>`;
    const row = container.querySelector(".movies");
    shuffle(movies).slice(0, 20).forEach(m => {
        const card = createMovieCard(m);
        card.addEventListener("click", () => saveLastWatchedGenre(m));
        row.appendChild(card);
    });
}

async function buildAllGenreRows() {
    const container = document.getElementById("genreContainer") || document.body;
    container.innerHTML = ""; // Clear for re-renders

    const user = auth.currentUser;
    if (!user) {
        const banner = document.createElement("div");
        banner.className = "auth-status-banner";
        banner.innerText = "Not logged in: Personalized content isn't available.";
        container.appendChild(banner);
    }

    const genreMap = {};
    movies.forEach(m => {
        getGenres(m.genres).forEach(g => {
            if (!genreMap[g]) genreMap[g] = [];
            genreMap[g].push(m);
        });
    });

    // Priority: Cloud Email Doc > Local IndexedDB
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
auth.onAuthStateChanged(() => {
    const interval = setInterval(() => {
        if (window.movies && Array.isArray(movies) && movies.length > 0) {
            clearInterval(interval);
            buildRandom();
            buildAllGenreRows();
        }
    }, 50);
});
