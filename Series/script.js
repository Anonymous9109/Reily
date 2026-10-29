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
        margin-bottom: 12px;
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

    /* Comments Trigger Button */
    .comments-trigger-btn {
        background-color: #1a1a1a;
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 14px 24px;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-weight: 600;
        font-size: 15px;
        width: 100%;
        max-width: 320px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: background-color 0.2s, border-color 0.2s;
        margin-bottom: 24px;
    }
    .comments-trigger-btn:hover {
        background-color: #262626;
        border-color: rgba(255, 255, 255, 0.4);
    }

    /* Smooth Sliding Full-Page Comments Modal Window */
    #commentsOverlayModal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: #050505;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        transform: translateY(100%);
        transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        visibility: hidden;
    }

    #commentsOverlayModal.active {
        transform: translateY(0);
        visibility: visible;
    }

    .comments-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #262626;
        background-color: #050505;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .comments-back-btn {
        background: #262626;
        color: #ffffff;
        border: 1px solid #404040;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
    }
    .comments-back-btn:hover {
        background: #333333;
    }

    /* Fixed Bottom Comment Bar inside Modal */
    .comments-bottom-bar {
        position: sticky;
        bottom: 0;
        left: 0;
        width: 100%;
        background-color: #0a0a0a;
        border-top: 1px solid #262626;
        padding: 12px 20px;
        box-sizing: border-box;
        display: flex;
        gap: 10px;
        align-items: center;
        z-index: 20;
    }

    .comments-bottom-bar input {
        flex: 1;
        background-color: #141414;
        border: 1px solid #333333;
        border-radius: 8px;
        padding: 12px 14px;
        color: #ffffff;
        font-size: 0.95rem;
        outline: none;
    }
    .comments-bottom-bar input:focus {
        border-color: #555555;
    }

    .comments-bottom-bar button {
        background-color: #ffffff;
        color: #000000;
        border: none;
        border-radius: 8px;
        padding: 12px 20px;
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        transition: background 0.2s;
    }
    .comments-bottom-bar button:hover {
        background-color: #e0e0e0;
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

    /* ==========================================
     * REVIEWS SYSTEM STYLING
     * ========================================== */
    :root {
      --rev-bg: transparent;
      --rev-card-bg: #0a0a0a;
      --rev-panel-bg: #141414;
      --rev-input-bg: #0f0f0f;
      --rev-border: #262626;
      --rev-border-accent: #404040;
      --rev-text-main: #ffffff;
      --rev-text-muted: #888888;
    }

    .reviews-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      background-color: var(--rev-bg) !important;
      border: none;
      border-radius: 12px;
      padding: 20px 16px;
      color: var(--rev-text-main);
      box-sizing: border-box;
      text-align: left !important;
      position: relative;
      z-index: 4;
      flex: 1;
      overflow-y: auto;
    }

    .reviews-container .header-zone {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--rev-border);
      padding-bottom: 10px;
      margin-bottom: 16px;
    }

    .reviews-container .header-zone h2 {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--rev-text-main);
      letter-spacing: -0.5px;
      margin: 0;
    }

    /* Hidden or removed series badge styling */
    .reviews-container .series-badge {
      display: none !important;
    }

    .reviews-container .status-banner {
      display: none;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 0.875rem;
      margin-bottom: 16px;
      font-weight: 500;
      background-color: #0a0a0a;
      border: 1px solid #888888;
      color: #ffffff;
    }

    .reviews-container .modal-box {
      background-color: #0a0a0a;
      border: 1px solid var(--rev-border-accent);
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .reviews-container .modal-box p {
      color: var(--rev-text-main);
      margin-bottom: 10px;
      font-size: 0.9rem;
    }

    .reviews-container .modal-input-group {
      display: flex;
      gap: 8px;
    }

    .reviews-container .modal-input-group input {
      flex: 1;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--rev-border-accent);
      background-color: var(--rev-input-bg);
      color: #fff;
      font-size: 0.85rem;
    }

    .reviews-container .review-input-zone {
      display: none !important;
    }

    .reviews-container .review-card {
      background-color: #0a0a0a !important;
      border: 1px solid var(--rev-border);
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }

    .reviews-container .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .reviews-container .review-author {
      color: #ffffff !important;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .reviews-container .review-date {
      color: var(--rev-text-muted);
      font-size: 0.75rem;
    }

    .reviews-container .review-body {
      width: 100%;
      font-size: 0.9rem;
      line-height: 1.4;
      color: #eeeeee;
      white-space: pre-line;
      word-break: break-word;
    }

    .reviews-container .review-actions {
      display: flex;
      justify-content: flex-end;
      width: 100%;
      margin-top: 2px;
    }

    .reviews-container .replies-zone {
      margin-left: 8px;
      border-left: 2px solid var(--rev-border-accent);
      padding-left: 10px;
      margin-top: 6px;
    }

    .reviews-container .reply-card {
      background-color: #141414;
      padding: 8px 10px;
      border-radius: 6px;
      margin-bottom: 6px;
      font-size: 0.8rem;
      border: 1px solid var(--rev-border);
    }

    .reviews-container .reply-card strong {
      color: #ffffff;
    }

    .reviews-container .reply-time {
      font-size: 0.7rem;
      color: var(--rev-text-muted);
      text-align: right;
      margin-top: 2px;
    }

    .reviews-container .reply-input-group {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }

    .reviews-container .reply-input-group input {
      flex: 1;
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid var(--rev-border-accent);
      background-color: var(--rev-input-bg);
      color: #fff;
      font-size: 0.8rem;
    }

    .reviews-container .btn-secondary {
      padding: 6px 12px;
      background-color: #262626;
      color: #ffffff;
      border: 1px solid var(--rev-border-accent);
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .reviews-container .empty-state {
      text-align: center;
      color: var(--rev-text-muted);
      padding: 20px 0;
      font-size: 0.85rem;
      background-color: #0a0a0a;
      border-radius: 8px;
      border: 1px solid var(--rev-border);
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

        let activeSeasonReference = displayOrder[0];
        renderActiveSeasonContent(activeSeasonReference, []);

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

            watchedEpisodesList.sort((a, b) => b.time - a.time);
            renderActiveSeasonContent(activeSeasonReference, watchedEpisodesList);
        });

        function renderActiveSeasonContent(season, watchedEpisodesList) {
            activeSeasonReference = season;
            if (!episodeContainer) return;
            episodeContainer.innerHTML = "";

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

            // 2. Comments Trigger Button
            const commentsBtn = document.createElement("button");
            commentsBtn.className = "comments-trigger-btn";
            commentsBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                <span>Comments & Reviews</span>
            `;
            commentsBtn.onclick = () => {
                openCommentsModal(id);
            };
            episodeContainer.appendChild(commentsBtn);

            // 3. Dropdown Accordion for all episodes
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
                    document.querySelectorAll(".season-btn").forEach(b => b.classList.remove("active"));
                    seasonBtn.classList.add("active");
                    fetchCloudflareProgressMap().then(progress => {
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

// ==========================================================================
// SMOOTH SLIDING FULL-PAGE COMMENTS / REVIEWS SYSTEM
// ==========================================================================

function openCommentsModal(seriesId) {
    let overlay = document.getElementById("commentsOverlayModal");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "commentsOverlayModal";
        overlay.innerHTML = `
            <div class="comments-modal-header">
                <button class="comments-back-btn" onclick="closeCommentsModal()">← Back</button>
                <h3 style="margin:0; font-size: 1.1rem; color: #fff;">Discussion Board</h3>
                <div style="width: 60px;"></div>
            </div>
            <div id="commentsModalBodyContainer" style="flex: 1; width: 100%; display: flex; flex-direction: column; overflow: hidden;"></div>
            <div class="comments-bottom-bar">
                <input type="text" id="modalBottomCommentInput" placeholder="Write a comment..." />
                <button onclick="submitBottomComment()">Send</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    initReviewsSystem(seriesId);
    
    // Trigger smooth slide up
    requestAnimationFrame(() => {
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
    });
}

