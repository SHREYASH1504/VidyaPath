const mongoose = require('mongoose');

const userAnswerSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    questionId: {
        type: String,
        required: false
    },
    question: {
        type: String,
        required: false
    },
    answer: {
        type: String,
        required: true
    },
    phase: {
        type: String,
        default: 'phase_1'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const UserAnswer = mongoose.model('UserAnswer', userAnswerSchema);

module.exports = UserAnswer;
