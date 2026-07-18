const mongoose = require('mongoose');

const flaggedEventSchema = new mongoose.Schema({
  id: { type: String, required: true },
  timestamp: { type: Number, required: true }, // seconds into session
  module: { type: String, required: true },
  severity: { type: String, required: true },
  message: { type: String, required: true }
});

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateName: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  overallScore: { type: Number, required: true },
  verdict: { type: String, required: true },
  moduleAverages: {
    gaze: { type: Number, required: true },
    lipSync: { type: Number, required: true },
    latency: { type: Number, required: true },
    prosody: { type: Number, required: true },
    environment: { type: Number, required: true }
  },
  totalDuration: { type: Number, required: true },
  totalFlags: { type: Number, required: true },
  flaggedEvents: [flaggedEventSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
