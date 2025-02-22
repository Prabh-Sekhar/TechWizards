// server.js
require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express
const app = express();

// Middleware setup
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON requests

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Use the free tier model (gemini-pro)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Get AI response
    const result = await model.generateContent(message);
    const response = await result.response;
    
    // Send formatted response
    res.json({ 
      reply: response.text().replace(/\*\*/g, '') // Remove markdown formatting
    });

  } catch (error) {
    // Detailed error logging
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});