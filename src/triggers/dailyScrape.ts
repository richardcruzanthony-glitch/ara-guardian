export const dailyScrape = async () => {
  const sites = [
    "https://news.ycombinator.com",
    "https://arxiv.org/list/cs/recent",
    "https://www.lesswrong.com",
  ];
  for (const site of sites) {
    await mastra.runTool("scrape", { url: site });
  }
  await mastra.runTool("adjust", { 
    mistake: "old information", 
    correct_answer: "I just scraped the latest data" 
  });
};
