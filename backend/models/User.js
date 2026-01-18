const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    // Clerk ID to link with auth provider
    clerkId: {
        type: String,
        unique: true,
        sparse: true
    },
    // Location Details
    location: {
        locality: String,
        district: String,
        state: String,
    },
    // Academic Details
    academicDetails: {
        board10: String,
        year10: String,
        percentage10: String,
        is12Completed: Boolean,
        stream12: String,
        percentage12: String,
        subjects12: Map, // Store subject preferences as a map or object
    },
    // Graduation Details
    graduationDetails: {
        isCompleted: Boolean,
        field: String,
        college: String,
        year: String,
        cgpa: String,
    },
    // Interests Step
    interests: {
        selectedInterests: [String],
        subjectLikes: Map, // e.g. { "Math": 8, "Physics": 5 }
        strengths: [String],
        workStyle: String,
        otherInterests: String,
    },
    // AI Chatbot Results
    chatbotData: {
        careerPath: String,
        summary: String,
        sessionId: String,
        insights: [String], // Array of insight strings from chatbot
        topCareers: [{
            name: String,
            salary: String,
            risk: Number // 0=Low, 1=Medium, 2=High
        }],
        timestamp: { type: Date, default: Date.now },
        // Store chatbot conversation history
        conversations: [{
            question: String,
            questionId: String,
            answer: String,
            timestamp: { type: Date, default: Date.now }
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
