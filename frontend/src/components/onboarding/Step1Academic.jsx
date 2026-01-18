import React from 'react';
import { useTranslation } from 'react-i18next';

const Step1Academic = ({ formData, updateFormData, onNext }) => {
    const { t } = useTranslation();

    const handleChange = (field, value) => {
        updateFormData({ [field]: value });
    };

    const handleSubjectChange = (subject) => {
        const currentSubjects = formData.subjects12 || {};
        const newSubjects = { ...currentSubjects, [subject]: !currentSubjects[subject] };
        updateFormData({ subjects12: newSubjects });
    };

    const isFormValid = () => {
        // Basic validation
        if (!formData.locality || !formData.district || !formData.state) return false;
        if (!formData.board10 || !formData.year10 || !formData.percentage10) return false;
        if (!formData.is12Completed) return true; // If 12th skipped, valid
        if (formData.is12Completed && (!formData.stream12 || !formData.percentage12)) return false;
        return true;
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('personal_academic')}</h2>
            <p className="text-gray-500 mb-8">{t('tell_us_basic')}</p>

            <div className="mb-8">
                <h3 className="font-bold mb-4 text-green-700">{t('current_loc')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('locality')}</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                            placeholder="e.g. Andheri"
                            value={formData.locality}
                            onChange={(e) => handleChange('locality', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('district')}</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                            placeholder="e.g. Mumbai Suburban"
                            value={formData.district}
                            onChange={(e) => handleChange('district', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('state')}</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                            placeholder="e.g. Maharashtra"
                            value={formData.state}
                            onChange={(e) => handleChange('state', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <hr className="border-gray-200 my-6" />

            <div className="mb-8">
                <h3 className="font-bold mb-4 text-green-700">{t('10th_std')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('board')}</label>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                            value={formData.board10}
                            onChange={(e) => handleChange('board10', e.target.value)}
                        >
                            <option value="">{t('select_board')}</option>
                            <option value="State Board">State Board</option>
                            <option value="CBSE">CBSE</option>
                            <option value="ICSE">ICSE</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('passing_year')}</label>
                        <input
                            type="number"
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                            placeholder="e.g. 2022"
                            value={formData.year10}
                            onChange={(e) => handleChange('year10', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('percentage')} <span className="text-xs font-normal text-gray-500">(35-100)</span></label>
                        <input
                            type="number"
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                            placeholder="e.g. 85.5"
                            min="35"
                            max="100"
                            value={formData.percentage10}
                            onChange={(e) => handleChange('percentage10', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <hr className="border-gray-200 my-6" />

            <div className="mb-8">
                <h3 className="font-bold mb-4 text-green-700">{t('12th_std')}</h3>

                <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!formData.is12Completed}
                            onChange={(e) => {
                                const notCompleted = e.target.checked;
                                updateFormData({
                                    is12Completed: !notCompleted,
                                    stream12: notCompleted ? 'Not Completed' : ''
                                });
                            }}
                            className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">{t('12th_not_completed')}</span>
                    </label>
                </div>

                {formData.is12Completed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('stream')}</label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                                value={formData.stream12}
                                onChange={(e) => handleChange('stream12', e.target.value)}
                            >
                                <option value="">{t('select_stream')}</option>
                                <option value="Science">Science</option>
                                <option value="Commerce">Commerce</option>
                                <option value="Arts">Arts</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('percentage')} <span className="text-xs font-normal text-gray-500">(35-100)</span></label>
                            <input
                                type="number"
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                                placeholder="e.g. 78.0"
                                value={formData.percentage12}
                                onChange={(e) => handleChange('percentage12', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {formData.is12Completed && formData.stream12 && (
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('main_subjects')}</label>
                        <div className="flex flex-wrap gap-2">
                            {(() => {
                                const streamSubjects = {
                                    'Science': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Electronics'],
                                    'Commerce': ['Accountancy', 'Economics', 'Business Studies', 'Mathematics', 'English', 'Informatics Practices'],
                                    'Arts': ['History', 'Sociology', 'Political Science', 'Geography', 'Psychology', 'Economics', 'English']
                                };

                                const subjectsToShow = streamSubjects[formData.stream12] || [];

                                return subjectsToShow.length > 0 ? (
                                    subjectsToShow.map(sub => (
                                        <button
                                            key={sub}
                                            onClick={() => handleSubjectChange(sub)}
                                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${formData.subjects12?.[sub] ? 'bg-green-100 border-green-500 text-green-800' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {sub}
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Select a stream to see subjects</p>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end mt-8">
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

export default Step1Academic;
