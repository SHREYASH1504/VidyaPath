const express = require('express');
const router = express.Router();
const Roadmap = require('../models/Roadmap');
const Job = require('../models/Job');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Get roadmap for a job
// @route   GET /api/roadmap/job/:jobId?email=user@example.com
// @access  Public
router.get('/job/:jobId', async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Calculate match score if email is provided - use same logic as recommendations
        let matchScore = null;
        const email = req.query.email;
        if (email) {
            try {
                const user = await User.findOne({ email });
                if (user) {
                    // Use the exact same calculation logic as jobRoutes to ensure consistency
                    // Get all jobs and calculate match scores to find this job's position
                    let allJobs = await Job.find({});
                    
                    if (allJobs.length === 0) {
                        const ruralJobsPath = path.join(__dirname, '../data/ruralJobs.json');
                        if (fs.existsSync(ruralJobsPath)) {
                            const ruralJobsData = JSON.parse(fs.readFileSync(ruralJobsPath, 'utf8'));
                            try {
                                await Job.insertMany(ruralJobsData);
                                allJobs = await Job.find({});
                            } catch (error) {
                                console.error('Error seeding jobs:', error);
                                allJobs = ruralJobsData.map((j, idx) => ({
                                    ...j,
                                    _id: `temp_${idx}`,
                                    matchScore: 0
                                }));
                            }
                        }
                    }
                    
                    const chatbotTopCareers = user.chatbotData?.topCareers || [];
                    const chatbotCareerPath = user.chatbotData?.careerPath || 'General';
                    const userInterests = user.interests?.selectedInterests || [];
                    const userLocation = user.location;
                    
                    const chatbotCareerMap = {};
                    chatbotTopCareers.forEach((career, index) => {
                        const careerName = (career.name || '').toLowerCase();
                        chatbotCareerMap[careerName] = {
                            index: index,
                            career: career,
                            priority: chatbotTopCareers.length - index
                        };
                    });
                    
                    // Calculate match scores for all jobs (same as recommendations)
                    allJobs = allJobs.map(j => {
                        let matchScore = 0;
                        let isChatbotRecommended = false;
                        let chatbotMatchScore = null;
                        
                        const jobTitleLower = (j.title || '').toLowerCase();
                        const jobCompanyLower = (j.company || '').toLowerCase();
                        const jobTagsLower = (j.tags || []).map(t => t.toLowerCase());
                        const allJobText = `${jobTitleLower} ${jobCompanyLower} ${jobTagsLower.join(' ')}`;
                        
                        for (const [careerName, careerInfo] of Object.entries(chatbotCareerMap)) {
                            const careerKeywords = careerName.split(/[\s+&,]/).filter(k => k.length > 2);
                            const matchesKeywords = careerKeywords.some(keyword => 
                                allJobText.includes(keyword) || jobTitleLower.includes(keyword)
                            );
                            const exactMatch = jobTitleLower.includes(careerName) || 
                                             careerName.includes(jobTitleLower) ||
                                             allJobText.includes(careerName);
                            
                            if (matchesKeywords || exactMatch) {
                                isChatbotRecommended = true;
                                chatbotMatchScore = Math.max(80, 95 - (careerInfo.index * 3));
                                matchScore += 100;
                                break;
                            }
                        }
                        
                        if (chatbotCareerPath.includes('Degree') && j.category === 'Degree-Based Career') matchScore += 30;
                        if (chatbotCareerPath.includes('Arts') && j.category === 'Communication & Arts') matchScore += 30;
                        if (chatbotCareerPath.includes('Skill') && j.category === 'Skill-Based Career') matchScore += 30;
                        if (chatbotCareerPath.includes('Rural') && j.isRural) matchScore += 35;
                        
                        if (userLocation?.state && j.state === userLocation.state) matchScore += 20;
                        if (userLocation?.district && j.district === userLocation.district) matchScore += 15;
                        
                        const matchingTags = j.tags.filter(tag => 
                            userInterests.some(interest => 
                                interest.toLowerCase().includes(tag.toLowerCase()) || 
                                tag.toLowerCase().includes(interest.toLowerCase())
                            )
                        );
                        matchScore += matchingTags.length * 10;
                        
                        const stream = user.academicDetails?.stream12;
                        if (stream === 'Science' && j.tags.some(t => ['Tech', 'Coding', 'Data', 'AI'].includes(t))) matchScore += 15;
                        if (stream === 'Commerce' && j.tags.some(t => ['Finance', 'Business', 'Banking'].includes(t))) matchScore += 15;
                        if (stream === 'Arts' && j.tags.some(t => ['Design', 'Creative', 'Writing'].includes(t))) matchScore += 15;
                        
                        j.matchScore = matchScore;
                        j.isChatbotRecommended = isChatbotRecommended;
                        j.chatbotMatchScore = chatbotMatchScore;
                        return j;
                    });
                    
                    // Sort the same way as recommendations
                    allJobs.sort((a, b) => {
                        if (a.isChatbotRecommended && !b.isChatbotRecommended) return -1;
                        if (!a.isChatbotRecommended && b.isChatbotRecommended) return 1;
                        return (b.matchScore || 0) - (a.matchScore || 0);
                    });
                    
                    const chatbotRecommendedJobs = allJobs.filter(j => j.isChatbotRecommended);
                    const otherJobs = allJobs.filter(j => !j.isChatbotRecommended);
                    const sortedJobs = [...chatbotRecommendedJobs, ...otherJobs];
                    
                    // Find this job's position and calculate its match score
                    const jobId = job._id ? job._id.toString() : job.id;
                    const jobIndex = sortedJobs.findIndex(j => {
                        const jId = j._id ? j._id.toString() : j.id;
                        return jId && jId.toString() === jobId.toString();
                    });
                    
                    if (jobIndex !== -1) {
                        const foundJob = sortedJobs[jobIndex];
                        
                        if (jobIndex < 5) {
                            // Top 5 get distinct scores: 95, 92, 89, 86, 83
                            matchScore = 95 - (jobIndex * 3);
                        } else {
                            if (foundJob.isChatbotRecommended && foundJob.chatbotMatchScore !== null) {
                                matchScore = Math.max(80, Math.min(82, foundJob.chatbotMatchScore - 1));
                            } else {
                                const scores = sortedJobs.slice(5).map(j => j.matchScore || 0);
                                if (scores.length > 0) {
                                    const minScore = Math.min(...scores);
                                    const maxScore = Math.max(...scores);
                                    const scoreRange = maxScore - minScore || 1;
                                    const normalizedPosition = (foundJob.matchScore - minScore) / scoreRange;
                                    matchScore = Math.round(80 + (normalizedPosition * 2));
                                } else {
                                    matchScore = 80;
                                }
                            }
                        }
                        
                        matchScore = Math.max(80, Math.min(95, matchScore));
                    } else {
                        // Fallback calculation if job not found in sorted list
                        const chatbotTopCareers = user.chatbotData?.topCareers || [];
                        const chatbotCareerPath = user.chatbotData?.careerPath || 'General';
                        const userInterests = user.interests?.selectedInterests || [];
                        const userLocation = user.location;
                        
                        let calculatedScore = 0;
                        let isChatbotRecommended = false;
                        let chatbotMatchScore = null;
                        
                        const jobTitleLower = (job.title || '').toLowerCase();
                        const jobCompanyLower = (job.company || '').toLowerCase();
                        const jobTagsLower = (job.tags || []).map(t => t.toLowerCase());
                        const allJobText = `${jobTitleLower} ${jobCompanyLower} ${jobTagsLower.join(' ')}`;
                        
                        chatbotTopCareers.forEach((career, careerIndex) => {
                            const careerName = (career.name || '').toLowerCase();
                            const careerKeywords = careerName.split(/[\s+&,]/).filter(k => k.length > 2);
                            
                            const matchesKeywords = careerKeywords.some(keyword => 
                                allJobText.includes(keyword) || jobTitleLower.includes(keyword)
                            );
                            const exactMatch = jobTitleLower.includes(careerName) || 
                                             careerName.includes(jobTitleLower) ||
                                             allJobText.includes(careerName);
                            
                            if (matchesKeywords || exactMatch) {
                                isChatbotRecommended = true;
                                chatbotMatchScore = Math.max(80, 95 - (careerIndex * 3));
                                calculatedScore += 100;
                            }
                        });
                        
                        if (chatbotCareerPath.includes('Degree') && job.category === 'Degree-Based Career') calculatedScore += 30;
                        if (chatbotCareerPath.includes('Arts') && job.category === 'Communication & Arts') calculatedScore += 30;
                        if (chatbotCareerPath.includes('Skill') && job.category === 'Skill-Based Career') calculatedScore += 30;
                        if (chatbotCareerPath.includes('Rural') && job.isRural) calculatedScore += 35;
                        
                        if (userLocation?.state && job.state === userLocation.state) calculatedScore += 20;
                        if (userLocation?.district && job.district === userLocation.district) calculatedScore += 15;
                        
                        const matchingTags = job.tags.filter(tag => 
                            userInterests.some(interest => 
                                interest.toLowerCase().includes(tag.toLowerCase()) || 
                                tag.toLowerCase().includes(interest.toLowerCase())
                            )
                        );
                        calculatedScore += matchingTags.length * 10;
                        
                        const stream = user.academicDetails?.stream12;
                        if (stream === 'Science' && job.tags.some(t => ['Tech', 'Coding', 'Data', 'AI'].includes(t))) calculatedScore += 15;
                        if (stream === 'Commerce' && job.tags.some(t => ['Finance', 'Business', 'Banking'].includes(t))) calculatedScore += 15;
                        if (stream === 'Arts' && job.tags.some(t => ['Design', 'Creative', 'Writing'].includes(t))) calculatedScore += 15;
                        
                        if (isChatbotRecommended && chatbotMatchScore !== null) {
                            matchScore = chatbotMatchScore;
                        } else if (calculatedScore > 0) {
                            matchScore = Math.max(80, Math.min(95, 80 + (calculatedScore / 150) * 15));
                        }
                    }
                }
            } catch (userError) {
                console.error('Error calculating match score for roadmap:', userError);
            }
        }

        // Find roadmap by job title or create default
        let roadmap = await Roadmap.findOne({ jobTitle: job.title });
        
        if (!roadmap) {
            // Create a default roadmap based on job category
            roadmap = await createDefaultRoadmap(job);
        }
        
        // Update match score if calculated
        if (matchScore !== null) {
            roadmap.match = matchScore;
        }

        res.json(roadmap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get roadmap by job title
// @route   GET /api/roadmap/:jobTitle
// @access  Public
router.get('/:jobTitle', async (req, res) => {
    try {
        const roadmap = await Roadmap.findOne({ 
            jobTitle: { $regex: req.params.jobTitle, $options: 'i' } 
        });
        
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }
        
        res.json(roadmap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Create or update roadmap
// @route   POST /api/roadmap
// @access  Public (should be protected in production)
router.post('/', async (req, res) => {
    try {
        const { jobTitle, ...roadmapData } = req.body;
        
        let roadmap = await Roadmap.findOne({ jobTitle });
        
        if (roadmap) {
            // Update existing roadmap
            Object.assign(roadmap, roadmapData);
            roadmap.updatedAt = new Date();
            await roadmap.save();
        } else {
            // Create new roadmap
            roadmap = await Roadmap.create({
                jobTitle,
                ...roadmapData
            });
        }
        
        res.json(roadmap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Helper function to create default roadmap
async function createDefaultRoadmap(job) {
    // Get match score from job if available
    const matchScore = job.matchScore || 85;

    // Create roadmap based on job category and type
    let roadmapSteps = [];
    let skills = [];
    let course = {
        title: 'Career Fundamentals',
        desc: 'Getting Started',
        mentor: 'Career Coach',
        role: 'Mentor',
        duration: '4 weeks',
        level: 'Beginner'
    };

    // Roadmap templates based on job category
    if (job.category === 'Rural') {
        // Rural job roadmaps
        if (job.tags?.some(t => t.includes('Teaching') || t.includes('Education'))) {
            roadmapSteps = [
                { title: 'Complete 12th', subtitle: 'Any Stream', status: 'Pending', icon: '🎓', order: 1 },
                { title: 'Get D.Ed/B.Ed', subtitle: 'Teaching Certificate', status: 'Pending', icon: '📜', order: 2 },
                { title: 'Apply for Government Jobs', subtitle: 'Teacher Recruitment', status: 'Pending', icon: '📝', order: 3 },
                { title: 'Start Teaching', subtitle: 'Primary/Secondary School', status: 'Pending', icon: '👨‍🏫', order: 4 }
            ];
            skills = [
                { name: 'Teaching', level: 'Essential', desc: 'Classroom Management', icon: '👨‍🏫', color: 'text-blue-600', bg: 'bg-blue-50', progress: 40 },
                { name: 'Communication', level: 'Essential', desc: 'Student Interaction', icon: '💬', color: 'text-green-600', bg: 'bg-green-50', progress: 50 },
                { name: 'Subject Knowledge', level: 'Essential', desc: 'Core Subjects', icon: '📚', color: 'text-purple-600', bg: 'bg-purple-50', progress: 45 }
            ];
            course = {
                title: 'Teaching Fundamentals',
                desc: 'Learn Classroom Management',
                mentor: 'Education Expert',
                role: 'Senior Teacher',
                duration: '6 weeks',
                level: 'Beginner'
            };
        } else if (job.tags?.some(t => t.includes('Healthcare') || t.includes('Health'))) {
            roadmapSteps = [
                { title: 'Complete 10th', subtitle: 'Basic Education', status: 'Pending', icon: '🎓', order: 1 },
                { title: 'Get ANM/ASHA Training', subtitle: 'Health Worker Certificate', status: 'Pending', icon: '🏥', order: 2 },
                { title: 'Apply for Health Centers', subtitle: 'Primary Health Center', status: 'Pending', icon: '📋', order: 3 },
                { title: 'Start Health Services', subtitle: 'Community Health', status: 'Pending', icon: '💊', order: 4 }
            ];
            skills = [
                { name: 'Basic Medical Knowledge', level: 'Essential', desc: 'First Aid & Health', icon: '💊', color: 'text-red-600', bg: 'bg-red-50', progress: 35 },
                { name: 'Communication', level: 'Essential', desc: 'Patient Care', icon: '💬', color: 'text-blue-600', bg: 'bg-blue-50', progress: 50 },
                { name: 'Record Keeping', level: 'Essential', desc: 'Health Records', icon: '📝', color: 'text-green-600', bg: 'bg-green-50', progress: 40 }
            ];
        } else if (job.tags?.some(t => t.includes('Banking') || t.includes('Bank'))) {
            roadmapSteps = [
                { title: 'Complete 12th', subtitle: 'Any Stream', status: 'Pending', icon: '🎓', order: 1 },
                { title: 'Learn Banking Basics', subtitle: 'Financial Literacy', status: 'Pending', icon: '💰', order: 2 },
                { title: 'Apply for Bank Exams', subtitle: 'RRB/Clerk Exams', status: 'Pending', icon: '📝', order: 3 },
                { title: 'Start Banking Career', subtitle: 'Rural Bank Clerk', status: 'Pending', icon: '🏦', order: 4 }
            ];
            skills = [
                { name: 'Numerical Ability', level: 'Essential', desc: 'Math & Calculations', icon: '🔢', color: 'text-blue-600', bg: 'bg-blue-50', progress: 45 },
                { name: 'Computer Skills', level: 'Essential', desc: 'Banking Software', icon: '💻', color: 'text-green-600', bg: 'bg-green-50', progress: 40 },
                { name: 'Customer Service', level: 'Essential', desc: 'Client Interaction', icon: '👥', color: 'text-purple-600', bg: 'bg-purple-50', progress: 50 }
            ];
        } else if (job.tags?.some(t => t.includes('Agriculture') || t.includes('Extension'))) {
            roadmapSteps = [
                { title: 'Complete 12th', subtitle: 'Science/Agriculture', status: 'Pending', icon: '🎓', order: 1 },
                { title: 'Get Agriculture Diploma', subtitle: 'Agricultural Extension', status: 'Pending', icon: '🌾', order: 2 },
                { title: 'Apply for Government Jobs', subtitle: 'Agriculture Department', status: 'Pending', icon: '📋', order: 3 },
                { title: 'Start Field Work', subtitle: 'Farmer Support', status: 'Pending', icon: '🚜', order: 4 }
            ];
            skills = [
                { name: 'Agricultural Knowledge', level: 'Essential', desc: 'Crop & Farming', icon: '🌾', color: 'text-green-600', bg: 'bg-green-50', progress: 50 },
                { name: 'Field Work', level: 'Essential', desc: 'On-Ground Experience', icon: '🚜', color: 'text-orange-600', bg: 'bg-orange-50', progress: 40 },
                { name: 'Communication', level: 'Essential', desc: 'Farmer Interaction', icon: '💬', color: 'text-blue-600', bg: 'bg-blue-50', progress: 45 }
            ];
        } else if (job.tags?.some(t => t.includes('Technical') || t.includes('Electrical') || t.includes('Mechanical'))) {
            roadmapSteps = [
                { title: 'Complete 10th', subtitle: 'Basic Education', status: 'Pending', icon: '🎓', order: 1 },
                { title: 'Get ITI Certificate', subtitle: 'Technical Training', status: 'Pending', icon: '🔧', order: 2 },
                { title: 'Gain Practical Experience', subtitle: 'Apprenticeship', status: 'Pending', icon: '⚙️', order: 3 },
                { title: 'Start Technical Career', subtitle: 'Electrician/Mechanic', status: 'Pending', icon: '🛠️', order: 4 }
            ];
            skills = (job.skills || []).slice(0, 3).map((skill, idx) => ({
                name: typeof skill === 'string' ? skill : skill.name || skill,
                level: 'Essential',
                desc: 'Technical Skill',
                icon: '🔧',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                progress: 40 + (idx * 15)
            }));
        } else {
            // Generic rural job roadmap
            roadmapSteps = [
                { title: 'Complete Basic Education', subtitle: '10th/12th Pass', status: 'Pending', icon: '🎓', order: 1 },
                { title: 'Get Required Training', subtitle: 'Skill Development', status: 'Pending', icon: '📚', order: 2 },
                { title: 'Apply for Positions', subtitle: 'Job Applications', status: 'Pending', icon: '📝', order: 3 },
                { title: 'Start Career', subtitle: job.title, status: 'Pending', icon: '🚀', order: 4 }
            ];
            skills = (job.skills || []).slice(0, 3).map((skill, idx) => ({
                name: typeof skill === 'string' ? skill : skill.name || skill,
                level: 'Essential',
                desc: 'Required Skill',
                icon: '📌',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                progress: 30 + (idx * 20)
            }));
        }
    } else if (job.category === 'Degree-Based Career') {
        roadmapSteps = [
            { title: 'Complete 12th (Science)', subtitle: 'PCM/PCB Subjects', status: 'Pending', icon: '🎓', order: 1 },
            { title: 'Get Bachelor Degree', subtitle: 'B.Tech/B.Sc/B.Com', status: 'Pending', icon: '📚', order: 2 },
            { title: 'Build Skills', subtitle: 'Technical/Professional', status: 'Pending', icon: '⚡', order: 3 },
            { title: 'Get Internship', subtitle: 'Practical Experience', status: 'Pending', icon: '💼', order: 4 },
            { title: 'Start Full-Time Career', subtitle: job.title, status: 'Pending', icon: '🏆', order: 5 }
        ];
        skills = (job.skills || []).slice(0, 3).map((skill, idx) => ({
            name: typeof skill === 'string' ? skill : skill.name || skill,
            level: idx === 0 ? 'Advanced' : idx === 1 ? 'Intermediate' : 'Essential',
            desc: 'Core Skill',
            icon: '⚙️',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            progress: 50 + (idx * 15)
        }));
    } else if (job.category === 'Skill-Based Career') {
        roadmapSteps = [
            { title: 'Learn Fundamentals', subtitle: 'Basic Skills', status: 'Pending', icon: '📖', order: 1 },
            { title: 'Practice & Build Projects', subtitle: 'Hands-on Experience', status: 'Pending', icon: '🛠️', order: 2 },
            { title: 'Get Certifications', subtitle: 'Skill Validation', status: 'Pending', icon: '📜', order: 3 },
            { title: 'Start Career', subtitle: job.title, status: 'Pending', icon: '🚀', order: 4 }
        ];
        skills = (job.skills || []).slice(0, 3).map((skill, idx) => ({
            name: typeof skill === 'string' ? skill : skill.name || skill,
            level: 'Essential',
            desc: 'Practical Skill',
            icon: '🎯',
            color: 'text-green-600',
            bg: 'bg-green-50',
            progress: 40 + (idx * 20)
        }));
    } else {
        // Default roadmap
        roadmapSteps = [
            { title: 'Get Started', subtitle: 'Begin your journey', status: 'Pending', icon: '🚀', order: 1 },
            { title: 'Learn Skills', subtitle: 'Build Expertise', status: 'Pending', icon: '📚', order: 2 },
            { title: 'Gain Experience', subtitle: 'Practical Work', status: 'Pending', icon: '💼', order: 3 },
            { title: 'Achieve Career', subtitle: job.title, status: 'Pending', icon: '🏆', order: 4 }
        ];
        skills = (job.skills || []).slice(0, 3).map((skill, idx) => ({
            name: typeof skill === 'string' ? skill : skill.name || skill,
            level: 'Essential',
            desc: 'Required Skill',
            icon: '📌',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            progress: 30 + (idx * 20)
        }));
    }

    const defaultRoadmap = {
        jobTitle: job.title,
        jobId: job._id,
        description: job.description || 'Your personalized roadmap to success.',
        tags: (job.tags || []).map(tag => ({ label: tag, icon: '📌' })),
        match: matchScore,
        stats: [
            { label: 'AVG SALARY', value: job.salaryRange || (job.salary ? `₹${job.salary.min || 0}L - ₹${job.salary.max || 0}L` : '₹2L - ₹5L'), icon: '💵' },
            { label: 'LOCATION', value: job.location, icon: '📍' },
            { label: 'TYPE', value: job.type, icon: '⏱️' },
            { label: 'CATEGORY', value: job.category, icon: '💼' }
        ],
        roadmap: roadmapSteps,
        skills: skills.length > 0 ? skills : (job.skills || []).slice(0, 3).map((skill, idx) => ({
            name: typeof skill === 'string' ? skill : skill.name || skill,
            level: 'Essential',
            desc: 'Required Skill',
            icon: '📌',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            progress: 30 + (idx * 20)
        })),
        course: course
    };

    return await Roadmap.create(defaultRoadmap);
}

module.exports = router;
