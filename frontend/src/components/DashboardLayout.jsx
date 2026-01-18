import React, { useState } from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { Bot, Star, Map, Menu, X, LogOut, LayoutDashboard, Download } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import { generateDashboardPDF } from '../utils/generatePDF';

const DashboardLayout = ({ children }) => {
    const { user } = useUser();
    const { t } = useTranslation();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleDownloadSummary = async () => {
        if (!user?.primaryEmailAddress?.emailAddress) {
            alert('Please sign in to download your summary.');
            return;
        }

        setIsDownloading(true);
        try {
            const email = user.primaryEmailAddress.emailAddress;
            
            // Fetch all necessary data
            const [userResponse, jobsResponse] = await Promise.all([
                fetch(`http://localhost:5000/api/users/${email}`),
                fetch(`http://localhost:5000/api/jobs/recommendations/${email}`)
            ]);

            const userData = userResponse.ok ? await userResponse.json() : null;
            const recommendedJobs = jobsResponse.ok ? await jobsResponse.json() : [];

            // Fetch roadmaps for top recommended jobs (limit to 5 to avoid too many requests)
            const topJobs = recommendedJobs.slice(0, 5);
            const roadmapPromises = topJobs.map(job => {
                const jobId = job.id || job._id;
                if (!jobId) return null;
                return fetch(`http://localhost:5000/api/roadmap/job/${jobId}?email=${encodeURIComponent(email)}`)
                    .then(res => res.ok ? res.json() : null)
                    .catch(() => null);
            });

            const roadmaps = await Promise.all(roadmapPromises);

            // Attach roadmap data to jobs
            const jobsWithRoadmaps = topJobs.map((job, index) => ({
                ...job,
                roadmap: roadmaps[index] || null
            }));

            // Generate and download PDF
            await generateDashboardPDF(userData, jobsWithRoadmaps, user);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const sidebarItems = [
        { icon: LayoutDashboard, label: t('nav_dashboard'), path: "/dashboard" },
        { icon: Bot, label: t('nav_chatbot'), path: "/chatbot" },
        { icon: Star, label: t('nav_recommendations'), path: "/recommendations" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-8 text-[#0a2e1d]">
                        <div className="w-8 h-8 bg-[#00e572] rounded-lg flex items-center justify-center text-white font-bold">
                            VP
                        </div>
                        <span className="text-xl font-bold tracking-tight">VidyaPath</span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${location.pathname === item.path
                                    ? 'bg-[#00e572]/10 text-[#00e572] font-semibold'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="border-t border-gray-100 pt-6 space-y-3">
                        {/* Download Summary Button */}
                        <button
                            onClick={handleDownloadSummary}
                            disabled={isDownloading}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#00e572] text-white hover:bg-[#00c462] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download size={18} />
                            {isDownloading ? t('nav_downloading') || 'Downloading...' : t('nav_download_summary') || 'Download Summary'}
                        </button>

                        {/* User Profile Section */}
                        <div className="flex items-center gap-3 mb-4">
                            <img
                                src={user?.imageUrl}
                                alt="Profile"
                                className="w-10 h-10 rounded-full border border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {user?.fullName}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                    {user?.primaryEmailAddress?.emailAddress}
                                </p>
                            </div>
                        </div>
                        <SignOutButton>
                            <button className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium">
                                <LogOut size={18} />
                                {t('nav_sign_out')}
                            </button>
                        </SignOutButton>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between lg:hidden">
                    <div className="flex items-center gap-2">
                        <button onClick={toggleSidebar} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Menu size={24} />
                        </button>
                        <span className="font-bold text-gray-900">VidyaPath</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                        <img src={user?.imageUrl} alt="Profile" />
                    </div>
                </header>

                <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
                    {/* Header for Desktop */}
                    <div className="hidden lg:flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {location.pathname === '/dashboard' ? t('dashboard_my_dashboard') : location.pathname === '/chatbot' ? t('nav_chatbot') : location.pathname.includes('roadmap') ? t('dashboard_career_roadmap') : t('dashboard_overview')}
                            </h1>
                            {location.pathname !== '/dashboard' && (
                                <p className="text-gray-500 text-sm">{t('dashboard_welcome', { name: user?.firstName })}</p>
                            )}
                        </div>
                        <LanguageSelector />
                    </div>

                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
