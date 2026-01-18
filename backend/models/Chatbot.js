const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['academic', 'career', 'skills', 'general'],
        default: 'general'
    },
    tags: [String], // For filtering questions based on user profile
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Chatbot = mongoose.model('Chatbot', chatbotSchema);

module.exports = Chatbot;
