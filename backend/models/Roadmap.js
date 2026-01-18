const mongoose = require('mongoose');

const roadmapStepSchema = new mongoose.Schema({
    title: String,
    subtitle: String,
    status: {
        type: String,
        enum: ['Completed', 'In Progress', 'Pending'],
        default: 'Pending'
    },
    icon: String,
    order: Number,
    description: String,
    duration: String, // e.g., "3-6 months"
    resources: [{
        title: String,
        url: String,
        type: String // 'course', 'article', 'video', etc.
    }]
});

const skillSchema = new mongoose.Schema({
    name: String,
    level: String, // 'Essential', 'Intermediate', 'Advanced', 'Expert'
    desc: String,
    icon: String,
    color: String,
    bg: String,
    progress: Number, // 0-100
});

const roadmapSchema = new mongoose.Schema({
    jobTitle: {
        type: String,
        required: true,
        unique: true,
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    description: String,
    tags: [{
        label: String,
        icon: String
    }],
    match: {
        type: Number,
        default: 0
    },
    stats: [{
        label: String,
        value: String,
        icon: String,
        highlight: Boolean
    }],
    roadmap: [roadmapStepSchema],
    skills: [skillSchema],
    course: {
        title: String,
        desc: String,
        mentor: String,
        role: String,
        duration: String,
        level: String
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

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

module.exports = Roadmap;
