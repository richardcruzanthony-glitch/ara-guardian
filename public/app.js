// Command button panel logic
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.command-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const command = btn.getAttribute('data-command');
      if (command) {
        chatInput.value = command + ' ';
        chatInput.focus();
      }
    });
  });
});
const streamEl = document.getElementById("messageStream");
const form = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const uploadList = document.getElementById("uploadList");
const fileInput = document.getElementById("fileInput");
const micButton = document.getElementById("micButton");
const tunnelInput = document.getElementById("tunnelUrl");
const copyButton = document.getElementById("copyTunnel");
const apiBaseInput = document.getElementById("apiBase");
const toolModeInput = document.getElementById("toolMode");
const timeoutInput = document.getElementById("timeout");
const prefsButton = document.getElementById("savePrefs");
const statusLine = document.getElementById("statusLine");

let recorder;
let chunks = [];

const renderBase = "https://ara-guardian.onrender.com";
const sampleTunnel = renderBase;
tunnelInput.placeholder = sampleTunnel;
apiBaseInput.placeholder = sampleTunnel;

const applyDefaultBase = () => {
  if (!apiBaseInput.value) {
    apiBaseInput.value = renderBase;
  }
  if (!tunnelInput.value) {
    tunnelInput.value = renderBase;
  }
};

applyDefaultBase();

const appendMessage = (role, text, tone = "agent") => {
  const msg = document.createElement("div");
  msg.className = `msg msg--${tone}`;
  msg.innerHTML = `
    <span class="msg__role">${role}</span>
    <p>${text}</p>
    <time>${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
  `;
  streamEl.appendChild(msg);
  streamEl.scrollTop = streamEl.scrollHeight;
};

const listUploads = (files) => {
  uploadList.innerHTML = "";
  [...files].forEach((file) => {
    const tag = document.createElement("span");
    tag.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
    uploadList.appendChild(tag);
  });
};

const normalizeBase = (input) => {
  if (!input) return "";
  return input.endsWith("/") ? input.slice(0, -1) : input;
};

const sendChat = async ({ message, files }) => {
  const base = normalizeBase(apiBaseInput.value || "");
  const endpoint = base ? `${base}/api/chat` : "/api/chat";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        files: files?.map((file) => ({ name: file.name, size: file.size })),
        toolMode: toolModeInput.value,
        timeout: Number(timeoutInput.value) || 45,
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    appendMessage("Ara", data.text || "Agent responded with no text", "agent");
  } catch (error) {
    appendMessage(
      "System",
      `Unable to reach backend (${error.message}). Check that the tunnel or local server is running.`,
      "system",
    );
  }
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;

  appendMessage("You", message, "system");
  sendChat({ message, files: fileInput.files });
  chatInput.value = "";
  fileInput.value = "";
  uploadList.innerHTML = "";
});

fileInput.addEventListener("change", (event) => {
  listUploads(event.target.files);
});

micButton.addEventListener("click", async () => {
  if (recorder && recorder.state === "recording") {
    recorder.stop();
    micButton.textContent = "🎙 Start voice";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const fakeName = `voice-${Date.now()}.webm`;
      appendMessage("You", `Voice command captured (${Math.round(blob.size / 1024)} KB).`, "system");
      // Placeholder: in production send the blob to /api/voice
    };
    recorder.start();
    micButton.textContent = "⏹ Stop";
  } catch (error) {
    appendMessage("System", `Microphone unavailable: ${error.message}`, "system");
  }
});

copyButton.addEventListener("click", async () => {
  if (!tunnelInput.value) return;
  try {
    await navigator.clipboard.writeText(tunnelInput.value);
    statusLine.textContent = "Tunnel copied to clipboard";
    setTimeout(() => (statusLine.textContent = ""), 2000);
  } catch (error) {
    statusLine.textContent = "Clipboard unavailable";
  }
});

prefsButton.addEventListener("click", () => {
  const prefs = {
    apiBase: apiBaseInput.value,
    tunnel: tunnelInput.value,
    toolMode: toolModeInput.value,
    timeout: timeoutInput.value,
  };
  localStorage.setItem("araGuardianPrefs", JSON.stringify(prefs));
  statusLine.textContent = "Preferences saved locally";
  setTimeout(() => (statusLine.textContent = ""), 2500);
});

document.addEventListener("DOMContentLoaded", () => {
  const stored = localStorage.getItem("araGuardianPrefs");
  if (!stored) return;
  try {
    const prefs = JSON.parse(stored);
    tunnelInput.value = prefs.tunnel || "";
    apiBaseInput.value = prefs.apiBase || "";
    toolModeInput.value = prefs.toolMode || toolModeInput.value;
    timeoutInput.value = prefs.timeout || timeoutInput.value;
  } catch (error) {
    console.warn("Unable to parse stored prefs", error);
  }
  applyDefaultBase();
});
