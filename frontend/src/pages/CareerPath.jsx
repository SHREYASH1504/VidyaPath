import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import DashboardLayout from '../components/DashboardLayout';
import { Share2, Clock, Briefcase, TrendingUp, CheckCircle, Circle, Play } from 'lucide-react';

const CareerPath = () => {
    const { jobId } = useParams();
    const { t } = useTranslation();
    const { user } = useUser();
    const [jobData, setJobData] = useState(null);
    const [roadmapData, setRoadmapData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobData = async () => {
            if (jobId) {
                try {
                    // Get user email from Clerk
                    const userEmail = user?.primaryEmailAddress?.emailAddress || '';
                    
                    // Fetch job details with match score (if email available)
                    const jobUrl = userEmail 
                        ? `http://localhost:5000/api/jobs/${jobId}?email=${encodeURIComponent(userEmail)}`
                        : `http://localhost:5000/api/jobs/${jobId}`;
                    
                    const jobResponse = await fetch(jobUrl);
                    if (jobResponse.ok) {
                        const job = await jobResponse.json();
                        setJobData(job);

                        // Fetch roadmap for this job (with email for match score)
                        const roadmapUrl = userEmail 
                            ? `http://localhost:5000/api/roadmap/job/${jobId}?email=${encodeURIComponent(userEmail)}`
                            : `http://localhost:5000/api/roadmap/job/${jobId}`;
                        
                        const roadmapResponse = await fetch(roadmapUrl);
                        if (roadmapResponse.ok) {
                            const roadmap = await roadmapResponse.json();
                            setRoadmapData(roadmap);
                        } else {
                            // Create default roadmap structure from job data
                            const defaultRoadmap = createDefaultRoadmapFromJob(job);
                            // Use job's matchScore if available
                            if (job.matchScore) {
                                defaultRoadmap.match = job.matchScore;
                            }
                            setRoadmapData(defaultRoadmap);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching job data:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchJobData();
    }, [jobId, user]);

    const createDefaultRoadmapFromJob = (job) => {
        // Create roadmap steps based on job category
        let roadmapSteps = [];
        
        if (job.category === 'Rural') {
            if (job.tags?.some(t => t.includes('Teaching') || t.includes('Education'))) {
                roadmapSteps = [
                    { title: 'Complete 12th', subtitle: 'Any Stream', status: 'Pending', icon: '🎓', order: 1 },
                    { title: 'Get D.Ed/B.Ed', subtitle: 'Teaching Certificate', status: 'Pending', icon: '📜', order: 2 },
                    { title: 'Apply for Government Jobs', subtitle: 'Teacher Recruitment', status: 'Pending', icon: '📝', order: 3 },
                    { title: 'Start Teaching', subtitle: 'Primary/Secondary School', status: 'Pending', icon: '👨‍🏫', order: 4 }
                ];
            } else if (job.tags?.some(t => t.includes('Healthcare') || t.includes('Health'))) {
                roadmapSteps = [
                    { title: 'Complete 10th', subtitle: 'Basic Education', status: 'Pending', icon: '🎓', order: 1 },
                    { title: 'Get ANM/ASHA Training', subtitle: 'Health Worker Certificate', status: 'Pending', icon: '🏥', order: 2 },
                    { title: 'Apply for Health Centers', subtitle: 'Primary Health Center', status: 'Pending', icon: '📋', order: 3 },
                    { title: 'Start Health Services', subtitle: 'Community Health', status: 'Pending', icon: '💊', order: 4 }
                ];
            } else if (job.tags?.some(t => t.includes('Banking') || t.includes('Bank'))) {
                roadmapSteps = [
                    { title: 'Complete 12th', subtitle: 'Any Stream', status: 'Pending', icon: '🎓', order: 1 },
                    { title: 'Learn Banking Basics', subtitle: 'Financial Literacy', status: 'Pending', icon: '💰', order: 2 },
                    { title: 'Apply for Bank Exams', subtitle: 'RRB/Clerk Exams', status: 'Pending', icon: '📝', order: 3 },
                    { title: 'Start Banking Career', subtitle: 'Rural Bank Clerk', status: 'Pending', icon: '🏦', order: 4 }
                ];
            } else if (job.tags?.some(t => t.includes('Technical') || t.includes('Electrical') || t.includes('Mechanical'))) {
                roadmapSteps = [
                    { title: 'Complete 10th', subtitle: 'Basic Education', status: 'Pending', icon: '🎓', order: 1 },
                    { title: 'Get ITI Certificate', subtitle: 'Technical Training', status: 'Pending', icon: '🔧', order: 2 },
                    { title: 'Gain Practical Experience', subtitle: 'Apprenticeship', status: 'Pending', icon: '⚙️', order: 3 },
                    { title: 'Start Technical Career', subtitle: 'Electrician/Mechanic', status: 'Pending', icon: '🛠️', order: 4 }
                ];
            } else {
                roadmapSteps = [
                    { title: 'Complete Basic Education', subtitle: '10th/12th Pass', status: 'Pending', icon: '🎓', order: 1 },
                    { title: 'Get Required Training', subtitle: 'Skill Development', status: 'Pending', icon: '📚', order: 2 },
                    { title: 'Apply for Positions', subtitle: 'Job Applications', status: 'Pending', icon: '📝', order: 3 },
                    { title: 'Start Career', subtitle: job.title, status: 'Pending', icon: '🚀', order: 4 }
                ];
            }
        } else if (job.category === 'Degree-Based Career') {
            roadmapSteps = [
                { title: 'Complete 12th (Science)', subtitle: 'PCM/PCB Subjects', status: 'Pending', icon: '🎓', order: 1 },
                { title: 'Get Bachelor Degree', subtitle: 'B.Tech/B.Sc/B.Com', status: 'Pending', icon: '📚', order: 2 },
                { title: 'Build Skills', subtitle: 'Technical/Professional', status: 'Pending', icon: '⚡', order: 3 },
                { title: 'Get Internship', subtitle: 'Practical Experience', status: 'Pending', icon: '💼', order: 4 },
                { title: 'Start Full-Time Career', subtitle: job.title, status: 'Pending', icon: '🏆', order: 5 }
            ];
        } else if (job.category === 'Skill-Based Career') {
            roadmapSteps = [
                { title: 'Learn Fundamentals', subtitle: 'Basic Skills', status: 'Pending', icon: '📖', order: 1 },
                { title: 'Practice & Build Projects', subtitle: 'Hands-on Experience', status: 'Pending', icon: '🛠️', order: 2 },
                { title: 'Get Certifications', subtitle: 'Skill Validation', status: 'Pending', icon: '📜', order: 3 },
                { title: 'Start Career', subtitle: job.title, status: 'Pending', icon: '🚀', order: 4 }
            ];
        } else {
            roadmapSteps = [
                { title: 'Get Started', subtitle: 'Begin your journey', status: 'Pending', icon: '🚀', order: 1 },
                { title: 'Learn Skills', subtitle: 'Build Expertise', status: 'Pending', icon: '📚', order: 2 },
                { title: 'Gain Experience', subtitle: 'Practical Work', status: 'Pending', icon: '💼', order: 3 },
                { title: 'Achieve Career', subtitle: job.title, status: 'Pending', icon: '🏆', order: 4 }
            ];
        }
        
        // Normalize match score to 80-95 range
        let matchScore = job.matchScore || job.match;
        if (!matchScore || matchScore < 80 || matchScore > 95) {
            if (matchScore > 0) {
                matchScore = Math.max(80, Math.min(95, 80 + (matchScore / 100) * 15));
            } else {
                matchScore = 88; // Default to middle of range
            }
        }
        matchScore = Math.round(matchScore);
        
        return {
            jobTitle: job.title,
            description: job.description || "Your personalized roadmap to success.",
            tags: (job.tags || []).map(tag => ({ label: tag, icon: "📌" })),
            match: matchScore,
            stats: [
                { label: "AVG SALARY", value: job.salaryRange || "₹2L - ₹5L", icon: "💵" },
                { label: "LOCATION", value: job.location, icon: "📍" },
                { label: "TYPE", value: job.type, icon: "⏱️" },
                { label: "CATEGORY", value: job.category, icon: "💼" }
            ],
            roadmap: [
                { title: "Get Started", subtitle: "Begin your journey", status: "Pending", icon: "🚀", order: 1 }
            ],
            skills: (job.skills || []).slice(0, 3).map((skill, idx) => ({
                name: typeof skill === 'string' ? skill : skill.name || skill,
                level: "Essential",
                desc: "Required skill",
                icon: "📌",
                color: "text-blue-600",
                bg: "bg-blue-50",
                progress: 30 + (idx * 20)
            })),
            course: {
                title: "Career Fundamentals",
                desc: "Getting Started",
                mentor: "Career Coach",
                role: "Mentor",
                duration: "4 weeks",
                level: "Beginner"
            }
        };
    };

    // Mock Database for different career paths (fallback)
    const jobDatabase = {
        '1': { // Software Engineer
            title: "Software Engineer",
            description: "Design, develop, and test software applications for computers and mobile devices to solve real-world problems.",
            tags: [
                { label: "Science Stream", icon: "🔬" },
                { label: "High Demand", icon: "📈" },
                { label: "Remote Friendly", icon: "🌍" }
            ],
            match: 95,
            stats: [
                { label: "AVG SALARY", value: "₹12L - ₹18L", icon: "💵" },
                { label: "GROWTH", value: "+22% very high", icon: "↗️", highlight: true },
                { label: "DURATION", value: "4 Years degree", icon: "⏱️" },
                { label: "OPENINGS", value: "45k+ active jobs", icon: "💼" }
            ],
            roadmap: [
                { title: "Class 12 (Science)", subtitle: "PCM Subjects", status: "Completed", icon: "🎓" },
                { title: "B.Tech (CS/IT)", subtitle: "Undergraduate Degree", status: "In Progress", icon: "📚" },
                { title: "DSA & Algorithms", subtitle: "Core Foundation", status: "Pending", icon: "⚡" },
                { title: "Internship", subtitle: "Practical Experience", status: "Pending", icon: "💼" },
                { title: "Full-Time Role", subtitle: "Software Engineer", status: "Pending", icon: "🏆" }
            ],
            skills: [
                { name: "Java/C++", level: "Advanced", desc: "Core Logic Building", icon: "⚙️", color: "text-blue-600", bg: "bg-blue-50", progress: 75 },
                { name: "System Design", level: "Intermediate", desc: "Scalable Architecture", icon: "📐", color: "text-purple-600", bg: "bg-purple-50", progress: 40 },
                { name: "Databases", level: "Essential", desc: "SQL & NoSQL", icon: "🗄️", color: "text-orange-600", bg: "bg-orange-50", progress: 60 }
            ],
            course: { title: "Dsa Masterclass", desc: "Complete Guide to Algorithms", mentor: "Tanay Pratap", role: "SDE II @ Microsoft" }
        },
        '2': { // Frontend Developer
            title: "Frontend Developer",
            description: "Build the visual components of websites and web applications that users see and interact with.",
            tags: [
                { label: "Creative", icon: "🎨" },
                { label: "Tech", icon: "💻" },
                { label: "Remote", icon: "🏠" }
            ],
            match: 90,
            stats: [
                { label: "AVG SALARY", value: "₹8L - ₹15L", icon: "💵" },
                { label: "GROWTH", value: "+18% High", icon: "↗️", highlight: true },
                { label: "DURATION", value: "6-12 Months", icon: "⏱️" },
                { label: "OPENINGS", value: "30k+ active jobs", icon: "💼" }
            ],
            roadmap: [
                { title: "HTML/CSS/JS", subtitle: "Web Fundamentals", status: "Completed", icon: "🧱" },
                { title: "React/Vue", subtitle: "Modern Frameworks", status: "In Progress", icon: "⚛️" },
                { title: "Build Projects", subtitle: "Portfolio", status: "Pending", icon: "📂" },
                { title: "Freelancing", subtitle: "Initial Experience", status: "Pending", icon: "🤝" }
            ],
            skills: [
                { name: "ReactJS", level: "Advanced", desc: "Component Based UI", icon: "⚛️", color: "text-blue-600", bg: "bg-blue-50", progress: 80 },
                { name: "CSS/Tailwind", level: "Intermediate", desc: "Result Oriented Design", icon: "🎨", color: "text-pink-600", bg: "bg-pink-50", progress: 90 },
                { name: "JavaScript", level: "Essential", desc: "Interactivity", icon: "📜", color: "text-yellow-600", bg: "bg-yellow-50", progress: 70 }
            ],
            course: { title: "Frontend Professional", desc: "Master React & Modern CSS", mentor: "Akshay Saini", role: "SDE @ Uber" }
        },
        '3': { // Data Scientist
            title: "Data Scientist",
            description: "Analyze large data sets to find patterns and insights that help organizations make better decisions.",
            tags: [
                { label: "Analytical", icon: "📊" },
                { label: "Math", icon: "📐" },
                { label: "Tech", icon: "💻" }
            ],
            match: 92,
            stats: [
                { label: "AVG SALARY", value: "₹15L - ₹25L", icon: "💵" },
                { label: "GROWTH", value: "+30% High", icon: "↗️", highlight: true },
                { label: "DURATION", value: "12-18 Months", icon: "⏱️" },
                { label: "OPENINGS", value: "20k+ active jobs", icon: "💼" }
            ],
            roadmap: [
                { title: "Python/R", subtitle: "Programming Basics", status: "Completed", icon: "🐍" },
                { title: "Statistics", subtitle: "Math Fundamentals", status: "In Progress", icon: "📉" },
                { title: "Machine Learning", subtitle: "Predictive Models", status: "Pending", icon: "🤖" },
                { title: "Deep Learning", subtitle: "Advanced AI", status: "Pending", icon: "🧠" }
            ],
            skills: [
                { name: "Python", level: "Advanced", desc: "Data Manipulation", icon: "🐍", color: "text-green-600", bg: "bg-green-50", progress: 85 },
                { name: "SQL", level: "Advanced", desc: "Database Querying", icon: "🗄️", color: "text-blue-600", bg: "bg-blue-50", progress: 75 },
                { name: "Statistics", level: "Intermediate", desc: "Probability & Stats", icon: "📈", color: "text-purple-600", bg: "bg-purple-50", progress: 60 }
            ],
            course: { title: "Data Science A-Z", desc: "Machine Learning & AI", mentor: "Andrew Ng", role: "Co-founder @ Coursera" }
        },
        '4': { // Cyber Security Analyst
            title: "Cyber Security Analyst",
            description: "Protect computer networks and systems from cyber threats, attacks, and unauthorized access.",
            tags: [
                { label: "Security", icon: "🔒" },
                { label: "Tech", icon: "💻" },
                { label: "Critical", icon: "🚨" }
            ],
            match: 88,
            stats: [
                { label: "AVG SALARY", value: "₹10L - ₹20L", icon: "💵" },
                { label: "GROWTH", value: "+28% Very High", icon: "↗️", highlight: true },
                { label: "DURATION", value: "6-12 Months", icon: "⏱️" },
                { label: "OPENINGS", value: "15k+ active jobs", icon: "💼" }
            ],
            roadmap: [
                { title: "Networking", subtitle: "TCP/IP Basics", status: "Completed", icon: "🌐" },
                { title: "Linux", subtitle: "OS Administration", status: "In Progress", icon: "🐧" },
                { title: "Ethical Hacking", subtitle: "Penetration Testing", status: "Pending", icon: "🕵️" },
                { title: "Certifications", subtitle: "CEH / CISSP", status: "Pending", icon: "📜" }
            ],
            skills: [
                { name: "Networking", level: "Advanced", desc: "Network Protocols", icon: "🌐", color: "text-blue-600", bg: "bg-blue-50", progress: 80 },
                { name: "Linux", level: "Intermediate", desc: "Command Line", icon: "🐧", color: "text-gray-600", bg: "bg-gray-50", progress: 70 },
                { name: "Scripting", level: "Essential", desc: "Bash/Python", icon: "📜", color: "text-green-600", bg: "bg-green-50", progress: 50 }
            ],
            course: { title: "Complete Cyber Security", desc: "Zero to Hero Ethical Hacking", mentor: "Nathan House", role: "Cyber Security Expert" }
        },
        '5': { // Graphic Designer
            title: "Graphic Designer",
            description: "Create visual concepts to communicate ideas that inspire, inform, and captivate consumers.",
            tags: [
                { label: "Creative", icon: "🎨" },
                { label: "Design", icon: "✏️" },
                { label: "Visual", icon: "👁️" }
            ],
            match: 87, // Within 80-95 range
            stats: [
                { label: "AVG SALARY", value: "₹5L - ₹10L", icon: "💵" },
                { label: "GROWTH", value: "+10% Steady", icon: "↗️", highlight: true },
                { label: "DURATION", value: "3-6 Months", icon: "⏱️" },
                { label: "OPENINGS", value: "25k+ active jobs", icon: "💼" }
            ],
            roadmap: [
                { title: "Design Principles", subtitle: "Color Theory", status: "Completed", icon: "🎭" },
                { title: "Adobe Suite", subtitle: "Ps, Ai, Id", status: "In Progress", icon: "🖼️" },
                { title: "Portfolio", subtitle: "Showcase Work", status: "Pending", icon: "📂" },
                { title: "Freelancing", subtitle: "Client Projects", status: "Pending", icon: "🤝" }
            ],
            skills: [
                { name: "Photoshop", level: "Advanced", desc: "Image Editing", icon: "🖼️", color: "text-blue-600", bg: "bg-blue-50", progress: 90 },
                { name: "Illustrator", level: "Intermediate", desc: "Vector Graphics", icon: "✒️", color: "text-orange-600", bg: "bg-orange-50", progress: 75 },
                { name: "Creativity", level: "Expert", desc: "Visual Thinking", icon: "💡", color: "text-yellow-600", bg: "bg-yellow-50", progress: 95 }
            ],
            course: { title: "Graphic Design Masterclass", desc: "Learn Photoshop, Illustrator, InDesign", mentor: "Lindsay Marsh", role: "Designer & Instructor" }
        },
        '6': { // UX One
            title: "UX Researcher",
            description: "Conduct research to understand user behaviors, needs, and motivations to improve product design.",
            tags: [
                { label: "Research", icon: "🔍" },
                { label: "Psychology", icon: "🧠" },
                { label: "Tech", icon: "💻" }
            ],
            match: 82,
            stats: [
                { label: "AVG SALARY", value: "₹12L - ₹20L", icon: "💵" },
                { label: "GROWTH", value: "+20% High", icon: "↗️", highlight: true },
                { label: "DURATION", value: "6 Months", icon: "⏱️" },
                { label: "OPENINGS", value: "10k+ active jobs", icon: "💼" }
            ],
            roadmap: [
                { title: "User Research", subtitle: "Methodologies", status: "Completed", icon: "📝" },
                { title: "Prototyping", subtitle: "Wireframing", status: "In Progress", icon: "📐" },
                { title: "Usability Testing", subtitle: "Feedback Loop", status: "Pending", icon: "🔄" },
                { title: "Case Studies", subtitle: "Portfolio", status: "Pending", icon: "📂" }
            ],
            skills: [
                { name: "User Research", level: "Advanced", desc: "Interviews & Surveys", icon: "📝", color: "text-purple-600", bg: "bg-purple-50", progress: 85 },
                { name: "Wireframing", level: "Intermediate", desc: "Figma/Sketch", icon: "📐", color: "text-pink-600", bg: "bg-pink-50", progress: 70 },
                { name: "Analysis", level: "Essential", desc: "Data Interpretation", icon: "📊", color: "text-blue-600", bg: "bg-blue-50", progress: 60 }
            ],
            course: { title: "Google UX Design Cert", desc: "Complete UX Course", mentor: "Google", role: "Industry learder" }
        },
        '7': { // Content Strategist
            title: "Content Strategist",
            description: "Plan, develop, and manage content to achieve business goals and engage audiences.",
            tags: [
                { label: "Writing", icon: "✍️" },
                { label: "Strategy", icon: "🎯" },
                { label: "Marketing", icon: "📢" }
            ],
            match: 80,
            stats: [
                { label: "AVG SALARY", value: "₹10L - ₹18L", icon: "💵" },
                { label: "GROWTH", value: "+15% Steady", icon: "↗️", highlight: true },
                { label: "DURATION", value: "3-6 Months", icon: "⏱️" },
                { label: "OPENINGS", value: "12k+ active jobs", icon: "💼" }
            ],
            roadmap: [
                { title: "Writing Skills", subtitle: "Copywriting", status: "Completed", icon: "✍️" },
                { title: "SEO", subtitle: "Search Optimization", status: "In Progress", icon: "🔍" },
                { title: "Content Audit", subtitle: "Analysis", status: "Pending", icon: "📊" },
                { title: "Strategy", subtitle: "Planning", status: "Pending", icon: "🗺️" }
            ],
            skills: [
                { name: "Copywriting", level: "Advanced", desc: "Persuasive Writing", icon: "✍️", color: "text-blue-600", bg: "bg-blue-50", progress: 90 },
                { name: "SEO", level: "Intermediate", desc: "Keyword Research", icon: "🔍", color: "text-green-600", bg: "bg-green-50", progress: 70 },
                { name: "Analytics", level: "Essential", desc: "Performance Tracking", icon: "📈", color: "text-orange-600", bg: "bg-orange-50", progress: 60 }
            ],
            course: { title: "Content Marketing Masterclass", desc: "Create Content that Sells", mentor: "Brad Merrill", role: "Content Expert" }
        },
        '8': { // Product Manager
            title: "Product Manager",
            description: "Guide the success of a product and lead the cross-functional team that is responsible for improving it.",
            tags: [
                { label: "Leadership", icon: "👑" },
                { label: "Strategy", icon: "🎯" },
                { label: "Tech", icon: "💻" }
            ],
            match: 92, // Within 80-95 range
            stats: [
                { label: "AVG SALARY", value: "₹20L - ₹35L", icon: "💵" },
                { label: "GROWTH", value: "+25% High", icon: "↗️", highlight: true },
                { label: "DURATION", value: "6-12 Months", icon: "⏱️" },
                { label: "OPENINGS", value: "8k+ active jobs", icon: "💼" }
            ],
            roadmap: [
                { title: "Agile/Scrum", subtitle: "Methodologies", status: "Completed", icon: "🔄" },
                { title: "User Stories", subtitle: "Requirements", status: "In Progress", icon: "📝" },
                { title: "Roadmapping", subtitle: "Planning", status: "Pending", icon: "🗺️" },
                { title: "Launch", subtitle: "Go-to-Market", status: "Pending", icon: "🚀" }
            ],
            skills: [
                { name: "Leadership", level: "Advanced", desc: "Team Management", icon: "👑", color: "text-purple-600", bg: "bg-purple-50", progress: 85 },
                { name: "Strategic Thinking", level: "Advanced", desc: "Long-term Vision", icon: "🎯", color: "text-red-600", bg: "bg-red-50", progress: 80 },
                { name: "Communication", level: "Expert", desc: "Stakeholder Mgmt", icon: "🗣️", color: "text-blue-600", bg: "bg-blue-50", progress: 90 }
            ],
            course: { title: "Become a Product Manager", desc: "Learn the Skills & Get the Job", mentor: "Cole Mercer", role: "Senior PM @ Uber" }
        },
        '9': { // Financial Analyst
            title: "Financial Analyst",
            description: "Assess the performance of stocks, bonds, and other types of investments to guide businesses and individuals.",
            tags: [
                { label: "Finance", icon: "💰" },
                { label: "Math", icon: "🧮" },
                { label: "Analysis", icon: "📊" }
            ],
            match: 75,
            stats: [
                { label: "AVG SALARY", value: "₹6L - ₹12L", icon: "💵" },
                { label: "GROWTH", value: "+12% Steady", icon: "↗️", highlight: true },
                { label: "DURATION", value: "1-2 Years", icon: "⏱️" },
                { label: "OPENINGS", value: "18k+ active jobs", icon: "💼" }
            ],
            roadmap: [
                { title: "Accounting", subtitle: "Basics of Finance", status: "Completed", icon: "📒" },
                { title: "Excel", subtitle: "Modeling", status: "In Progress", icon: "📊" },
                { title: "Financial Modeling", subtitle: "Valuation", status: "Pending", icon: "📈" },
                { title: "CFA", subtitle: "Certification", status: "Pending", icon: "📜" }
            ],
            skills: [
                { name: "Excel", level: "Expert", desc: "Advanced Modeling", icon: "📊", color: "text-green-600", bg: "bg-green-50", progress: 95 },
                { name: "Accounting", level: "Intermediate", desc: "GAAP/IFRS", icon: "📒", color: "text-blue-600", bg: "bg-blue-50", progress: 70 },
                { name: "Analysis", level: "Advanced", desc: "Ratio Analysis", icon: "📉", color: "text-gray-600", bg: "bg-gray-50", progress: 80 }
            ],
            course: { title: "Complete Financial Analyst Course", desc: "Excel, Accounting, Financial Modeling", mentor: "365 Careers", role: "Finance Academy" }
        },
        '10': { // Digital Marketer
            title: "Digital Marketer",
            description: "Promote products or brands via one or more forms of electronic media.",
            tags: [
                { label: "Marketing", icon: "📢" },
                { label: "Social", icon: "📱" },
                { label: "Creative", icon: "🎨" }
            ],
            match: 88,
            stats: [
                { label: "AVG SALARY", value: "₹4L - ₹8L", icon: "💵" },
                { label: "GROWTH", value: "+22% High", icon: "↗️", highlight: true },
                { label: "DURATION", value: "3-6 Months", icon: "⏱️" },
                { label: "OPENINGS", value: "40k+ active jobs", icon: "💼" }
            ],
            roadmap: [
                { title: "Marketing Fund.", subtitle: "Basics", status: "Completed", icon: "📢" },
                { title: "Social Media", subtitle: "Content Creation", status: "In Progress", icon: "📱" },
                { title: "SEO/SEM", subtitle: "Traffic Growth", status: "Pending", icon: "🔍" },
                { title: "Analytics", subtitle: "Measurement", status: "Pending", icon: "📊" }
            ],
            skills: [
                { name: "Social Media", level: "Advanced", desc: "Platform Growth", icon: "📱", color: "text-blue-600", bg: "bg-blue-50", progress: 90 },
                { name: "SEO", level: "Intermediate", desc: "Ranking", icon: "🔍", color: "text-green-600", bg: "bg-green-50", progress: 70 },
                { name: "Content", level: "Advanced", desc: "Creation", icon: "✍️", color: "text-purple-600", bg: "bg-purple-50", progress: 80 }
            ],
            course: { title: "Google Digital Garage", desc: "Fundamentals of Digital Marketing", mentor: "Google", role: "Tech Giant" }
        },
        // Fallback or Generic
        'default': {
            title: "Career Path",
            description: "Your personalized roadmap to success based on your profile and interests.",
            tags: [],
            match: 0,
            stats: [],
            roadmap: [],
            skills: [],
            course: { title: "Career Fundamentals", desc: "Getting Started", mentor: "Career Coach", role: "Mentor" }
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="text-gray-500">Loading job details...</div>
                </div>
            </DashboardLayout>
        );
    }

    // Use backend data if available, otherwise fallback to mock data
    let currentData;
    if (jobData && roadmapData) {
        // Calculate match score - use from roadmap, job matchScore, or normalize to 80-95 range
        let matchScore = roadmapData.match || jobData.matchScore || jobData.match;
        
        // Ensure match score is between 80-95
        if (!matchScore || matchScore < 80 || matchScore > 95) {
            if (matchScore > 0) {
                // Normalize existing score to 80-95 range
                matchScore = Math.max(80, Math.min(95, 80 + (matchScore / 100) * 15));
            } else {
                matchScore = 88; // Default to middle of range
            }
        }
        matchScore = Math.round(matchScore);
        
        currentData = {
            title: jobData.title,
            description: roadmapData.description || jobData.description,
            tags: roadmapData.tags || (jobData.tags || []).map(tag => ({ label: tag, icon: "📌" })),
            match: matchScore,
            stats: roadmapData.stats || [
                { label: "AVG SALARY", value: jobData.salaryRange || "₹2L - ₹5L", icon: "💵" },
                { label: "LOCATION", value: jobData.location, icon: "📍" },
                { label: "TYPE", value: jobData.type, icon: "⏱️" },
                { label: "CATEGORY", value: jobData.category, icon: "💼" }
            ],
            roadmap: roadmapData.roadmap || [],
            skills: roadmapData.skills || (jobData.skills || []).slice(0, 3).map((skill, idx) => ({
                name: typeof skill === 'string' ? skill : skill.name || skill,
                level: "Essential",
                desc: "Required skill",
                icon: "📌",
                color: "text-blue-600",
                bg: "bg-blue-50",
                progress: 30 + (idx * 20)
            })),
            course: roadmapData.course || {
                title: "Career Fundamentals",
                desc: "Getting Started",
                mentor: "Career Coach",
                role: "Mentor"
            },
            jobDetails: jobData // Store full job details
        };
    } else {
        currentData = jobDatabase[jobId] || jobDatabase['1'];
    }

    // Normalize data structure for view
    const careerInfo = {
        title: currentData.title,
        description: currentData.description,
        tags: currentData.tags,
        match: currentData.match,
        stats: currentData.stats
    };

    const roadmapSteps = currentData.roadmap;
    const skillsToAcquire = currentData.skills;

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row gap-8 justify-between">
                    <div className="flex-1 space-y-4">

                        <h1 className="text-4xl font-extrabold text-gray-900">{careerInfo.title}</h1>
                        <p className="text-gray-600 max-w-2xl text-lg leading-relaxed">{careerInfo.description}</p>
                        
                        {/* Show job details if available */}
                        {currentData.jobDetails && (
                            <div className="mt-4 space-y-2">
                                {currentData.jobDetails.company && (
                                    <p className="text-gray-700"><strong>Company:</strong> {currentData.jobDetails.company}</p>
                                )}
                                {currentData.jobDetails.ruralDetails && (
                                    <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-100">
                                        <p className="text-sm text-gray-700"><strong>Village:</strong> {currentData.jobDetails.ruralDetails.village}</p>
                                        <p className="text-sm text-gray-700"><strong>Block:</strong> {currentData.jobDetails.ruralDetails.block}</p>
                                        <p className="text-sm text-gray-700"><strong>Panchayat:</strong> {currentData.jobDetails.ruralDetails.panchayat}</p>
                                        <p className="text-sm text-gray-700"><strong>Accessibility:</strong> {currentData.jobDetails.ruralDetails.accessibility}</p>
                                    </div>
                                )}
                                {currentData.jobDetails.requirements && currentData.jobDetails.requirements.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-sm font-semibold text-gray-900 mb-1">Requirements:</p>
                                        <ul className="list-disc list-inside text-sm text-gray-600">
                                            {currentData.jobDetails.requirements.map((req, idx) => (
                                                <li key={idx}>{req}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 flex-wrap">
                            {careerInfo.tags.map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 shadow-sm">
                                    <span>{tag.icon}</span> {tag.label}
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors">
                                <Share2 size={18} /> {t('cp_share')}
                            </button>
                        </div>
                    </div>

                    {/* Career Match Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full lg:w-80 flex-shrink-0">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{t('cp_career_match')}</h3>
                                <p className="text-xs text-gray-500">{t('cp_based_on')}</p>
                            </div>
                            <span className="text-3xl font-black text-gray-900">{careerInfo.match}<span className="text-base font-normal text-gray-400">%</span></span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-[#00e572] rounded-full" style={{ width: `${careerInfo.match}%` }}></div>
                        </div>
                        <div className="bg-green-50 text-green-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2 font-medium">
                            <CheckCircle size={14} /> {t('cp_excellent_fit')}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {careerInfo.stats.map((stat, idx) => {
                        const statLabelMap = {
                            "AVG SALARY": "cp_avg_salary",
                            "GROWTH": "cp_growth",
                            "DURATION": "cp_duration",
                            "OPENINGS": "cp_openings"
                        };
                        return (
                            <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    <span>{stat.icon}</span> {t(statLabelMap[stat.label] || stat.label)}
                                </div>
                                <div className={`text-xl font-bold ${stat.highlight ? 'text-green-600' : 'text-gray-900'}`}>{stat.value}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Education Roadmap */}
                {roadmapSteps && roadmapSteps.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">{t('cp_edu_roadmap')}</h2>
                            <span className="text-gray-500 text-sm flex items-center gap-2">
                                <Circle size={12} fill="currentColor" className="text-gray-300" /> {t('cp_typical_path')}
                            </span>
                        </div>

                        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm relative overflow-x-auto">
                            <div className="flex justify-between items-start min-w-[800px] relative">
                                {/* Connecting Line */}
                                <div className="absolute top-8 left-10 right-10 h-1 bg-gray-100 -z-0"></div>

                                {roadmapSteps.map((step, idx) => {
                                    const isCompleted = step.status === "Completed";
                                    const isInProgress = step.status === "In Progress";

                                    return (
                                        <div key={idx} className="relative z-10 flex flex-col items-center text-center group w-1/5">
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-4 border-4 transition-transform group-hover:scale-110 shadow-sm
                                                ${isCompleted ? 'bg-[#00e572] border-white text-white' :
                                                    isInProgress ? 'bg-white border-[#00e572] text-[#00e572]' : 'bg-gray-50 border-white text-gray-300'}`}>
                                                {step.icon || '📌'}
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1">{step.title || `Step ${idx + 1}`}</h3>
                                            <p className="text-xs text-gray-500 mb-3">{step.subtitle || ''}</p>

                                            {isCompleted && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Completed</span>}
                                            {isInProgress && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">In Progress</span>}
                                            {!isCompleted && !isInProgress && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Pending</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* Key Skills - Full Width */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{t('cp_key_skills')}</h2>
                        <button className="text-[#00e572] font-bold text-sm hover:underline">{t('cp_view_all_skills')}</button>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {skillsToAcquire.map((skill, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${skill.bg || 'bg-blue-50'}`}>
                                        {skill.icon || '📌'}
                                    </div>
                                    <span className="text-xs font-semibold bg-gray-50 text-gray-500 px-2 py-1 rounded border border-gray-100">{skill.level || 'Essential'}</span>
                                </div>
                                <h3 className="font-bold text-gray-900">{skill.name}</h3>
                                <p className="text-xs text-gray-500 mb-3">{skill.desc || 'Required skill'}</p>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${(skill.color || 'text-blue-600').replace('text', 'bg')}`} style={{ width: `${skill.progress || 50}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};

export default CareerPath;
