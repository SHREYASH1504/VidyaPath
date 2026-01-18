import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import Step1Academic from '../components/onboarding/Step1Academic';
import Step2Graduation from '../components/onboarding/Step2Graduation';
import Step3Interests from '../components/onboarding/Step3Interests';
import Step4Chatbot from '../components/onboarding/Step4Chatbot';
import { BookOpen, MapPin, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SignOutButton } from '@clerk/clerk-react';
import LanguageSelector from '../components/LanguageSelector'; // Assuming we want it here too

import axios from 'axios';

const Onboarding = () => {
    const { user } = useUser();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // User Info
        email: user?.primaryEmailAddress?.emailAddress || '',
        clerkId: user?.id || '',
        // Location
        locality: '',
        district: '',
        state: '',
        // Academic
        board10: '',
        year10: '',
        percentage10: '',
        is12Completed: true,
        stream12: '',
        percentage12: '',
        subjects12: {}, // { 'Math': true, 'Physics': false }

        // Graduation (Conditional)
        gradStatus: '', // 'Not Started', 'Pursuing', 'Completed'
        degree: '',
        specialization: '',
        college: '',
        gradYear: '',
        gradScore: '',

        // Interests
        interests: [], // ['Coding', 'Music']
        otherInterests: '',
        subjectScores: {}, // { 'Math': 8, 'Science': 6 }
        strengths: [],
        workStyleEnvironment: '', // 'Indoor', 'Outdoor'
        workStyleType: '' // 'Desk', 'Field'
    });

    const updateFormData = (newData) => {
        setFormData(prev => ({ ...prev, ...newData }));
    };

    // Prepare data for backend
    const prepareDataForBackend = () => {
        return {
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
                field: formData.degree, // Using degree as main field
                specialization: formData.specialization, // Add this to schema if needed, currently mapping degree to field
                college: formData.college,
                year: formData.gradYear,
                cgpa: formData.gradScore,
                // store status somewhere if needed or infer
            },
            interests: {
                selectedInterests: formData.interests,
                otherInterests: formData.otherInterests,
                subjectLikes: formData.subjectScores,
                strengths: formData.strengths,
                workStyle: `${formData.workStyleEnvironment}-${formData.workStyleType}` // Combine or change schema? Keeping simple for now
            },
            // Chatbot data is separate step primarily
        };
    };

    const saveData = async (currentData = formData) => {
        try {
            if (!user?.primaryEmailAddress?.emailAddress) return;

            const payload = prepareDataForBackend();
            // Override with any immediate currentData updates if necessary, 
            // but formData state might not be updated yet if called inside handler.
            // Better to pass data or rely on useEffect? 
            // For now rely on formData being mostly up to date or passing partials if critical.
            // Actually, we should probably construct payload from a merge of formData and any new step data.

            await axios.post('http://localhost:5000/api/users/onboarding', payload);
            console.log("Data saved successfully");
        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    React.useEffect(() => {
        const fetchUserData = async () => {
            // Check if user wants to retake survey (bypass redirect)
            const urlParams = new URLSearchParams(window.location.search);
            const retakeSurvey = urlParams.get('retake') === 'true';
            
            if (user.primaryEmailAddress?.emailAddress) {
                try {
                    const email = user.primaryEmailAddress.emailAddress;
                    // Update email and clerkId in state just in case
                    setFormData(prev => ({ ...prev, email, clerkId: user.id }));

                    const res = await axios.get(`http://localhost:5000/api/users/${email}`);
                    const data = res.data;

                    if (data) {
                        // Check if user has completed onboarding
                        const hasCompletedOnboarding = 
                            (data?.academicDetails && (data.academicDetails.board10 || data.academicDetails.stream12)) ||
                            (data?.interests && (
                                data.interests.selectedInterests?.length > 0 ||
                                data.interests.strengths?.length > 0 ||
                                (data.interests.subjectLikes && Object.keys(data.interests.subjectLikes).length > 0)
                            )) ||
                            (data?.chatbotData && data.chatbotData.careerPath) ||
                            (data?.location && (data.location.state || data.location.district)) ||
                            (data?.graduationDetails && data.graduationDetails.field);

                        console.log('Onboarding page - User data check:', {
                            hasCompletedOnboarding,
                            retakeSurvey,
                            data,
                            hasInterests: data?.interests?.selectedInterests?.length > 0,
                            hasStrengths: data?.interests?.strengths?.length > 0,
                            hasSubjectLikes: data?.interests?.subjectLikes && Object.keys(data.interests.subjectLikes).length > 0
                        });

                        // If user has completed onboarding and NOT retaking, redirect to dashboard
                        if (hasCompletedOnboarding && !retakeSurvey) {
                            console.log('User has completed onboarding, redirecting to dashboard');
                            navigate('/dashboard');
                            return;
                        }
                        
                        // If retaking survey, still load existing data but allow editing
                        if (retakeSurvey && hasCompletedOnboarding) {
                            console.log('User is retaking survey, loading existing data for editing');
                        }

                        // Flatten backend data to frontend state
                        setFormData(prev => ({
                            ...prev,
                            // Location
                            locality: data.location?.locality || '',
                            district: data.location?.district || '',
                            state: data.location?.state || '',

                            // Academic
                            board10: data.academicDetails?.board10 || '',
                            year10: data.academicDetails?.year10 || '',
                            percentage10: data.academicDetails?.percentage10 || '',
                            is12Completed: data.academicDetails?.is12Completed ?? true,
                            stream12: data.academicDetails?.stream12 || '',
                            percentage12: data.academicDetails?.percentage12 || '',
                            subjects12: data.academicDetails?.subjects12 || {},

                            // Graduation
                            // Mapping back might be tricky without exact status field in backend?
                            // For now assume if graduation details exist, we map them
                            gradStatus: data.graduationDetails?.year ? 'Pursuing' : '', // Simplified logic or need extra field
                            degree: data.graduationDetails?.field || '',
                            college: data.graduationDetails?.college || '',
                            gradYear: data.graduationDetails?.year || '',
                            gradScore: data.graduationDetails?.cgpa || '',

                            // Interests
                            interests: data.interests?.selectedInterests || [],
                            otherInterests: data.interests?.otherInterests || '',
                            subjectScores: data.interests?.subjectLikes || {},
                            strengths: data.interests?.strengths || [],
                            // Split workStyle back
                            workStyleEnvironment: data.interests?.workStyle?.split('-')[0] || '',
                            workStyleType: data.interests?.workStyle?.split('-')[1] || '',
                        }));
                    }
                } catch (err) {
                    console.log("User not found or error fetching, starting fresh.");
                }
            }
        };
        fetchUserData();
    }, [user, navigate]);

    const handleNext = () => {
        saveData();
        setStep(prev => prev + 1);
    };

    // ... (rest of the code)

    const handleFinish = async () => {
        await saveData();
        // Final navigation or logic
        console.log("Onboarding complete");
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="w-full mx-auto px-15 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#00e572] rounded-lg flex items-center justify-center text-white">
                            <BookOpen size={20} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-900">{t('app_name')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageSelector />
                        <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.fullName}</p>
                                <p className="text-xs text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white shadow-sm">
                                <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <SignOutButton>
                                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Sign Out">
                                    <LogOut size={18} />
                                </button>
                            </SignOutButton>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 py-10 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Progress Bar */}
                    <div className="mb-10">
                        <div className="flex justify-between text-sm font-semibold text-gray-500 mb-2">
                            <span className={step >= 1 ? 'text-green-700' : ''}>{t('step_1')}</span>
                            <span className={step >= 2 ? 'text-green-700' : ''}>{t('step_2')}</span>
                            <span className={step >= 3 ? 'text-green-700' : ''}>{t('step_3')}</span>
                            <span className={step >= 4 ? 'text-green-700' : ''}>{t('step_4')}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-700 transition-all duration-500 ease-out"
                                style={{ width: `${(step / 4) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
                        {step === 1 && <Step1Academic formData={formData} updateFormData={updateFormData} onNext={handleNext} />}
                        {step === 2 && <Step2Graduation formData={formData} updateFormData={updateFormData} onNext={handleNext} onBack={() => setStep(1)} />}
                        {step === 3 && <Step3Interests formData={formData} updateFormData={updateFormData} onNext={handleNext} onBack={() => setStep(2)} />}
                        {step === 4 && <Step4Chatbot formData={formData} onFinish={handleFinish} onBack={() => setStep(3)} />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Onboarding;
