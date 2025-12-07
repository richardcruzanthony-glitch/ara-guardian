<script>
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.textContent = sender === "user" ? "You: " + text : "ARA: " + text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  appendMessage("user", text);
  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer ${AI_API_KEY}"  // Keep this as ${AI_API_KEY} in TS template literal
      },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    appendMessage("ara", data.reply || "No response");
  } catch (err) {
    appendMessage("ara", "Error contacting server");
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
</script>
