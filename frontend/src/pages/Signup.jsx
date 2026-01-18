import React, { useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Signup = () => {
    const { isLoaded, signUp, setActive } = useSignUp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;

        try {
            await signUp.create({
                emailAddress: email,
                password,
            });

            // prepare email verification
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setPendingVerification(true);
        } catch (err) {
            console.error(JSON.stringify(err, null, 2));
            setError(err.errors[0]?.longMessage || "Something went wrong during signup");
        }
    };

    const onPressVerify = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status !== 'complete') {
                // The status can also be `abandoned` or `missing_requirements`
                console.log(JSON.stringify(completeSignUp, null, 2));
            }

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
                navigate('/');
            }
        } catch (err) {
            console.error(JSON.stringify(err, null, 2));
            setError(err.errors[0]?.longMessage || "Invalid verification code");
        }
    };

    if (pendingVerification) {
        return (
            <AuthLayout>
                <div className="w-full">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('verify_email')}</h1>
                        <p className="text-gray-500 text-sm">{t('sent_code')} {email}</p>
                    </div>
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center border border-red-100">{error}</div>}
                    <form onSubmit={onPressVerify}>
                        <div className="mb-5">
                            <label htmlFor="code" className="block text-sm font-semibold text-gray-900 mb-2">{t('ver_code')}</label>
                            <div className="relative">
                                <input
                                    id="code"
                                    value={code}
                                    placeholder={t('enter_code')}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10 transition-all"
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full p-3.5 bg-[#00e572] hover:bg-[#00cc66] text-[#0a2e1d] rounded-lg text-base font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">{t('verify_email')}</button>
                    </form>
                </div>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout>
            <div className="w-full">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('create_account')}</h1>
                    <p className="text-gray-500 text-sm">{t('join_today')}</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center border border-red-100">{error}</div>}

                <button
                    type="button"
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3 transition-all mb-4"
                    onClick={() => signUp.authenticateWithRedirect({
                        strategy: 'oauth_google',
                        redirectUrl: '/sso-callback',
                        redirectUrlComplete: '/'
                    })}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t('cont_google')}
                </button>

                <div className="flex items-center text-center my-6 text-gray-500 text-sm before:flex-1 before:border-b before:border-gray-200 after:flex-1 after:border-b after:border-gray-200">
                    <span className="px-3">{t('or_register')}</span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">{t('email_addr')}</label>
                        <div className="relative">
                            <input
                                id="email"
                                type="email"
                                placeholder={t('enter_email')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full p-3 pr-10 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10 transition-all"
                            />
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        </div>
                    </div>

                    <div className="mb-5">
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">{t('password')}</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t('create_pass')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full p-3 pr-10 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10 transition-all"
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="w-full p-3.5 bg-[#00e572] hover:bg-[#00cc66] text-[#0a2e1d] rounded-lg text-base font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer mt-5">
                        {t('register_cta')} <span>→</span>
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>{t('already_acc')} <Link to="/login" className="text-[#16a34a] font-bold hover:underline ml-1">{t('login_cta')}</Link></p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default Signup;
