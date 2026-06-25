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
        video.innerHTML = `<source src="${series.video}" type="video/mp4">`;
        video.load();

        const revealVideo = () => {
            video.style.opacity = "1";
        };

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

    const seasonNav = document.getElementById("seasonNav");
    const episodeContainer = document.getElementById("episodeList");

    // Create and insert the Continue Watching button container right before seasonNav
    const continueContainer = document.createElement("div");
    continueContainer.id = "continueWatchingContainer";
    continueContainer.style.marginBottom = "15px"; // Simple separation layout spacing
    seasonNav.parentNode.insertBefore(continueContainer, seasonNav);

    if (series.seasons && series.seasons.length > 0) {
        const storageKey = `lastSeason_${id}`;
        const localLastSeasonNum = await getProgress(storageKey);

        const renderUI = (lastWatchedEpisode = null) => {
            seasonNav.innerHTML = "";
            episodeContainer.innerHTML = "";
            continueContainer.innerHTML = ""; // Clear old button frames

            // Find matching season configuration details 
            let displayOrder = [...series.seasons];
            let activeSeason = displayOrder[0];
            let matchedSeason = null;

            if (lastWatchedEpisode) {
                matchedSeason = displayOrder.find(s => lastWatchedEpisode.startsWith(s.prefix));
                if (matchedSeason) activeSeason = matchedSeason;
            } else if (localLastSeasonNum) {
                const localMatched = displayOrder.find(s => s.number == localLastSeasonNum);
                if (localMatched) activeSeason = localMatched;
            }

            // --- Build "Continue Watching" Button if progress exists ---
            if (lastWatchedEpisode && matchedSeason) {
                // Parse episode number out of prefix token matching strings
                const epNumber = lastWatchedEpisode.replace(matchedSeason.prefix, "");
                
                const continueBtn = document.createElement("button");
                continueBtn.className = "continue-btn";
                continueBtn.textContent = `▶ Continue Watching: Season ${matchedSeason.number} - Episode ${epNumber}`;
                
                // Add simple design style properties (or control via global platform CSS configurations)
                continueBtn.style.padding = "12px 24px";
                continueBtn.style.background = "red";
                continueBtn.style.color = "white";
                continueBtn.style.border = "none";
                continueBtn.style.borderRadius = "4px";
                continueBtn.style.fontWeight = "bold";
                continueBtn.style.cursor = "pointer";
                continueBtn.style.display = "block";
                
                continueBtn.onclick = () => {
                    window.location.href = `videoplayer.html?series=${id}&ep=${lastWatchedEpisode}`;
                };
                continueContainer.appendChild(continueBtn);
            }

            const showEpisodes = (season) => {
                episodeContainer.innerHTML = "";
                for (let i = 1; i <= season.totalEpisodes; i++) {
                    const btn = document.createElement("button");
                    btn.className = "ep-btn";
                    btn.textContent = `Episode ${i}`;
                    const episodeKey = `${season.prefix}${i}`;
                    
                    if (lastWatchedEpisode === episodeKey) {
                        btn.classList.add("watching");
                        btn.style.borderBottom = "3px solid red";
                    }

                    btn.onclick = () => window.location.href = `videoplayer.html?series=${id}&ep=${episodeKey}`;
                    episodeContainer.appendChild(btn);
                }
            };

            displayOrder.forEach((season) => {
                const seasonBtn = document.createElement("button");
                seasonBtn.className = "season-btn";
                seasonBtn.textContent = `Season ${season.number}`;

                if (season.number === activeSeason.number) {
                    seasonBtn.classList.add("active");
                    showEpisodes(season);
                }

                seasonBtn.onclick = async () => {
                    document.querySelectorAll(".season-btn").forEach(b => b.classList.remove("active"));
                    seasonBtn.classList.add("active");
                    await saveProgress(storageKey, season.number);
                    showEpisodes(season);
                };

                seasonNav.appendChild(seasonBtn);
            });
        };

        // Pull active server profiles context mapping
        if (window.fbAuth && window.fbDb) {
            window.fbAuth.onAuthStateChanged((user) => {
                if (user) {
                    window.fbDb.collection("users").doc(user.uid).collection("watchHistory").doc(id).get()
                        .then((docSnap) => {
                            const lastEp = docSnap.exists ? docSnap.data().lastWatchedEpisode : null;
                            renderUI(lastEp);
                        })
                        .catch(() => renderUI(null));
                } else {
                    renderUI(null);
                }
            });
        } else {
            renderUI(null);
        }
    }
}

// Run the async function
init();
