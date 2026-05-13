// 1. Find your existing container
const container = document.querySelector(".random-container");

// 2. Create the button
const btn = document.createElement("button");
btn.className = "random-btn";
btn.textContent = "Contact Us"; 
container.appendChild(btn);

// 3. Create the message box dynamically
const box = document.createElement("div");
box.id = "contactBox";
box.style.display = "none"; // hidden initially
box.style.position = "fixed";
box.style.bottom = "20px";
box.style.right = "20px";
box.style.width = "300px";
box.style.background = "#111";
box.style.padding = "15px";
box.style.borderRadius = "10px";
box.style.boxShadow = "0 0 15px rgba(0,0,0,0.7)";
box.innerHTML = `
  <textarea id="msg" placeholder="Write message..." style="
    width:100%; height:100px; background:#222; color:#fff; border:none; padding:10px; border-radius:5px;
  "></textarea>
  <button id="sendBtn" style="
    margin-top:10px; width:100%; padding:10px; background:red; border:none; color:#fff; cursor:pointer; border-radius:5px;
  ">Send</button>
`;
document.body.appendChild(box);

// 4. Show the box when the button is clicked
btn.onclick = () => {
  box.style.display = "block";
};
// 5. Send message via EmailJS
document.getElementById("sendBtn").onclick = () => {
  const text = document.getElementById("msg").value.trim();
  if (!text) return alert("Write something!");

  emailjs.send("service_qpvbli5", "template_jkhlj1b", {
    message: text,
    from_name: "Rinolski User"
  })
  .then((res) => {
    alert("Message sent!");
    document.getElementById("msg").value = "";
    box.style.display = "none";
  })
  .catch((err) => {
    console.error("EmailJS error:", err);
    alert("Failed to send message. Check console for details.");
  });
};