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
let csrfToken = null;

// Fetch CSRF token from server
const fetchCsrfToken = async () => {
  try {
    const response = await fetch('/csrf-token', { credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken;
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
};

// Fetch token on load
fetchCsrfToken();

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

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  try {
    const headers = { "Content-Type": "application/json" };
    
    // Add CSRF token if available (for Express server)
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({
        message,
        files: files?.map((file) => ({ name: file.name, size: file.size })),
        toolMode: toolModeInput.value,
        timeout: Number(timeoutInput.value) || 45,
      }),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorData;
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      } else {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // If CSRF error, refresh token and notify user
      if (response.status === 403) {
        await fetchCsrfToken();
        errorData.error += ' (Security token refreshed, please try again)';
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    const data = await response.json();
    appendMessage("Ara", data.text || "Agent responded with no text", "agent");
  } catch (error) {
    appendMessage(
      "System",
      `Unable to reach backend (${error.message}). Check that the tunnel or local server is running.`,
      "system",
    );
  } finally {
    if (submitButton) submitButton.disabled = false;
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
