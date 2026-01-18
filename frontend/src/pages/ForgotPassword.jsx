import React, { useState, useEffect } from 'react';
import { useSignIn, useClerk } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(0); // Track failed code attempts
    const [successfulCreation, setSuccessfulCreation] = useState(false);
    const [complete, setComplete] = useState(false);
    const [secondFactor, setSecondFactor] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const { isLoaded, signIn, setActive } = useSignIn();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Sign out on mount to ensure clean state for password reset
    useEffect(() => {
        if (isLoaded) {
            signOut();
        }
    }, [isLoaded, signOut]);

    if (!isLoaded) {
        return null;
    }

    // Step 1: Send Reset Code
    const create = async (e) => {
        e.preventDefault();
        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: email,
            });
            setSuccessfulCreation(true);
            setError(null);
        } catch (err) {
            console.error('error', err.errors ? err.errors[0] : err);
            setError(err.errors ? err.errors[0].longMessage : "Something went wrong. Please try again.");
        }
    };

    // Step 2: Reset Password
    const reset = async (e) => {
        e.preventDefault();
        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
                password,
            });

            if (result.status === 'complete') {
                setActive({ session: result.createdSessionId });
                setComplete(true);
                setError(null);
                setTimeout(() => {
                    navigate('/');
                }, 2000); // Redirect after success message
            } else {
                console.log(result);
            }
        } catch (err) {
            console.error('error', err.errors ? err.errors[0] : err);
            setFailedAttempts(prev => prev + 1);
            if (failedAttempts >= 2) {
                // If failed too many times, maybe suggest restarting or resending
                setError("Multiple failed attempts. Please restart the process or check your code.");
            } else {
                setError(err.errors ? err.errors[0].longMessage : "Invalid code or password.");
            }
        }
    };

    if (complete) {
        return (
            <AuthLayout>
                <div className="w-full">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('pass_reset_success_title')}</h1>
                        <p className="text-gray-500 text-sm">{t('pass_reset_success_desc')}</p>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="w-full">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('forgot_pass_title')}</h1>
                    <p className="text-gray-500 text-sm">{successfulCreation ? t('forgot_pass_desc_code') : t('forgot_pass_desc_email')}</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center border border-red-100">{error}</div>}

                {!successfulCreation ? (
                    <form onSubmit={create}>
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
                        <button type="submit" className="w-full p-3.5 bg-[#00e572] hover:bg-[#00cc66] text-[#0a2e1d] rounded-lg text-base font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer mt-5">
                            {t('send_reset_code')} <span>→</span>
                        </button>
                    </form>
                ) : (
                    <form onSubmit={reset}>
                        <div className="mb-5">
                            <label htmlFor="code" className="block text-sm font-semibold text-gray-900 mb-2">{t('reset_code_label')}</label>
                            <div className="relative">
                                <input
                                    id="code"
                                    type="text"
                                    placeholder={t('enter_code')}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    className="w-full p-3 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#00e572] focus:ring-4 focus:ring-[#00e572]/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="mb-5">
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">{t('new_pass_label')}</label>
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
                            {t('reset_pass_btn')} <span>→</span>
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>{t('remember_pass')} <Link to="/login" className="text-[#16a34a] font-bold hover:underline ml-1">{t('back_to_login')}</Link></p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;
