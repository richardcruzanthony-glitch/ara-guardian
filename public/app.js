// Command buttons setup
document.addEventListener("DOMContentLoaded", function () {
  const commands = ["skill", "learn", "memory", "adjustment", "reflection"];
  const commandButtonsDiv = document.getElementById("command-buttons");

  function sendCommand(cmd) {
    sendMessage("/" + cmd);
  }

  if (commandButtonsDiv) {
    commands.forEach(cmd => {
      const btn = document.createElement("button");
      btn.textContent = cmd;
      btn.type = "button";
      btn.onclick = () => sendCommand(cmd);
      commandButtonsDiv.appendChild(btn);
    });
  }
});

// Chat logic
const messagesDiv = document.getElementById("messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

function appendMessage(text, sender) {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Dummy sendMessage function (replace with your backend integration)
function sendMessage(text) {
  appendMessage(text, "user");
  // Simulate ARA response (replace with real backend call)
  setTimeout(() => {
    appendMessage("ARA: (simulated response to) " + text, "ara");
  }, 500);
}

chatForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (text) {
    sendMessage(text);
    chatInput.value = "";
  }
});
