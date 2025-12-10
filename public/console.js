// Example client-side messaging handler with error catching
if (chrome && chrome.runtime) {
  chrome.runtime.sendMessage({ action: "testMessage" })
    .then(response => console.log("Response:", response))
    .catch(error => console.error("Messaging error handled:", error.message));  // Catches port closure or connection issues
}
