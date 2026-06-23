const params = new URLSearchParams(window.location.search);
const id = params.get("series");
const series = seriesData[id];

// --- IndexedDB Helper Logic ---
const dbName = "StreamingDB";
const storeName = "progress";

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = (e) => {
            e.target.result.createObjectStore(storeName);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const getProgress = async (key) => {
    const db = await openDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
    });
};

const saveProgress = async (key, value) => {
    const db = await openDB();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.put(value, key);
};
// --- End Helper Logic ---

async function init() {
    if (!series) return;

    // Fill Basic Info
    document.getElementById("title").textContent = series.title;
    document.getElementById("desc").textContent = series.desc;
    
    const video = document.getElementById("bgVideo");

    if (series.video) {
        // Clear any old sources and inject the new one
        video.innerHTML = `<source src="${series.video}" type="video/mp4">`;
        video.load();

        /** * FIX: REVEAL LOGIC
         * We keep the video at opacity 0 (defined in your CSS) 
         * and only switch to 1 once the data is actually playing.
         */
        const revealVideo = () => {
            video.style.opacity = "1";
        };

        // If the video is already buffered/playing
        if (video.readyState >= 3) {
            revealVideo();
        } else {
            // Listen for the first frame being drawn
            video.addEventListener('loadeddata', revealVideo);
        }

        // Catch errors to ensure it stays black if link is broken
        video.addEventListener('error', () => {
            video.style.opacity = "0";
            console.log("Video source not found - keeping background black.");
        });
    }

    const seasonNav = document.getElementById("seasonNav");
    const episodeContainer = document.getElementById("episodeList");

    if (series.seasons && series.seasons.length > 0) {
        const storageKey = `lastSeason_${id}`;
        
        // 1. Fetch last watched season from IndexedDB
        const lastSeasonNum = await getProgress(storageKey);

        // 2. Sort: Last watched season comes first
        let displayOrder = [...series.seasons];
        if (lastSeasonNum) {
            displayOrder.sort((a, b) => (a.number == lastSeasonNum ? -1 : 1));
        }

        const showEpisodes = (season) => {
            episodeContainer.innerHTML = "";
            for (let i = 1; i <= season.totalEpisodes; i++) {
                const btn = document.createElement("button");
                btn.className = "ep-btn";
                btn.textContent = `Episode ${i}`;
                const episodeKey = `${season.prefix}${i}`;
                btn.onclick = () => window.location.href = `videoplayer.html?ep=${episodeKey}`;
                episodeContainer.appendChild(btn);
            }
        };

        // 3. Build Season Buttons
        displayOrder.forEach((season, index) => {
            const seasonBtn = document.createElement("button");
            seasonBtn.className = "season-btn";
            seasonBtn.textContent = `Season ${season.number}`;

            if (index === 0) {
                seasonBtn.classList.add("active");
                showEpisodes(season);
            }

            seasonBtn.onclick = async () => {
                // Save to IndexedDB and reload
                await saveProgress(storageKey, season.number);
                location.reload();
            };

            seasonNav.appendChild(seasonBtn);
        });
    }
}

// Run the async function
init();
