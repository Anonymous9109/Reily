const params = new URLSearchParams(window.location.search);
const id = params.get("series") || params.get("movie");
const series = seriesData[id];

// --- INSTANT AUTHENTICATION GUARD ---
(function() {
    const token = localStorage.getItem("session_token");
    if (!token) {
        window.location.replace("https://rinolski.online/");
    }
})();

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

    /* Favorites Action Button */
    .favorites-action-btn {
        background-color: #1a1a1a;
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 14px 16px;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: background-color 0.2s, border-color 0.2s, color 0.2s;
    }
    .favorites-action-btn:hover {
        background-color: #262626;
        border-color: rgba(255, 255, 255, 0.4);
    }
    .favorites-action-btn.favorited {
        border-color: #e50914;
        color: #e50914;
    }
    .favorites-action-btn.favorited svg {
        fill: #e50914;
    }

    .fav-count-badge {
        background-color: rgba(255, 255, 255, 0.15);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 700;
        margin-left: 2px;
    }
    .favorites-action-btn.favorited .fav-count-badge {
        background-color: rgba(229, 9, 20, 0.25);
    }

    /* Comments Trigger Button */
    .comments-trigger-btn {
        background-color: #1a1a1a;
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 14px 16px;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: background-color 0.2s, border-color 0.2s;
    }
    .comments-trigger-btn:hover {
        background-color: #262626;
        border-color: rgba(255, 255, 255, 0.4);
    }

    /* Full-Page Comments Modal Window */
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

    /* Full-Page Replies Modal Drawer */
    #repliesDrawerModal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: #080808;
        z-index: 100000;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        transform: translateY(100%);
        transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        visibility: hidden;
    }

    #repliesDrawerModal.active {
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
      cursor: pointer;
    }
    .reviews-container .review-author:hover {
      text-decoration: underline;
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
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-top: 2px;
    }

    .comment-menu-wrapper {
      position: relative;
      display: inline-block;
    }

    .comment-dots-btn {
      background: transparent;
      border: none;
      color: #888888;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 2px 8px;
      border-radius: 4px;
      transition: color 0.2s, background 0.2s;
    }
    .comment-dots-btn:hover {
      color: #ffffff;
      background: #1f1f1f;
    }

    .comment-dropdown-menu {
      display: none;
      position: absolute;
      right: 0;
      bottom: 100%;
      margin-bottom: 4px;
      background-color: #161616;
      border: 1px solid #333333;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.6);
      z-index: 50;
      min-width: 100px;
    }
    .comment-dropdown-menu.active {
      display: block;
    }

    .comment-dropdown-item {
      background: transparent;
      color: #dddddd;
      border: none;
      width: 100%;
      padding: 8px 14px;
      text-align: left;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .comment-dropdown-item:hover {
      background-color: #262626;
      color: #ffffff;
    }

    .reply-thread-btn {
      background-color: #1a1a1a;
      color: #cccccc;
      border: 1px solid var(--rev-border-accent);
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s, color 0.2s;
    }
    .reply-thread-btn:hover {
      background-color: #262626;
      color: #ffffff;
    }

    .edited-badge {
      font-size: 0.7rem;
      color: #888888;
      font-style: italic;
      margin-left: 6px;
    }

    .replies-list-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px 16px;
      box-sizing: border-box;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .standalone-reply-card {
      background-color: #121212 !important;
      border: 1px solid #262626;
      border-radius: 10px;
      padding: 14px;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
    }

    .standalone-reply-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .standalone-reply-body {
      width: 100%;
      font-size: 0.9rem;
      line-height: 1.4;
      color: #dddddd;
      white-space: pre-line;
      word-break: break-word;
    }

    .standalone-reply-actions {
      display: flex;
      justify-content: flex-end;
      width: 100%;
      margin-top: 2px;
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

    /* Slide-Up User Profile Window Styles */
    #userProfileSlideModal {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translate(-50%, 100%);
        width: 100vw;
        max-width: 500px;
        background-color: #111111;
        border-top: 1px solid #262626;
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        z-index: 200000;
        padding: 24px 20px 32px 20px;
        box-sizing: border-box;
        transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 -10px 30px rgba(0,0,0,0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    #userProfileSlideModal.active {
        transform: translate(-50%, 0);
    }

    .user-profile-handle {
        width: 40px;
        height: 4px;
        background-color: #404040;
        border-radius: 2px;
        margin-bottom: 20px;
        cursor: pointer;
    }

    .user-profile-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background-color: #262626;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: bold;
        color: #ffffff;
        margin-bottom: 12px;
        border: 2px solid #404040;
        overflow: hidden;
    }

    .user-profile-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .user-profile-username {
        font-size: 1.25rem;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 16px;
    }

    .user-profile-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        width: 100%;
        margin-top: 8px;
    }

    .user-profile-stat-box {
        background-color: #1a1a1a;
        border: 1px solid #262626;
        border-radius: 10px;
        padding: 14px;
        text-align: center;
    }

    .user-profile-stat-label {
        font-size: 0.75rem;
        color: #888888;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .user-profile-stat-value {
        font-size: 0.95rem;
        font-weight: 600;
        color: #ffffff;
    }

    /* Backdrop Overlay */
    #userProfileBackdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 199999;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
    }

    #userProfileBackdrop.active {
        opacity: 1;
        visibility: visible;
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
    const response = await fetch(`${API_BASE}/api/get-progress`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
    if (!response.ok) return {};
    const data = await response.json();
    
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

            for (const [movieIdKey, record] of Object.entries(cloudflareProgress)) {
                if (!movieIdKey) continue;

                const lowerKey = movieIdKey.toLowerCase();
                const lowerSeriesId = id.toLowerCase();
                
                const matchesId = lowerKey.includes(lowerSeriesId);
                const matchesPrefix = series.seasons.some(s => lowerKey.startsWith(s.prefix.toLowerCase()));

                if (matchesId || matchesPrefix || lowerKey.includes(lowerSeriesId.replace(/-/g, ''))) {
                    let timeVal = 0;
                    if (record && record.updatedAt) {
                        timeVal = new Date(record.updatedAt).getTime();
                    }
                    if (!timeVal || isNaN(timeVal)) {
                        timeVal = Date.now();
                    }

                    watchedEpisodesList.push({ key: movieIdKey, time: timeVal });
                }
            }

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
                    const seasonNum = match[1];
                    const currentEpNum = parseInt(match[2], 10);
                    
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

            // 2. EQUAL-SIZE ACTION BUTTONS WRAPPER (Side-by-Side Row)
            const actionButtonsGrid = document.createElement("div");
            actionButtonsGrid.style.cssText = "display: flex; gap: 10px; width: 100%; max-width: 320px; margin-bottom: 24px;";

            // Add to Favorites Button (With Public Count Badge)
            const favoritesBtn = document.createElement("button");
            favoritesBtn.className = "favorites-action-btn";
            favoritesBtn.id = "favoritesActionBtn";
            favoritesBtn.style.cssText = "flex: 1;";
            favoritesBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>Favorites</span>
                <span class="fav-count-badge" id="favCountBadge">0</span>
            `;
            
            checkFavoriteStatusAndCount(id, favoritesBtn);

            favoritesBtn.onclick = () => {
                const token = localStorage.getItem("session_token");
                if (!token) {
                    window.location.replace("https://rinolski.online/");
                    return;
                }
                toggleFavoriteItem(id, series.title, imagePath, favoritesBtn);
            };

            // Comments Trigger Button
            const commentsBtn = document.createElement("button");
            commentsBtn.className = "comments-trigger-btn";
            commentsBtn.style.cssText = "flex: 1;";
            commentsBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                <span>Reviews</span>
            `;
            commentsBtn.onclick = () => {
                const token = localStorage.getItem("session_token");
                if (!token) {
                    window.location.replace("https://rinolski.online/");
                    return;
                }
                openCommentsModal(id);
            };

            actionButtonsGrid.appendChild(favoritesBtn);
            actionButtonsGrid.appendChild(commentsBtn);
            episodeContainer.appendChild(actionButtonsGrid);

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
                        for (const [k, rec] of Object.entries(progress)) {
                            if (k && k.toLowerCase().includes(id.toLowerCase())) {
                                let t = rec.updatedAt ? new Date(rec.updatedAt).getTime() : Date.now();
                                list.push({ key: k, time: t });
                            }
                        }
                        renderActiveSeasonContent(season, list);
                    });
                };

                seasonNav.appendChild(seasonBtn);
            });
        }
    }
}

