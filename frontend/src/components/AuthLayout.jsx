import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';

const AuthLayout = ({ children }) => {
    const { t } = useTranslation();
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: t('slide_1_title'),
            subtitle: t('slide_1_subtitle'),
            desc: t('slide_1_desc')
        },
        {
            title: t('slide_2_title'),
            subtitle: t('slide_2_subtitle'),
            desc: t('slide_2_desc')
        },
        {
            title: t('slide_3_title'),
            subtitle: t('slide_3_subtitle'),
            desc: t('slide_3_desc')
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 2000);
        return () => clearInterval(timer);
    }, [slides.length]);

    return (
        <div className="flex min-h-screen w-full font-sans">
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex w-1/2 bg-[#0a2e1d] relative overflow-hidden flex-col justify-end p-16 text-white transition-all duration-700">
                {/* Background Gradients/Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a4d33_0%,_transparent_70%)] opacity-30 z-0"></div>
                <div className="absolute inset-0 w-full h-full bg-cover bg-center opacity-60 mix-blend-overlay bg-[url(https://lh3.googleusercontent.com/aida-public/AB6AXuAt18O7-DUIZMDvOnIe8jJk-ttC3A-_fiPQaZ0cFYpOwQbYcMI--bBZcCMW1CiKsPoNHYoqEQ9U6LHOgHNv5vFmBZ8NNvae032uUL1yxUDBkfYlUP0FO2ku_alx8kRKBpqmjdQ9n_1EZSvOjhmTn573065y0E0RxU1wWFq5P9G0amI-TwIRmDpFCzqwZjsHmOwsx_r83Ob7gk8kSXkkSXmQRzRBpMisBfAXIihNi7pUBFE5d9qLJHGci4Al3NhruAxgZWDNyu-qi6Aw)]"></div>

                {/* Content */}
                <div className="relative z-10 mb-8 min-h-[300px] flex flex-col justify-end">
                    <div className="absolute top-0 left-0 mt-[calc(-100vh+160px)] flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#00e572] rounded-full flex items-center justify-center">
                            <BookOpen size={18} color="white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">{t('app_name')}</span>
                    </div>

                    <div className="transition-opacity duration-700 ease-in-out">
                        <h1 className="text-5xl font-bold leading-tight mb-4 animate-[fadeIn_0.5s_ease-out]">
                            {slides[currentSlide].title}<br />
                            <span className="text-[#00e572]">{slides[currentSlide].subtitle}</span>
                        </h1>
                        <p className="text-gray-300 text-lg max-w-md mb-8 leading-relaxed animate-[fadeIn_0.7s_ease-out]">
                            {slides[currentSlide].desc}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-2 rounded-full transition-all duration-500 ${currentSlide === index ? 'w-12 bg-[#00e572]' : 'w-2 bg-gray-600 hover:bg-gray-500'}`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center p-6 relative">
                <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05),0_4px_6px_-2px_rgba(0,0,0,0.025)]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-green-100 text-[#16a34a] rounded-lg flex items-center justify-center">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{t('app_name')}</h2>
                            <p className="text-xs text-gray-500 font-medium">{t('portal_name')}</p>
                        </div>
                        <div className="ml-auto">
                            <LanguageSelector />
                        </div>
                    </div>
                    {children}
                </div>
                <div className="absolute bottom-6 w-full text-center text-xs text-gray-400">
                    {t('login_trouble')} <a href="#" className="text-gray-500 underline hover:text-gray-700">{t('support_team')}</a>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
