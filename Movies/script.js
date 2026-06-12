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

async function checkContinueWatchingStatus() {
  try {
    // Import Firestore and Auth modules dynamically
    const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

    const auth = getAuth();
    const db = getFirestore();

    // Wait until Firebase determines if a user is logged in
    auth.onAuthStateChanged(async (user) => {
      // CHANGED: Added user.email check since the subcollection uses the email address as the folder document name
      if (user && user.email) {
        
        // CHANGED: Matches player setup path -> watchHistory/userEmail/movies/movieId
        const docRef = doc(db, "watchHistory", user.email, "movies", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentTime = data.currentTime || 0;
          const duration = data.duration || 0;

          // If they have watched a piece but haven't completely finished it (15 seconds left buffer)
          if (currentTime > 5 && currentTime < (duration - 15)) {
            const timeLeftSeconds = duration - currentTime;
            const timeLeftMinutes = Math.ceil(timeLeftSeconds / 60);

            const playBtn = document.querySelector(".play-btn");
            if (playBtn) {
              // Retain your neat inline SVG graphic layout and just update text contents
              playBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Continue • ${timeLeftMinutes}m left
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