// ==========================================================================
// USER PROFILE SLIDE-UP WINDOW SYSTEM
// ==========================================================================

async function openUserProfileModal() {
    const token = localStorage.getItem("session_token");
    if (!token) {
        window.location.replace("https://rinolski.online/");
        return;
    }

    let backdrop = document.getElementById("userProfileBackdrop");
    let modal = document.getElementById("userProfileSlideModal");

    if (!modal) {
        backdrop = document.createElement("div");
        backdrop.id = "userProfileBackdrop";
        backdrop.onclick = closeUserProfileModal;
        document.body.appendChild(backdrop);

        modal = document.createElement("div");
        modal.id = "userProfileSlideModal";
        modal.innerHTML = `
            <div class="user-profile-handle" onclick="closeUserProfileModal()"></div>
            <div class="user-profile-avatar" id="modalUserAvatar">U</div>
            <div class="user-profile-username" id="modalUsername">@Loading...</div>
            
            <div class="user-profile-stats-grid">
                <div class="user-profile-stat-box">
                    <div class="user-profile-stat-label">Saved Content</div>
                    <div class="user-profile-stat-value" id="modalSavedCount">-</div>
                </div>
                <div class="user-profile-stat-box">
                    <div class="user-profile-stat-label">Member Since</div>
                    <div class="user-profile-stat-value" id="modalMemberSince">-</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Fetch live user stats from backend
    try {
        const res = await fetch(`${API_BASE}/api/user-stats`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            
            const usernameEl = document.getElementById("modalUsername");
            const avatarEl = document.getElementById("modalUserAvatar");
            const savedCountEl = document.getElementById("modalSavedCount");
            const memberSinceEl = document.getElementById("modalMemberSince");

            if (usernameEl) usernameEl.textContent = `@${data.username || "User"}`;
            if (savedCountEl) savedCountEl.textContent = `${data.savedCount || 0} items`;
            
            if (memberSinceEl && data.signupDate) {
                const dateObj = new Date(data.signupDate);
                memberSinceEl.textContent = isNaN(dateObj) ? data.signupDate.split('T')[0] : dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            }

            if (avatarEl) {
                if (data.pfp && data.pfp.length > 5) {
                    avatarEl.innerHTML = `<img src="${data.pfp}" alt="Avatar" />`;
                } else {
                    avatarEl.textContent = (data.username ? data.username.charAt(0) : "U").toUpperCase();
                }
            }
        }
    } catch (err) {
        console.error("Failed to load user profile metrics:", err);
    }

    requestAnimationFrame(() => {
        backdrop.classList.add("active");
        modal.classList.add("active");
    });
}

function closeUserProfileModal() {
    const backdrop = document.getElementById("userProfileBackdrop");
    const modal = document.getElementById("userProfileSlideModal");
    if (backdrop) backdrop.classList.remove("active");
    if (modal) modal.classList.remove("active");
}

// Automatically bind click triggers to usernames / authors across the page
document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".review-author, .user-profile-trigger, [id*='usernameDisplay']");
    if (trigger) {
        openUserProfileModal();
    }
});

// ==========================================================================
// FAVORITES CLIENT HELPERS
// ==========================================================================

async function checkFavoriteStatusAndCount(movieId, btnElement) {
  const token = localStorage.getItem("session_token");

  // 1. Fetch public count (no auth required)
  try {
    const countRes = await fetch(`${API_BASE}/api/favorite-count?movieId=${encodeURIComponent(movieId)}`);
    if (countRes.ok) {
      const countData = await countRes.json();
      const badge = btnElement.querySelector("#favCountBadge");
      if (badge) badge.textContent = countData.totalFavorites || 0;
    }
  } catch (err) {
    console.error("Error fetching favorite count:", err);
  }

  // 2. Fetch personal state if token exists
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/get-favorites`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    const favorites = data.favorites || {};

    if (favorites[movieId]) {
      btnElement.classList.add("favorited");
      btnElement.querySelector("svg").setAttribute("fill", "currentColor");
    }
  } catch (err) {
    console.error("Error checking favorite status:", err);
  }
}

