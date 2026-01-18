import React from 'react';
import { useTranslation } from 'react-i18next';
import { Book, Code, PenTool, Music, Globe, Cpu, Calculator, TrendingUp, Beaker, Palette, Scale, Gavel, Wrench, Microscope, Briefcase, Camera, Coffee, Flower2, Activity, Video, Lock, DollarSign } from 'lucide-react';

const Step3Interests = ({ formData, updateFormData, onNext, onBack }) => {
    const { t } = useTranslation();

    const handleInterestToggle = (interest) => {
        const current = formData.interests || [];
        if (current.includes(interest)) {
            updateFormData({ interests: current.filter(i => i !== interest) });
        } else {
            updateFormData({ interests: [...current, interest] });
        }
    };

    const handleScoreChange = (subject, score) => {
        const currentScores = formData.subjectScores || {};
        updateFormData({ subjectScores: { ...currentScores, [subject]: parseInt(score) } });
    };

    const isFormValid = () => {
        if (!formData.interests || formData.interests.length < 3) return false;
        if (!formData.workStyleEnvironment || !formData.workStyleType) return false;
        return true;
    };

    // General hobbies available to everyone
    const generalHobbies = [
        { name: 'Music', icon: <Music size={20} /> },
        { name: 'Reading', icon: <Book size={20} /> },
        { name: 'Travel', icon: <Globe size={20} /> },
        { name: 'Gaming', icon: <Cpu size={20} /> },
        { name: 'Art', icon: <Palette size={20} /> },
        { name: 'Photography', icon: <Camera size={20} /> },
        { name: 'Cooking', icon: <Coffee size={20} /> },
        { name: 'Gardening', icon: <Flower2 size={20} /> },
        { name: 'Fitness', icon: <Activity size={20} /> },
    ];

    const degreeContent = {
        'B.Tech/B.E': {
            interests: [
                { name: 'Coding', icon: <Code size={20} /> },
                { name: 'Robotics', icon: <Cpu size={20} /> },
                { name: 'Web Dev', icon: <Globe size={20} /> },
                { name: 'Data Science', icon: <TrendingUp size={20} /> },
                { name: 'Cyber Security', icon: <Lock size={20} /> },
                { name: 'AI/ML', icon: <Cpu size={20} /> },
            ],
            subjects: ['Mathematics', 'Physics', 'Programming', 'Data Structures']
        },
        'B.Sc': {
            interests: [
                { name: 'Research', icon: <Microscope size={20} /> },
                { name: 'Lab Work', icon: <Beaker size={20} /> },
                { name: 'Analysis', icon: <TrendingUp size={20} /> },
            ],
            subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics']
        },
        'B.Com': {
            interests: [
                { name: 'Finance', icon: <TrendingUp size={20} /> },
                { name: 'Accounting', icon: <Calculator size={20} /> },
                { name: 'Business', icon: <Briefcase size={20} /> },
                { name: 'Stock Market', icon: <TrendingUp size={20} /> },
                { name: 'Investing', icon: <DollarSign size={20} /> },
            ],
            subjects: ['Accounts', 'Economics', 'Business Studies', 'Statistics']
        },
        'BBA': {
            interests: [
                { name: 'Management', icon: <Briefcase size={20} /> },
                { name: 'Marketing', icon: <TrendingUp size={20} /> },
                { name: 'HR', icon: <Globe size={20} /> },
            ],
            subjects: ['Management Principles', 'Marketing', 'HR Management', 'Economics']
        },
        'B.A': {
            interests: [
                { name: 'Writing', icon: <PenTool size={20} /> },
                { name: 'History', icon: <Book size={20} /> },
                { name: 'Politics', icon: <Gavel size={20} /> },
                { name: 'Social Work', icon: <Globe size={20} /> },
                { name: 'Film Making', icon: <Video size={20} /> },
                { name: 'Animation', icon: <Palette size={20} /> },
            ],
            subjects: ['English', 'History', 'Pol Science', 'Sociology']
        },
        'Diploma': {
            interests: [
                { name: 'Practical Skills', icon: <Wrench size={20} /> },
                { name: 'Field Work', icon: <Briefcase size={20} /> },
            ],
            subjects: ['Applied Science', 'Workshop Tech', 'Engineering Drawing']
        },
        'Other': {
            interests: [
                { name: 'Research', icon: <Book size={20} /> },
                { name: 'Professional', icon: <Briefcase size={20} /> },
            ],
            subjects: ['General Aptitude', 'Reasoning', 'English']
        }
    };

    // Get content based on selected degree or default to Other
    const currentDegreeContent = degreeContent[formData.degree] || degreeContent['Other'];

    // Combine degree specific interests with general hobbies
    const allInterests = [
        ...currentDegreeContent.interests,
        ...generalHobbies,
        { name: 'Other', icon: <PenTool size={20} /> } // Add Other option
    ];

    const subjects = currentDegreeContent.subjects;

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('interests_skills')}</h2>
            <p className="text-gray-500 mb-8">{t('interests_desc')}</p>

            {/* Interest Multi-Select */}
            <div className="mb-8">
                <h3 className="font-bold mb-4 text-green-700">{t('select_interests')} <span className="text-xs font-normal text-gray-500">(Min 3)</span></h3>
                <div className="flex flex-wrap gap-3">
                    {allInterests.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => handleInterestToggle(item.name)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${formData.interests?.includes(item.name) ? 'border-[#00e572] bg-green-50 text-green-800' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                        >
                            {item.icon}
                            <span className="font-semibold text-sm">{item.name}</span>
                        </button>
                    ))}
                </div>

                {/* Show input if 'Other' is selected */}
                {formData.interests?.includes('Other') && (
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('specify_other_interests') || "Specify Other Interests"}</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                            placeholder="e.g. Photography, Cooking, etc."
                            value={formData.otherInterests || ''}
                            onChange={(e) => updateFormData({ otherInterests: e.target.value })}
                        />
                    </div>
                )}
            </div>

            <hr className="border-gray-200 my-6" />

            {/* Subject Sliders */}
            <div className="mb-8">
                <h3 className="font-bold mb-4 text-green-700">{t('rate_subjects')} <span className="text-xs font-normal text-gray-500">(1-10)</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {subjects.map(sub => (
                        <div key={sub}>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">{sub}</label>
                                <span className="text-sm font-bold text-[#00e572]">{formData.subjectScores?.[sub] || 5}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={formData.subjectScores?.[sub] || 5}
                                onChange={(e) => handleScoreChange(sub, e.target.value)}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00e572]"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <hr className="border-gray-200 my-6" />

            {/* Work Style */}
            <div className="mb-8">
                <h3 className="font-bold mb-4 text-green-700">{t('work_style')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('environment')}</label>
                        <div className="flex gap-2">
                            {['Indoor', 'Outdoor'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => updateFormData({ workStyleEnvironment: type })}
                                    className={`flex-1 py-3 rounded-lg border-2 text-sm font-bold transition-all ${formData.workStyleEnvironment === type ? 'border-[#00e572] bg-green-50 text-green-800' : 'border-gray-200 bg-white text-gray-500'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('type')}</label>
                        <div className="flex gap-2">
                            {['Desk', 'Field'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => updateFormData({ workStyleType: type })}
                                    className={`flex-1 py-3 rounded-lg border-2 text-sm font-bold transition-all ${formData.workStyleType === type ? 'border-[#00e572] bg-green-50 text-green-800' : 'border-gray-200 bg-white text-gray-500'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button onClick={onBack} className="px-6 py-3 rounded-lg font-bold transition-colors bg-gray-200 hover:bg-gray-300 text-gray-700">
                    ← {t('back')}
                </button>
                <button
                    onClick={onNext}
                    disabled={!isFormValid()}
                    className={`px-6 py-3 rounded-lg font-bold transition-colors bg-[#00e572] hover:bg-[#00cc66] text-[#0a2e1d] ${!isFormValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {t('next_step')} →
                </button>
            </div>
        </div>
    );
};

export default Step3Interests;
