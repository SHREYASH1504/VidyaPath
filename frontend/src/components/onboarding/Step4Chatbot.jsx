import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Step4Chatbot = ({ formData, onBack }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { id: 1, text: 'chat_intro', sender: 'bot', isKey: true }
    ]);
    const [inputText, setInputText] = useState('');
    const [questionQueue, setQuestionQueue] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
    const [showRecommendation, setShowRecommendation] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const [sessionId, setSessionId] = useState(null);
    const [chatbotInsights, setChatbotInsights] = useState([]);
    const [chatbotTopCareers, setChatbotTopCareers] = useState([]);

    // Initialize chatbot session with live API
    useEffect(() => {
        const initializeChatbot = async () => {
            try {
                // Use email directly as user identifier for the API
                const userEmail = formData.email || formData.clerkId || 'user_' + Date.now();
                
                // Start chat session with live API endpoint
                const startResponse = await fetch(`http://localhost:8000/api/v1/chat/abc/start/${userEmail}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (startResponse.ok) {
                    const startData = await startResponse.json();
                    if (startData.success && startData.question) {
                        // Use API response
                        setSessionId(startData.sessionId);
                        
                        // Store question ID in queue
                        if (startData.questionId) {
                            setQuestionQueue([startData.questionId]);
                            setCurrentQuestionIndex(0);
                        }
                        
                        // Store insights and profile if available
                        if (startData.insights && startData.insights.length > 0) {
                            setChatbotInsights(startData.insights);
                        }
                        
                        if (startData.topCareers && startData.topCareers.length > 0) {
                            setChatbotTopCareers(startData.topCareers);
                        }
                        
                        // Display the first question from API
                        addBotMessage(startData.question, false);
                        return;
                    } else {
                        console.error('Chatbot API response missing question:', startData);
                        // If no question, redirect to dashboard
                        saveDataAndRedirect();
                        return;
                    }
                } else {
                    const errorData = await startResponse.json().catch(() => ({}));
                    console.error('Chatbot API returned error:', startResponse.status, errorData);
                    // API is down or error, save data and redirect to dashboard
                    saveDataAndRedirect();
                    return;
                }
            } catch (error) {
                console.error('Chatbot API initialization error:', error);
                // Network error or API down, save data and redirect to dashboard
                saveDataAndRedirect();
                return;
            }
        };

        initializeChatbot();
    }, [formData.email, navigate]);

    // Removed static question generation - now using live API only

    const addBotMessage = (text, isKey = false) => {
        setMessages(prev => [...prev, { id: Date.now(), text, sender: 'bot', isKey }]);
    };

    const addUserMessage = (text) => {
        setMessages(prev => [...prev, { id: Date.now(), text, sender: 'user', isKey: false }]);
    };

    const saveDataAndRedirect = async () => {
        // Save current data before redirecting (fallback when API fails)
        const payload = {
            email: formData.email,
            clerkId: formData.clerkId,
            location: {
                locality: formData.locality,
                district: formData.district,
                state: formData.state
            },
            academicDetails: {
                board10: formData.board10,
                year10: formData.year10,
                percentage10: formData.percentage10,
                is12Completed: formData.is12Completed,
                stream12: formData.stream12,
                percentage12: formData.percentage12,
                subjects12: formData.subjects12
            },
            graduationDetails: {
                isCompleted: formData.gradStatus === 'Completed',
                field: formData.specialization || formData.degree,
                college: formData.college,
                year: formData.gradYear,
                cgpa: formData.gradScore
            },
            interests: {
                selectedInterests: formData.interests,
                subjectLikes: formData.subjectScores,
                strengths: formData.strengths,
                workStyle: `${formData.workStyleEnvironment} - ${formData.workStyleType}`
            },
            chatbotData: {
                careerPath: chatbotTopCareers.length > 0 ? "Skill-Based Career" : "Skill-Based Career",
                summary: chatbotInsights.length > 0 ? chatbotInsights.join("; ") : "Chatbot API unavailable, using default recommendation",
                sessionId: sessionId || null,
                insights: chatbotInsights,
                topCareers: chatbotTopCareers,
                timestamp: new Date().toISOString()
            }
        };

        try {
            await fetch('http://localhost:5000/api/users/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch (error) {
            console.error('Error saving data:', error);
        } finally {
            // Redirect to dashboard
            navigate('/dashboard');
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userAnswer = inputText.trim();
        addUserMessage(userAnswer);
        setInputText('');

        // Use live chatbot API
        if (sessionId) {
            try {
                const currentQuestionId = questionQueue[currentQuestionIndex];

                if (!currentQuestionId) {
                    console.error('No question ID available for current question');
                    saveDataAndRedirect();
                    return;
                }

                // Submit answer to live API
                const answerResponse = await fetch('http://localhost:8000/api/v1/chat/abc/answer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId: sessionId,
                        questionId: currentQuestionId,
                        answer: userAnswer
                    }),
                });

                if (answerResponse.ok) {
                    const answerData = await answerResponse.json();
                    if (answerData.success) {
                        // Check if chatbot conversation is complete
                        if (answerData.isComplete) {
                            // Store final insights and careers
                            if (answerData.insights && answerData.insights.length > 0) {
                                setChatbotInsights(prev => [...prev, ...answerData.insights]);
                            }
                            if (answerData.topCareers && answerData.topCareers.length > 0) {
                                setChatbotTopCareers(answerData.topCareers);
                            }
                            // Chatbot complete, generate final prediction
                            generateFinalPrediction(answerData.topCareers || []);
                            return;
                        } else if (answerData.question) {
                            // Store insights if available
                            if (answerData.insights && answerData.insights.length > 0) {
                                setChatbotInsights(prev => [...prev, ...answerData.insights]);
                                // Optionally display insights to user
                                // answerData.insights.forEach(insight => {
                                //     addBotMessage(`💡 ${insight}`, false);
                                // });
                            }
                            
                            // Store next question ID and display question
                            if (answerData.questionId) {
                                setQuestionQueue(prev => [...prev, answerData.questionId]);
                                setCurrentQuestionIndex(prev => prev + 1);
                            }
                            
                            // Display next question from API
                            addBotMessage(answerData.question, false);
                            
                            // Update top careers if available (may be updated during conversation)
                            if (answerData.topCareers && answerData.topCareers.length > 0) {
                                setChatbotTopCareers(answerData.topCareers);
                            }
                            return;
                        }
                    }
                } else {
                    const errorData = await answerResponse.json().catch(() => ({}));
                    console.error('Chatbot API answer error:', answerResponse.status, errorData);
                    // If API fails, save current data and redirect to dashboard
                    saveDataAndRedirect();
                    return;
                }
            } catch (error) {
                console.error('Chatbot API error:', error);
                // Network error, save data and redirect to dashboard
                saveDataAndRedirect();
                return;
            }
        } else {
            // No session ID, something went wrong with initialization
            console.error('No session ID available');
            saveDataAndRedirect();
            return;
        }
    };

    const generateFinalPrediction = (topCareers = []) => {
        setTimeout(() => {
            addBotMessage("chat_generating", true);

            setTimeout(async () => {
                // Use careers from API
                const careersToUse = topCareers.length > 0 ? topCareers : chatbotTopCareers;
                let category = "Skill-Based Career"; // Default
                let careerSummary = "Analysis complete based on your responses.";
                
                if (careersToUse.length > 0) {
                    // Display top careers from API
                    const firstCareer = careersToUse[0];
                    if (firstCareer.name) {
                        addBotMessage(`Based on your responses, we recommend: **${firstCareer.name}**`, false);
                        if (firstCareer.salary) {
                            addBotMessage(`Expected salary range: ${firstCareer.salary}`, false);
                        }
                        if (firstCareer.risk !== undefined) {
                            const riskLevels = ["Low", "Medium", "High"];
                            addBotMessage(`Risk level: ${riskLevels[firstCareer.risk] || "Medium"}`, false);
                        }
                    }
                    
                    // Build summary with all careers
                    if (careersToUse.length > 1) {
                        const otherCareers = careersToUse.slice(1, 3).map(c => c.name).join(", ");
                        if (otherCareers) {
                            addBotMessage(`Other recommended paths: ${otherCareers}`, false);
                        }
                    }
                    
                    // Determine category from career name/type
                    const careerText = firstCareer.name?.toLowerCase() || '';
                    if (careerText.includes('teacher') || careerText.includes('bank') || careerText.includes('government') || careerText.includes('clerk')) {
                        category = "Degree-Based Career";
                    } else if (careerText.includes('design') || careerText.includes('creative') || careerText.includes('arts')) {
                        category = "Communication & Arts";
                    } else if (careerText.includes('upsc') || careerText.includes('ias') || careerText.includes('ips')) {
                        category = "Degree-Based Career"; // Competitive exams
                    } else if (careerText.includes('rural') || careerText.includes('agriculture') || careerText.includes('extension')) {
                        category = "Rural";
                    }
                    
                    // Build summary with insights
                    careerSummary = careersToUse.map(c => `${c.name}${c.salary ? ` (${c.salary})` : ''}`).join("; ");
                    if (chatbotInsights.length > 0) {
                        careerSummary += ` | Insights: ${chatbotInsights.slice(0, 2).join("; ")}`;
                    }
                } else {
                    // Fallback: determine category from form data if no careers from API
                    if (formData.stream12 === 'Science' || formData.degree) category = "Degree-Based Career";
                    if (formData.interests?.includes('Public Speaking') || formData.stream12 === 'Arts') category = "Communication & Arts";
                    careerSummary = "Analysis complete. Recommendations based on your profile.";
                }

                addBotMessage(`chat_recommendation:${category}`, false);
                addBotMessage("chat_saved", true);

                // Prepare Payload for Backend with chatbot data
                const payload = {
                    email: formData.email,
                    clerkId: formData.clerkId,
                    location: {
                        locality: formData.locality,
                        district: formData.district,
                        state: formData.state
                    },
                    academicDetails: {
                        board10: formData.board10,
                        year10: formData.year10,
                        percentage10: formData.percentage10,
                        is12Completed: formData.is12Completed,
                        stream12: formData.stream12,
                        percentage12: formData.percentage12,
                        subjects12: formData.subjects12
                    },
                    graduationDetails: {
                        isCompleted: formData.gradStatus === 'Completed',
                        field: formData.specialization || formData.degree,
                        college: formData.college,
                        year: formData.gradYear,
                        cgpa: formData.gradScore
                    },
                    interests: {
                        selectedInterests: formData.interests,
                        subjectLikes: formData.subjectScores,
                        strengths: formData.strengths,
                        workStyle: `${formData.workStyleEnvironment} - ${formData.workStyleType}`
                    },
                    chatbotData: {
                        careerPath: category,
                        summary: careerSummary,
                        sessionId: sessionId,
                        insights: chatbotInsights,
                        topCareers: careersToUse,
                        timestamp: new Date().toISOString()
                    }
                };

                try {
                    const response = await fetch('http://localhost:5000/api/users/onboarding', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });

                    if (response.ok) {
                        console.log("Data saved successfully with chatbot recommendations!");
                        setShowRecommendation(true);
                    } else {
                        console.error("Failed to save data");
                        // If save fails, still redirect to dashboard after delay
                        setTimeout(() => {
                            navigate('/dashboard');
                        }, 2000);
                    }
                } catch (error) {
                    console.error("Error saving data:", error);
                    // If error, redirect to dashboard
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 2000);
                }
            }, 1500);
        }, 1000);
    };

    const renderMessageText = (msg) => {
        if (msg.text.startsWith('chat_recommendation:')) {
            const category = msg.text.split(':')[1];
            return (
                <span>
                    {t('chat_recommendation')} <strong>{category}</strong>
                </span>
            );
        }
        return msg.isKey ? t(msg.text) : msg.text;
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('chat_title')}</h2>

            <div className="flex flex-col h-[600px] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`max-w-[80%] p-4 rounded-2xl text-[0.95rem] leading-relaxed animate-[fadeIn_0.3s_ease-up] ${msg.sender === 'bot' ? 'self-start bg-white text-gray-800 rounded-bl-none shadow-sm' : 'self-end bg-[#00e572] text-[#061e12] rounded-br-none font-medium'}`}>
                            {renderMessageText(msg)}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {showRecommendation ? (
                    <div className="p-6 bg-white border-t border-gray-200">
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 text-center">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                                <Sparkles size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Analysis Complete!</h3>
                            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                                We've analyzed your responses and prepared a personalized career roadmap for you.
                            </p>
                            <button
                                onClick={async () => {
                                    // Determine career path from chatbot recommendations
                                    let category = "Skill-Based Career";
                                    let careerSummary = "Analysis complete based on your responses.";
                                    
                                    if (chatbotTopCareers.length > 0) {
                                        const firstCareer = chatbotTopCareers[0];
                                        const careerText = firstCareer.name?.toLowerCase() || '';
                                        if (careerText.includes('teacher') || careerText.includes('bank') || careerText.includes('government')) {
                                            category = "Degree-Based Career";
                                        } else if (careerText.includes('design') || careerText.includes('creative')) {
                                            category = "Communication & Arts";
                                        }
                                        careerSummary = chatbotTopCareers.map(c => `${c.name}${c.salary ? ` (${c.salary})` : ''}`).join("; ");
                                        if (chatbotInsights.length > 0) {
                                            careerSummary += ` | Insights: ${chatbotInsights.slice(0, 2).join("; ")}`;
                                        }
                                    }
                                    
                                    // Save data with chatbot recommendations
                                    const payload = {
                                        email: formData.email,
                                        clerkId: formData.clerkId,
                                        location: {
                                            locality: formData.locality,
                                            district: formData.district,
                                            state: formData.state
                                        },
                                        academicDetails: {
                                            board10: formData.board10,
                                            year10: formData.year10,
                                            percentage10: formData.percentage10,
                                            is12Completed: formData.is12Completed,
                                            stream12: formData.stream12,
                                            percentage12: formData.percentage12,
                                            subjects12: formData.subjects12
                                        },
                                        graduationDetails: {
                                            isCompleted: formData.gradStatus === 'Completed',
                                            field: formData.specialization || formData.degree,
                                            college: formData.college,
                                            year: formData.gradYear,
                                            cgpa: formData.gradScore
                                        },
                                        interests: {
                                            selectedInterests: formData.interests,
                                            subjectLikes: formData.subjectScores,
                                            strengths: formData.strengths,
                                            workStyle: `${formData.workStyleEnvironment} - ${formData.workStyleType}`
                                        },
                                        chatbotData: {
                                            careerPath: category,
                                            summary: careerSummary,
                                            sessionId: sessionId,
                                            insights: chatbotInsights,
                                            topCareers: chatbotTopCareers,
                                            timestamp: new Date().toISOString()
                                        }
                                    };
                                    
                                    try {
                                        await fetch('http://localhost:5000/api/users/onboarding', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(payload),
                                        });
                                    } catch (error) {
                                        console.error('Error saving data on button click:', error);
                                    } finally {
                                        navigate('/dashboard');
                                    }
                                }}
                                className="inline-flex items-center justify-center gap-2 bg-[#00e572] hover:bg-[#00c462] text-[#061e12] px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
                            >
                                View Dashboard
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-white border-t border-gray-200 flex gap-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t('type_answer')}
                            className="flex-1 p-3 px-4 border border-gray-300 rounded-full outline-none focus:border-[#00e572]"
                        />
                        <button onClick={handleSend} className="w-11 h-11 bg-[#00e572] rounded-full flex items-center justify-center text-[#061e12] border-none cursor-pointer transition-transform active:scale-95">
                            <Send size={20} />
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-4">
                <button onClick={onBack} className="px-6 py-3 rounded-lg font-bold transition-colors bg-gray-200 hover:bg-gray-300 text-gray-700">
                    {t('chat_back_btn')}
                </button>
            </div>
        </div>
    );
};

export default Step4Chatbot;
