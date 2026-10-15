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

// --- Inject Dynamic CSS with Fixed Z-Index Layering for Content Over Background ---
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
        overflow-y: auto;
    }

    /* Sharp background image kept strictly in the background */
    #ambientBg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        filter: none;
        transform: none;
        z-index: 0;
        pointer-events: none;
    }

    /* Force all content containers to stay visible on top of the background */
    .content-wrapper, 
    #title, 
    #desc, 
    #seasonNav, 
    #episodeList, 
    .main-container, 
    #movieContentWrapper {
        position: relative;
        z-index: 2;
        opacity: 1 !important;
        visibility: visible !important;
    }

    .content-wrapper, #title, .main-container {
        margin-top: 100px;
    }

    #episodeList {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        width: 100%;
        margin-top: 20px;
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
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
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

async function loadDataFiles() {
  if (!id) return;

  try {
    // 1. Fetch and parse search.js safely to load the movies array
    const searchResponse = await fetch("/JS/search.js");
    const searchText = await searchResponse.text();
    const cleanSearchText = searchText.replace(/const\s+movies\s*=/, "return ");
    const parseSearch = new Function(cleanSearchText);
    window.searchArray = parseSearch();

    // 2. Initialize Series Layout & Background
    init();

  } catch (error) {
    console.error("Critical error while reading data engines safely:", error);
    init(); 
  }
}

async function init() {
    if (!series) return;

    // Fill Basic Info
    const titleEl = document.getElementById("title");
    const descEl = document.getElementById("desc");
    
    if (titleEl) titleEl.textContent = series.title;
    if (descEl) descEl.textContent = series.desc;

    // Locate poster image from searchArray securely
    let imagePath = "";
    if (window.searchArray) {
      const matchedSearchItem = window.searchArray.find(m => {
        if (!m.link) return false;
        const urlPart = m.link.includes('?') ? m.link.split('?')[1] : m.link;
        const movieUrlParams = new URLSearchParams(urlPart);
        const movieId = movieUrlParams.get('movie') || movieUrlParams.get('series');
        return movieId && movieId.toLowerCase() === id.toLowerCase();
      });

      if (matchedSearchItem && matchedSearchItem.image) {
        const filename = matchedSearchItem.image.split('/').pop();
        imagePath = `/images/${filename}`;
      }
    }

    // Fallback if not matched in searchArray
    if (!imagePath && series.image) {
      imagePath = series.image.startsWith('/') ? series.image : `/${series.image}`;
    }

    // Setup Sharp Background Poster Container
    let ambientBg = document.getElementById("ambientBg");
    if (!ambientBg) {
      ambientBg = document.createElement("div");
      ambientBg.id = "ambientBg";
      document.body.insertBefore(ambientBg, document.body.firstChild);
    }
    if (imagePath) {
      ambientBg.style.backgroundImage = `url('${imagePath}')`;
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
            if (!episodeContainer) return;
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
        if (seasonNav) {
            seasonNav.innerHTML = "";
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
}

// Run the safe loader
loadDataFiles();
