// const axios = require('axios');
// const cheerio = require('cheerio');
// const Parser = require('rss-parser');
// require('dotenv').config(); // DEEPSEEK_API_KEY must be set here

// const parser = new Parser();

// async function fetchLatestArticleFromFeed(feedUrl) {
//   const feed = await parser.parseURL(feedUrl);
//   if (!feed.items || feed.items.length === 0) throw new Error("No articles found in feed.");

//   const latest = feed.items[0];
//   return {
//     title: latest.title,
//     link: latest.link,
//   };
// }

// async function extractArticleData(url) {
//   try {
//     const res = await axios.get(url, { timeout: 10000 });
//     const $ = cheerio.load(res.data);

//     const title = $("title").text().trim() || "No Title";
//     const metaDescription = $('meta[name="description"]').attr("content") || "No Description";

//     let content = "";
//     $("p").each((_, el) => {
//       content += $(el).text() + "\n";
//     });

//     if (!title || !content.trim()) {
//       throw new Error("No valid title or article content found.");
//     }

//     return {
//       title,
//       description: metaDescription,
//       body: content.slice(0, 3500),
//     };
//   } catch (err) {
//     console.error("❌ [extractArticleData] Failed:", err.message);
//     throw err;
//   }
// }

// async function rewriteWithDeepSeek({ title, description, body }) {
//   const prompt = `
// You are a professional cricket journalist writing for a premium news aggregator. Rewrite the following cricket news article in three formats — 60 words, 100 words, and 250 words. Each version should:

// 1. Sound human-written and bypass AI detection tools.
// 2. Follow Google News and Discover best practices.
// 3. Be structured with proper subheadings and bullet points.
// 4. Avoid AI-like phrases and include journalistic reasoning.
// 5. Use a natural, confident tone with indirect references (e.g., “sources suggest,” “according to insiders”).
// 6. Do not copy the original phrasing. Reconstruct it originally.
// 7. End each version with a subtle forward-looking line or closing statement if possible.

// ---

// ### Original Article Title:
// ${title}

// ### Original Article Summary:
// ${description || body.slice(0, 350)}

// Now rewrite the article in three formats with the above instructions.
// `;

//   const res = await axios.post(
//     "https://api.deepseek.com/v1/chat/completions",
//     {
//       model: "deepseek-chat",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.3,
//       max_tokens: 1200,
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//     }
//   );

//   return res.data.choices[0].message.content;
// }

// async function runFeedToRewrite(feedUrl) {
//   try {
//     const latestArticle = await fetchLatestArticleFromFeed(feedUrl);
//     console.log(`🔗 Latest Article: ${latestArticle.title}`);
//     console.log(`🌐 URL: ${latestArticle.link}`);

//     const articleContent = await extractArticleData(latestArticle.link);
//     const rewrittenContent = await rewriteWithDeepSeek(articleContent);

//     console.log("✅ Rewritten Article:\n");
//     console.log(rewrittenContent);
//   } catch (err) {
//     console.error("❌ Error in pipeline:", err.message);
//   }
// }

// // 🔁 Run with Cricket Feed
// runFeedToRewrite("https://cricketaddictor.com/feed/");





//tesdt







const axios = require('axios');
require('dotenv').config(); // Make sure DEEPSEEK_API_KEY is in your .env

async function rewriteWithDeepSeek({ title, body }) {
  const prompt = `
You are a professional news summarizer.

Your job is to rewrite the following cricket news article into 3 strictly fact-based summaries:

1. A 60-word version  
2. A 100-word version  
3. A 250-word version  

Rules:
- DO NOT invent, assume, or infer anything that is not explicitly in the source text.
- DO NOT use creative phrases like "sources say" or "may be considered" unless they appear in the article.
- DO NOT change the meaning, order, or tone of the original content.
- USE bullet points and subheadings for clarity.
- Maintain journalistic tone but keep it neutral and factual.
- Add a headline for each version.

---

### Original Article Title:
${title}

### Original Article Content:
${body}
`;

  const res = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1600,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.choices[0].message.content;
}

// ✅ Manually provide your article content here:
const manualArticle = {
  title: "Shubman Gill rejected for India's Test captaincy, Jasprit Bumrah emerges as 'automatic choice'",
  body: `
Former Indian batter and cricket specialist Wasim Jaffer has dropped his bold take on India’s next captain in Test cricket on social media. Jaffer backed Jasprit Bumrah as the best man to lead the Indian cricket team in Tests, calling him the automatic choice unless the pacer himself says no.

After Rohit Sharma’s retirement from the longest format of the game, the Indian selectors are in a dilemma about selecting the right candidate to lead the side. There are reports that the BCCI and the selectors are looking at the Gujarat Titans captain, Shubman Gill, as India’s next Test captain.

Wasim Jaffer picks Jasprit Bumrah over Shubman Gill as India’s next Test captain
Gill led India in the T20Is, and he is even the vice-captain of the national team in the ODIs, but his sudden rise in leadership at the international arena without any substantial experience left many worried, including Wasim Jaffer, especially when the team has options like Bumrah.

The ace Indian pacer has led India in three Tests and has been serving as the vice-captain in the format, but few reports suggest that he is not in contention for the full-time captaincy due to the history of his injuries, as they feel his presence in the XI is much more important than leadership.

Contrary to the background noise, Jaffer wants the BCCI to hand over India’s Test captaincy to Bumrah despite Shubman Gill being seen as a future leader. The former Indian batter believes that Gill should be made vice-captain and step in when Bumrah takes a break.

Jasprit Bumrah is an automatic captaincy choice: Wasim Jaffer
This will help the Gujarat Titans captain to continue learning while Bumrah leads the charge. The cricket pundit feels Bumrah being Test captain would prepare Gill for future leadership without the burden of full-time responsibility too early.

Wasim Jaffer posted, X: “I think Bumrah is an automatic captaincy choice, unless he doesn't want the responsibility. He should be the captain with Gill as VC—stepping in whenever Bumrah needs rest. This way Gill could also be groomed without the pressure of being the full-time captain.”

Shubman Gill set to become India’s next Test captain after secret lunch with Gautam Gambhir
Meanwhile, according to a report by the Times of India, Shubman Gill recently met Gautam Gambhir at his home in Delhi for lunch. They reportedly have discussions for four to five hours, and it's now almost certain that Gill will be named India’s next Test captain.

The report further claimed that Gill also met Indian chief selector Ajit Agarkar at Wankhede Stadium after the IPL 2025 match between Gujarat Titans and Mumbai Indians in Mumbai. Since the selectors want a long-term captain, Gill looks like a perfect option for them in the Tests.

Interestingly, Gambhir reportedly brought back Shardul Thakur and Ishan Kishan into the Test scenes, as the two players are almost certain to be picked in India A's squad for the upcoming England tour. The first India A vs. England Lions match is scheduled to be played on May 30.
`
};

// 🔁 Run
(async () => {
  try {
    const output = await rewriteWithDeepSeek(manualArticle);
    console.log("✅ Rewritten Summaries:\n");
    console.log(output);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
