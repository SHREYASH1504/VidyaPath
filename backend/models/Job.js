const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    company: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    district: String,
    state: String,
    type: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
        required: true,
    },
    salary: {
        min: Number,
        max: Number,
        currency: {
            type: String,
            default: 'INR'
        }
    },
    salaryRange: String, // e.g., "₹5L - ₹10L"
    category: {
        type: String,
        enum: ['Degree-Based Career', 'Skill-Based Career', 'Communication & Arts', 'Rural', 'Urban'],
        required: true,
    },
    tags: [String],
    description: String,
    requirements: [String],
    skills: [String],
    matchScore: {
        type: Number,
        default: 0
    },
    isRural: {
        type: Boolean,
        default: false
    },
    ruralDetails: {
        village: String,
        block: String,
        panchayat: String,
        accessibility: String, // e.g., "Nearby", "Requires travel"
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
