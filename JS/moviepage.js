
const video = document.querySelector('#video');
const playPauseButton = document.querySelector('#play-pause');
const playIcon = document.querySelector('#play-icon');
const pauseIcon = document.querySelector('#pause-icon');
const progressBar = document.querySelector('#progress-bar');
const customControls = document.querySelector('#custom-controls');
const videoContainer = document.querySelector('#video-container');

let controlsVisible = false;  
    let hideControlsTimeout;  


    function showControls() {  
        customControls.classList.add('visible');  
        controlsVisible = true;  
        clearTimeout(hideControlsTimeout);  
        hideControlsTimeout = setTimeout(() => {  
            if (controlsVisible) {  
                customControls.classList.remove('visible');  
                controlsVisible = false;  
            }  
        }, 3000);  
    }  


    playPauseButton.addEventListener('click', function () {  
        if (video.paused) {  
            video.play();  
            playIcon.style.display = 'none';  
            pauseIcon.style.display = 'block';  
        } else {  
            video.pause();  
            playIcon.style.display = 'block';  
            pauseIcon.style.display = 'none';  
        }  
        showControls();  
    });  


    video.addEventListener('timeupdate', function () {  
        const progress = (video.currentTime / video.duration) * 100;  
        progressBar.style.width = progress + '%';  
    });  


    videoContainer.addEventListener('click', function () {  
        if (!controlsVisible) {  
            showControls();  
        } else {  
            customControls.classList.remove('visible');  
            controlsVisible = false;  
        }  
    });  


    pauseIcon.style.display = 'block';  
    playIcon.style.display = 'none';  
    customControls.classList.remove('visible');  
    document.addEventListener("DOMContentLoaded", function () {  
const video = document.querySelector("video");   

if (!video) return;  

const observer = new IntersectionObserver((entries) => {  
    entries.forEach(entry => {  
        if (entry.isIntersecting) {  
            video.play();  
        } else {  
            video.pause();   
        }  
    });  
}, { threshold: 0.5 });   

observer.observe(video);

});
// === SHARE BUTTON ===
window.addEventListener("DOMContentLoaded", () => {
const credits = document.querySelector(".movie-credits");
if (!credits) return;

// Create the Share button  
const shareBtn = document.createElement("button");  
shareBtn.textContent = "Share";  
shareBtn.className = "share-btn";  

// Insert button under the Creator line  
credits.insertAdjacentElement("afterend", shareBtn);  

// Add basic styles  
const style = document.createElement("style");  
style.textContent = `

.share-btn {
margin-top: 10px; /*  increase this value to move it further down /
background-color: white; / Rinolski-style white */
color: black;
border: none;
padding: 10px 10%;
border-radius: 8px;
font-size: 15px;
font-weight: bold;
cursor: pointer;
transition: 0.2s;
margin-left: 5px;
display: inline-block;
}

.share-btn:active {
transform: scale(0.96);
opacity: 0.9;
}
`;
document.head.appendChild(style);

// Button click handler  
shareBtn.addEventListener("click", async () => {  
    const pageTitle = document.querySelector(".movie-title")?.textContent || document.title;  
    const pageUrl = window.location.href;  

    // 1️⃣ If Sketchware WebView is present, call native share  
    if (window.AndroidInterface && window.AndroidInterface.sharePage) {  
        window.AndroidInterface.sharePage(pageTitle, pageUrl);  
        return;  
    }  

    // 2️⃣ Use Web Share API (mobile browsers)  
    if (navigator.share) {  
        try {  
            await navigator.share({  
                title: pageTitle,  
                text: `Watch ${pageTitle} on Rinolski!`,  
                url: pageUrl  
            });  
            return;  
        } catch (err) {  
            console.log("Web share canceled or failed:", err);  
        }  
    }  

    // 3️⃣ Fallback: copy link to clipboard  
    try {  
        if (navigator.clipboard && navigator.clipboard.writeText) {  
            await navigator.clipboard.writeText(pageUrl);  
        } else {  
            const textarea = document.createElement("textarea");  
            textarea.value = pageUrl;  
            textarea.style.position = "absolute";  
            textarea.style.left = "-9999px";  
            document.body.appendChild(textarea);  
            textarea.select();  
            document.execCommand("copy");  
            document.body.removeChild(textarea);  
        }  
        alert("Link copied! You can now share it anywhere.");  
    } catch (err) {  
        alert("Failed to copy the link. Here's the URL:\n" + pageUrl);  
    }  
});

});
// --------------------------
// IndexedDB Watched Episodes
// --------------------------

let db;
const DB_NAME = "rinolskiDB";
const STORE_NAME = "watchedEpisodes";

// Open database
function openDB() {
return new Promise((resolve, reject) => {
const request = indexedDB.open(DB_NAME, 1);

request.onupgradeneeded = (e) => {  
        db = e.target.result;  
        if (!db.objectStoreNames.contains(STORE_NAME)) {  
            db.createObjectStore(STORE_NAME);  
        }  
    };  

    request.onsuccess = (e) => {  
        db = e.target.result;  
        resolve();  
    };  

    request.onerror = () => reject("IndexedDB error");  
});

}

// Save episode ID
function markWatched(epID) {
return new Promise((resolve) => {
const tx = db.transaction(STORE_NAME, "readwrite");
const store = tx.objectStore(STORE_NAME);
store.put(true, epID);
tx.oncomplete = resolve;
});
}

// Check if episode is watched
function isWatched(epID) {
return new Promise((resolve) => {
const tx = db.transaction(STORE_NAME, "readonly");
const store = tx.objectStore(STORE_NAME);
const request = store.get(epID);

request.onsuccess = () => resolve(request.result === true);  
    request.onerror = () => resolve(false);  
});

}

// --------------------------
// Main watched logic
// --------------------------

async function initWatched() {
await openDB();

// 1️⃣ Save watched on click  
document.querySelectorAll(".episode a").forEach(link => {  
    link.addEventListener("click", () => {  
        const url = new URL(link.href, location.href);  
        const epID = url.searchParams.get("ep");  
        if (epID) markWatched(epID);  
    });  
});  

// 2️⃣ Show "WATCHED" badge  
document.querySelectorAll(".episode").forEach(async ep => {  
    const link = ep.querySelector("a");  
    if (!link) return;  

    const url = new URL(link.href, location.href);  
    const epID = url.searchParams.get("ep");  
    if (!epID) return;  

    if (await isWatched(epID)) {  
        ep.style.opacity = "0.55";  

        if (!ep.querySelector(".watched-badge")) {  
            const container = ep.querySelector(".image-container");  
            if (!container) return;  

            const badge = document.createElement("div");  
            badge.className = "watched-badge";  
            badge.textContent = "WATCHED";  

            // Inline styling (you can override in CSS)  
            badge.style.position = "absolute";  
            badge.style.top = "5px";  
            badge.style.right = "5px";  
            badge.style.background = "red";  
            badge.style.padding = "3px 6px";  
            badge.style.color = "white";  
            badge.style.fontSize = "12px";  
            badge.style.borderRadius = "4px";  
            badge.style.zIndex = "99";  

            container.appendChild(badge);  
        }  
    }  
});

}

// Run when page is fully lo


// ui-fix.js
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
















aded
window.addEventListener("load", initWatched);
//