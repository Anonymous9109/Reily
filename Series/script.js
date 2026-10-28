const params = new URLSearchParams(window.location.search);
const id = params.get("series");
const series = seriesData[id];

// --- Save Incoming Page Reference (Avoiding Video Player) ---
document.addEventListener("DOMContentLoaded", () => {
    const referrer = document.referrer;
    if (referrer && !referrer.includes("videoplayer") && !referrer.includes("player")) {
        sessionStorage.setItem("safeBackUrl", referrer);
    }
});

// --- IndexedDB Helper Logic (Season memory) ---
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

// --- Configure Existing Back Button Using Stored Safe URL ---
document.addEventListener("DOMContentLoaded", () => {
    const existingBackBtn = document.getElementById("backBtn") || document.querySelector(".back-btn") || document.querySelector("button[onclick*='history']") || document.querySelector("a[href*='back']");
    if (existingBackBtn) {
        existingBackBtn.onclick = (e) => {
            e.preventDefault();
            const safeUrl = sessionStorage.getItem("safeBackUrl");
            if (safeUrl) {
                window.location.href = safeUrl;
            } else {
                history.back();
            }
        };
    }
});

async function loadDataFiles() {
  if (!id) return;

  try {
    const searchResObj = await fetch("/JS/search.js");
    const searchText = await searchResObj.text();
    const cleanSearchText = searchText.replace(/const\s+movies\s*=/, "return ");
    const parseSearch = new Function(cleanSearchText);
    window.searchArray = parseSearch();

    await init();
  } catch (error) {
    console.error("Critical error while reading data engines safely:", error);
    await init(); 
  }
}

// Fetch user's watch history directly from Cloudflare D1 Worker
async function fetchCloudflareProgressMap() {
  const token = localStorage.getItem("session_token");
  if (!token) return {};

  try {
    const response = await fetch(`https://rinolski.misty-fog-201e.workers.dev/api/get-progress?forced_ts=${Date.now()}`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      cache: "no-store"
    });
    if (!response.ok) return {};
    const data = await response.json();
    console.log("☁️ RAW CLOUDFLARE PROGRESS RESPONSE:", data);
    
    // Universally extract progress regardless of key wrapper name
    return data.progress || data.data || data.history || (typeof data === 'object' ? data : {});
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

    const seasonNav = document.getElementById("seasonNav");
    const episodeContainer = document.getElementById("episodeList");

    if (series.seasons && series.seasons.length > 0) {
        const storageKey = `lastSeason_${id}`;
        const lastSeasonNum = await getProgress(storageKey);

        let displayOrder = [...series.seasons];
        if (lastSeasonNum) {
            displayOrder.sort((a, b) => (a.number == lastSeasonNum ? -1 : 1));
        }

        // Render skeleton / default state immediately before network returns
        let activeSeasonReference = displayOrder[0];
        renderActiveSeasonContent(activeSeasonReference, []);

        // Fetch Cloudflare progress asynchronously and update in real-time
        fetchCloudflareProgressMap().then(cloudflareProgress => {
            let watchedEpisodesList = [];

            const progressEntries = Array.isArray(cloudflareProgress) 
                ? cloudflareProgress 
                : Object.entries(cloudflareProgress);

            progressEntries.forEach(entry => {
                let movieIdKey = "";
                let record = {};

                if (Array.isArray(entry)) {
                    movieIdKey = entry[0];
                    record = entry[1] || {};
                } else {
                    movieIdKey = entry.movieId || entry.id || entry.key || "";
                    record = entry;
                }

                if (!movieIdKey) return;

                const lowerKey = movieIdKey.toLowerCase();
                const lowerSeriesId = id.toLowerCase();
                
                const matchesId = lowerKey.includes(lowerSeriesId);
                const matchesPrefix = series.seasons.some(s => lowerKey.startsWith(s.prefix.toLowerCase()));

                if (matchesId || matchesPrefix) {
                    let timeVal = 0;
                    for (let prop in record) {
                        const val = Number(record[prop]);
                        if (!isNaN(val) && val > timeVal) {
                            timeVal = val;
                        }
                    }
                    if (timeVal === 0) timeVal = Date.now();

                    watchedEpisodesList.push({ key: movieIdKey, time: timeVal });
                }
            });

            // Sort descending so the most recent watch is at [0]
            watchedEpisodesList.sort((a, b) => b.time - a.time);
            console.log("🎯 REAL-TIME CLOUDFLARE MATCHED & SORTED EPISODES:", watchedEpisodesList);

            // Re-render instantly with real-time data loaded from Cloudflare
            renderActiveSeasonContent(activeSeasonReference, watchedEpisodesList);
        });

        function renderActiveSeasonContent(season, watchedEpisodesList) {
            activeSeasonReference = season;
            if (!episodeContainer) return;
            episodeContainer.innerHTML = "";

            // Filter history strictly belonging to the active season prefix
            let seasonWatchedList = watchedEpisodesList.filter(item => 
                item.key.toLowerCase().startsWith(season.prefix.toLowerCase())
            );

            let targetEpKey = `${season.prefix}1`;
            let buttonText = "Play Episode 1";

            if (seasonWatchedList.length > 0) {
                const latestWatched = seasonWatchedList[0].key;
                const match = latestWatched.match(/-S(\d+)E(\d+)/i) || latestWatched.match(/S(\d+)E(\d+)/i);
                
                if (match) {
                    const currentEpNum = parseInt(match[2], 10);
                    const seasonNum = match[1];
                    
                    targetEpKey = latestWatched;
                    buttonText = `Continue Watching (S${seasonNum} E${currentEpNum})`;
                } else {
                    targetEpKey = latestWatched;
                    buttonText = `Continue Watching (${latestWatched})`;
                }
            } else {
                targetEpKey = `${season.prefix}1`;
                buttonText = "Play Episode 1";
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
            bigPlayBtn.onclick = () => {
                window.location.href = `videoplayer.html?ep=${targetEpKey}`;
            };
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
                    epBtn.onclick = () => {
                        window.location.href = `videoplayer.html?ep=${episodeKey}`;
                    };
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
        }

        if (seasonNav) {
            seasonNav.innerHTML = "";
            displayOrder.forEach((season, index) => {
                const seasonBtn = document.createElement("button");
                seasonBtn.className = "season-btn";
                seasonBtn.textContent = `Season ${season.number}`;

                if (index === 0) {
                    seasonBtn.classList.add("active");
                }

                seasonBtn.onclick = async () => {
                    await saveProgress(storageKey, season.number);
                    // Re-render with current cached data instantly on season switch
                    document.querySelectorAll(".season-btn").forEach(b => b.classList.remove("active"));
                    seasonBtn.classList.add("active");
                    fetchCloudflareProgressMap().then(progress => {
                        // Re-run matching logic for new season
                        let list = [];
                        const entries = Array.isArray(progress) ? progress : Object.entries(progress);
                        entries.forEach(entry => {
                            let k = Array.isArray(entry) ? entry[0] : (entry.movieId || entry.id || entry.key || "");
                            if (k && k.toLowerCase().includes(id.toLowerCase())) {
                                list.push({ key: k, time: Date.now() });
                            }
                        });
                        renderActiveSeasonContent(season, list);
                    });
                };

                seasonNav.appendChild(seasonBtn);
            });
        }
    }
}

loadDataFiles();

// Force strict refresh when navigating back from video player
window.addEventListener("pageshow", (event) => {
    if (event.persisted || window.performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
        window.location.reload();
    }
});
