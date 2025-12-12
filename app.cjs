const http = require('http');
const url = require('url');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 5000;
const XAI_API_KEY = process.env.XAI_API_KEY;

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
    .message.user { color: blue; }
    .message.ara { color: green; }
    input[type="text"] { width: 70%; padding: 8px; }
    button { padding: 8px 12px; }
  </style>
</head>
<body>
  <h1>ARA Guardian Chat</h1>
  <div class="chat-box">
    <div id="messages" class="messages"></div>
    <input id="userInput" type="text" placeholder="Type your message..." />
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
        });
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

async function getXaiGrokCompletion(message) {
  console.log('Sending to xAI Grok:', message);
  try {
    const response = await fetch('https://api.x.ai/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-0709',
        max_tokens: 64,
        messages: [
          { role: 'user', content: message }
        ]
      }),
    });

    const rawBody = await response.text();
    console.log('xAI Grok raw response status:', response.status);
    console.log('xAI Grok raw response body:', rawBody);

    if (!response.ok) {
      try {
        const errorData = JSON.parse(rawBody);
        return errorData.error?.message || 'API error occurred';
      } catch {
        return 'Failed to parse API error';
      }
    }

    const completion = JSON.parse(rawBody);
    // The response content is an array of objects with type and text
    if (completion.content && Array.isArray(completion.content) && completion.content[0]?.text) {
      return completion.content[0].text;
    }
    return completion.content || 'No response';
  } catch (err) {
    console.error('xAI Grok fetch error:', err);
    return 'Error contacting xAI Grok';
  }
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
        const reply = await getXaiGrokCompletion(data.message);
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
