// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // Filter out initial bot message if present
    const filteredHistory = history.filter((msg, index) => {
      if (index === 0 && msg.role === 'bot') return false;
      return true;
    });

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { maxOutputTokens: 1000 }
    });

    // Format conversation history properly
    const chat = model.startChat({
      history: filteredHistory.map(msg => ({
        role: msg.role === "bot" ? "model" : "user",
        parts: [{ text: msg.content }]
      })),
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    const cleanedText = response.text()
      .replace(/\*\*/g, '')
      .replace(/\*/g, '•')
      .replace(/```/g, '');

    res.json({ reply: cleanedText });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});