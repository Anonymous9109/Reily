// --- Configure Existing Back Button ---
document.addEventListener("DOMContentLoaded", () => {
    const existingBackBtn = document.getElementById("backBtn") || document.querySelector(".back-btn") || document.querySelector("button[onclick*='history']");
    if (existingBackBtn) {
        existingBackBtn.onclick = (e) => {
            e.preventDefault();
            // Dynamically jump back past the video player in history
            if (window.history.length > 2) {
                history.go(-2);
            } else {
                history.back();
            }
        };
    }
});
