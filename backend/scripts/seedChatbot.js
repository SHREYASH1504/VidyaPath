const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Chatbot = require('../models/Chatbot');

dotenv.config();

const seedChatbot = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Clear existing chatbot data
        await Chatbot.deleteMany({});
        console.log('Cleared existing chatbot data');

        // Seed chatbot questions and answers
        const chatbotData = [
            {
                question: 'What tools or equipment do you enjoy working with?',
                answer: 'Working with tools can lead to careers in mechanics, carpentry, electrical work, or agriculture. These skill-based careers are in high demand in rural areas and offer good earning potential.',
                category: 'general',
                tags: ['tools', 'earning', 'skill-based']
            },
            {
                question: 'How important is earning money quickly to you?',
                answer: 'If earning quickly is important, consider skill-based careers like electrician, mechanic, or computer operator. These require shorter training periods and can start earning within 6-12 months.',
                category: 'career',
                tags: ['earning', 'skill-based', 'quick']
            },
            {
                question: 'Do you enjoy solving puzzles and logical problems?',
                answer: 'If you enjoy puzzles and logic, careers in software engineering, data science, or cybersecurity might be perfect for you. These require strong analytical thinking and problem-solving skills.',
                category: 'career',
                tags: ['puzzles', 'computer', 'tech', 'coding']
            },
            {
                question: 'Are you comfortable working with computers and technology?',
                answer: 'Computer skills open many doors! You can pursue careers in software development, data entry, digital marketing, or even start a cyber cafe in rural areas. Technology skills are highly valued everywhere.',
                category: 'skills',
                tags: ['computer', 'tech', 'coding']
            },
            {
                question: 'Do you prefer working in a creative team or alone?',
                answer: 'Creative team work suits careers in design, content creation, or marketing. If you prefer working alone, consider freelance writing, photography, or handicraft work. Both paths offer good opportunities.',
                category: 'career',
                tags: ['creative', 'team', 'aesthetics', 'design']
            },
            {
                question: 'How important is aesthetics and visual appeal to you?',
                answer: 'If aesthetics matter to you, consider careers in graphic design, interior design, photography, or handicrafts. These creative fields allow you to express your visual sense and can be very rewarding.',
                category: 'career',
                tags: ['aesthetics', 'design', 'creative']
            },
            {
                question: 'Which industry interests you most?',
                answer: 'Different industries offer different opportunities. Technology is growing fast, healthcare is always in demand, agriculture is crucial in rural areas, and education shapes future generations. Consider what aligns with your interests and location.',
                category: 'career',
                tags: ['industry', 'general']
            },
            {
                question: 'How important is career growth to you?',
                answer: 'Career growth depends on continuous learning and skill development. Tech careers offer rapid growth, while traditional fields like teaching or government jobs offer stability. Choose based on your priorities.',
                category: 'career',
                tags: ['growth', 'general']
            },
            {
                question: 'What are the best skills for 2026?',
                answer: 'Top skills for 2026 include: Digital literacy, Communication, Problem-solving, Technical skills (coding, data analysis), Creative skills (design, content), and Soft skills (teamwork, adaptability). Focus on skills that combine technology with human creativity.',
                category: 'skills',
                tags: ['skills', 'future', 'general']
            },
            {
                question: 'How do I become a Product Manager?',
                answer: 'To become a Product Manager: 1) Get a degree in business/tech, 2) Learn Agile/Scrum methodologies, 3) Build communication and leadership skills, 4) Gain experience in tech or business roles, 5) Create a portfolio of product ideas. It requires both technical understanding and business acumen.',
                category: 'career',
                tags: ['product', 'management', 'career']
            },
            {
                question: 'Resume tips for freshers',
                answer: 'Resume tips for freshers: 1) Highlight education and relevant coursework, 2) Include projects and internships, 3) List technical and soft skills, 4) Add any certifications or online courses, 5) Keep it concise (1-2 pages), 6) Use action verbs, 7) Tailor it to each job application.',
                category: 'career',
                tags: ['resume', 'career', 'general']
            },
            {
                question: 'Explain high-demand tech roles',
                answer: 'High-demand tech roles include: Software Engineer (develops applications), Data Scientist (analyzes data), Cybersecurity Analyst (protects systems), Cloud Engineer (manages cloud infrastructure), and AI/ML Engineer (builds intelligent systems). These roles offer excellent salaries and growth opportunities.',
                category: 'career',
                tags: ['tech', 'roles', 'career']
            }
        ];

        const chatbots = await Chatbot.insertMany(chatbotData);
        console.log(`Seeded ${chatbots.length} chatbot Q&A pairs`);

        console.log('Chatbot seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding chatbot:', error);
        process.exit(1);
    }
};

seedChatbot();
