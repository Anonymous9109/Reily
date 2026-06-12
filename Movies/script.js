const params = new URLSearchParams(window.location.search);
const id = params.get("movie");

// We expose the global movies reference so player.js can pull dynamic titles
window.movies = typeof movies !== "undefined" ? movies : {};
const movie = window.movies[id];

if (!movie) {
  document.body.innerHTML = "Movie not found";
} else {
  document.getElementById("title").textContent = movie.title;
  document.getElementById("desc").textContent = movie.desc;

  const video = document.getElementById("bgVideo");
  video.innerHTML = `<source src="${movie.video}" type="video/mp4">`;

  // Check for saved progress in Firestore to modify the Play Button
  checkContinueWatchingStatus();
}

/**
 * Formats raw minutes remaining into a clean text string.
 * Converts values >= 60 minutes into hours and minutes (e.g., 96m -> 1h 36m).
 */
function formatMinutesDisplay(totalMinutes) {
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.round(totalMinutes)}m`;
}

async function checkContinueWatchingStatus() {
  try {
    // Import Firestore and Auth modules dynamically
    const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

    const auth = getAuth();
    const db = getFirestore();

    // Safely figure out the movie title even if data layer loads out of order
    const activeMovieTitle = movie ? movie.title : document.getElementById("title").textContent;

    if (!activeMovieTitle || activeMovieTitle === "Movie not found") {
      return; // Can't fetch history without a valid title identifier
    }

    // Wait until Firebase determines if a user is logged in
    auth.onAuthStateChanged(async (user) => {
      if (user && user.email) {
        // Escape dots out of email string for safe document path layout
        const cleanEmail = user.email.replace(/\./g, '_');
        
        // Document name matching player.js: emailString_movieTitleString
        const docRef = doc(db, "watchHistory", `${cleanEmail}_${activeMovieTitle}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentTime = data.currentTime || 0;
          const duration = data.duration || 0;

          // If they have watched a piece but haven't completely finished it (15 seconds left buffer)
          if (currentTime > 5 && currentTime < (duration - 15)) {
            const timeLeftSeconds = duration - currentTime;
            const timeLeftMinutes = timeLeftSeconds / 60;

            // Turn raw minutes into clean format ("1h 36m" instead of "96m")
            const formattedTimeLeft = formatMinutesDisplay(timeLeftMinutes);

            // Select via class first, fall back to searching for any button containing "play" in context
            let playBtn = document.querySelector(".play-btn") || document.querySelector("button[onclick^='play']");
            
            if (playBtn) {
              // Retain your neat inline SVG graphic layout and just update text contents
              playBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Continue • ${formattedTimeLeft} left
              `;
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error reading continue watching status:", error);
  }
}

function play() {
  // Pass along both the stream endpoint and the original movie collection ID to the player context
  window.location.href = `videoplayer?ep=${movie.play}&movie=${id}`;
}

function goBack() {
  window.history.back();
}

(function () {
  const style = document.createElement('style');
  style.innerHTML = `
    * {
      -webkit-tap-highlight-color: transparent !important;
      -webkit-touch-callout: none !important;
    }

    button, a {
      outline: none !important;
      border: none;
    }

    button:focus,
    button:focus-visible,
    a:focus,
    a:focus-visible {
      outline: none !important;
    }

    button:active,
    a:active {
      background-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
})();
