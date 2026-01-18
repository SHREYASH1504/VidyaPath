import jsPDF from 'jspdf';

export const generateDashboardPDF = async (userData, recommendedJobs, userInfo) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace = 10) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
            doc.addPage();
            yPosition = 20;
            return true;
        }
        return false;
    };

    // Helper function to clean text and remove gibberish
    const cleanText = (text) => {
        if (!text) return '';
        // Convert to string
        let cleaned = String(text);
        // Remove MongoDB ObjectIds (24 character hex strings)
        cleaned = cleaned.replace(/\b[0-9a-f]{24}\b/gi, '');
        // Remove undefined, null, [object Object] strings
        cleaned = cleaned.replace(/undefined|null|\[object Object\]/gi, '');
        // Remove excessive whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        // Remove special control characters but keep normal punctuation
        cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
        return cleaned;
    };

    // Helper function to add text with word wrap
    const addText = (text, x, y, maxWidth, fontSize = 10, fontStyle = 'normal', color = [0, 0, 0]) => {
        const cleanedText = cleanText(text);
        if (!cleanedText) return 0;
        
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(cleanedText, maxWidth);
        doc.text(lines, x, y);
        return lines.length * (fontSize * 0.35); // Approximate line height
    };

    // Helper function to add a section title
    const addSectionTitle = (title) => {
        checkPageBreak(15);
        yPosition += 10;
        const height = addText(title, margin, yPosition, contentWidth, 16, 'bold', [10, 229, 114]);
        yPosition += height + 5;
        // Add underline
        doc.setDrawColor(10, 229, 114);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
        yPosition += 5;
    };

    // Helper function to add a subsection
    const addSubSection = (title) => {
        checkPageBreak(12);
        yPosition += 8;
        const height = addText(title, margin, yPosition, contentWidth, 12, 'bold', [0, 0, 0]);
        yPosition += height + 3;
    };

    // Cover Page
    doc.setFillColor(10, 229, 114);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('VidyaPath', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(20);
    doc.text('Career Summary Report', pageWidth / 2, 45, { align: 'center' });
    
    yPosition = 80;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Generated for: ${userInfo?.fullName || userData?.email || 'User'}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition = 120;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text('This report contains your personalized career insights, recommended jobs,', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text('skill gaps, and detailed roadmaps for each recommended career path.', pageWidth / 2, yPosition, { align: 'center' });

    // Start content pages
    doc.addPage();
    yPosition = 20;

    // 1. Personal Information Section
    addSectionTitle('Personal Information');
    
    if (userData) {
        const personalInfo = [];
        if (userData.location) {
            const locationParts = [
                cleanText(userData.location.locality),
                cleanText(userData.location.district),
                cleanText(userData.location.state)
            ].filter(Boolean);
            if (locationParts.length > 0) {
                personalInfo.push(`Location: ${locationParts.join(', ')}`);
            }
        }
        const email = cleanText(userData.email || userInfo?.primaryEmailAddress?.emailAddress);
        if (email && email.includes('@')) {
            personalInfo.push(`Email: ${email}`);
        }
        
        personalInfo.forEach(info => {
            if (info && cleanText(info)) {
                checkPageBreak(7);
                addText(`• ${info}`, margin, yPosition, contentWidth, 10);
                yPosition += 7;
            }
        });
    }

    // 2. Academic Background
    addSectionTitle('Academic Background');
    
    if (userData?.academicDetails) {
        const academic = userData.academicDetails;
        const academicInfo = [];
        
        const board10 = cleanText(academic.board10);
        if (board10) {
            academicInfo.push(`10th Board: ${board10}`);
        }
        const year10 = cleanText(academic.year10);
        if (year10) {
            academicInfo.push(`10th Year: ${year10}`);
        }
        const percentage10 = cleanText(academic.percentage10);
        if (percentage10) {
            academicInfo.push(`10th Percentage: ${percentage10}%`);
        }
        if (academic.is12Completed) {
            const stream12 = cleanText(academic.stream12 || 'Not specified');
            academicInfo.push(`12th Stream: ${stream12}`);
            const percentage12 = cleanText(academic.percentage12);
            if (percentage12) {
                academicInfo.push(`12th Percentage: ${percentage12}%`);
            }
            if (academic.subjects12 && Object.keys(academic.subjects12).length > 0) {
                const subjects = Object.entries(academic.subjects12)
                    .map(([sub, score]) => {
                        const cleanSub = cleanText(sub);
                        const cleanScore = typeof score === 'number' ? score : cleanText(String(score));
                        return cleanSub && cleanScore ? `${cleanSub}: ${cleanScore}/10` : null;
                    })
                    .filter(Boolean)
                    .join(', ');
                if (subjects) {
                    academicInfo.push(`12th Subjects & Scores: ${subjects}`);
                }
            }
        } else {
            academicInfo.push('12th: Not completed');
        }

        academicInfo.forEach(info => {
            if (info && cleanText(info)) {
                checkPageBreak(7);
                addText(`• ${info}`, margin, yPosition, contentWidth, 10);
                yPosition += 7;
            }
        });
    }

    // 3. Graduation Details
    if (userData?.graduationDetails) {
        addSectionTitle('Graduation Details');
        const grad = userData.graduationDetails;
        const gradInfo = [];
        
        if (grad.isCompleted) {
            gradInfo.push(`Status: Completed`);
            const field = cleanText(grad.field);
            if (field) gradInfo.push(`Field: ${field}`);
            const college = cleanText(grad.college);
            if (college) gradInfo.push(`College: ${college}`);
            const year = cleanText(grad.year);
            if (year) gradInfo.push(`Year: ${year}`);
            const cgpa = cleanText(grad.cgpa);
            if (cgpa) gradInfo.push(`CGPA: ${cgpa}`);
        } else {
            gradInfo.push('Status: Not completed or in progress');
            const field = cleanText(grad.field);
            if (field) gradInfo.push(`Pursuing: ${field}`);
        }

        gradInfo.forEach(info => {
            if (info && cleanText(info)) {
                checkPageBreak(7);
                addText(`• ${info}`, margin, yPosition, contentWidth, 10);
                yPosition += 7;
            }
        });
    }

    // 4. Interests & Strengths
    addSectionTitle('Interests & Strengths');
    
    if (userData?.interests) {
        const interests = userData.interests;
        
        if (interests.selectedInterests && Array.isArray(interests.selectedInterests) && interests.selectedInterests.length > 0) {
            checkPageBreak(10);
            addSubSection('Selected Interests:');
            const interestsList = interests.selectedInterests
                .map(i => cleanText(i))
                .filter(i => i && i.length > 0 && !i.match(/^[0-9a-f]{24}$/i));
            if (interestsList.length > 0) {
                const interestsText = interestsList.join(', ');
                const height = addText(`• ${interestsText}`, margin, yPosition, contentWidth, 10);
                yPosition += height + 5;
            }
        }
        
        if (interests.strengths && Array.isArray(interests.strengths) && interests.strengths.length > 0) {
            checkPageBreak(10);
            addSubSection('Strengths:');
            const strengthsList = interests.strengths
                .map(s => cleanText(s))
                .filter(s => s && s.length > 0 && !s.match(/^[0-9a-f]{24}$/i));
            if (strengthsList.length > 0) {
                const strengthsText = strengthsList.join(', ');
                const height = addText(`• ${strengthsText}`, margin, yPosition, contentWidth, 10);
                yPosition += height + 5;
            }
        }
        
        if (interests.workStyle) {
            const workStyle = cleanText(interests.workStyle);
            if (workStyle) {
                checkPageBreak(7);
                addText(`Work Style: ${workStyle}`, margin, yPosition, contentWidth, 10);
                yPosition += 7;
            }
        }
    }

    // 5. AI Career Path Insights
    if (userData?.chatbotData) {
        addSectionTitle('AI Career Path Analysis');
        const chatbot = userData.chatbotData;
        
        if (chatbot.careerPath) {
            const careerPath = cleanText(chatbot.careerPath);
            if (careerPath) {
                checkPageBreak(7);
                addText(`Recommended Career Path: ${careerPath}`, margin, yPosition, contentWidth, 11, 'bold');
                yPosition += 8;
            }
        }
        
        if (chatbot.topCareers && Array.isArray(chatbot.topCareers) && chatbot.topCareers.length > 0) {
            checkPageBreak(10);
            addSubSection('Top Recommended Careers:');
            chatbot.topCareers.forEach((career, index) => {
                const careerName = cleanText(career.name);
                if (careerName) {
                    checkPageBreak(10);
                    addText(`${index + 1}. ${careerName}`, margin, yPosition, contentWidth, 11, 'bold');
                    yPosition += 7;
                    if (career.salary) {
                        const salary = cleanText(career.salary);
                        if (salary) {
                            addText(`   Salary: ${salary}`, margin, yPosition, contentWidth, 10);
                            yPosition += 6;
                        }
                    }
                    if (career.risk !== undefined && typeof career.risk === 'number') {
                        const riskLevel = ['Low', 'Medium', 'High'][career.risk] || 'Medium';
                        addText(`   Risk Level: ${riskLevel}`, margin, yPosition, contentWidth, 10);
                        yPosition += 6;
                    }
                    yPosition += 3;
                }
            });
        }
    }

    // 6. Interest Summary (Chart-like representation)
    if (userData) {
        addSectionTitle('Interest Distribution');
        
        // Calculate interest stats (similar to dashboard logic)
        const scores = { 'Technology': 0, 'Creative': 0, 'Business': 0, 'Social': 0, 'Rural': 0 };
        
        const stream = userData.academicDetails?.stream12;
        if (stream === 'Science') scores['Technology'] += 25;
        if (stream === 'Commerce') scores['Business'] += 25;
        if (stream === 'Arts') { scores['Creative'] += 15; scores['Social'] += 15; }
        
        const interests = userData.interests?.selectedInterests || [];
        interests.forEach(i => {
            const interest = i.toLowerCase();
            if (['coding', 'robotics', 'tech'].some(t => interest.includes(t))) scores['Technology'] += 12;
            if (['art', 'design', 'creative'].some(t => interest.includes(t))) scores['Creative'] += 12;
            if (['business', 'finance', 'management'].some(t => interest.includes(t))) scores['Business'] += 12;
            if (['social', 'teaching', 'community'].some(t => interest.includes(t))) scores['Social'] += 12;
            if (['agriculture', 'rural', 'farming'].some(t => interest.includes(t))) scores['Rural'] += 15;
        });
        
        // Normalize to percentages
        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        const normalized = Object.entries(scores).map(([label, value]) => ({
            label,
            percentage: total > 0 ? Math.round((value / total) * 100) : 0
        })).filter(item => item.percentage > 0).sort((a, b) => b.percentage - a.percentage);
        
        normalized.forEach(item => {
            checkPageBreak(8);
            addText(`${item.label}: ${item.percentage}%`, margin, yPosition, contentWidth, 10);
            // Simple bar representation
            const barWidth = (item.percentage / 100) * (contentWidth * 0.6);
            doc.setFillColor(10, 229, 114);
            doc.rect(margin + 60, yPosition - 4, barWidth, 4, 'F');
            yPosition += 8;
        });
    }

    // 7. Recommended Jobs
    if (recommendedJobs && recommendedJobs.length > 0) {
        addSectionTitle('Recommended Career Opportunities');
        
        recommendedJobs.slice(0, 10).forEach((job, index) => {
            checkPageBreak(25);
            
            const jobTitle = cleanText(job.title || 'Untitled Job');
            if (jobTitle && jobTitle.length > 0) {
                addText(`${index + 1}. ${jobTitle}`, margin, yPosition, contentWidth, 12, 'bold');
                yPosition += 8;
            } else {
                // Skip this job if title is completely invalid
                return;
            }
            
            const jobDetails = [];
            if (job.company && cleanText(job.company)) jobDetails.push(`Company: ${cleanText(job.company)}`);
            const location = cleanText(job.location || job.district || '');
            if (location) {
                const state = cleanText(job.state || '');
                jobDetails.push(`Location: ${location}${state ? `, ${state}` : ''}`);
            }
            if (job.salaryRange || (job.salary && (job.salary.min || job.salary.max))) {
                const salary = job.salaryRange || 
                    (job.salary ? `₹${job.salary.min || 'N/A'} - ₹${job.salary.max || 'N/A'} ${cleanText(job.salary.currency || '')}` : '');
                if (salary && cleanText(salary) !== '₹N/A - ₹N/A ') {
                    jobDetails.push(`Salary: ${cleanText(salary)}`);
                }
            }
            if (job.type && cleanText(job.type)) jobDetails.push(`Type: ${cleanText(job.type)}`);
            if (job.match || job.matchScore) {
                const matchValue = job.match || job.matchScore;
                if (typeof matchValue === 'number' && !isNaN(matchValue)) {
                    jobDetails.push(`Career Match: ${Math.round(matchValue)}%`);
                }
            }
            if (job.category && cleanText(job.category)) jobDetails.push(`Category: ${cleanText(job.category)}`);
            
            jobDetails.forEach(detail => {
                if (detail && cleanText(detail)) {
                    addText(`   ${detail}`, margin, yPosition, contentWidth, 9);
                    yPosition += 6;
                }
            });
            
            if (job.description) {
                const desc = cleanText(job.description);
                if (desc) {
                    yPosition += 2;
                    const height = addText(`   Description: ${desc.substring(0, 200)}${desc.length > 200 ? '...' : ''}`, margin, yPosition, contentWidth, 9);
                    yPosition += height + 3;
                }
            }
            
            if (job.skills && Array.isArray(job.skills) && job.skills.length > 0) {
                const skillsList = job.skills
                    .map(s => cleanText(typeof s === 'string' ? s : (s.name || s)))
                    .filter(s => s && s.length > 0 && !s.match(/^[0-9a-f]{24}$/i)); // Remove ObjectIds
                if (skillsList.length > 0) {
                    addText(`   Key Skills: ${skillsList.slice(0, 5).join(', ')}${skillsList.length > 5 ? '...' : ''}`, margin, yPosition, contentWidth, 9);
                    yPosition += 6;
                }
            }
            
            if (job.tags && Array.isArray(job.tags) && job.tags.length > 0) {
                const tagsList = job.tags
                    .map(t => cleanText(typeof t === 'string' ? t : (t.name || t.label || t)))
                    .filter(t => t && t.length > 0 && !t.match(/^[0-9a-f]{24}$/i)); // Remove ObjectIds
                if (tagsList.length > 0) {
                    addText(`   Tags: ${tagsList.join(', ')}`, margin, yPosition, contentWidth, 9);
                    yPosition += 6;
                }
            }
            
            yPosition += 5;
            
            // Add roadmap for this job (if available)
            if (job.roadmap) {
                checkPageBreak(30);
                const roadmapTitle = cleanText(jobTitle);
                if (roadmapTitle) {
                    addSubSection(`Career Roadmap for "${roadmapTitle}":`);
                } else {
                    addSubSection('Career Roadmap:');
                }
                
                if (job.roadmap.match && typeof job.roadmap.match === 'number' && !isNaN(job.roadmap.match)) {
                    addText(`Career Match: ${Math.round(job.roadmap.match)}%`, margin, yPosition, contentWidth, 10);
                    yPosition += 7;
                }
                
                if (job.roadmap.description) {
                    const desc = cleanText(job.roadmap.description);
                    if (desc) {
                        const descHeight = addText(`Overview: ${desc.substring(0, 150)}${desc.length > 150 ? '...' : ''}`, margin, yPosition, contentWidth, 9);
                        yPosition += descHeight + 5;
                    }
                }
                
                // Add roadmap steps
                if (job.roadmap.roadmap && Array.isArray(job.roadmap.roadmap) && job.roadmap.roadmap.length > 0) {
                    addText('Career Progression Steps:', margin, yPosition, contentWidth, 10, 'bold');
                    yPosition += 7;
                    
                    job.roadmap.roadmap.slice(0, 5).forEach((step, stepIndex) => {
                        checkPageBreak(8);
                        const stepTitle = cleanText(step.title || step.subtitle || 'Step');
                        if (stepTitle && stepTitle !== 'Step') {
                            addText(`${stepIndex + 1}. ${stepTitle}`, margin + 5, yPosition, contentWidth - 10, 9);
                            yPosition += 6;
                            if (step.subtitle && step.subtitle !== step.title) {
                                const subtitle = cleanText(step.subtitle);
                                if (subtitle && subtitle !== stepTitle) {
                                    addText(`   ${subtitle}`, margin + 10, yPosition, contentWidth - 15, 8, 'italic', [100, 100, 100]);
                                    yPosition += 5;
                                }
                            }
                        }
                    });
                    yPosition += 3;
                }
                
                // Add required skills
                if (job.roadmap.skills && Array.isArray(job.roadmap.skills) && job.roadmap.skills.length > 0) {
                    addText('Key Skills to Develop:', margin, yPosition, contentWidth, 10, 'bold');
                    yPosition += 7;
                    const skillsList = job.roadmap.skills
                        .map(s => cleanText(typeof s === 'string' ? s : (s.name || s)))
                        .filter(s => s && s.length > 0 && !s.match(/^[0-9a-f]{24}$/i));
                    if (skillsList.length > 0) {
                        const skillsText = skillsList.slice(0, 8).join(', ');
                        const skillsHeight = addText(`• ${skillsText}${skillsList.length > 8 ? '...' : ''}`, margin, yPosition, contentWidth, 9);
                        yPosition += skillsHeight + 5;
                    }
                }
                
                // Add course recommendation if available
                if (job.roadmap.course) {
                    const course = job.roadmap.course;
                    const courseTitle = cleanText(course.title);
                    if (courseTitle) {
                        addText('Recommended Course:', margin, yPosition, contentWidth, 10, 'bold');
                        yPosition += 7;
                        addText(`   Title: ${courseTitle}`, margin, yPosition, contentWidth, 9);
                        yPosition += 6;
                    }
                    if (course.desc) {
                        const courseDesc = cleanText(course.desc);
                        if (courseDesc) {
                            const courseDescHeight = addText(`   Description: ${courseDesc.substring(0, 100)}${courseDesc.length > 100 ? '...' : ''}`, margin, yPosition, contentWidth, 9);
                            yPosition += courseDescHeight + 4;
                        }
                    }
                    if (course.duration) {
                        const duration = cleanText(course.duration);
                        if (duration) {
                            addText(`   Duration: ${duration}`, margin, yPosition, contentWidth, 9);
                            yPosition += 6;
                        }
                    }
                    if (course.level) {
                        const level = cleanText(course.level);
                        if (level) {
                            addText(`   Level: ${level}`, margin, yPosition, contentWidth, 9);
                            yPosition += 6;
                        }
                    }
                }
                
                yPosition += 5;
            }
            
            // Add separator line between jobs
            if (index < recommendedJobs.slice(0, 10).length - 1) {
                checkPageBreak(5);
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.3);
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 8;
            }
        });
    }

    // 8. Skill Gaps Analysis
    addSectionTitle('Skill Gap Analysis');
    
    if (userData && recommendedJobs && recommendedJobs.length > 0) {
        const topJob = recommendedJobs[0];
        const topJobTitle = cleanText(topJob.title);
        if (topJob.skills && Array.isArray(topJob.skills) && topJob.skills.length > 0) {
            if (topJobTitle) {
                addSubSection(`Skills Required for "${topJobTitle}":`);
            } else {
                addSubSection('Skills Required:');
            }
            const skillsList = topJob.skills
                .map(s => cleanText(typeof s === 'string' ? s : (s.name || s)))
                .filter(s => s && s.length > 0 && !s.match(/^[0-9a-f]{24}$/i));
            
            skillsList.forEach(skill => {
                checkPageBreak(7);
                addText(`• ${skill}`, margin, yPosition, contentWidth, 10);
                yPosition += 7;
            });
            
            if (skillsList.length > 0) {
                yPosition += 5;
                addText('Note: Focus on developing these skills to increase your career match percentage.', margin, yPosition, contentWidth, 9, 'italic', [100, 100, 100]);
                yPosition += 8;
            }
        }
    }

    // 9. Detailed Roadmaps for Top Jobs
    if (recommendedJobs && recommendedJobs.length > 0) {
        const jobsWithRoadmaps = recommendedJobs.filter(job => job.roadmap);
        if (jobsWithRoadmaps.length > 0) {
            addSectionTitle('Detailed Career Roadmaps');
            
            jobsWithRoadmaps.slice(0, 3).forEach((job, jobIndex) => {
                checkPageBreak(40);
                const roadmap = job.roadmap;
                const roadmapJobTitle = cleanText(job.title);
                
                if (roadmapJobTitle) {
                    addText(`Roadmap ${jobIndex + 1}: ${roadmapJobTitle}`, margin, yPosition, contentWidth, 14, 'bold', [10, 229, 114]);
                    yPosition += 10;
                }
                
                if (roadmap.match && typeof roadmap.match === 'number' && !isNaN(roadmap.match)) {
                    addText(`Career Match Score: ${Math.round(roadmap.match)}%`, margin, yPosition, contentWidth, 11, 'bold');
                    yPosition += 8;
                }
                
                // Stats if available
                if (roadmap.stats && Array.isArray(roadmap.stats) && roadmap.stats.length > 0) {
                    roadmap.stats.forEach(stat => {
                        const label = cleanText(stat.label);
                        const value = cleanText(stat.value);
                        if (label && value) {
                            checkPageBreak(7);
                            addText(`${label}: ${value}`, margin, yPosition, contentWidth, 10);
                            yPosition += 7;
                        }
                    });
                    yPosition += 3;
                }
                
                // Full roadmap steps
                if (roadmap.roadmap && Array.isArray(roadmap.roadmap) && roadmap.roadmap.length > 0) {
                    addSubSection('Step-by-Step Career Path:');
                    roadmap.roadmap.forEach((step, stepIndex) => {
                        checkPageBreak(10);
                        const stepNum = stepIndex + 1;
                        const stepTitle = cleanText(step.title || 'Untitled Step');
                        if (stepTitle && stepTitle !== 'Untitled Step') {
                            addText(`Step ${stepNum}: ${stepTitle}`, margin, yPosition, contentWidth, 11, 'bold');
                            yPosition += 7;
                            if (step.subtitle && step.subtitle !== step.title) {
                                const subtitle = cleanText(step.subtitle);
                                if (subtitle && subtitle !== stepTitle) {
                                    const subtitleHeight = addText(subtitle, margin + 10, yPosition, contentWidth - 15, 9);
                                    yPosition += subtitleHeight + 4;
                                }
                            }
                            if (step.status) {
                                const status = cleanText(step.status);
                                if (status) {
                                    addText(`Status: ${status}`, margin + 10, yPosition, contentWidth - 15, 9, 'italic', [100, 100, 100]);
                                    yPosition += 6;
                                }
                            }
                        }
                    });
                    yPosition += 5;
                }
                
                // Detailed skills breakdown
                if (roadmap.skills && Array.isArray(roadmap.skills) && roadmap.skills.length > 0) {
                    addSubSection('Required Skills Breakdown:');
                    const validSkills = roadmap.skills
                        .map(skill => ({
                            name: cleanText(typeof skill === 'string' ? skill : (skill.name || skill)),
                            level: cleanText(skill.level || 'Not specified'),
                            progress: typeof skill.progress === 'number' ? skill.progress : 0,
                            desc: cleanText(skill.desc || '')
                        }))
                        .filter(s => s.name && s.name.length > 0 && !s.name.match(/^[0-9a-f]{24}$/i));
                    
                    validSkills.slice(0, 10).forEach(skill => {
                        checkPageBreak(8);
                        addText(`• ${skill.name}`, margin, yPosition, contentWidth, 10);
                        yPosition += 6;
                        addText(`  Level: ${skill.level} | Progress: ${skill.progress}%`, margin + 10, yPosition, contentWidth - 15, 9, 'normal', [100, 100, 100]);
                        yPosition += 6;
                        if (skill.desc) {
                            const descHeight = addText(`  ${skill.desc.substring(0, 80)}${skill.desc.length > 80 ? '...' : ''}`, margin + 10, yPosition, contentWidth - 15, 8);
                            yPosition += descHeight + 3;
                        }
                    });
                    yPosition += 5;
                }
                
                // Course recommendation
                if (roadmap.course) {
                    addSubSection('Recommended Learning Path:');
                    const course = roadmap.course;
                    const courseTitle = cleanText(course.title);
                    if (courseTitle) {
                        addText(`Course: ${courseTitle}`, margin, yPosition, contentWidth, 11, 'bold');
                        yPosition += 7;
                    }
                    if (course.desc) {
                        const courseDesc = cleanText(course.desc);
                        if (courseDesc) {
                            const courseDescHeight = addText(courseDesc, margin, yPosition, contentWidth, 10);
                            yPosition += courseDescHeight + 5;
                        }
                    }
                    const courseDetails = [];
                    if (course.mentor) {
                        const mentor = cleanText(course.mentor);
                        if (mentor) courseDetails.push(`Instructor: ${mentor}`);
                    }
                    if (course.role) {
                        const role = cleanText(course.role);
                        if (role) courseDetails.push(`Target Role: ${role}`);
                    }
                    if (course.duration) {
                        const duration = cleanText(course.duration);
                        if (duration) courseDetails.push(`Duration: ${duration}`);
                    }
                    if (course.level) {
                        const level = cleanText(course.level);
                        if (level) courseDetails.push(`Level: ${level}`);
                    }
                    
                    courseDetails.forEach(detail => {
                        if (detail && cleanText(detail)) {
                            checkPageBreak(6);
                            addText(`• ${detail}`, margin, yPosition, contentWidth, 10);
                            yPosition += 6;
                        }
                    });
                }
                
                yPosition += 10;
                
                // Add separator between roadmaps
                if (jobIndex < Math.min(jobsWithRoadmaps.length, 3) - 1) {
                    checkPageBreak(5);
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.5);
                    doc.line(margin, yPosition, pageWidth - margin, yPosition);
                    yPosition += 10;
                }
            });
        }
    }

    // 10. Action Items & Next Steps
    addSectionTitle('Recommended Next Steps');
    
    const actionItems = [
        'Review and prioritize the top 3 recommended career opportunities',
        'Identify skill gaps and create a learning plan',
        'Explore detailed roadmaps for each career path',
        'Research salary expectations and job market trends',
        'Connect with professionals in your target field',
        'Build a portfolio or gain relevant experience',
        'Consider relevant certifications or courses',
        'Set short-term and long-term career goals',
        'Track your progress and update your profile regularly',
        'Stay updated with industry trends and developments'
    ];
    
    actionItems.forEach((item, index) => {
        checkPageBreak(7);
        addText(`${index + 1}. ${item}`, margin, yPosition, contentWidth, 10);
        yPosition += 7;
    });

    // Footer on last page
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text('VidyaPath Career Summary Report', pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    // Save the PDF
    const fileName = `VidyaPath_Career_Summary_${userInfo?.fullName?.replace(/\s+/g, '_') || 'User'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
