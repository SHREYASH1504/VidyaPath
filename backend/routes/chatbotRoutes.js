const express = require('express');
const router = express.Router();
const Chatbot = require('../models/Chatbot');
const User = require('../models/User');

// @desc    Get chatbot questions based on user profile
// @route   GET /api/chatbot/questions
// @access  Public
router.get('/questions', async (req, res) => {
    try {
        const { email } = req.query;
        
        let user = null;
        if (email) {
            user = await User.findOne({ email });
        }

        // Get questions based on user profile
        let questions = [];
        
        if (user) {
            const stream = user.academicDetails?.stream12;
            const is12Completed = user.academicDetails?.is12Completed;
            const subjectScores = user.interests?.subjectLikes || {};
            const interests = user.interests?.selectedInterests || [];

            // Logic 1: 10th Only + Low Math
            if (!is12Completed && (subjectScores.Math || 0) < 5) {
                questions = await Chatbot.find({
                    tags: { $in: ['tools', 'earning', 'skill-based'] },
                    isActive: true
                }).limit(5);
            }
            // Logic 2: Science + High Math + Coding
            else if (stream === 'Science' && (subjectScores.Math || 0) > 7 && interests.includes('Coding')) {
                questions = await Chatbot.find({
                    tags: { $in: ['puzzles', 'computer', 'tech', 'coding'] },
                    isActive: true
                }).limit(5);
            }
            // Logic 3: Arts + Creative
            else if (stream === 'Arts' || interests.includes('Art & Design')) {
                questions = await Chatbot.find({
                    tags: { $in: ['creative', 'team', 'aesthetics', 'design'] },
                    isActive: true
                }).limit(5);
            }
        }

        // Fallback to general questions
        if (questions.length === 0) {
            questions = await Chatbot.find({
                category: 'general',
                isActive: true
            }).limit(5);
        }

        res.json(questions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Save chatbot conversation
// @route   POST /api/chatbot/conversation
// @access  Public
router.post('/conversation', async (req, res) => {
    try {
        const { email, question, answer } = req.body;

        if (!email || !question || !answer) {
            return res.status(400).json({ message: 'Email, question, and answer are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add conversation to user's chatbot data
        if (!user.chatbotData.conversations) {
            user.chatbotData.conversations = [];
        }

        user.chatbotData.conversations.push({
            question,
            answer,
            timestamp: new Date()
        });

        await user.save();

        res.json({ message: 'Conversation saved successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get chatbot answer for a question
// @route   POST /api/chatbot/answer
// @access  Public
router.post('/answer', async (req, res) => {
    try {
        const { question, email } = req.body;

        // Try to find matching answer in database
        const chatbot = await Chatbot.findOne({
            question: { $regex: question, $options: 'i' },
            isActive: true
        });

        if (chatbot) {
            // Save conversation if email provided
            if (email) {
                const user = await User.findOne({ email });
                if (user) {
                    if (!user.chatbotData.conversations) {
                        user.chatbotData.conversations = [];
                    }
                    user.chatbotData.conversations.push({
                        question,
                        answer: chatbot.answer,
                        timestamp: new Date()
                    });
                    await user.save();
                }
            }

            return res.json({ answer: chatbot.answer, source: 'database' });
        }

        // Fallback: Generate generic response
        const genericResponses = [
            "That's an interesting question! Based on current market trends, focusing on practical skills is key.",
            "I can definitely help with that. Have you considered looking into certifications for that role?",
            "Great choice! Many top companies are looking for exactly those kinds of skills right now.",
            "To get started, I'd recommend building a strong portfolio. Would you like some project ideas?",
            "Network engineering and Cyber Security are closely related. You might find skills in one transferable to the other."
        ];

        const randomResponse = genericResponses[Math.floor(Math.random() * genericResponses.length)];

        // Save conversation if email provided
        if (email) {
            const user = await User.findOne({ email });
            if (user) {
                if (!user.chatbotData.conversations) {
                    user.chatbotData.conversations = [];
                }
                user.chatbotData.conversations.push({
                    question,
                    answer: randomResponse,
                    timestamp: new Date()
                });
                await user.save();
            }
        }

        res.json({ answer: randomResponse, source: 'generated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Create chatbot Q&A (Admin/Seed)
// @route   POST /api/chatbot
// @access  Public (should be protected in production)
router.post('/', async (req, res) => {
    try {
        const { question, answer, category, tags } = req.body;

        const chatbot = await Chatbot.create({
            question,
            answer,
            category: category || 'general',
            tags: tags || []
        });

        res.status(201).json(chatbot);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get all chatbot Q&A
// @route   GET /api/chatbot
// @access  Public
router.get('/', async (req, res) => {
    try {
        const chatbots = await Chatbot.find({ isActive: true });
        res.json(chatbots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
