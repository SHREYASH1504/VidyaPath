const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserAnswer = require('../models/UserAnswer');
const ChatSession = require('../models/ChatSession');

// @desc    Start chat session - storage endpoint
// @route   POST /api/v1/chat/storage/start/:userId
// @access  Public
router.post('/storage/start/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const email = userId.includes('@') ? userId : null;

        // Find or create session
        let session = await ChatSession.findOne({ userId: userId });
        const sessionId = session ? session.sessionId : `storage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (!session) {
            // Get user data from User collection
            let user = null;
            if (email) {
                user = await User.findOne({ email: email });
            } else {
                user = await User.findOne({ clerkId: userId }) || await User.findOne({ email: userId });
            }

            session = await ChatSession.create({
                sessionId: sessionId,
                userId: userId,
                email: email || user?.email,
                phase: 'phase_1',
                isComplete: false,
                profile: user ? {
                    name: user.firstName || '',
                    district: user.location?.district || 'Unknown',
                    level: user.academicDetails?.is12Completed ? '12th' : '10th'
                } : {
                    name: '',
                    district: 'Unknown',
                    level: '10th'
                },
                totalMessages: 0
            });
        }

        // Generate welcome message based on user data
        let user = null;
        if (email) {
            user = await User.findOne({ email: email });
        } else {
            user = await User.findOne({ clerkId: userId }) || await User.findOne({ email: userId });
        }

        let welcomeMessage = "Hello! I'm your personal career advisor. How can I help you today?";
        
        if (user) {
            const userData = {
                interests: user.interests?.selectedInterests || [],
                strengths: user.interests?.strengths || [],
                stream: user.academicDetails?.stream12,
                location: user.location?.district || user.location?.state,
                careerPath: user.chatbotData?.careerPath,
                topCareers: user.chatbotData?.topCareers || []
            };

            if (userData.topCareers.length > 0) {
                welcomeMessage = `Welcome back! I see you're interested in ${userData.topCareers[0].name || 'career guidance'}. What would you like to know more about?`;
            } else if (userData.interests.length > 0) {
                welcomeMessage = `Hello! I notice you're interested in ${userData.interests.slice(0, 2).join(' and ')}. How can I help you explore career options?`;
            }
        }

        res.json({
            success: true,
            sessionId: session.sessionId,
            message: welcomeMessage,
            profile: session.profile,
            phase: session.phase,
            isComplete: session.isComplete
        });
    } catch (error) {
        console.error('Error starting chat session:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error starting chat session', 
            error: error.message 
        });
    }
});

// @desc    Answer chat message - storage endpoint
// @route   POST /api/v1/chat/storage/answer
// @access  Public
router.post('/storage/answer', async (req, res) => {
    try {
        const { sessionId, answer, userId, email } = req.body;

        if (!answer) {
            return res.status(400).json({ 
                success: false, 
                message: 'Answer is required' 
            });
        }

        // Get user identifier
        const userIdentifier = userId || email || (sessionId ? null : 'unknown');
        
        // Find session
        let session = null;
        if (sessionId) {
            session = await ChatSession.findOne({ sessionId: sessionId });
        }
        
        if (!session && userIdentifier) {
            // Try to find session by userId/email
            session = await ChatSession.findOne({ 
                $or: [
                    { userId: userIdentifier },
                    { email: userIdentifier }
                ]
            });
        }

        // Get user data from User collection
        let user = null;
        if (email) {
            user = await User.findOne({ email: email });
        } else if (userId) {
            user = await User.findOne({ email: userId }) || await User.findOne({ clerkId: userId });
        } else if (session) {
            user = await User.findOne({ email: session.email }) || await User.findOne({ clerkId: session.userId });
        }

        // Save user answer
        if (sessionId || session) {
            await UserAnswer.create({
                sessionId: sessionId || session?.sessionId || `temp_${Date.now()}`,
                userId: userId || email || session?.userId || userIdentifier,
                answer: answer,
                phase: session?.phase || 'phase_1',
                timestamp: new Date()
            });

            // Update session
            if (session) {
                session.totalMessages = (session.totalMessages || 0) + 1;
                session.updatedAt = new Date();
                await session.save();
            }
        }

        // Generate personalized response based on user data
        let botResponse = generatePersonalizedResponse(answer, user, session);

        res.json({
            success: true,
            sessionId: sessionId || session?.sessionId,
            message: botResponse,
            phase: session?.phase || 'phase_1',
            isComplete: session?.isComplete || false
        });
    } catch (error) {
        console.error('Error processing answer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error processing answer', 
            error: error.message 
        });
    }
});

