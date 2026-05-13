document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("back-btn-container");
  const btn = document.createElement("a");
  btn.href = "/Home.html"; // adjust if your homepage path differs
  btn.innerHTML = "&#x2190; Back";
  btn.className = "back-btn";
  container.appendChild(btn);
});