const params = new URLSearchParams(window.location.search);
const id = params.get("series");
const series = seriesData[id];

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
    continueContainer.style.marginBottom = "15px";
    seasonNav.parentNode.insertBefore(continueContainer, seasonNav);

    if (series.seasons && series.seasons.length > 0) {

        const renderUI = (lastWatchedEpisode = null, lastSavedSeasonNum = null) => {
            seasonNav.innerHTML = "";
            episodeContainer.innerHTML = "";
            continueContainer.innerHTML = ""; 

            let displayOrder = [...series.seasons];
            let activeSeason = displayOrder[0];
            let matchedSeason = null;

            // 1. Determine which season to focus on based on cloud progress sync
            if (lastWatchedEpisode) {
                matchedSeason = displayOrder.find(s => lastWatchedEpisode.startsWith(s.prefix));
                if (matchedSeason) activeSeason = matchedSeason;
            } else if (lastSavedSeasonNum) {
                const seasonMatch = displayOrder.find(s => s.number == lastSavedSeasonNum);
                if (seasonMatch) activeSeason = seasonMatch;
            }

            // 2. Build the "Continue Watching" button if progress is found
            if (lastWatchedEpisode && matchedSeason) {
                const epNumber = lastWatchedEpisode.replace(matchedSeason.prefix, "");
                
                const continueBtn = document.createElement("button");
                continueBtn.className = "continue-btn";
                continueBtn.textContent = `▶ Continue Watching: Season ${matchedSeason.number} - Episode ${epNumber}`;
                
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

            // 3. Render Episode Grid list layout
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

            // 4. Render Season Selection Navigation Tab items
            displayOrder.forEach((season) => {
                const seasonBtn = document.createElement("button");
                seasonBtn.className = "season-btn";
                seasonBtn.textContent = `Season ${season.number}`;

                if (season.number === activeSeason.number) {
                    seasonBtn.classList.add("active");
                    showEpisodes(season);
                }

                seasonBtn.onclick = () => {
                    document.querySelectorAll(".season-btn").forEach(b => b.classList.remove("active"));
                    seasonBtn.classList.add("active");
                    showEpisodes(season);

                    // Push user's manual season selection toggle into the core document profile record
                    if (window.fbAuth && window.fbDb && window.fbAuth.currentUser) {
                        const uid = window.fbAuth.currentUser.uid;
                        window.fbDb.collection("users").doc(uid).collection("watchHistory").doc(id).set({
                            lastViewedSeason: season.number,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true }).catch(err => console.error("Error updating season selection context:", err));
                    }
                };

                seasonNav.appendChild(seasonBtn);
            });
        };

        // --- Core Entry: Fetch everything live from Firestore ---
        if (window.fbAuth && window.fbDb) {
            window.fbAuth.onAuthStateChanged((user) => {
                if (user) {
                    window.fbDb.collection("users").doc(user.uid).collection("watchHistory").doc(id).get()
                        .then((docSnap) => {
                            if (docSnap.exists) {
                                const data = docSnap.data();
                                renderUI(data.lastWatchedEpisode, data.lastViewedSeason);
                            } else {
                                renderUI(null, null);
                            }
                        })
                        .catch((err) => {
                            console.error("Firestore loading error:", err);
                            renderUI(null, null);
                        });
                } else {
                    renderUI(null, null);
                }
            });
        } else {
            renderUI(null, null);
        }
    }
}

init();

