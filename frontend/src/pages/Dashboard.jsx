import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import { TrendingUp, Brain, ArrowRight, RefreshCcw, Bookmark } from 'lucide-react';

const Dashboard = () => {
    const { user } = useUser();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.primaryEmailAddress?.emailAddress) {
                try {
                    const email = user.primaryEmailAddress.emailAddress;
                    // Fetch user data
                    const userResponse = await fetch(`http://localhost:5000/api/users/${email}`);
                    if (userResponse.ok) {
                        const data = await userResponse.json();
                        setUserData(data);
                    }

                    // Fetch recommended jobs
                    const jobsResponse = await fetch(`http://localhost:5000/api/jobs/recommendations/${email}`);
                    if (jobsResponse.ok) {
                        const jobsData = await jobsResponse.json();
                        console.log("Dashboard recommended jobs:", jobsData);
                        setRecommendedJobs(jobsData || []);
                    } else {
                        console.error("Failed to fetch recommended jobs for dashboard");
                        setRecommendedJobs([]);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUserData();
    }, [user]);

    // Dynamic Interest Analysis based on skills, interests, academic data, and chatbot career path
    const getInterestStats = () => {
        if (!userData) return [
            { label: 'Technology', percentage: 45, color: '#00e572' },
            { label: 'Creative', percentage: 30, color: '#3b82f6' },
            { label: 'Social', percentage: 25, color: '#f59e0b' }
        ];

        const scores = { 'Technology': 0, 'Creative': 0, 'Business': 0, 'Social': 0, 'Rural': 0 };

        // 1. Analyze Stream (Academic Background)
        const stream = userData.academicDetails?.stream12;
        if (stream === 'Science') scores['Technology'] += 25;
        if (stream === 'Commerce') scores['Business'] += 25;
        if (stream === 'Arts') { scores['Creative'] += 15; scores['Social'] += 15; }

        // 2. Analyze Graduation (Degree/Field)
        const degree = userData.graduationDetails?.field || userData.graduationDetails?.specialization || '';
        if (degree) {
            if (degree.match(/B.Tech|B.E|B.Sc|Diploma|Computer|Engineering|Technical|IT/)) scores['Technology'] += 20;
            if (degree.match(/B.Com|BBA|Management|Business|Finance|Account/)) scores['Business'] += 20;
            if (degree.match(/B.A|Arts|Design|Fine Arts|Literature/)) { scores['Creative'] += 15; scores['Social'] += 5; }
            if (degree.match(/Education|Teaching|B.Ed|D.Ed/)) scores['Social'] += 20;
            if (degree.match(/Agriculture|Farming|Rural/)) { scores['Rural'] += 25; scores['Technology'] += 5; }
        }

        // 3. Analyze Selected Interests
        const interests = userData.interests?.selectedInterests || [];
        interests.forEach(i => {
            const interest = i.toLowerCase();
            if (['coding', 'robotics', 'web dev', 'data science', 'gaming', 'research', 'lab work', 'analysis', 'mathematics', 'physics', 'statistics', 'cyber security', 'ai/ml', 'programming', 'tech'].includes(interest)) {
                scores['Technology'] += 12;
            }
            if (['art', 'design', 'music', 'writing', 'reading', 'photography', 'videography', 'animation', 'film making', 'cooking', 'creative', 'drawing', 'painting'].includes(interest)) {
                scores['Creative'] += 12;
            }
            if (['finance', 'accounting', 'business', 'management', 'marketing', 'entrepreneurship', 'economics', 'stock market', 'investing', 'sales'].includes(interest)) {
                scores['Business'] += 12;
            }
            if (['history', 'politics', 'social work', 'travel', 'public speaking', 'teaching', 'volunteering', 'hr', 'law', 'gardening', 'fitness', 'health', 'community'].includes(interest)) {
                scores['Social'] += 12;
            }
            if (['agriculture', 'farming', 'rural', 'extension', 'field work'].includes(interest)) {
                scores['Rural'] += 15;
            }
        });

        // 4. Analyze Subject Scores (Strong Subjects)
        const subjects = userData.interests?.subjectLikes || {};
        Object.entries(subjects).forEach(([sub, score]) => {
            const subject = sub.toLowerCase();
            if (score >= 7) { // Strong preference
                if (['mathematics', 'physics', 'chemistry', 'biology', 'programming', 'computer', 'science'].includes(subject)) {
                    scores['Technology'] += 8;
                }
                if (['accounts', 'economics', 'business studies', 'commerce'].includes(subject)) {
                    scores['Business'] += 8;
                }
                if (['history', 'politics', 'sociology', 'geography'].includes(subject)) {
                    scores['Social'] += 8;
                }
                if (['english', 'art', 'music', 'drawing'].includes(subject)) {
                    scores['Creative'] += 8;
                }
            }
        });

        // 5. Analyze Strengths (Skills)
        const strengths = userData.interests?.strengths || [];
        strengths.forEach(strength => {
            const skill = strength.toLowerCase();
            if (['coding', 'programming', 'analytical', 'problem solving', 'logical', 'technical', 'math', 'science', 'research'].includes(skill)) {
                scores['Technology'] += 10;
            }
            if (['creative', 'artistic', 'design', 'writing', 'imagination', 'innovation'].includes(skill)) {
                scores['Creative'] += 10;
            }
            if (['leadership', 'management', 'business', 'negotiation', 'finance', 'organization'].includes(skill)) {
                scores['Business'] += 10;
            }
            if (['communication', 'teaching', 'social', 'empathy', 'helping', 'caring', 'community'].includes(skill)) {
                scores['Social'] += 10;
            }
            if (['field work', 'agriculture', 'rural', 'hands-on', 'practical'].includes(skill)) {
                scores['Rural'] += 12;
            }
        });

        // 6. Analyze Work Style Preferences
        const workStyle = userData.interests?.workStyle || '';
        if (workStyle) {
            const style = workStyle.toLowerCase();
            if (style.includes('indoor') || style.includes('desk') || style.includes('office')) {
                scores['Technology'] += 5;
                scores['Business'] += 5;
            }
            if (style.includes('creative') || style.includes('flexible')) {
                scores['Creative'] += 8;
            }
            if (style.includes('social') || style.includes('people') || style.includes('community')) {
                scores['Social'] += 8;
            }
            if (style.includes('outdoor') || style.includes('field') || style.includes('rural')) {
                scores['Rural'] += 10;
            }
        }

        // 7. Analyze Chatbot Career Path Recommendation
        const careerPath = userData.chatbotData?.careerPath || '';
        if (careerPath) {
            const path = careerPath.toLowerCase();
            if (path.includes('technology') || path.includes('tech') || path.includes('degree-based') || path.includes('engineering')) {
                scores['Technology'] += 20;
            }
            if (path.includes('creative') || path.includes('arts') || path.includes('communication')) {
                scores['Creative'] += 20;
            }
            if (path.includes('business') || path.includes('commerce') || path.includes('finance')) {
                scores['Business'] += 20;
            }
            if (path.includes('social') || path.includes('teaching') || path.includes('health')) {
                scores['Social'] += 20;
            }
            if (path.includes('skill-based') || path.includes('rural') || path.includes('agriculture')) {
                scores['Rural'] += 25;
            }
        }

        // 8. Analyze Location (Rural Preference)
        const location = userData.location;
        if (location?.district || location?.state) {
            // If user is in a rural area or prefers rural jobs, boost rural score
            scores['Rural'] += 10;
        }

        // 9. Analyze Recommended Jobs (if available)
        if (recommendedJobs && recommendedJobs.length > 0) {
            recommendedJobs.slice(0, 5).forEach(job => {
                const jobTitle = (job.title || '').toLowerCase();
                const jobTags = (job.tags || []).map(t => t.toLowerCase());
                const allJobText = jobTitle + ' ' + jobTags.join(' ');
                
                if (allJobText.includes('tech') || allJobText.includes('computer') || allJobText.includes('software')) {
                    scores['Technology'] += 5;
                }
                if (allJobText.includes('creative') || allJobText.includes('design') || allJobText.includes('art')) {
                    scores['Creative'] += 5;
                }
                if (allJobText.includes('bank') || allJobText.includes('finance') || allJobText.includes('business')) {
                    scores['Business'] += 5;
                }
                if (allJobText.includes('teacher') || allJobText.includes('health') || allJobText.includes('social')) {
                    scores['Social'] += 5;
                }
                if (allJobText.includes('rural') || allJobText.includes('agriculture') || allJobText.includes('extension')) {
                    scores['Rural'] += 8;
                }
            });
        }

        // Calculate Total
        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        if (total === 0) return [{ label: 'General', percentage: 100, color: '#00e572' }];

        // Colors - Include Rural as a category
        const colorMap = { 
            'Technology': '#00e572', 
            'Creative': '#3b82f6', 
            'Business': '#f59e0b', 
            'Social': '#a855f7',
            'Rural': '#22c55e'
        };

        // Convert to Array, Sort, and Normalize
        // Map Rural to Social if Rural score is high, or keep separate
        const interestStats = Object.entries(scores)
            .map(([label, score]) => ({ 
                label, 
                percentage: (score / total) * 100, 
                color: colorMap[label] || '#00e572' 
            }))
            .filter(item => item.percentage > 5) // Only show significant categories (above 5%)
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 3) // Top 3 categories
            .map(item => ({ ...item, percentage: Math.round(item.percentage) }));

        // Ensure percentages sum to 100 (normalize)
        const sum = interestStats.reduce((acc, item) => acc + item.percentage, 0);
        if (sum !== 100 && interestStats.length > 0) {
            const diff = 100 - sum;
            interestStats[0].percentage += diff; // Add difference to top category
        }

        return interestStats.length > 0 ? interestStats : [{ label: 'General', percentage: 100, color: '#00e572' }];
    };

    const getTopMatches = () => {
        // Use recommended jobs from backend
        if (recommendedJobs && recommendedJobs.length > 0) {
            return recommendedJobs.slice(0, 3).map(job => {
                // Use match score from backend (should be between 80-95 after normalization)
                let matchScore = job.match || job.matchScore;
                
                // Ensure match score is between 80-95 (safety check)
                if (!matchScore || matchScore < 80 || matchScore > 95) {
                    // Default to a range based on position: first job 93, second 88, third 83
                    const defaults = [93, 88, 83];
                    const index = recommendedJobs.indexOf(job);
                    matchScore = defaults[index] || 85;
                }
                
                return {
                    title: job.title,
                    match: Math.round(matchScore), // Ensure it's an integer
                    tags: job.tags || [],
                    id: job.id || job._id,
                    company: job.company,
                    location: job.location
                };
            });
        }
        // Return empty array if no jobs yet (don't show fallback)
        return [];
    };

    const getSkillGaps = () => {
        if (!userData || !recommendedJobs || recommendedJobs.length === 0) {
            return [
                { name: 'Advanced Communication', current: 60, target: 90 },
                { name: 'Technical Proficiency', current: 40, target: 80 },
                { name: 'Project Management', current: 30, target: 75 }
            ];
        }

        // Get top recommended job
        const topJob = recommendedJobs[0];
        const userSkills = userData.interests?.strengths || [];
        const userSubjectScores = userData.interests?.subjectLikes || {};
        
        // Get required skills from job
        const requiredSkills = topJob.skills || [];
        
        // Compare user skills with required skills
        const skillGaps = requiredSkills.slice(0, 3).map((skill, index) => {
            const skillName = typeof skill === 'string' ? skill : skill.name || skill;
            // Check if user has this skill
            const hasSkill = userSkills.some(us => 
                us.toLowerCase().includes(skillName.toLowerCase()) || 
                skillName.toLowerCase().includes(us.toLowerCase())
            );
            
            // Calculate current level based on subject scores or default
            let current = 40;
            if (hasSkill) current = 70;
            if (userSubjectScores[skillName]) {
                current = Math.min(90, (userSubjectScores[skillName] / 10) * 100);
            }
            
            return {
                name: skillName,
                current: Math.round(current),
                target: 85
            };
        });

        return skillGaps.length > 0 ? skillGaps : [
            { name: 'Advanced Communication', current: 60, target: 90 },
            { name: 'Technical Proficiency', current: 40, target: 80 },
            { name: 'Project Management', current: 30, target: 75 }
        ];
    };

    const getSkillsToImprove = () => {
        // Based on subject scores < 7 or defaults
        const weakSubjects = Object.entries(userData?.interests?.subjectLikes || {})
            .filter(([_, score]) => score < 7)
            .map(([subject]) => subject);

        return weakSubjects.length > 0 ? weakSubjects : ['Public Speaking', 'Critical Thinking', 'Time Management'];
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    const topMatches = getTopMatches();
    const skillGaps = getSkillGaps();
    const skillsToImprove = getSkillsToImprove();
    const interests = userData?.interests?.selectedInterests || [];
    const interestStats = getInterestStats();

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">

                {/* Welcome Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        {t('dashboard_welcome', { name: user?.firstName || 'Student' })} <span className="inline-block hover:rotate-12 transition-transform origin-bottom-right">👋</span>
                    </h1>
                    <p className="text-gray-500 mt-2">Here is your career progress update.</p>
                </div>

                {/* Hero Card - Top Match */}
                {!loading && topMatches.length > 0 && (
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 relative">
                        {/* Chatbot Recommended Badge */}
                        {recommendedJobs[0]?.isChatbotRecommended && (
                            <div className="absolute top-6 right-6 bg-[#00e572] text-white text-xs font-bold px-4 py-2 rounded-full z-10 flex items-center gap-2 shadow-lg">
                                <span>🤖</span> AI Recommended
                            </div>
                        )}
                        {/* Image Section */}
                        <div className="w-full md:w-1/3 bg-gray-900 rounded-2xl h-64 relative overflow-hidden group">
                            {(() => {
                                // Get image based on job title - comprehensive mapping for all rural jobs
                                const jobTitle = topMatches[0].title?.toLowerCase() || '';
                                let imageUrl = 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?q=80&w=3540&auto=format&fit=crop'; // Default career image
                                
                                // Teaching & Education
                                if (jobTitle.includes('teacher') || jobTitle.includes('teaching') || jobTitle.includes('anganwadi')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=3024&auto=format&fit=crop';
                                }
                                // Healthcare & Medical
                                else if (jobTitle.includes('health') || jobTitle.includes('nurse') || jobTitle.includes('asha') || jobTitle.includes('anm')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?q=80&w=3024&auto=format&fit=crop';
                                }
                                // Banking & Finance
                                else if (jobTitle.includes('bank') || jobTitle.includes('finance') || jobTitle.includes('clerk')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2940&auto=format&fit=crop';
                                }
                                // Agriculture & Farming
                                else if (jobTitle.includes('agriculture') || jobTitle.includes('extension') || jobTitle.includes('farmer') || jobTitle.includes('dairy')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2940&auto=format&fit=crop';
                                }
                                // Electrical Work
                                else if (jobTitle.includes('electrician') || jobTitle.includes('electrical')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=2969&auto=format&fit=crop';
                                }
                                // Mechanical & Automotive
                                else if (jobTitle.includes('mechanic') || jobTitle.includes('mechanical') || jobTitle.includes('tractor') || jobTitle.includes('auto')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=2874&auto=format&fit=crop';
                                }
                                // Computer & Technology
                                else if (jobTitle.includes('computer') || jobTitle.includes('operator') || jobTitle.includes('software') || jobTitle.includes('developer')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2940&auto=format&fit=crop';
                                }
                                // Handicraft & Artisan Work
                                else if (jobTitle.includes('tailor') || jobTitle.includes('handicraft') || jobTitle.includes('artisan')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1583168567779-ccb0b8b31b56?q=80&w=2940&auto=format&fit=crop';
                                }
                                // Photography
                                else if (jobTitle.includes('photographer') || jobTitle.includes('photography')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2942&auto=format&fit=crop';
                                }
                                // Transportation & Delivery
                                else if (jobTitle.includes('driver') || jobTitle.includes('transport') || jobTitle.includes('postman') || jobTitle.includes('delivery')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2969&auto=format&fit=crop';
                                }
                                // Carpentry & Woodwork
                                else if (jobTitle.includes('carpenter') || jobTitle.includes('carpentry')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=2874&auto=format&fit=crop';
                                }
                                // Marketing & Sales
                                else if (jobTitle.includes('marketing') || jobTitle.includes('sales') || jobTitle.includes('executive')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2915&auto=format&fit=crop';
                                }
                                // Government & Administration
                                else if (jobTitle.includes('panchayat') || jobTitle.includes('secretary') || jobTitle.includes('administrator')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2940&auto=format&fit=crop';
                                }
                                // Retail & Business
                                else if (jobTitle.includes('shopkeeper') || jobTitle.includes('store') || jobTitle.includes('retail')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2940&auto=format&fit=crop';
                                }
                                // Utility & Infrastructure
                                else if (jobTitle.includes('water') || jobTitle.includes('supply') || jobTitle.includes('operator')) {
                                    imageUrl = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2940&auto=format&fit=crop';
                                }
                                
                                return (
                                    <img
                                        src={imageUrl}
                                        alt={topMatches[0].title || "Career"}
                                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                                    />
                                );
                            })()}
                            <div className="absolute bottom-4 left-4 bg-[#00e572] text-[#061e12] text-xs font-bold px-3 py-1.5 rounded-full">
                                #1 Recommendation
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 flex flex-col justify-center py-2">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{topMatches[0].title}</h2>
                                    <p className="text-gray-500 max-w-md">
                                        Based on your high {interests.slice(0, 2).join(' & ')} scores.
                                    </p>
                                </div>
                                <div className="bg-green-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-green-100">
                                    <div className="relative w-12 h-12 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#eee"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#00e572"
                                                strokeWidth="3"
                                                strokeDasharray={`${topMatches[0].match}, 100`}
                                            />
                                        </svg>
                                        <span className="absolute text-xs font-bold text-[#00e572]">{topMatches[0].match}%</span>
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-bold text-gray-900">{t('cp_excellent_fit')}</p>
                                        <p className="text-gray-500">Top 5% in your region</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={() => {
                                        if (topMatches[0]?.id) {
                                            navigate(`/roadmap/${topMatches[0].id}`);
                                        } else {
                                            navigate('/recommendations');
                                        }
                                    }}
                                    className="bg-[#00e572] hover:bg-[#00c462] text-[#061e12] px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-green-200"
                                >
                                    {t('view_career_roadmap')} <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Grid Section */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Interest Summary */}
                    <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Brain className="text-[#00e572]" size={24} /> {t('interest_summary')}
                            </h3>
                        </div>

                        <div className="flex items-center gap-8">
                            {/* Dynamic Donut Chart */}
                            <div className="relative w-40 h-40 rounded-full" style={{
                                background: `conic-gradient(
                                    ${interestStats[0]?.color} 0% ${interestStats[0]?.percentage}%, 
                                    ${interestStats[1]?.color || interestStats[0]?.color} ${interestStats[0]?.percentage}% ${interestStats[0]?.percentage + (interestStats[1]?.percentage || 0)}%, 
                                    ${interestStats[2]?.color || interestStats[0]?.color} ${interestStats[0]?.percentage + (interestStats[1]?.percentage || 0)}% 100%
                                )`
                            }}>
                                <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center z-10">
                                    <span className="text-gray-400 text-xs font-medium">Dominant</span>
                                    <span className="text-gray-900 font-bold text-lg">{interestStats[0]?.label || 'General'}</span>
                                </div>
                            </div>

                            <div className="space-y-3 flex-1">
                                {interestStats.map((stat, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }}></div>
                                        <span className="text-gray-600">{stat.label} ({stat.percentage}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Skill Gaps */}
                    <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="text-orange-500" size={24} /> {t('skill_gaps')}
                            </h3>
                            <button
                                onClick={() => navigate('/recommendations')}
                                className="text-[#00e572] text-sm font-semibold hover:underline"
                            >
                                {t('find_courses')}
                            </button>
                        </div>

                        <div className="space-y-6">
                            {skillGaps.map((skill, index) => (
                                <div key={index}>
                                    <div className="flex justify-between text-sm mb-2 font-medium">
                                        <span className="text-gray-900">{skill.name}</span>
                                        <div className="text-xs text-gray-400 flex gap-4">
                                            <span>Current: Intermediate</span>
                                            <span>Target: Advanced</span>
                                        </div>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-blue-500' : 'bg-[#00e572]'}`}
                                            style={{ width: `${skill.current}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Courses Based on Skill Gaps */}
                <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Bookmark className="text-blue-500" size={24} /> Recommended Courses
                        </h3>
                        <button
                            onClick={() => navigate('/recommendations')}
                            className="text-[#00e572] text-sm font-semibold hover:underline"
                        >
                            View All Courses →
                        </button>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                        {skillGaps.map((skill, idx) => {
                            const courseTitles = {
                                'Advanced Communication': 'Communication Mastery Course',
                                'Technical Proficiency': 'Technical Skills Bootcamp',
                                'Project Management': 'Project Management Fundamentals',
                                'Communication': 'Effective Communication Skills',
                                'Banking': 'Banking & Finance Basics',
                                'Customer Service': 'Customer Service Excellence',
                                'Computer Skills': 'Computer Fundamentals',
                                'Teaching': 'Teaching Methodology',
                                'Healthcare': 'Basic Healthcare Training',
                                'Agricultural Knowledge': 'Agricultural Extension Training',
                                'Electrical Work': 'Electrical Engineering Basics',
                                'Mechanical Repair': 'Mechanical Engineering Fundamentals'
                            };
                            
                            const courseDescriptions = {
                                'Advanced Communication': 'Master professional communication, public speaking, and interpersonal skills.',
                                'Technical Proficiency': 'Build technical expertise in your chosen field with hands-on projects.',
                                'Project Management': 'Learn project planning, execution, and team management skills.',
                                'Communication': 'Improve your communication skills for better career opportunities.',
                                'Banking': 'Learn banking operations, financial management, and customer service.',
                                'Customer Service': 'Excel in customer interactions and service delivery.',
                                'Computer Skills': 'Master computer basics, MS Office, and digital literacy.',
                                'Teaching': 'Learn effective teaching methods and classroom management.',
                                'Healthcare': 'Understand basic healthcare, first aid, and patient care.',
                                'Agricultural Knowledge': 'Learn modern agricultural practices and extension work.',
                                'Electrical Work': 'Master electrical systems, safety, and troubleshooting.',
                                'Mechanical Repair': 'Learn mechanical systems, repair, and maintenance.'
                            };

                            const courseTitle = courseTitles[skill.name] || `${skill.name} Course`;
                            const courseDesc = courseDescriptions[skill.name] || `Learn ${skill.name} to bridge your skill gap and advance your career.`;

                            return (
                                <div key={idx} className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => navigate('/recommendations')}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                                            📚
                                        </div>
                                        <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded">
                                            Gap: {skill.target - skill.current}%
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-2">{courseTitle}</h4>
                                    <p className="text-sm text-gray-600 mb-4">{courseDesc}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">4-8 weeks</span>
                                        <span className="text-xs font-semibold text-blue-600">View Course →</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Bottom Actions */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Retake Survey - Full Width or Half if Resume Chat was there */}
                    <button
                        onClick={() => navigate('/onboarding?retake=true')}
                        className="bg-purple-50 hover:bg-purple-100 p-6 rounded-2xl border border-purple-100 flex items-center gap-4 transition-colors text-left group w-full"
                    >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-purple-600 shadow-sm group-hover:scale-110 transition-transform">
                            <RefreshCcw size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">{t('retake_survey')}</h4>
                            <p className="text-sm text-gray-500">{t('retake_survey_desc')}</p>
                        </div>
                    </button>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
