const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @desc    Save or update user onboarding data
// @route   POST /api/users/onboarding
// @access  Public (or Protected if we verify token)
router.post('/onboarding', async (req, res) => {
    const { email, clerkId, location, academicDetails, graduationDetails, interests, chatbotData } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            // Update existing user
            if (location) user.location = location;
            if (academicDetails) user.academicDetails = academicDetails;
            if (graduationDetails) user.graduationDetails = graduationDetails;
            if (interests) user.interests = interests;
            if (chatbotData) {
                // Merge chatbot data, preserving conversation history
                if (chatbotData.careerPath) user.chatbotData.careerPath = chatbotData.careerPath;
                if (chatbotData.summary) user.chatbotData.summary = chatbotData.summary;
                if (chatbotData.sessionId) user.chatbotData.sessionId = chatbotData.sessionId;
                if (chatbotData.insights && Array.isArray(chatbotData.insights)) {
                    user.chatbotData.insights = chatbotData.insights;
                }
                if (chatbotData.topCareers && Array.isArray(chatbotData.topCareers)) {
                    user.chatbotData.topCareers = chatbotData.topCareers;
                }
                if (chatbotData.timestamp) {
                    user.chatbotData.timestamp = new Date(chatbotData.timestamp);
                }
                if (chatbotData.conversations) {
                    user.chatbotData.conversations = [
                        ...(user.chatbotData.conversations || []),
                        ...chatbotData.conversations
                    ];
                }
            }
            if (clerkId) user.clerkId = clerkId;
            user.updatedAt = new Date();

            const updatedUser = await user.save();
            return res.json(updatedUser);
        } else {
            // Create new user
            user = await User.create({
                email,
                clerkId,
                location,
                academicDetails,
                graduationDetails,
                interests,
                chatbotData: chatbotData || {}
            });
            return res.status(201).json(user);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get user profile
// @route   GET /api/users/:email
// @access  Public
router.get('/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get user dashboard data
// @route   GET /api/users/:email/dashboard
// @access  Public
router.get('/:email/dashboard', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return user data formatted for dashboard
        res.json({
            user,
            interestStats: calculateInterestStats(user),
            topMatches: [], // Will be populated by job recommendations
            skillGaps: calculateSkillGaps(user)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Helper function to calculate interest stats
function calculateInterestStats(user) {
    const scores = { 'Technology': 0, 'Creative': 0, 'Business': 0, 'Social': 0 };
    
    const stream = user.academicDetails?.stream12;
    if (stream === 'Science') scores['Technology'] += 30;
    if (stream === 'Commerce') scores['Business'] += 30;
    if (stream === 'Arts') { scores['Creative'] += 15; scores['Social'] += 15; }

    const degree = user.graduationDetails?.field;
    if (degree) {
        if (degree.match(/B.Tech|B.E|B.Sc|Diploma|Computer/)) scores['Technology'] += 20;
        if (degree.match(/B.Com|BBA|Management/)) scores['Business'] += 20;
        if (degree.match(/B.A|Arts/)) { scores['Creative'] += 10; scores['Social'] += 10; }
    }

    const interests = user.interests?.selectedInterests || [];
    interests.forEach(i => {
        if (['Coding', 'Robotics', 'Web Dev', 'Data Science', 'Gaming', 'Research', 'Lab Work', 'Analysis', 'Mathematics', 'Physics', 'Statistics', 'Cyber Security', 'AI/ML'].includes(i)) scores['Technology'] += 15;
        if (['Art', 'Design', 'Music', 'Writing', 'Reading', 'Photography', 'Videography', 'Animation', 'Film Making', 'Cooking'].includes(i)) scores['Creative'] += 15;
        if (['Finance', 'Accounting', 'Business', 'Management', 'Marketing', 'Entrepreneurship', 'Economics', 'Stock Market', 'Investing'].includes(i)) scores['Business'] += 15;
        if (['History', 'Politics', 'Social Work', 'Travel', 'Public Speaking', 'Teaching', 'Volunteering', 'HR', 'Law', 'Gardening', 'Fitness'].includes(i)) scores['Social'] += 15;
    });

    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    if (total === 0) return [{ label: 'General', percentage: 100, color: '#00e572' }];

    const colorMap = { 'Technology': '#00e572', 'Creative': '#3b82f6', 'Business': '#f59e0b', 'Social': '#a855f7' };
    
    return Object.entries(scores)
        .map(([label, score]) => ({ label, percentage: (score / total) * 100, color: colorMap[label] }))
        .filter(item => item.percentage > 0)
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3)
        .map(item => ({ ...item, percentage: Math.round(item.percentage) }));
}

// Helper function to calculate skill gaps
function calculateSkillGaps(user) {
    const weakSubjects = Object.entries(user.interests?.subjectLikes || {})
        .filter(([_, score]) => score < 7)
        .map(([subject]) => subject);

    return weakSubjects.length > 0 
        ? weakSubjects.map(name => ({ name, current: 60, target: 90 }))
        : [
            { name: 'Advanced Communication', current: 60, target: 90 },
            { name: 'Technical Proficiency', current: 40, target: 80 },
            { name: 'Project Management', current: 30, target: 75 }
        ];
}

module.exports = router;