function closeCommentsModal() {
    const overlay = document.getElementById("commentsOverlayModal");
    if (overlay) {
        overlay.classList.remove("active");
        document.body.style.overflow = "auto";
    }
}

function initReviewsSystem(seriesId) {
  let container = document.querySelector(".reviews-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "reviews-container";
    container.innerHTML = `
      <div class="header-zone">
        <h2>Reviews</h2>
        <span class="series-badge" id="displaySeriesName"></span>
      </div>

      <!-- AD SLOT PLACED EXACTLY BELOW HEADER AND CENTERED -->
      <div id="adSlotZone" style="margin-bottom: 16px; display: flex; justify-content: center; align-items: center; width: 100%;"></div>

      <div id="statusBanner" class="status-banner"></div>

      <!-- Account Setup Container -->
      <div class="modal-box" id="usernameModal" style="display: none;">
        <p>Please enter a display name to participate in discussions:</p>
        <div class="modal-input-group">
          <input type="text" id="usernameInput" placeholder="Enter username" />
          <button class="btn-secondary" onclick="saveUsername()">Set Name</button>
        </div>
      </div>

      <!-- Main Feed Area -->
      <div id="reviewsList">
        <div class="empty-state">Loading reviews...</div>
      </div>
    `;

    const modalBodyContainer = document.getElementById("commentsModalBodyContainer");
    if (modalBodyContainer) {
        modalBodyContainer.insertBefore(container, modalBodyContainer.firstChild);
    } else {
        document.body.appendChild(container);
    }

    injectAdScript();
  }

  loadReviews(seriesId);
}

function injectAdScript() {
  const adZone = document.getElementById("adSlotZone");
  if (!adZone || document.getElementById("reynScriptTag")) return;

  const script = document.createElement("script");
  script.id = "reynScriptTag";
  script.async = true;
  script.referrerPolicy = "no-referrer-when-downgrade";
  script.src = "//shameful-farm.com/bVX/V-s.dvGJl_0FYyW/cL/CermS9iuhZLUYlfk/PiThc/xuMrzLgRx/NGD-EjtTNLzcE/zEOYDhEQ0/NeQE";

  adZone.appendChild(script);
}