// Helper function to generate personalized responses based on user data
function generatePersonalizedResponse(userQuestion, user, session) {
    const question = userQuestion.toLowerCase();
    
    // If no user data, provide general response
    if (!user) {
        return generateGeneralResponse(question);
    }

    // Extract user data
    const userData = {
        interests: user.interests?.selectedInterests || [],
        strengths: user.interests?.strengths || [],
        stream: user.academicDetails?.stream12,
        location: user.location?.district || user.location?.state,
        careerPath: user.chatbotData?.careerPath,
        topCareers: user.chatbotData?.topCareers || [],
        insights: user.chatbotData?.insights || [],
        academicDetails: user.academicDetails,
        graduationDetails: user.graduationDetails
    };

    // Career-related questions
    if (question.includes('career') || question.includes('job') || question.includes('profession')) {
        if (userData.topCareers.length > 0) {
            const topCareer = userData.topCareers[0];
            return `Based on your profile, I'd recommend exploring ${topCareer.name}. ${topCareer.salary ? `The salary range is typically ${topCareer.salary}. ` : ''}${userData.insights.length > 0 ? userData.insights[0] : 'This aligns well with your interests and skills.'}`;
        } else if (userData.careerPath) {
            return `Based on your profile, a ${userData.careerPath} path would suit you well. ${userData.interests.length > 0 ? `Your interests in ${userData.interests.slice(0, 3).join(', ')} are valuable in this field.` : ''}`;
        }
    }

    // Skills-related questions
    if (question.includes('skill') || question.includes('learn') || question.includes('study')) {
        if (userData.strengths.length > 0) {
            return `You have strengths in ${userData.strengths.slice(0, 3).join(', ')}. To build on these, consider focusing on practical projects and gaining hands-on experience. ${userData.interests.length > 0 ? `Given your interest in ${userData.interests[0]}, I'd recommend exploring related courses and certifications.` : ''}`;
        }
    }

    // Location-related questions
    if (question.includes('location') || question.includes('place') || question.includes('city') || question.includes('area')) {
        if (userData.location) {
            return `I see you're from ${userData.location}. There are great opportunities in your area. ${userData.stream ? `With your ${userData.stream} background, you can explore local industries that match your skills.` : ''}`;
        }
    }

    // Interest-related questions
    if (question.includes('interest') || question.includes('like') || question.includes('enjoy')) {
        if (userData.interests.length > 0) {
            return `Your interests in ${userData.interests.slice(0, 3).join(', ')} show great potential. These interests can lead to careers in various fields. ${userData.topCareers.length > 0 ? `I'd suggest exploring ${userData.topCareers[0].name} as a starting point.` : 'Would you like me to suggest specific career paths?'}`;
        }
    }

    // Education-related questions
    if (question.includes('education') || question.includes('degree') || question.includes('course') || question.includes('college')) {
        if (userData.stream) {
            return `With your ${userData.stream} background, you have several options. ${userData.graduationDetails?.field ? `You're pursuing ${userData.graduationDetails.field}, which opens up many career paths.` : 'Consider exploring degree programs that align with your interests and strengths.'}`;
        }
    }

    // Default personalized response
    return generateGeneralResponse(question, userData);
}

function generateGeneralResponse(question, userData = null) {
    // Try to provide helpful responses based on common questions
    if (question.includes('salary') || question.includes('income') || question.includes('earn')) {
        return "Salary ranges vary based on location, experience, and role. Entry-level positions typically start at ₹20,000-30,000, while experienced professionals can earn ₹50,000-1,00,000+. Would you like to know about specific job roles?";
    }

    if (question.includes('future') || question.includes('next') || question.includes('step')) {
        if (userData?.topCareers?.length > 0) {
            return `Your next steps could include: 1) Researching ${userData.topCareers[0].name} in detail, 2) Identifying required skills and qualifications, 3) Finding relevant courses or training programs, 4) Building a portfolio or gaining experience. Would you like me to elaborate on any of these?`;
        }
        return "Your next steps should include: 1) Identifying your interests and strengths, 2) Researching career options, 3) Understanding required qualifications, 4) Creating a learning plan. How can I help you get started?";
    }

    if (question.includes('help') || question.includes('advice') || question.includes('guidance')) {
        return "I'm here to help! I can provide guidance on careers, skills, education paths, and job opportunities. What specific area would you like to explore?";
    }

    // Default response
    return "Thank you for your question! Based on the information I have about your profile, I can provide personalized career guidance. Could you ask me something more specific about careers, skills, education, or job opportunities?";
}

module.exports = router;
