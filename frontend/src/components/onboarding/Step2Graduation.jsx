import React from 'react';
import { useTranslation } from 'react-i18next';

const Step2Graduation = ({ formData, updateFormData, onNext, onBack }) => {
    const { t } = useTranslation();

    const handleChange = (field, value) => {
        updateFormData({ [field]: value });
    };

    const isFormValid = () => {
        if (!formData.gradStatus) return false;
        // If not started, other fields not required
        if (formData.gradStatus === 'Not Started') return true;

        // If pursuing or completed, need details
        if (!formData.degree || !formData.college) return false;

        // If degree is 'Other', need to specify it
        if (formData.degree === 'Other' && !formData.otherDegree) return false;

        return true;
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('graduation_details')}</h2>
            <p className="text-gray-500 mb-8">{t('higher_edu_desc')}</p>

            <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('grad_status')}</label>
                <select
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10 mb-4"
                    value={formData.gradStatus}
                    onChange={(e) => handleChange('gradStatus', e.target.value)}
                >
                    <option value="">{t('select_status')}</option>
                    <option value="Not Started">{t('not_started')}</option>
                    <option value="Pursuing">{t('pursuing')}</option>
                    <option value="Completed">{t('completed')}</option>
                </select>

                {formData.gradStatus && formData.gradStatus !== 'Not Started' && (
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('degree_type')}</label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                                value={formData.degree}
                                onChange={(e) => handleChange('degree', e.target.value)}
                            >
                                <option value="">Select Degree</option>
                                <option value="B.Tech/B.E">B.Tech / B.E</option>
                                <option value="B.Sc">B.Sc</option>
                                <option value="B.Com">B.Com</option>
                                <option value="B.A">B.A</option>
                                <option value="BBA">BBA</option>
                                <option value="Diploma">Diploma</option>
                                <option value="Other">Other</option>
                            </select>

                            {formData.degree === 'Other' && (
                                <div className="mt-3">
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                                        placeholder={t('specify_degree') || "Specify Degree"}
                                        value={formData.otherDegree || ''}
                                        onChange={(e) => handleChange('otherDegree', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('specialization')}</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                                placeholder="e.g. Computer Science, Economics"
                                value={formData.specialization}
                                onChange={(e) => handleChange('specialization', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('college')}</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                                placeholder="e.g. University of Mumbai"
                                value={formData.college}
                                onChange={(e) => handleChange('college', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('passing_year')}</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                                    placeholder="e.g. 2025"
                                    value={formData.gradYear}
                                    onChange={(e) => handleChange('gradYear', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('cgpa')}</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10"
                                    placeholder="e.g. 8.5 cgpa"
                                    value={formData.gradScore}
                                    onChange={(e) => handleChange('gradScore', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
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

export default Step2Graduation;
