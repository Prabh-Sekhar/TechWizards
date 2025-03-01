require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const NEWS_API_KEY = process.env.GOOGLE_NEWS_API_KEY;

async function fetchNews(query, isGlobal = false) {
  try {
    let url;
    const params = new URLSearchParams({
      apiKey: NEWS_API_KEY,
      pageSize: 50,
      sortBy: 'publishedAt',
    });

    if (isGlobal) {
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}`;
    } else {
      if (!query || query.toLowerCase().includes('awareness')) {
        url = 'https://newsapi.org/v2/top-headlines?country=in';
        params.append('category', 'general');
      } else {
        url = 'https://newsapi.org/v2/top-headlines';
        params.append('country', 'in');
        params.append('q', query);
      }
    }

    const response = await axios.get(`${url}&${params}`);
    
    if (response.data.status !== "ok") {
      console.error('NewsAPI Error:', response.data);
      return [];
    }

    const articles = response.data.articles.filter(article => {
      const content = `${article.title} ${article.description}`.toLowerCase();
      return content.includes('awareness') ||
             content.includes('initiative') ||
             content.includes('scheme') ||
             content.includes('campaign') ||
             content.includes('government');
    }).slice(0, 10);

    return articles.map(article => ({
      title: article.title,
      source: article.source.name,
      description: article.description,
      url: article.url,
      publishedAt: new Date(article.publishedAt).toLocaleDateString()
    }));

  } catch (error) {
    console.error("News API Error:", error.response?.data || error.message);
    return [];
  }
}

async function analyzeUserMessage(message) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { maxOutputTokens: 100 }
    });

    const prompt = `Classify this message about Indian news/awareness:
    1. "GREETING" - Hello/Hi
    2. "AWARENESS" - Social issues, campaigns, government schemes
    3. "NEWS" - Current events
    4. "OTHER" - Unrelated topics

    Message: "${message}"
    Response (only 1 word):`;

    const result = await model.generateContent(prompt);
    const classification = (await result.response.text()).trim().toUpperCase();
    return classification === 'GREETING' ? 'greeting' :
           classification === 'AWARENESS' ? 'awareness' :
           classification === 'NEWS' ? 'news' : 'other';

  } catch (error) {
    console.error('Analysis Error:', error);
    return 'news';
  }
}


app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const classification = await analyzeUserMessage(message);

    if (classification === 'greeting') {
      return res.json({
        reply: "Namaste! I provide latest Indian public awareness updates. Ask me about:\n" +
               "- Government schemes\n- Social campaigns\n- Health initiatives\n- Education programs\n" +
               "- General news\nHow can I assist you?"
      });
    }

    const isAwareness = classification === 'awareness';
    const searchQuery = isAwareness ? `public awareness ${message}` : message;
    const articles = await fetchNews(searchQuery, classification === 'news');

    let replyText;
    if (articles.length > 0) {
      const context = articles.map(a => `${a.title}: ${a.description}`).join('\n');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Create a concise summary in 3 paragraphs about ${message} using these updates:\n${context}`;
      const result = await model.generateContent(prompt);
      replyText = (await result.response.text()).replace(/\\/g, '');
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(`Explain ${message} in context of Indian public awareness`);
      replyText = (await result.response.text()) + "\n\n(General information as recent updates unavailable)";
    }

    res.json({ reply: replyText.trim() });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      reply: "Temporarily unavailable. Please try again shortly." 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
