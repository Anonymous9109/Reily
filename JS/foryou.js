/* -----------------------------
   CSS INJECTION (Maximum Closeness)
------------------------------ */
const style = document.createElement('style');
style.textContent = `
    /* Remove all spacing between genre blocks */
    .section {
        margin: 0 !important;
        padding: 0 !important;
    }

    /* Remove all spacing between Title and Row */
    .section-title {
        margin: 0 !important;
        padding: 2px 5px !important; /* Minimal 20px gap just to keep text visible */
        font-size: 1rem;
        line-height: 1;
    }

    /* Remove vertical gap in the flex container */
    .movies {
        display: flex;
        overflow-x: auto;
        gap: 5px; /* Minimal horizontal gap between posters */
        margin: 10px !important;
        padding: 0 !important;
        scrollbar-width: none;
    }

    .movies::-webkit-scrollbar {
        display: none;
    }

    .movie {
        flex: 0 0 auto;
        margin: 0 !important;
        padding: 0 !important;
    }

    .movie img {
        display: block;
        margin: 0;
        width: 100%; /* Ensures no extra inline spacing */
    }

    .movie .title {
        margin: 0 !important;
        padding: 0px 0 50px 0 !important; /* Space below the text before next row starts */
        font-size: 0.75rem;
        line-height: 1.1;
    }
`;
document.head.appendChild(style);

/* -----------------------------
   INDEXEDDB (WebView-safe storage)
------------------------------ */

const DB_NAME = "rinolskiDB";
const STORE = "meta";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE);
            }
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
    } catch (e) {
        console.log("IndexedDB set error:", e);
    }
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
    } catch (e) {
        return null;
    }
}

/* -----------------------------
   HELPERS
------------------------------ */

function getGenres(genres) {
    if (Array.isArray(genres)) return genres.map(g => g.toLowerCase());
    if (typeof genres === "string") return genres.split(",").map(g => g.trim().toLowerCase());
    return [];
}

function createMovieCard(m) {
    const div = document.createElement("div");
    div.className = "movie";
    div.innerHTML = `
        <a href="${m.link}">
            <img src="${m.image}">
        </a>
        <p class="title">${m.title}</p>
    `;
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

function saveLastWatchedGenre(movie) {
    const genres = getGenres(movie.genres);
    if (genres.length) setLastGenre(genres[0]);
}

/* -----------------------------
   RANDOM PICKS
------------------------------ */

function buildRandom() {
    const container = document.getElementById("randomContainer");
    if (!container) return;
    const random = shuffle(movies).slice(0, 20);
    container.innerHTML = `
        <div class="section">
            <h2 class="section-title">Random Picks</h2>
            <div class="movies"></div>
        </div>
    `;
    const row = container.querySelector(".movies");
    random.forEach(m => {
        const card = createMovieCard(m);
        card.addEventListener("click", () => saveLastWatchedGenre(m));
        row.appendChild(card);
    });
}

/* -----------------------------
   GENRE ROWS
------------------------------ */

async function buildAllGenreRows() {
    const container = document.getElementById("genreContainer") || document.body;
    const genreMap = {};

    movies.forEach(m => {
        getGenres(m.genres).forEach(g => {
            if (!genreMap[g]) genreMap[g] = [];
            genreMap[g].push(m);
        });
    });

    let lastGenre = await getLastGenre();
    let genres = Object.keys(genreMap);
    if (lastGenre && genreMap[lastGenre]) {
        genres = [lastGenre, ...genres.filter(g => g !== lastGenre)];
    }

    const finalOrder = [genres[0], ...shuffle(genres.slice(1))];

    finalOrder.forEach(genre => {
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
   INIT
------------------------------ */

window.addEventListener("load", () => {
    const interval = setInterval(() => {
        if (window.movies && Array.isArray(movies) && movies.length > 0) {
            clearInterval(interval);
            try {
                buildRandom();
                buildAllGenreRows();
            } catch (e) {
                console.log("Render error:", e);
            }
        }
    }, 50);
});
