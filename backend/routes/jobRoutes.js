const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Get job recommendations for a user
// @route   GET /api/jobs/recommendations/:email
// @access  Public
router.get('/recommendations/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get all jobs
        let jobs = await Job.find({});

        // If no jobs in DB, load from rural jobs JSON and seed them
        if (jobs.length === 0) {
            const ruralJobsPath = path.join(__dirname, '../data/ruralJobs.json');
            if (fs.existsSync(ruralJobsPath)) {
                const ruralJobsData = JSON.parse(fs.readFileSync(ruralJobsPath, 'utf8'));
                // Seed jobs from JSON
                try {
                    await Job.insertMany(ruralJobsData);
                    jobs = await Job.find({});
                } catch (error) {
                    console.error('Error seeding jobs:', error);
                    // If seeding fails, use JSON data directly
                    jobs = ruralJobsData.map((job, index) => ({
                        ...job,
                        _id: `temp_${index}`,
                        matchScore: 0
                    }));
                }
            }
        }

        // Get chatbot recommendations
        const chatbotTopCareers = user.chatbotData?.topCareers || [];
        const chatbotCareerPath = user.chatbotData?.careerPath || 'General';
        const chatbotInsights = user.chatbotData?.insights || [];
        
        // Calculate match scores based on user profile and chatbot recommendations
        const userCategory = chatbotCareerPath || 'General';
        const userInterests = user.interests?.selectedInterests || [];
        const userLocation = user.location;

        // Create a map of chatbot recommended careers for quick lookup
        const chatbotCareerMap = {};
        chatbotTopCareers.forEach((career, index) => {
            const careerName = (career.name || '').toLowerCase();
            chatbotCareerMap[careerName] = {
                index: index,
                career: career,
                priority: chatbotTopCareers.length - index // Higher priority for earlier recommendations
            };
        });

        jobs = jobs.map(job => {
            let matchScore = 0;
            let isChatbotRecommended = false;
            let chatbotMatchScore = null;

            // PRIORITY 1: Match with chatbot recommended careers (highest priority)
            const jobTitleLower = (job.title || '').toLowerCase();
            const jobCompanyLower = (job.company || '').toLowerCase();
            const jobTagsLower = (job.tags || []).map(t => t.toLowerCase());
            const allJobText = `${jobTitleLower} ${jobCompanyLower} ${jobTagsLower.join(' ')}`;
            
            // Check if job matches any chatbot recommended career
            for (const [careerName, careerInfo] of Object.entries(chatbotCareerMap)) {
                // Match by career name keywords
                const careerKeywords = careerName.split(/[\s+&,]/).filter(k => k.length > 2);
                const matchesKeywords = careerKeywords.some(keyword => 
                    allJobText.includes(keyword) || jobTitleLower.includes(keyword)
                );
                
                // Match by exact or partial career name
                const exactMatch = jobTitleLower.includes(careerName) || 
                                   careerName.includes(jobTitleLower) ||
                                   allJobText.includes(careerName);
                
                if (matchesKeywords || exactMatch) {
                    isChatbotRecommended = true;
                    // Calculate chatbot match score based on position and risk
                    // Top chatbot recommendations get higher scores
                    const baseScore = 95 - (careerInfo.index * 3); // 95, 92, 89, 86, 83...
                    chatbotMatchScore = Math.max(80, Math.min(95, baseScore));
                    matchScore += 100; // Huge boost for chatbot recommendations
                    break;
                }
            }

            // PRIORITY 2: Match by chatbot career path category
            if (userCategory.includes('Degree') && job.category === 'Degree-Based Career') matchScore += 30;
            if (userCategory.includes('Arts') && job.category === 'Communication & Arts') matchScore += 30;
            if (userCategory.includes('Skill') && job.category === 'Skill-Based Career') matchScore += 30;
            if (userCategory.includes('Rural') && job.isRural) matchScore += 35;

            // PRIORITY 3: Match by location
            if (userLocation?.state && job.state === userLocation.state) matchScore += 20;
            if (userLocation?.district && job.district === userLocation.district) matchScore += 15;

            // PRIORITY 4: Match by tags/interests
            const matchingTags = job.tags.filter(tag => 
                userInterests.some(interest => 
                    interest.toLowerCase().includes(tag.toLowerCase()) || 
                    tag.toLowerCase().includes(interest.toLowerCase())
                )
            );
            matchScore += matchingTags.length * 10;

            // PRIORITY 5: Match by stream
            const stream = user.academicDetails?.stream12;
            if (stream === 'Science' && job.tags.some(t => ['Tech', 'Coding', 'Data', 'AI'].includes(t))) matchScore += 15;
            if (stream === 'Commerce' && job.tags.some(t => ['Finance', 'Business', 'Banking'].includes(t))) matchScore += 15;
            if (stream === 'Arts' && job.tags.some(t => ['Design', 'Creative', 'Writing'].includes(t))) matchScore += 15;

            // Store chatbot recommendation info
            job.matchScore = matchScore;
            job.isChatbotRecommended = isChatbotRecommended;
            job.chatbotMatchScore = chatbotMatchScore;
            return job;
        });

        // Sort by match score (chatbot recommended jobs first, then by score)
        jobs.sort((a, b) => {
            // First sort by chatbot recommendation status
            if (a.isChatbotRecommended && !b.isChatbotRecommended) return -1;
            if (!a.isChatbotRecommended && b.isChatbotRecommended) return 1;
            // Then by match score
            return (b.matchScore || 0) - (a.matchScore || 0);
        });
        
        // Separate chatbot recommended jobs and other jobs
        const chatbotRecommendedJobs = jobs.filter(j => j.isChatbotRecommended);
        const otherJobs = jobs.filter(j => !j.isChatbotRecommended);
        
        // Combine: chatbot recommended first, then others
        const sortedJobs = [...chatbotRecommendedJobs, ...otherJobs];
        
        // Handle AI-suggested jobs that don't exist in DB
        // If chatbot recommended careers but no jobs matched, find most relevant jobs
        if (chatbotTopCareers.length > 0 && chatbotRecommendedJobs.length === 0) {
            console.log('No exact matches for chatbot careers, finding most relevant jobs...');
            
            const matchedJobIds = new Set(); // Track already matched jobs to avoid duplicates
            
            // For each chatbot career, find the most relevant job
            chatbotTopCareers.forEach((career, careerIndex) => {
                const careerName = (career.name || '').toLowerCase();
                const careerKeywords = careerName.split(/[\s+&,]/).filter(k => k.length > 2);
                
                // Find best matching job for this career (excluding already matched ones)
                let bestMatch = null;
                let bestScore = 0;
                
                otherJobs.forEach(job => {
                    // Skip if already matched
                    const jobId = job._id ? (job._id.toString ? job._id.toString() : job._id) : job.id;
                    if (matchedJobIds.has(jobId)) return;
                    
                    const jobTitleLower = (job.title || '').toLowerCase();
                    const jobTagsLower = (job.tags || []).map(t => t.toLowerCase());
                    const allJobText = `${jobTitleLower} ${jobTagsLower.join(' ')}`;
                    
                    // Calculate relevance score
                    let relevanceScore = 0;
                    careerKeywords.forEach(keyword => {
                        if (allJobText.includes(keyword)) {
                            relevanceScore += 10;
                        }
                        if (jobTitleLower.includes(keyword)) {
                            relevanceScore += 15; // Higher weight for title match
                        }
                    });
                    
                    // Also check category match
                    if (careerName.includes('teacher') && job.tags.some(t => t.toLowerCase().includes('teaching'))) relevanceScore += 20;
                    if (careerName.includes('bank') && job.tags.some(t => t.toLowerCase().includes('banking'))) relevanceScore += 20;
                    if (careerName.includes('health') && job.tags.some(t => t.toLowerCase().includes('health'))) relevanceScore += 20;
                    if (careerName.includes('agriculture') && job.tags.some(t => t.toLowerCase().includes('agriculture'))) relevanceScore += 20;
                    if (careerName.includes('government') && job.tags.some(t => t.toLowerCase().includes('government'))) relevanceScore += 20;
                    if (careerName.includes('rural') && job.isRural) relevanceScore += 15;
                    
                    if (relevanceScore > bestScore) {
                        bestScore = relevanceScore;
                        bestMatch = job;
                    }
                });
                
                // If found a relevant match, mark it as chatbot recommended
                if (bestMatch && bestScore > 0) {
                    const jobId = bestMatch._id ? (bestMatch._id.toString ? bestMatch._id.toString() : bestMatch._id) : bestMatch.id;
                    matchedJobIds.add(jobId);
                    
                    bestMatch.isChatbotRecommended = true;
                    // Assign match score based on career position (95, 92, 89, 86, 83...)
                    bestMatch.chatbotMatchScore = Math.max(80, 95 - (careerIndex * 3));
                    // Move to chatbot recommended list
                    chatbotRecommendedJobs.push(bestMatch);
                }
            });
            
            // Remove matched jobs from otherJobs
            const matchedIds = Array.from(matchedJobIds);
            otherJobs = otherJobs.filter(job => {
                const jobId = job._id ? (job._id.toString ? job._id.toString() : job._id) : job.id;
                return !matchedIds.includes(jobId);
            });
            
            // Re-sort after adding matches
            chatbotRecommendedJobs.sort((a, b) => (b.chatbotMatchScore || 0) - (a.chatbotMatchScore || 0));
            sortedJobs.splice(0, sortedJobs.length, ...chatbotRecommendedJobs, ...otherJobs);
        }
        
        // Normalize match scores to be between 80-95
        // Ensure top 5 have distinct scores: 95, 92, 89, 86, 83
        const recommendedJobs = sortedJobs.slice(0, 20).map((job, index) => {
            // Handle both MongoDB documents and plain objects
            const jobId = job._id ? (job._id.toString ? job._id.toString() : job._id) : job.id || `temp_${Date.now()}_${Math.random()}`;
            
            // Calculate normalized match score
            // Top 5 MUST have distinct scores: 95, 92, 89, 86, 83
            let normalizedMatch = 85; // Default fallback
            
            if (index < 5) {
                // Top 5 always get distinct scores based on position, regardless of chatbot recommendation
                // This ensures: 95, 92, 89, 86, 83
                normalizedMatch = 95 - (index * 3);
            } else {
                // For jobs beyond top 5, use chatbot score if available, otherwise normalize
                if (job.isChatbotRecommended && job.chatbotMatchScore !== null) {
                    // Use chatbot score but ensure it's lower than top 5
                    normalizedMatch = Math.max(80, Math.min(82, job.chatbotMatchScore - 1));
                } else {
                    // Normalize based on match score
                    const scores = sortedJobs.slice(5).map(j => j.matchScore || 0);
                    if (scores.length > 0) {
                        const minScore = Math.min(...scores);
                        const maxScore = Math.max(...scores);
                        const scoreRange = maxScore - minScore || 1;
                        const normalizedPosition = (job.matchScore - minScore) / scoreRange;
                        normalizedMatch = Math.round(80 + (normalizedPosition * 2)); // 80-82
                    } else {
                        normalizedMatch = 80;
                    }
                }
            }
            
            // Ensure it's between 80-95 (safety check)
            normalizedMatch = Math.max(80, Math.min(95, normalizedMatch));
            
            return {
                id: jobId,
                _id: jobId, // Include both for compatibility
                title: job.title,
                company: job.company,
                location: job.location,
                district: job.district,
                state: job.state,
                type: job.type,
                salary: job.salaryRange || (job.salary ? `${job.salary.min || 0}L - ${job.salary.max || 0}L` : '₹2L - ₹5L'),
                salaryRange: job.salaryRange || (job.salary ? `${job.salary.min || 0}L - ${job.salary.max || 0}L` : '₹2L - ₹5L'),
                category: job.category,
                tags: job.tags || [],
                skills: job.skills || [],
                requirements: job.requirements || [],
                description: job.description,
                match: normalizedMatch,
                matchScore: normalizedMatch,
                isRural: job.isRural || false,
                ruralDetails: job.ruralDetails || null,
                isChatbotRecommended: job.isChatbotRecommended || false
            };
        });

        // If no jobs found, return empty array with helpful message
        if (recommendedJobs.length === 0) {
            return res.json([]);
        }

        res.json(recommendedJobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, location, isRural } = req.query;
        let query = {};

        if (category) query.category = category;
        if (location) query.location = { $regex: location, $options: 'i' };
        if (isRural !== undefined) query.isRural = isRural === 'true';

        const jobs = await Job.find(query);
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get job by ID (with match score if email provided)
// @route   GET /api/jobs/:id?email=user@example.com
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        
        // If email is provided, get match score from recommendations to ensure consistency
        const email = req.query.email;
        if (email) {
            try {
                const user = await User.findOne({ email });
                if (user) {
                    // Call the recommendations logic directly to get the exact match score
                    // This ensures consistency between recommendations list and individual job view
                    const jobId = job._id ? job._id.toString() : job.id;
                    
                    // Reuse the recommendations logic to get the exact match score
                    // We'll simulate the recommendations endpoint logic
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
                    
                    // Use the same calculation logic as recommendations endpoint
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
                    const jobIndex = sortedJobs.findIndex(j => {
                        const jId = j._id ? j._id.toString() : j.id;
                        return jId && jId.toString() === jobId.toString();
                    });
                    
                    if (jobIndex !== -1) {
                        const foundJob = sortedJobs[jobIndex];
                        let normalizedMatch = 85;
                        
                        if (jobIndex < 5) {
                            // Top 5 get distinct scores: 95, 92, 89, 86, 83
                            normalizedMatch = 95 - (jobIndex * 3);
                        } else {
                            if (foundJob.isChatbotRecommended && foundJob.chatbotMatchScore !== null) {
                                normalizedMatch = Math.max(80, Math.min(82, foundJob.chatbotMatchScore - 1));
                            } else {
                                const scores = sortedJobs.slice(5).map(j => j.matchScore || 0);
                                if (scores.length > 0) {
                                    const minScore = Math.min(...scores);
                                    const maxScore = Math.max(...scores);
                                    const scoreRange = maxScore - minScore || 1;
                                    const normalizedPosition = (foundJob.matchScore - minScore) / scoreRange;
                                    normalizedMatch = Math.round(80 + (normalizedPosition * 2));
                                } else {
                                    normalizedMatch = 80;
                                }
                            }
                        }
                        
                        normalizedMatch = Math.max(80, Math.min(95, normalizedMatch));
                        
                        return res.json({
                            ...job.toObject(),
                            match: normalizedMatch,
                            matchScore: normalizedMatch,
                            isChatbotRecommended: foundJob.isChatbotRecommended || false
                        });
                    }
                    
                    // Fallback: Calculate match score if not found in recommendations
                    // (This should rarely happen, but provides a fallback)
                    // Variables chatbotTopCareers, chatbotCareerPath, userInterests, userLocation are already declared above
                    let fallbackMatchScore = 0;
                    let fallbackIsChatbotRecommended = false;
                    let fallbackChatbotMatchScore = null;
                    
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
                            fallbackIsChatbotRecommended = true;
                            fallbackChatbotMatchScore = Math.max(80, 95 - (careerIndex * 3));
                            fallbackMatchScore += 100;
                        }
                    });
                    
                    if (chatbotCareerPath.includes('Degree') && job.category === 'Degree-Based Career') fallbackMatchScore += 30;
                    if (chatbotCareerPath.includes('Arts') && job.category === 'Communication & Arts') fallbackMatchScore += 30;
                    if (chatbotCareerPath.includes('Skill') && job.category === 'Skill-Based Career') fallbackMatchScore += 30;
                    if (chatbotCareerPath.includes('Rural') && job.isRural) fallbackMatchScore += 35;
                    
                    if (userLocation?.state && job.state === userLocation.state) fallbackMatchScore += 20;
                    if (userLocation?.district && job.district === userLocation.district) fallbackMatchScore += 15;
                    
                    const matchingTags = job.tags.filter(tag => 
                        userInterests.some(interest => 
                            interest.toLowerCase().includes(tag.toLowerCase()) || 
                            tag.toLowerCase().includes(interest.toLowerCase())
                        )
                    );
                    fallbackMatchScore += matchingTags.length * 10;
                    
                    const stream = user.academicDetails?.stream12;
                    if (stream === 'Science' && job.tags.some(t => ['Tech', 'Coding', 'Data', 'AI'].includes(t))) fallbackMatchScore += 15;
                    if (stream === 'Commerce' && job.tags.some(t => ['Finance', 'Business', 'Banking'].includes(t))) fallbackMatchScore += 15;
                    if (stream === 'Arts' && job.tags.some(t => ['Design', 'Creative', 'Writing'].includes(t))) fallbackMatchScore += 15;
                    
                    let normalizedMatch = 85;
                    if (fallbackIsChatbotRecommended && fallbackChatbotMatchScore !== null) {
                        normalizedMatch = fallbackChatbotMatchScore;
                    } else if (fallbackMatchScore > 0) {
                        normalizedMatch = Math.max(80, Math.min(95, 80 + (fallbackMatchScore / 150) * 15));
                    }
                    
                    return res.json({
                        ...job.toObject(),
                        match: normalizedMatch,
                        matchScore: normalizedMatch,
                        isChatbotRecommended: fallbackIsChatbotRecommended
                    });
                }
            } catch (userError) {
                console.error('Error calculating match score:', userError);
            }
        }
        
        // Return job without match score if no email or user not found
        res.json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Create a job (Admin/Seed)
// @route   POST /api/jobs
// @access  Public (should be protected in production)
router.post('/', async (req, res) => {
    try {
        const job = await Job.create(req.body);
        res.status(201).json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
