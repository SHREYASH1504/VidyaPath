import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${i18n.language === 'en'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
            >
                EN
            </button>
            <button
                onClick={() => changeLanguage('hi')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${i18n.language === 'hi'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
            >
                HI
            </button>
            <button
                onClick={() => changeLanguage('mr')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${i18n.language === 'mr'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
            >
                MR
            </button>
        </div>
    );
};

export default LanguageSelector;