async function toggleFavoriteItem(movieId, movieTitle, posterImage, btnElement) {
  const token = localStorage.getItem("session_token");
  if (!token) {
    window.location.replace("https://rinolski.online/");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/toggle-favorite`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ movieId, movieTitle, posterImage })
    });
    const data = await res.json();

    if (res.ok) {
      const badge = btnElement.querySelector("#favCountBadge");
      if (badge && typeof data.totalFavorites !== 'undefined') {
        badge.textContent = data.totalFavorites;
      }

      if (data.isFavorited) {
        btnElement.classList.add("favorited");
        btnElement.querySelector("svg").setAttribute("fill", "currentColor");
        showStatus("Added to your favorites!");
      } else {
        btnElement.classList.remove("favorited");
        btnElement.querySelector("svg").setAttribute("fill", "none");
        showStatus("Removed from your favorites.");
      }
    } else {
      showStatus(data.error || "Failed to update favorites.", true);
    }
  } catch (err) {
    showStatus("Connection error. Try again.", true);
  }
}

// ==========================================================================
// FULL-PAGE COMMENTS & REPLIES THREAD SYSTEM
// ==========================================================================

function openCommentsModal(seriesId) {
    const token = localStorage.getItem("session_token");
    if (!token) {
        window.location.replace("https://rinolski.online/");
        return;
    }

    let overlay = document.getElementById("commentsOverlayModal");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "commentsOverlayModal";
        overlay.innerHTML = `
            <div class="comments-modal-header">
                <button class="comments-back-btn" onclick="closeCommentsModal()">←</button>
                <h3 style="margin:0; font-size: 1.1rem; color: #fff;">Comments</h3>
                <div style="width: 60px;"></div>
            </div>
            <div id="commentsModalBodyContainer" style="flex: 1; width: 100%; display: flex; flex-direction: column; overflow: hidden;"></div>
            <div class="comments-bottom-bar">
                <input type="text" id="modalBottomCommentInput" placeholder="Write a comment... (use @username to tag)" />
                <button onclick="submitBottomComment()">Send</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    initReviewsSystem(seriesId);
    
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

let activeReplyTargetEmail = null;

function openRepliesDrawer(targetEmail, authorUsername) {
    const token = localStorage.getItem("session_token");
    if (!token) {
        window.location.replace("https://rinolski.online/");
        return;
    }

    activeReplyTargetEmail = targetEmail;
    let drawer = document.getElementById("repliesDrawerModal");
    if (!drawer) {
        drawer = document.createElement("div");
        drawer.id = "repliesDrawerModal";
        drawer.innerHTML = `
            <div class="comments-modal-header">
                <button class="comments-back-btn" onclick="closeRepliesDrawer()">←</button>
                <h3 id="repliesDrawerTitle" style="margin:0; font-size: 1.1rem; color: #fff;">Replies</h3>
                <div style="width: 60px;"></div>
            </div>
            <div id="repliesDrawerBodyContainer" class="replies-list-container"></div>
            <div class="comments-bottom-bar">
                <input type="text" id="drawerReplyInput" placeholder="Write a reply... (use @username to tag)" />
                <button onclick="submitDrawerReply()">Send</button>
            </div>
        `;
        document.body.appendChild(drawer);
    }

    const titleEl = document.getElementById("repliesDrawerTitle");
    if (titleEl) titleEl.textContent = `Replies to @${authorUsername || 'User'}`;

    renderRepliesInDrawer(targetEmail);

    requestAnimationFrame(() => {
        drawer.classList.add("active");
    });
}

function closeRepliesDrawer() {
    const drawer = document.getElementById("repliesDrawerModal");
    if (drawer) {
        drawer.classList.remove("active");
    }
    activeReplyTargetEmail = null;
}

function initReviewsSystem(seriesId) {
  let container = document.querySelector(".reviews-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "reviews-container";
    container.innerHTML = `
      <div class="header-zone">
        <h2>Comments</h2>
      </div>

      <div id="adSlotZone" style="margin-bottom: 16px; display: flex; justify-content: center; align-items: center; width: 100%;"></div>

      <div id="statusBanner" class="status-banner"></div>

      <div class="modal-box" id="usernameModal" style="display: none;">
        <p>Please enter a display name to participate in discussions:</p>
        <div class="modal-input-group">
          <input type="text" id="usernameInput" placeholder="Enter username" />
          <button class="btn-secondary" onclick="saveUsername()">Set Name</button>
        </div>
      </div>

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

function getCurrentUserEmail() {
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || payload.sub || "";
  } catch (e) {
    return "";
  }
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".comment-menu-wrapper")) {
    document.querySelectorAll(".comment-dropdown-menu.active").forEach(menu => {
      menu.classList.remove("active");
    });
  }
});

function toggleCommentMenu(event, menuId) {
  event.stopPropagation();
  document.querySelectorAll(".comment-dropdown-menu.active").forEach(menu => {
    if (menu.id !== menuId) menu.classList.remove("active");
  });
  const menu = document.getElementById(menuId);
  if (menu) {
    menu.classList.toggle("active");
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
    const currentUserEmail = getCurrentUserEmail();

    listEl.innerHTML = sortedReviews.map((r, idx) => {
      const authorEmail = r.authorEmail || r.email || "user";
      const safeEmailId = authorEmail.replace(/[^a-zA-Z0-9]/g, '_') + '_' + idx;
      const reviewContent = r.reviewText || r.text || r.content || "";
      const username = r.authorUsername || r.username || "Anonymous";
      const repliesCount = (r.replies || []).length;
      const isEdited = r.edited || r.isEdited;
      const isOwner = currentUserEmail && authorEmail === currentUserEmail;

      const formattedContent = escapeHtml(reviewContent).replace(/@([a-zA-Z0-9_]+)/g, '<span style="color: #4da6ff; font-weight: 600;">@$1</span>');
      const menuId = `comment-menu-${safeEmailId}`;

      return `
        <div class="review-card" id="review-card-${safeEmailId}">
          <div class="review-header">
            <span class="review-author" onclick="openUserProfileModal()">@${escapeHtml(username)}</span>
            <span class="review-date">${r.timestamp ? new Date(r.timestamp).toLocaleDateString() : ''}</span>
          </div>

          <div class="review-body">${formattedContent}${isEdited ? '<span class="edited-badge">(edited)</span>' : ''}</div>

          <div class="review-actions">
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="reply-thread-btn" onclick="openRepliesDrawer('${authorEmail}', '${escapeHtml(username)}')">
                💬 Replies (${repliesCount})
              </button>
              ${isOwner ? `
                <div class="comment-menu-wrapper">
                  <button class="comment-dots-btn" onclick="toggleCommentMenu(event, '${menuId}')">⋮</button>
                  <div class="comment-dropdown-menu" id="${menuId}">
                    <button class="comment-dropdown-item" onclick="promptEditReview('${authorEmail}', '${encodeURIComponent(reviewContent)}')">Edit</button>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (activeReplyTargetEmail) {
        renderRepliesInDrawer(activeReplyTargetEmail);
    }

  } catch(err) {
    listEl.innerHTML = `<div class="empty-state">Unable to load reviews right now.</div>`;
  }
}

async function renderRepliesInDrawer(targetEmail) {
  const container = document.getElementById("repliesDrawerBodyContainer");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/api/get-reviews?movie=${encodeURIComponent(id)}&series=${encodeURIComponent(id)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    const reviewsArr = data.reviews || data.data || [];

    const targetReview = reviewsArr.find(r => (r.authorEmail || r.email) === targetEmail);
    const repliesArr = targetReview ? (targetReview.replies || []) : [];

    if (repliesArr.length === 0) {
      container.innerHTML = `<div class="empty-state">No replies yet. Be the first to reply!</div>`;
      return;
    }

    const currentUserEmail = getCurrentUserEmail();

    container.innerHTML = repliesArr.map((rep, index) => {
      const repUsername = rep.replierUsername || rep.username || 'User';
      const repEmail = rep.replierEmail || rep.email || '';
      const repText = rep.text || rep.replyText || '';
      const repTime = rep.timestamp ? new Date(rep.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
      const isEdited = rep.edited || rep.isEdited;
      const isOwner = currentUserEmail && repEmail === currentUserEmail;

      const formattedReplyText = escapeHtml(repText).replace(/@([a-zA-Z0-9_]+)/g, '<span style="color: #4da6ff; font-weight: 600;">@$1</span>');
      const menuId = `reply-menu-${index}`;

      return `
        <div class="standalone-reply-card">
          <div class="standalone-reply-header">
            <strong class="review-author" onclick="openUserProfileModal()" style="color: #fff; font-size: 0.9rem;">@${escapeHtml(repUsername)}</strong>
            <span style="font-size: 0.75rem; color: #888;">${repTime}</span>
          </div>
          <div class="standalone-reply-body">${formattedReplyText}${isEdited ? '<span class="edited-badge">(edited)</span>' : ''}</div>
          <div class="standalone-reply-actions">
            ${isOwner ? `
              <div class="comment-menu-wrapper">
                <button class="comment-dots-btn" onclick="toggleCommentMenu(event, '${menuId}')">⋮</button>
                <div class="comment-dropdown-menu" id="${menuId}">
                  <button class="comment-dropdown-item" onclick="promptEditReply('${targetEmail}', ${index}, '${encodeURIComponent(repText)}')">Edit</button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="empty-state">Unable to load replies.</div>`;
  }
}

async function saveUsername() {
  const token = localStorage.getItem("session_token");
  if (!token) {
      window.location.replace("https://rinolski.online/");
      return;
  }

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
  const token = localStorage.getItem("session_token");
  if (!token) {
      window.location.replace("https://rinolski.online/");
      return;
  }

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

async function submitDrawerReply() {
  const token = localStorage.getItem("session_token");
  if (!token) {
      window.location.replace("https://rinolski.online/");
      return;
  }

  if (!activeReplyTargetEmail) return;
  const currentSeries = id;
  const inputEl = document.getElementById("drawerReplyInput");
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
        targetEmail: activeReplyTargetEmail, 
        replyText: replyText,
        text: replyText
      })
    });
    const data = await res.json();

    if (data.requireUsername) {
      document.getElementById("usernameModal").style.display = "block";
    } else if (res.ok) {
      inputEl.value = "";
      renderRepliesInDrawer(activeReplyTargetEmail);
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
