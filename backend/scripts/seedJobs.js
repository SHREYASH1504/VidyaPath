const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Job = require('../models/Job');

dotenv.config();

const seedJobs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Clear existing jobs
        await Job.deleteMany({});
        console.log('Cleared existing jobs');

        // Read rural jobs JSON
        const ruralJobsPath = path.join(__dirname, '../data/ruralJobs.json');
        const ruralJobsData = JSON.parse(fs.readFileSync(ruralJobsPath, 'utf8'));

        // Insert rural jobs
        const jobs = await Job.insertMany(ruralJobsData);
        console.log(`Seeded ${jobs.length} rural jobs`);

        // Add some urban jobs for variety
        const urbanJobs = [
            {
                title: 'Software Engineer',
                company: 'Tech Corp',
                location: 'Bangalore',
                district: 'Bangalore Urban',
                state: 'Karnataka',
                type: 'Full-time',
                salary: { min: 12, max: 18, currency: 'INR' },
                salaryRange: '₹12L - ₹18L',
                category: 'Degree-Based Career',
                tags: ['Tech', 'Coding', 'Software'],
                description: 'Design and develop software applications.',
                requirements: ['B.Tech in CS/IT', 'Programming skills'],
                skills: ['Java', 'Python', 'System Design'],
                isRural: false
            },
            {
                title: 'Data Scientist',
                company: 'Data Analytics Inc',
                location: 'Hyderabad',
                district: 'Hyderabad',
                state: 'Telangana',
                type: 'Full-time',
                salary: { min: 15, max: 25, currency: 'INR' },
                salaryRange: '₹15L - ₹25L',
                category: 'Degree-Based Career',
                tags: ['Data', 'AI', 'Analytics'],
                description: 'Analyze data and build machine learning models.',
                requirements: ['B.Tech/M.Sc in Data Science', 'ML knowledge'],
                skills: ['Python', 'SQL', 'Machine Learning'],
                isRural: false
            }
        ];

        await Job.insertMany(urbanJobs);
        console.log(`Seeded ${urbanJobs.length} urban jobs`);

        console.log('Job seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding jobs:', error);
        process.exit(1);
    }
};

seedJobs();
