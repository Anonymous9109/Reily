const params = new URLSearchParams(window.location.search);
const id = params.get("series");
const series = seriesData[id];

// --- IndexedDB Helper Logic (Fallback / Season memory) ---
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

// --- Inject Dynamic CSS ---
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
        margin-top: 400px;
    }

    .big-play-btn {
        background-color: #ffffff;
        color: #000000;
        border: none;
        padding: 16px 24px;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-weight: 700;
        font-size: 16px;
        width: 100%;
        max-width: 320px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        transition: background-color 0.2s, transform 0.1s;
        margin-bottom: 24px;
    }
    .big-play-btn:hover {
        background-color: #f0f0f0;
        transform: translateY(-2px);
    }
    .big-play-btn .play-icon {
        width: 20px;
        height: 20px;
        fill: currentColor;
    }

    .episodes-dropdown-container {
        width: 100%;
        max-width: 450px;
        background: rgba(20, 20, 20, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        overflow: hidden;
        backdrop-filter: blur(10px);
        margin-top: 16px;
    }

    .episodes-dropdown-toggle {
        width: 100%;
        background: transparent;
        color: #ffffff;
        border: none;
        padding: 14px 18px;
        text-align: left;
        font-weight: 600;
        font-size: 15px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .episodes-dropdown-toggle:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .episodes-list-inner {
        max-height: 250px;
        overflow-y: auto;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: none;
        flex-direction: column;
    }

    .episodes-list-inner.open {
        display: flex;
    }

    .ep-dropdown-item {
        background: transparent;
        color: #ffffff;
        border: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding: 12px 18px;
        text-align: left;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .ep-dropdown-item:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .ep-dropdown-item .play-icon {
        width: 14px;
        height: 14px;
        fill: currentColor;
        opacity: 0.7;
    }
`;
document.head.appendChild(styleTag);

async function loadDataFiles() {
  if (!id) return;

  try {
    const searchResponse = await fetch("/JS/search.js");
    const searchText = await searchResponse.text();
    const cleanSearchText = searchText.replace(/const\s+movies\s*=/, "return ");
    const parseSearch = new Function(cleanSearchText);
    window.searchArray = parseSearch();

    init();
  } catch (error) {
    console.error("Critical error while reading data engines safely:", error);
    init(); 
  }
}

// Fetch user's watch history directly from Cloudflare D1 Worker
async function fetchCloudflareProgressMap() {
  const token = localStorage.getItem("session_token");
  if (!token) return {};

  try {
    const res = await fetch("https://rinolski.misty-fog-201e.workers.dev/api/get-progress", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.progress || {};
  } catch (err) {
    console.error("Error fetching Cloudflare progress:", err);
    return {};
  }
}

async function init() {
    if (!series) return;

    const titleEl = document.getElementById("title");
    const descEl = document.getElementById("desc");
    
    if (titleEl) titleEl.textContent = series.title;
    if (descEl) descEl.textContent = series.desc;

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

    if (!imagePath && series.image) {
      imagePath = series.image.startsWith('/') ? series.image : `/${series.image}`;
    }

    let ambientBg = document.getElementById("ambientBg");
    if (!ambientBg) {
      ambientBg = document.createElement("div");
      ambientBg.id = "ambientBg";
      document.body.insertBefore(ambientBg, document.body.firstChild);
    }
    if (imagePath) {
      ambientBg.style.backgroundImage = `url('${imagePath}')`;
    }

    // Pull progress records from Cloudflare D1
    const cloudflareProgress = await fetchCloudflareProgressMap();

    const seasonNav = document.getElementById("seasonNav");
    const episodeContainer = document.getElementById("episodeList");

    if (series.seasons && series.seasons.length > 0) {
        const storageKey = `lastSeason_${id}`;
        const lastSeasonNum = await getProgress(storageKey);

        let displayOrder = [...series.seasons];
        if (lastSeasonNum) {
            displayOrder.sort((a, b) => (a.number == lastSeasonNum ? -1 : 1));
        }

        const renderActiveSeasonContent = (season) => {
            if (!episodeContainer) return;
            episodeContainer.innerHTML = "";

            // Find the most recent episode watched for this series inside Cloudflare's data map
            let targetEpKey = `${season.prefix}1`;
            let buttonText = "Play Episode 1";
            let latestTimestamp = -1;

            for (const movieIdKey in cloudflareProgress) {
                // Check if the saved ID matches current series prefix pattern (e.g. "Beef-S1E...")
                if (movieIdKey.toLowerCase().startsWith(season.prefix.toLowerCase())) {
                    const record = cloudflareProgress[movieIdKey];
                    // Track by highest left time or latest modified entry if available
                    if (record && typeof record.left === 'number' && record.left > latestTimestamp) {
                        latestTimestamp = record.left;
                        targetEpKey = movieIdKey;
                    }
                }
            }

            // If a valid watched episode is found on Cloudflare, format it to "Continue Watching (S{X} E{Y})"
            if (latestTimestamp !== -1) {
                const match = targetEpKey.match(/-S(\d+)E(\d+)/i);
                if (match) {
                    buttonText = `Continue Watching (S${match[1]} E${match[2]})`;
                } else {
                    buttonText = `Continue Watching`;
                }
            }

            // 1. Big Main Action Button
            const bigPlayBtn = document.createElement("button");
            bigPlayBtn.className = "big-play-btn";
            bigPlayBtn.innerHTML = `
                <svg class="play-icon" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <span>${buttonText}</span>
            `;
            bigPlayBtn.onclick = () => window.location.href = `videoplayer.html?ep=${targetEpKey}`;
            episodeContainer.appendChild(bigPlayBtn);

            // 2. Dropdown Accordion for all episodes
            if (season.totalEpisodes >= 1) {
                const dropdownWrapper = document.createElement("div");
                dropdownWrapper.className = "episodes-dropdown-container";

                const dropdownToggle = document.createElement("button");
                dropdownToggle.className = "episodes-dropdown-toggle";
                dropdownToggle.innerHTML = `<span>All Episodes (${season.totalEpisodes})</span> <span>▼</span>`;

                const listInner = document.createElement("div");
                listInner.className = "episodes-list-inner";

                for (let i = 1; i <= season.totalEpisodes; i++) {
                    const epBtn = document.createElement("button");
                    epBtn.className = "ep-dropdown-item";
                    epBtn.innerHTML = `
                        <span>Episode ${i}</span>
                        <svg class="play-icon" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    `;

                    const episodeKey = `${season.prefix}${i}`;
                    epBtn.onclick = () => window.location.href = `videoplayer.html?ep=${episodeKey}`;
                    listInner.appendChild(epBtn);
                }

                dropdownToggle.onclick = () => {
                    listInner.classList.toggle("open");
                    dropdownToggle.querySelector("span:last-child").textContent = listInner.classList.contains("open") ? "▲" : "▼";
                };

                dropdownWrapper.appendChild(dropdownToggle);
                dropdownWrapper.appendChild(listInner);
                episodeContainer.appendChild(dropdownWrapper);
            }
        };

        if (seasonNav) {
            seasonNav.innerHTML = "";
            displayOrder.forEach((season, index) => {
                const seasonBtn = document.createElement("button");
                seasonBtn.className = "season-btn";
                seasonBtn.textContent = `Season ${season.number}`;

                if (index === 0) {
                    seasonBtn.classList.add("active");
                    renderActiveSeasonContent(season);
                }

                seasonBtn.onclick = async () => {
                    await saveProgress(storageKey, season.number);
                    location.reload();
                };

                seasonNav.appendChild(seasonBtn);
            });
        }
    }
}

loadDataFiles();