const API_BASE = "https://rinolski.misty-fog-201e.workers.dev";
const token = localStorage.getItem("session_token") || "";

function showStatus(message, isError = false) {
  const banner = document.getElementById("statusBanner");
  if (!banner) return;
  banner.className = `status-banner ${isError ? 'error' : ''}`;
  banner.innerText = message;
  banner.style.display = "block";
  setTimeout(() => { banner.style.display = "none"; }, 4000);
}

function toggleReplyInput(id) {
  const el = document.getElementById(`reply-box-${id}`);
  if (el) {
    el.style.display = el.style.display === "none" ? "flex" : "none";
  }
}

async function loadReviews(seriesId) {
  const currentSeries = seriesId || id;
  const listEl = document.getElementById("reviewsList");
  if (!listEl) return;

  try {
    const res = await fetch(`${API_BASE}/api/get-reviews?movie=${encodeURIComponent(currentSeries)}&series=${encodeURIComponent(currentSeries)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    const reviewsArr = data.reviews || data.data || [];

    if (!reviewsArr || reviewsArr.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No reviews yet. Be the first to publish one!</div>`;
      return;
    }

    const sortedReviews = [...reviewsArr].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    listEl.innerHTML = sortedReviews.map(r => {
      const authorEmail = r.authorEmail || r.email || "user";
      const safeEmailId = authorEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const reviewContent = r.reviewText || r.text || r.content || "";
      const username = r.authorUsername || r.username || "Anonymous";

      return `
        <div class="review-card">
          <div class="review-header">
            <span class="review-author">@${escapeHtml(username)}</span>
            <span class="review-date">${r.timestamp ? new Date(r.timestamp).toLocaleDateString() : ''}</span>
          </div>

          <div class="review-body">${escapeHtml(reviewContent)}</div>

          <div class="review-actions">
            <button class="btn-secondary" onclick="toggleReplyInput('${safeEmailId}')">Reply</button>
          </div>

          <div class="replies-zone">
            ${(r.replies || []).map(rep => `
              <div class="reply-card">
                <strong>@${escapeHtml(rep.replierUsername || rep.username || 'User')}:</strong> ${escapeHtml(rep.text || rep.replyText || '')}
                <div class="reply-time">${rep.timestamp ? new Date(rep.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</div>
              </div>
            `).join('')}

            <div class="reply-input-group" id="reply-box-${safeEmailId}" style="display: none;">
              <input type="text" id="reply-input-${safeEmailId}" placeholder="Reply..." />
              <button class="btn-secondary" onclick="submitReply('${authorEmail}')">Send</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch(err) {
    listEl.innerHTML = `<div class="empty-state">Unable to load reviews right now.</div>`;
  }
}

async function saveUsername() {
  const username = document.getElementById("usernameInput").value.trim();
  if (!username) return showStatus("Username cannot be empty.", true);

  try {
    const res = await fetch(`${API_BASE}/api/set-username`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ username })
    });
    const data = await res.json();

    if (res.ok) {
      showStatus("Username saved successfully!");
      document.getElementById("usernameModal").style.display = "none";
    } else {
      showStatus(data.error || "Failed to save username.", true);
    }
  } catch (err) {
    showStatus("Connection error. Please try again.", true);
  }
}

async function submitBottomComment() {
  const currentSeries = id;
  const inputEl = document.getElementById("modalBottomCommentInput");
  const text = inputEl ? inputEl.value.trim() : "";

  if (!text) return showStatus("Please write something before publishing.", true);

  try {
    const res = await fetch(`${API_BASE}/api/add-review`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        movie: currentSeries, 
        series: currentSeries, 
        reviewText: text,
        text: text
      })
    });
    const data = await res.json();

    if (data.requireUsername) {
      document.getElementById("usernameModal").style.display = "block";
    } else if (res.ok) {
      inputEl.value = "";
      loadReviews(currentSeries);
    } else {
      showStatus(data.error || "Could not publish review.", true);
    }
  } catch (err) {
    showStatus("Connection error. Please try again.", true);
  }
}

async function submitReply(targetEmail) {
  const currentSeries = id;
  const safeEmailId = targetEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const inputEl = document.getElementById(`reply-input-${safeEmailId}`);
  const replyText = inputEl ? inputEl.value.trim() : "";

  if (!replyText) return showStatus("Reply cannot be empty.", true);

  try {
    const res = await fetch(`${API_BASE}/api/add-reply`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        movie: currentSeries, 
        series: currentSeries, 
        targetEmail: targetEmail, 
        replyText: replyText,
        text: replyText
      })
    });
    const data = await res.json();

    if (data.requireUsername) {
      document.getElementById("usernameModal").style.display = "block";
    } else if (res.ok) {
      loadReviews(currentSeries);
    } else {
      showStatus(data.error || "Could not post reply.", true);
    }
  } catch (err) {
    showStatus("Connection error. Please try again.", true);
  }
}

function escapeHtml(str) {
  return str ? String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
}

loadDataFiles();

// Force strict refresh when navigating back from video player
window.addEventListener("pageshow", (event) => {
    if (event.persisted || window.performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
        window.location.reload();
    }
});
