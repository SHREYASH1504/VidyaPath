import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import DashboardLayout from '../components/DashboardLayout';
import { Send, Bot, User, Sparkles, RefreshCw, Paperclip, ThumbsUp, ThumbsDown, Copy } from 'lucide-react';

const ChatbotPage = () => {
    const { t } = useTranslation();
    const { user } = useUser();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize chatbot session on mount
    useEffect(() => {
        const initializeChatbot = async () => {
            if (!user?.primaryEmailAddress?.emailAddress) {
                setIsInitializing(false);
                return;
            }

            try {
                const userEmail = user.primaryEmailAddress.emailAddress;
                const startResponse = await fetch(`http://localhost:5000/api/v1/chat/storage/start/${userEmail}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (startResponse.ok) {
                    const startData = await startResponse.json();
                    console.log('Chatbot initialization response:', startData);
                    
                    // Check for sessionId in various possible fields
                    const receivedSessionId = startData.sessionId || startData.session_id || startData.sessionID;
                    
                    if (receivedSessionId) {
                        setSessionId(receivedSessionId);
                        
                        // Display welcome message from API if available, otherwise use default
                        const welcomeMessage = startData.message || startData.question || startData.response || t('cb_welcome_msg');
                        setMessages([{ id: 1, type: 'bot', text: welcomeMessage }]);
                    } else {
                        console.warn('No sessionId in API response:', startData);
                        // Fallback to default welcome message, but still allow sending messages
                        setMessages([{ id: 1, type: 'bot', text: t('cb_welcome_msg') }]);
                    }
                } else {
                    const errorText = await startResponse.text();
                    console.error('Chatbot API error:', startResponse.status, errorText);
                    // API error, use default welcome message, but still allow sending messages
                    setMessages([{ id: 1, type: 'bot', text: t('cb_welcome_msg') }]);
                }
            } catch (error) {
                console.error('Error initializing chatbot:', error);
                // Network error, use default welcome message, but still allow sending messages
                setMessages([{ id: 1, type: 'bot', text: t('cb_welcome_msg') }]);
            } finally {
                setIsInitializing(false);
            }
        };

        initializeChatbot();
    }, [user, t]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), type: 'user', text: input };
        const userInput = input.trim();
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Initialize session if it doesn't exist
        let currentSessionId = sessionId;
        if (!currentSessionId && user?.primaryEmailAddress?.emailAddress) {
            try {
                const userEmail = user.primaryEmailAddress.emailAddress;
                const startResponse = await fetch(`http://localhost:5000/api/v1/chat/storage/start/${userEmail}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (startResponse.ok) {
                    const startData = await startResponse.json();
                    console.log('Session initialization in handleSend:', startData);
                    
                    // Check for sessionId in various possible fields
                    const receivedSessionId = startData.sessionId || startData.session_id || startData.sessionID;
                    
                    if (receivedSessionId) {
                        currentSessionId = receivedSessionId;
                        setSessionId(receivedSessionId);
                    } else {
                        console.warn('No sessionId received during message send initialization');
                    }
                } else {
                    const errorText = await startResponse.text();
                    console.error('Session initialization failed:', startResponse.status, errorText);
                }
            } catch (error) {
                console.error('Error initializing session in handleSend:', error);
            }
        }

        // If still no sessionId after trying to initialize, try sending anyway (some APIs work without explicit session)
        if (!currentSessionId) {
            console.warn('No sessionId available, attempting to send message anyway');
        }

        try {
            // Build request body with sessionId and user email for context
            const userEmail = user?.primaryEmailAddress?.emailAddress;
            const requestBody = {
                answer: userInput
            };
            
            if (currentSessionId) {
                requestBody.sessionId = currentSessionId;
            }
            
            // Include user email if available (some APIs use this to fetch user data)
            if (userEmail) {
                requestBody.userId = userEmail;
                requestBody.email = userEmail;
            }
            
            console.log('Sending request to API:', requestBody);
            
            const answerResponse = await fetch('http://localhost:5000/api/v1/chat/storage/answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            console.log('Answer API response status:', answerResponse.status);
            
            // Get the raw response text first to see what we're actually getting
            const responseText = await answerResponse.text();
            console.log('Answer API raw response text:', responseText);

            if (answerResponse.ok) {
                let answerData;
                try {
                    answerData = JSON.parse(responseText);
                } catch (e) {
                    console.error('Failed to parse JSON response:', e);
                    // If it's not JSON, use the text directly
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        type: 'bot',
                        text: responseText || "I received a response but couldn't parse it."
                    }]);
                    setIsTyping(false);
                    return;
                }
                
                console.log('Answer API response data (full parsed):', JSON.stringify(answerData, null, 2));
                
                // Update sessionId if returned in response
                if (answerData.sessionId || answerData.session_id || answerData.sessionID) {
                    const newSessionId = answerData.sessionId || answerData.session_id || answerData.sessionID;
                    if (!sessionId || newSessionId !== sessionId) {
                        setSessionId(newSessionId);
                        console.log('Updated sessionId to:', newSessionId);
                    }
                }
                
                // Try to extract the bot response from various possible fields and nested structures
                let botResponse = null;
                
                // Check top-level fields (try all possible variations)
                botResponse = answerData.message || answerData.answer || answerData.response || answerData.text || answerData.reply || answerData.output || answerData.content;
                
                // Check nested structures
                if (!botResponse && answerData.data) {
                    botResponse = answerData.data.message || answerData.data.answer || answerData.data.response || answerData.data.text || answerData.data.reply || answerData.data.output || answerData.data.content;
                }
                
                if (!botResponse && answerData.result) {
                    botResponse = answerData.result.message || answerData.result.answer || answerData.result.response || answerData.result.text || answerData.result.reply || answerData.result.output || answerData.result.content;
                }
                
                if (!botResponse && answerData.response) {
                    botResponse = answerData.response.message || answerData.response.answer || answerData.response.text || answerData.response.content;
                }
                
                // If still no response found, log and use a fallback
                if (!botResponse) {
                    console.warn('Could not find response message in API response. Full response keys:', Object.keys(answerData));
                    console.warn('Full response:', answerData);
                    // Try to use the entire response as string if it's a simple structure
                    if (typeof answerData === 'string') {
                        botResponse = answerData;
                    } else {
                        botResponse = "I'm here to help! Could you please rephrase your question?";
                    }
                }
                
                console.log('Extracted bot response:', botResponse);
                
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: botResponse
                }]);
            } else {
                // API error, show error message with more details
                const errorText = await answerResponse.text();
                console.error('Answer API error:', answerResponse.status, errorText);
                
                let errorMessage = "I apologize, but I'm having trouble processing your request right now. Please try again.";
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.message || errorData.error) {
                        errorMessage = errorData.message || errorData.error;
                    }
                } catch (e) {
                    // If error text is not JSON, use default message
                }
                
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: errorMessage
                }]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                text: "I'm experiencing connectivity issues. Please check your connection and try again."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleClearChat = async () => {
        // Reset messages and reinitialize session
        setMessages([]);
        setSessionId(null);
        setIsInitializing(true);

        if (!user?.primaryEmailAddress?.emailAddress) {
            setIsInitializing(false);
            return;
        }

        try {
            const userEmail = user.primaryEmailAddress.emailAddress;
            const startResponse = await fetch(`http://localhost:5000/api/v1/chat/storage/start/${userEmail}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (startResponse.ok) {
                const startData = await startResponse.json();
                if (startData.success && startData.sessionId) {
                    setSessionId(startData.sessionId);
                    const welcomeMessage = startData.message || startData.question || t('cb_welcome_msg');
                    setMessages([{ id: 1, type: 'bot', text: welcomeMessage }]);
                } else {
                    setMessages([{ id: 1, type: 'bot', text: t('cb_welcome_msg') }]);
                }
            } else {
                setMessages([{ id: 1, type: 'bot', text: t('cb_welcome_msg') }]);
            }
        } catch (error) {
            console.error('Error reinitializing chatbot:', error);
            setMessages([{ id: 1, type: 'bot', text: t('cb_welcome_msg') }]);
        } finally {
            setIsInitializing(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const suggestedPrompts = [
        "What are the best skills for 2026?",
        "How do I become a Product Manager?",
        "Resume tips for freshers",
        "Explain high-demand tech roles"
    ];

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-[fadeIn_0.5s_ease-out]">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#00e572] rounded-full flex items-center justify-center text-white shadow-sm">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">{t('cb_assistant_name')}</h2>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> {t('cb_online')}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClearChat} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title={t('cb_clear_chat')}>
                        <RefreshCw size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    {isInitializing && messages.length === 0 && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-[#00e572] rounded-full flex items-center justify-center text-white">
                                <Bot size={18} />
                            </div>
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1 items-center h-12">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'bot' ? 'bg-[#00e572] text-white' : 'bg-gray-900 text-white'}`}>
                                {msg.type === 'bot' ? <Bot size={18} /> : <User size={18} />}
                            </div>

                            <div className={`flex flex-col gap-1 max-w-[80%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-4 rounded-2xl shadow-sm ${msg.type === 'bot'
                                    ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                    : 'bg-[#00e572] text-[#061e12] font-medium rounded-tr-none'
                                    }`}>
                                    {msg.text}
                                </div>
                                {msg.type === 'bot' && (
                                    <div className="flex gap-2 ml-2">
                                        <button className="text-gray-400 hover:text-gray-600"><ThumbsUp size={14} /></button>
                                        <button className="text-gray-400 hover:text-gray-600"><ThumbsDown size={14} /></button>
                                        <button className="text-gray-400 hover:text-gray-600"><Copy size={14} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-[#00e572] rounded-full flex items-center justify-center text-white">
                                <Bot size={18} />
                            </div>
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1 items-center h-12">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    {/* Suggested Prompts (only show if few messages) */}
                    {messages.length < 3 && (
                        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                            {suggestedPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setInput(prompt); }}
                                    className="whitespace-nowrap px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 hover:border-[#00e572] hover:text-[#00e572] transition-colors flex items-center gap-2"
                                >
                                    <Sparkles size={14} /> {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="relative flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-[#00e572] focus-within:ring-2 focus-within:ring-[#00e572]/20 transition-all">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
                            <Paperclip size={20} />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={t('cb_input_placeholder')}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="p-3 bg-[#00e572] text-[#061e12] rounded-xl hover:bg-[#00c462] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2">
                        {t('cb_disclaimer')}
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ChatbotPage;
