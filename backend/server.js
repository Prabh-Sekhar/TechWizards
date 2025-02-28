// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Enhanced function to analyze user messages
async function analyzeUserMessage(message) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { maxOutputTokens: 100 }
    });
    
    const prompt = `
    Determine if the following message is:
    1. Related to public awareness, public information campaigns, public health awareness, community education, outreach programs, or social awareness initiatives, OR
    2. A simple greeting or small talk (like "hello", "how are you", general pleasantries), OR
    3. Asking about news, events, or current affairs that people should be aware of
    
    Message: "${message}"
    
    Respond with only:
    "AWARENESS" if related to public awareness topics
    "GREETING" if it's just a greeting or small talk
    "NEWS" if it's asking about news, events, or important information people should know
    "OTHER" if it doesn't fit any of the above categories
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
    return 'other'; // Default to other on error
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // Check message type
    const messageType = await analyzeUserMessage(message);
    
    if (messageType === 'other') {
      return res.json({ 
        reply: "PUBLIC AWARENESS BULLETIN: Our service focuses exclusively on public awareness topics, general inquiries, and current events. Please rephrase your question to address these areas for a detailed report."
      });
    }
    
    const filteredHistory = history.filter((msg, index) => {
      if (index === 0 && msg.role === 'bot') return false;
      return true;
    });

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { maxOutputTokens: 1000 }
    });

    // Create the chat session
    const chat = model.startChat({
      history: filteredHistory.map(msg => ({
        role: msg.role === "bot" ? "model" : "user",
        parts: [{ text: msg.content }]
      })),
    });

    // Different instructions based on message type
    let systemInstruction = "";
    if (messageType === 'awareness') {
      systemInstruction = "You are a public awareness bulletin writer. Format your response as a concise news article with a headline, brief introduction, and structured paragraphs. Focus on public awareness campaigns, public information initiatives, community education, and social awareness. Use a professional, journalistic tone. Include relevant details while maintaining clarity. Do not use datelines or bylines.";
    } else if (messageType === 'greeting') {
      systemInstruction = "Respond briefly to the greeting in a professional tone, then transition to a news-style update about public awareness initiatives. Format your response as a brief bulletin with a headline like 'PUBLIC AWARENESS DAILY UPDATE' and a structured paragraph about current awareness campaigns. Do not use datelines or bylines.";
    } else if (messageType === 'news') {
      systemInstruction = "You are a news bulletin writer. Format your response as a formal news article with a headline, concise introduction, and structured paragraphs. Focus on important developments, current events, and matters of public interest. Use a professional, journalistic tone. Include relevant factual information while maintaining clarity. If applicable, highlight connections to public awareness campaigns. Do not use datelines or bylines.";
    }
    
    // Combine system instruction with the user's message
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