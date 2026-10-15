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

// --- Inject Dynamic CSS for Series Poster Background & Padding ---
const styleTag = document.createElement("style");
styleTag.textContent = `
    html, body {
        background-color: #000000;
        color: #ffffff;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        padding-left: 24px;
        padding-right: 24px;
        position: relative;
        min-height: 100vh;
    }

    /* Fixed backdrop using the poster image */
    body::before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background-image: var(--series-bg, none);
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        filter: brightness(0.35) blur(6px);
        transform: scale(1.05);
        z-index: -1;
    }

    /* Pushes content down by 100px */
    .content-wrapper, #title, .main-container {
        margin-top: 100px;
    }

    #episodeList {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        width: 100%;
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

    // 1. Set text info
    document.getElementById("title").textContent = series.title;
    document.getElementById("desc").textContent = series.desc;

    // 2. Locate poster image safely using absolute root-relative paths
    let posterPath = series.image || "";
    
    if (!posterPath && typeof movies !== "undefined") {
        const matched = movies.find(m => m.link && m.link.toLowerCase().includes(id.toLowerCase()));
        if (matched) {
            posterPath = matched.image;
        }
    }

    // Fallback if not found in movies array: construct directly from ID
    if (!posterPath) {
        posterPath = `images/${id}.jpg`;
    }

    // Ensure path starts from root or has correct relative jump if in a subfolder
    let finalUrl = posterPath;
    if (!finalUrl.startsWith("http") && !finalUrl.startsWith("/")) {
        // If script is in /Series/, jump back one level to access /images/
        finalUrl = `../${finalUrl.replace(/^\.\//, '')}`;
    }

    document.body.style.setProperty("--series-bg", `url('${finalUrl}')`);

    const seasonNav = document.getElementById("seasonNav");
    const episodeContainer = document.getElementById("episodeList");

    if (series.seasons && series.seasons.length > 0) {
        const storageKey = `lastSeason_${id}`;
        
        // Fetch last watched season from IndexedDB
        const lastSeasonNum = await getProgress(storageKey);

        // Sort: Last watched season comes first
        let displayOrder = [...series.seasons];
        if (lastSeasonNum) {
            displayOrder.sort((a, b) => (a.number == lastSeasonNum ? -1 : 1));
        }

        const showEpisodes = (season) => {
            episodeContainer.innerHTML = "";
            for (let i = 1; i <= season.totalEpisodes; i++) {
                const btn = document.createElement("button");
                btn.className = "ep-btn";
                
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

        // Build Season Buttons
        displayOrder.forEach((season, index) => {
            const seasonBtn = document.createElement("button");
            seasonBtn.className = "season-btn";
            seasonBtn.textContent = `Season ${season.number}`;

            if (index === 0) {
                seasonBtn.classList.add("active");
                showEpisodes(season);
            }

            seasonBtn.onclick = async () => {
                await saveProgress(storageKey, season.number);
                location.reload();
            };

            seasonNav.appendChild(seasonBtn);
        });
    }
}

// Run the async function
init();
