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

// Store reported incidents in memory (in a production app, use a database)
let reportedIncidents = [];

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
    4. "INCIDENT" - Questions about local reported safety incidents
    5. "OTHER" - Unrelated topics

    Message: "${message}"
    Response (only 1 word):`;

    const result = await model.generateContent(prompt);
    const classification = (await result.response.text()).trim().toUpperCase();
    return classification === 'GREETING' ? 'greeting' :
           classification === 'AWARENESS' ? 'awareness' :
           classification === 'NEWS' ? 'news' :
           classification === 'INCIDENT' ? 'incident' : 'other';

  } catch (error) {
    console.error('Analysis Error:', error);
    return 'news';
  }
}

// New endpoint to submit safety incidents
app.post('/api/report-incident', async (req, res) => {
  try {
    const { title, description, location, severity, imageUrl } = req.body;
    
    if (!title || !description || !location || !severity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const incident = {
      id: Date.now(),
      title,
      description,
      location,
      severity,
      imageUrl: imageUrl || null,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    
    reportedIncidents.push(incident);
    
    // Return success response
    res.status(201).json({ 
      success: true, 
      message: 'Incident reported successfully',
      incidentId: incident.id
    });
    
  } catch (error) {
    console.error('Report Incident Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to report incident' 
    });
  }
});

// Get all incidents
app.get('/api/incidents', (req, res) => {
  res.json(reportedIncidents);
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const classification = await analyzeUserMessage(message);

    if (classification === 'greeting') {
      return res.json({
        reply: "Namaste! I provide latest Indian public awareness updates and information about local safety incidents. Ask me about:\n" +
               "- Government schemes\n- Social campaigns\n- Health initiatives\n- Education programs\n" +
               "- Local safety incidents\n- General news\nHow can I assist you?"
      });
    }
    
    // Handle incident-related queries
    if (classification === 'incident') {
      if (reportedIncidents.length === 0) {
        return res.json({
          reply: "There are currently no safety incidents reported in your area. You can report an incident using our alert system."
        });
      }
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const incidentsContext = reportedIncidents.map(inc => 
        `Incident ID: ${inc.id}, Title: ${inc.title}, Description: ${inc.description}, Location: ${inc.location}, Severity: ${inc.severity}, Reported: ${new Date(inc.timestamp).toLocaleString()}, Status: ${inc.resolved ? 'Resolved' : 'Active'}`
      ).join('\n\n');
      
      const prompt = `You are a safety information assistant. The user has asked: "${message}"
      
Here are the current safety incidents reported:
${incidentsContext}

Provide a helpful, concise response addressing their query about these incidents. Prioritize higher severity incidents. If they're asking about a specific location or type of incident that doesn't match our records, kindly inform them.`;
      
      const result = await model.generateContent(prompt);
      replyText = await result.response.text();
      
      return res.json({ reply: replyText.trim() });
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