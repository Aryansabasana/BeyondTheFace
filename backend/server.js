const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const User = require('./models/User');
const Session = require('./models/Session');
const authMiddleware = require('./middleware/auth');
const { systemPrompt } = require('./prompts/analyzeClip');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://aryan_sabasana_cg:aryan_0612@aryanpatel.m0yqr3f.mongodb.net/beyondtheface';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB database successfully'))
  .catch((err) => console.error('Database connection error:', err));

// 1. Auth Routing: Signup
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET || 'beyond-the-face-jwt-secret-token-key-2026',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ message: 'Server error during user registration' });
  }
});

// 2. Auth Routing: Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET || 'beyond-the-face-jwt-secret-token-key-2026',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Server error during login verification' });
  }
});

// 3. Save Completed Session Report
app.post('/api/sessions/save', authMiddleware, async (req, res) => {
  const { 
    candidateName, 
    sessionId, 
    overallScore, 
    verdict, 
    moduleAverages, 
    totalDuration, 
    totalFlags, 
    flaggedEvents 
  } = req.body;

  if (!candidateName || !sessionId || overallScore === undefined || !verdict) {
    return res.status(400).json({ message: 'Missing session parameters' });
  }

  try {
    // Check if session ID already exists to prevent duplicate posts
    const existing = await Session.findOne({ sessionId });
    if (existing) {
      return res.status(200).json({ message: 'Session report already saved', session: existing });
    }

    const newSession = new Session({
      userId: req.user.userId,
      candidateName,
      sessionId,
      overallScore,
      verdict,
      moduleAverages,
      totalDuration,
      totalFlags,
      flaggedEvents
    });

    await newSession.save();
    res.status(201).json({ message: 'Session summary report saved successfully', session: newSession });
  } catch (err) {
    console.error('Error saving session report:', err);
    res.status(500).json({ message: 'Failed to persist session to database' });
  }
});

// 4. Gemini Multimodal Analysis proxy (audio + images)
app.post('/api/analyze-clip', authMiddleware, async (req, res) => {
  const { audioBase64, videoFrameBase64 } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured on server. Replying unavailable.');
    return res.status(200).json({ status: 'unavailable', error: 'Gemini key unconfigured' });
  }

  if (!audioBase64 || !videoFrameBase64 || !Array.isArray(videoFrameBase64)) {
    return res.status(400).json({ message: 'Audio buffer and video frames array are required' });
  }

  // Set timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash for fast multimodal outputs
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const contents = [
      {
        inlineData: {
          mimeType: 'audio/webm',
          data: audioBase64
        }
      },
      ...videoFrameBase64.map(frame => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data: frame
        }
      })),
      { text: systemPrompt }
    ];

    const result = await model.generateContent({
      contents,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            lipSync: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                reasoning: { type: 'STRING' }
              },
              required: ['score', 'reasoning']
            },
            prosody: {
              type: 'OBJECT',
              properties: {
                score: { type: 'INTEGER' },
                reasoning: { type: 'STRING' }
              },
              required: ['score', 'reasoning']
            }
          },
          required: ['lipSync', 'prosody']
        }
      }
    });

    clearTimeout(timeoutId);

    const text = result.response.text();
    const parsed = JSON.parse(text);
    res.status(200).json({ status: 'success', data: parsed });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Gemini proxy error:', err.message);
    res.status(200).json({ status: 'unavailable', error: err.message });
  }
});

// Run server
app.listen(PORT, () => {
  console.log(`BeyondTheFace Backend listening at http://localhost:${PORT}`);
});
