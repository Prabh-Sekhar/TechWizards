require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GOOGLE_NEWS_API_KEY = process.env.GOOGLE_NEWS_API_KEY;

// Function to fetch news articles from Google News API
async function fetchNews(query) {
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${googleNewsAPIKey}`;
    const response = await axios.get(url);

    if (response.data.status !== "ok") {
      throw new Error("Failed to fetch news articles.");
    }

    // Extract top 3 articles with relevant details
    return response.data.articles.slice(0, 3).map(article => ({
      title: article.title,
      source: article.source.name,
      author: article.author || "Unknown",
      publishedAt: article.publishedAt, // Raw timestamp
      description: article.description || "No description available.",
      url: article.url,
      content: article.content ? article.content.split("[+")[0] : "Content not available."
    }));

  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}


// Analyze user message type
async function analyzeUserMessage(message) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { maxOutputTokens: 100 }
    });

    const prompt = `
    Classify the following message:
    1. "AWARENESS" - Public awareness topics (e.g., social issues, education, health campaigns).
    2. "GREETING" - Greetings or small talk.
    3. "NEWS" - Inquiries about news, events, or current affairs.
    4. "OTHER" - Anything else.

    Message: "${message}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toUpperCase();

    if (text.includes('AWARENESS')) return 'awareness';
    if (text.includes('GREETING')) return 'greeting';
    if (text.includes('NEWS')) return 'news';
    return 'other';
  } catch (error) {
    console.error('Error analyzing message:', error);
    return 'other';
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    // Check message type
    const messageType = await analyzeUserMessage(message);

    // Handle news requests
    if (messageType === 'news') {
      const newsArticles = await fetchNews(message);
      if (newsArticles.length === 0) {
        return res.json({ reply: "Sorry, I couldn't find any relevant news articles at the moment." });
      }

      const formattedNews = newsArticles.map(article => `
      **Title:** ${article.title}
      **Source:** ${article.source}
      **Author:** ${article.author}
      **Published At:** ${new Date(article.publishedAt).toLocaleString()}
      **Summary:** ${article.description}
      **Read more:** ${article.url}
      `).join("\n\n");

      const newsPrompt = `
      Based on the following news details, generate a well-structured news article with a headline, introduction, and body paragraphs. Ensure clarity, professional journalistic tone, and factual accuracy.
      
      ${formattedNews}
      `;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(newsPrompt);
      const response = await result.response;
      
      const cleanedText = response.text()
        .replace(/\*\*/g, '')
        .replace(/\*/g, '•')
        .replace(/```/g, '');

      return res.json({ reply: cleanedText });
    }

    // Handle other message types
    const filteredHistory = history.filter((msg, index) => {
      if (index === 0 && msg.role === 'bot') return false;
      return true;
    });

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { maxOutputTokens: 1000 }
    });

    const chat = model.startChat({
      history: filteredHistory.map(msg => ({
        role: msg.role === "bot" ? "model" : "user",
        parts: [{ text: msg.content }]
      })),
    });

    let systemInstruction = "";
    if (messageType === 'awareness') {
      systemInstruction = "Format your response as a concise news article with a headline, structured paragraphs, and a professional tone.";
    } else if (messageType === 'greeting') {
      systemInstruction = "Respond to the greeting in a professional tone, then provide a brief news-style update.";
    }

    const enhancedMessage = `${systemInstruction}\n\nUser inquiry: ${message}`;

    const result = await chat.sendMessage(enhancedMessage);
    const response = await result.response;
    
    const cleanedText = response.text()
      .replace(/\*\*/g, '')
      .replace(/\*/g, '•')
      .replace(/```/g, '');

    res.json({ reply: cleanedText });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
