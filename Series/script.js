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

/**
 * Formats raw minutes remaining into a clean text string.
 * Converts values >= 60 minutes into hours and minutes (e.g., 74m -> 1h 14m).
 */
function formatMinutesDisplay(totalMinutes) {
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.round(totalMinutes)}m`;
}

async function init() {
    if (!series) return;

    // Fill Basic Info
    document.getElementById("title").textContent = series.title;
    document.getElementById("desc").textContent = series.desc;
    
    const video = document.getElementById("bgVideo");

    if (series.video) {
        video.innerHTML = `<source src="${series.video}" type="video/mp4">`;
        video.load();

        const revealVideo = () => { video.style.opacity = "1"; };

        if (video.readyState >= 3) {
            revealVideo();
        } else {
            video.addEventListener('loadeddata', revealVideo);
        }

        video.addEventListener('error', () => {
            video.style.opacity = "0";
            console.log("Video source not found - keeping background black.");
        });
    }

    // Process Continued Progress Rows
    await checkSeriesContinueWatching();

    // Render Season UI
    const seasonNav = document.getElementById("seasonNav");
    const episodeContainer = document.getElementById("episodeList");

    if (series.seasons && series.seasons.length > 0) {
        const storageKey = `lastSeason_${id}`;
        const lastSeasonNum = await getProgress(storageKey);

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
                btn.onclick = () => window.location.href = `videoplayer.html?ep=${episodeKey}&movie=${id}&title=${encodeURIComponent(series.title)}`;
                episodeContainer.appendChild(btn);
            }
        };

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

async function checkSeriesContinueWatching() {
  try {
    const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

    const auth = getAuth();
    const db = getFirestore();

    auth.onAuthStateChanged(async (user) => {
      if (user && user.email) {
        const cleanEmail = user.email.replace(/\./g, '_');
        const docRef = doc(db, "watchHistory", `${cleanEmail}_${series.title}`);
        const docSnap = await getDoc(docRef);

        // Make sure top deck wrapper structure container exists
        let topRowDeck = document.getElementById("continueWatchingDeck");
        if (!topRowDeck) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentTime = data.currentTime || 0;
          const duration = data.duration || 0;

          // Check if active session holds progress frames
          if (currentTime > 5 && currentTime < (duration - 15)) {
            const timeLeftSeconds = duration - currentTime;
            const timeLeftMinutes = timeLeftSeconds / 60;
            const formattedTimeLeft = formatMinutesDisplay(timeLeftMinutes);

            // Dynamically scan matching prefix strings to parse active Season and Episode numbers
            let activeEpKey = data.movieId || ""; 
            let parsedSeason = "1";
            let parsedEpisode = "1";
            let nextEpKey = "";

            if (series.seasons) {
              series.seasons.forEach((s) => {
                if (activeEpKey.startsWith(s.prefix)) {
                  parsedSeason = s.number;
                  parsedEpisode = activeEpKey.replace(s.prefix, "");
                  
                  // Check if a sequential episode exists inside the current season block layout
                  let currentEpNum = parseInt(parsedEpisode);
                  if (currentEpNum < s.totalEpisodes) {
                    nextEpKey = `${s.prefix}${currentEpNum + 1}`;
                  }
                }
              });
            }

            topRowDeck.style.display = "flex";
            topRowDeck.innerHTML = `
              <div class="resume-card-large" onclick="window.location.href='videoplayer.html?ep=${activeEpKey}&movie=${id}&title=${encodeURIComponent(series.title)}'">
                <div class="card-glow-overlay"></div>
                <div class="card-details-content">
                  <span class="badge-tag">CONTINUE WATCHING</span>
                  <h3>Season ${parsedSeason} • Episode ${parsedEpisode}</h3>
                  <p class="time-meta">${formattedTimeLeft} left</p>
                </div>
                <div class="play-indicator-action">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>

              ${nextEpKey ? `
                <div class="resume-card-next" onclick="window.location.href='videoplayer.html?ep=${nextEpKey}&movie=${id}&title=${encodeURIComponent(series.title)}'">
                  <div class="card-details-content">
                    <span class="badge-tag next-tag">UP NEXT</span>
                    <h3>Episode ${parseInt(parsedEpisode) + 1}</h3>
                    <p class="time-meta">Start Fresh</p>
                  </div>
                  <div class="play-indicator-action">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              ` : ''}
            `;
          }
        }
      }
    });
  } catch (error) {
    console.error("Error formatting custom interactive dashboard deck layout rows:", error);
  }
}

// Run the async function
init();
