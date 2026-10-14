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

// --- Inject Dynamic CSS for Centered Layout, 3-Column Grid & White Buttons ---
const styleTag = document.createElement("style");
styleTag.textContent = `
    /* Center the main content wrapper */
    .series-container, body > div:not(#background) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: left;
        max-width: 50%;
        margin: 0 auto;
        padding: 20px;
    }

    #title {
        text-align: left;
        margin-bottom: 10px;
    }

    #desc {
        text-align: left;
        max-width: 600px;
        margin-bottom: 20px;
    }

    #seasonNav {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }

    #episodeList {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        width: 100%;
        max-width: 800px;
    }
    .ep-btn {
        background-color: #ffffff;
        color: #000000;
        border: none;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: background-color 0.2s, transform 0.1s;
    }
    .ep-btn:hover {
        background-color: #f0f0f0;
        transform: translateY(-2px);
    }
    .ep-btn .play-icon {
        width: 16px;
        height: 16px;
        fill: currentColor;
    }
`;
document.head.appendChild(styleTag);

async function init() {
    if (!series) return;

    // Fill Basic Info
    document.getElementById("title").textContent = series.title;
    document.getElementById("desc").textContent = series.desc;

    // Background video removed per your request.

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
                
                // Episode text + SVG Play icon
                btn.innerHTML = `
                    <span>Episode ${i}</span>
                    <svg class="play-icon" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                `;

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
