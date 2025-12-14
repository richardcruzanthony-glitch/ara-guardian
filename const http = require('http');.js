const http = require('http');
const url = require('url');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const PORT = process.env.PORT || 5000;
const XAI_API_KEY = process.env.XAI_API_KEY;
const MEMORY_FILE = path.join(__dirname, 'us-complete.txt');

// HTML chat frontend (same as before)
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ARA Guardian Chat</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; text-align: center; padding: 50px; }
    h1 { color: #333; }
    .chat-box { background: #fff; padding: 20px; border-radius: 10px; width: 400px; margin: 0 auto; }
    .messages { height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; text-align: left; }
    .message { margin: 5px 0; }
    .message.user { color: #003366; }
    .message.ara { color: #006400; }
    input[type="text"] { width: 70%; padding: 8px; }
    button { padding: 8px 12px; }
  </style>
</head>
<body>
  <h1>ARA Guardian Chat</h1>
  <div class="chat-box">
    <div id="messages" class="messages"></div>
    <label for="userInput" style="display:block; text-align:left; margin-bottom:4px;">Message:</label>
    <button id="sendBtn" aria-label="Send message">Send</button>
    <button id="sendBtn">Send</button>
  </div>
  <script>
    const messagesDiv = document.getElementById('messages');
    const input = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    function appendMessage(sender, text) {
      const div = document.createElement('div');
      div.className = 'message ' + sender;
      div.textContent = sender === 'user' ? 'You: ' + text : 'ARA: ' + text;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      appendMessage('user', text);
      input.value = '';
      try {
        const res = await fetch('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        if (!res.ok) {
          let errorMsg = `Server error: ${res.status} ${res.statusText}`;
          try {
            const errorData = await res.json();
            if (errorData && errorData.error) {
              errorMsg += ` - ${errorData.error}`;
            } else if (errorData && errorData.message) {
              errorMsg += ` - ${errorData.message}`;
            }
          } catch {
            try {
              const errorText = await res.text();
              if (errorText) errorMsg += ` - ${errorText}`;
            } catch {}
          }
          throw new Error(errorMsg);
        }
        if (!res.ok) throw new Error('Server error: ' + res.status);
        const data = await res.json();
        appendMessage('ara', data.reply || 'No response');
      } catch (err) {
        appendMessage('ara', 'Error contacting server: ' + err.message);
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
  </script>
</body>
</html>
`;

// Helper: Load memory from file
async function loadMemory() {
  try {
    return await fs.readFile(MEMORY_FILE, 'utf8');
  } catch {
    return '';
  }
}

// Helper: Append new memory to file
async function saveMemory(newEntry) {
  await fs.appendFile(MEMORY_FILE, `\n${newEntry}`);
}

// Ask Grok for a chat response, using memory as context
async function getGrokCompletion(memory, message) {
  const response = await fetch('https://api.x.ai/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-4-0709',
      max_tokens: 128,
      messages: [
        { role: 'system', content: `Memory:\n${memory}` },
        { role: 'user', content: message }
      ]
    }),
  });
  const rawBody = await response.text();
  const completion = JSON.parse(rawBody);
  console.log('Full Grok API response:', completion);

  if (completion.content && Array.isArray(completion.content)) {
    const allText = completion.content.map(part => part.text || '').join(' ').trim();
    if (allText) return allText;
  }
  if (completion.content && typeof completion.content === 'string') {
    return completion.content;
  }
  return JSON.stringify(completion); // fallback: return the whole response as a string
}

// Ask Grok to reflect and improve memory
async function reflectOnMemory(memory) {
  const prompt = `Here is my current memory:\n${memory}\n\nPlease summarize, clean up, and improve this memory for future conversations.`;
  const response = await fetch('https://api.x.ai/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-4-0709',
      max_tokens: 256,
      messages: [
        { role: 'system', content: prompt }
      ]
    }),
  });
  const rawBody = await response.text();
  const completion = JSON.parse(rawBody);
  console.log('Full Grok API response:', completion);

  if (completion.content && Array.isArray(completion.content)) {
    const allText = completion.content.map(part => part.text || '').join(' ').trim();
    if (allText) return allText;
  }
  if (completion.content && typeof completion.content === 'string') {
    return completion.content;
  }
  return memory; // fallback to old memory if Grok fails
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (parsedUrl.pathname === '/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message must be a non-empty string' }));
          return;
        }
        const memory = await loadMemory();
        const reply = await getGrokCompletion(memory, data.message);
        await saveMemory(`User: ${data.message}\nAra: ${reply}`);
        // Reflection step: summarize/improve memory
        const updatedMemory = await reflectOnMemory(await loadMemory());
        await fs.writeFile(MEMORY_FILE, updatedMemory); // Overwrite with improved memory
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply }));
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});