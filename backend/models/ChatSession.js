const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String,
        required: false,
        index: true
    },
    phase: {
        type: String,
        default: 'phase_1'
    },
    isComplete: {
        type: Boolean,
        default: false
    },
    insights: [String],
    topCareers: [{
        name: String,
        salary: String,
        risk: Number
    }],
    profile: {
        name: String,
        district: String,
        level: String
    },
    totalMessages: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

module.exports = ChatSession;
