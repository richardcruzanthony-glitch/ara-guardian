import { mastra } from "../mastra/index";

const topics = [
  "Guardian Roofing prices just moved — here’s the play",
  "New hurricane forming — material shortage risk in 14 days",
  "Competitor just dropped prices 8% — counter-move ready",
  "You have 3 unclosed quotes aging — want me to chase?",
  "Steel futures are spiking — lock in now or wait?",
  "Good morning boss — your 6AM brief is ready",
];

setInterval(async () => {
  const topic = topics[Math.floor(Math.random() * topics.length)];
  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: "YOUR_CHAT_ID", // ← replace with your real Telegram ID
      text: `🧠 Ara speaking first:\n\n${topic}\n\nReply "go" for full briefing`,
    }),
  });
}, 60 * 60 * 1000); // every hour (change to 24*60*60*1000 for daily)
