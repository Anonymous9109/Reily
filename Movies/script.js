import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// Helper function to format minutes cleanly
function formatMinutesDisplay(totalMinutes) {
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.round(totalMinutes)}m`;
}

onAuthStateChanged(auth, async (user) => {
  if (user && user.email) {
    // Clean email string to safely use as a Firestore Document ID path
    const safeEmailDocId = user.email.replace(/\./g, '_');
    const movieTitleParam = activeMovieTitle; // Uses your global movie title variable

    try {
      // Document path uses the user's email address and the movie title string directly
      const docRef = doc(db, "watchHistory", `${safeEmailDocId}_${movieTitleParam}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentTime = data.currentTime || 0;
        const duration = data.duration || 0;

        // If progress is active and not finished
        if (currentTime > 5 && currentTime < (duration - 15)) {
          const secondsLeft = duration - currentTime;
          const minutesLeft = secondsLeft / 60;
          
          // Format text output string cleanly (e.g., "Continue • 1h 36m left")
          const formattedTimeLeft = formatMinutesDisplay(minutesLeft);
          
          const playBtn = document.getElementById("yourPlayButtonId");
          if (playBtn) {
            playBtn.innerHTML = `Continue • ${formattedTimeLeft} left`;
          }
        }
      }
    } catch (error) {
      console.error("Error updating button state layout:", error);
    }
  }
});
