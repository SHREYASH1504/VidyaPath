import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import { Briefcase, MapPin, DollarSign, Building, Clock, CheckCircle } from 'lucide-react';

const Recommendations = () => {
    const { user } = useUser();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (user?.primaryEmailAddress?.emailAddress) {
                try {
                    const email = user.primaryEmailAddress.emailAddress;
                    // Fetch user data
                    const userResponse = await fetch(`http://localhost:5000/api/users/${email}`);
                    if (userResponse.ok) {
                        const data = await userResponse.json();
                        setUserData(data);
                    }

                    // Fetch recommended jobs from backend
                    const jobsResponse = await fetch(`http://localhost:5000/api/jobs/recommendations/${email}`);
                    if (jobsResponse.ok) {
                        const jobsData = await jobsResponse.json();
                        console.log("Recommended jobs:", jobsData);
                        setRecommendedJobs(jobsData || []);
                    } else {
                        const errorData = await jobsResponse.json().catch(() => ({}));
                        console.error("Failed to fetch recommended jobs:", errorData);
                        setRecommendedJobs([]);
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [user]);

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('rec_jobs_title')}</h1>
                    <p className="text-gray-500 mt-2">{t('rec_jobs_desc')}</p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">{t('rec_finding')}</div>
                ) : (
                    <div className="space-y-8">
                        {/* Top 5 Recommended Jobs */}
                        {recommendedJobs.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Briefcase size={24} className="text-[#00e572]" />
                                    Top 5 Recommended Jobs
                                </h2>
                                <div className="grid gap-6">
                                    {recommendedJobs.slice(0, 5).map((job) => (
                                        <div
                                            key={job.id || job._id}
                                            onClick={() => navigate(`/roadmap/${job.id || job._id}`)}
                                            className="bg-white p-6 rounded-2xl border-2 border-[#00e572]/20 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row gap-6 items-start md:items-center cursor-pointer relative"
                                        >
                                            {job.isChatbotRecommended && (
                                                <div className="absolute top-4 right-4 bg-[#00e572] text-white text-xs font-bold px-3 py-1 rounded-full">
                                                    AI Recommended
                                                </div>
                                            )}
                                            {/* Logo Placeholder */}
                                            <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-[#00e572]/10 transition-colors">
                                                <Building size={32} className="text-gray-400 group-hover:text-[#00e572]" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                    {job.title}
                                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <CheckCircle size={10} /> {job.match || 0}% {t('match_percentage')}
                                                    </span>
                                                </h3>
                                                <div className="text-gray-500 text-sm font-medium mb-3">{job.company}</div>

                                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                                    <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                                        <MapPin size={14} /> {job.location}
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                                        <Clock size={14} /> {job.type}
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                                        <DollarSign size={14} /> {job.salary || job.salaryRange}
                                                    </div>
                                                    {job.isRural && (
                                                        <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 text-green-700">
                                                            Rural Job
                                                        </div>
                                                    )}
                                                </div>

                                                {job.tags && job.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {job.tags.slice(0, 3).map((tag, idx) => (
                                                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Other Recommended Jobs */}
                        {recommendedJobs.length > 5 && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Briefcase size={24} className="text-gray-400" />
                                    Other Recommended Jobs
                                </h2>
                                <div className="grid gap-6">
                                    {recommendedJobs.slice(5).map((job) => (
                                        <div
                                            key={job.id || job._id}
                                            onClick={() => navigate(`/roadmap/${job.id || job._id}`)}
                                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row gap-6 items-start md:items-center cursor-pointer"
                                        >
                                            {/* Logo Placeholder */}
                                            <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-[#00e572]/10 transition-colors">
                                                <Building size={32} className="text-gray-400 group-hover:text-[#00e572]" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                    {job.title}
                                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <CheckCircle size={10} /> {job.match || 0}% {t('match_percentage')}
                                                    </span>
                                                </h3>
                                                <div className="text-gray-500 text-sm font-medium mb-3">{job.company}</div>

                                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                                    <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                                        <MapPin size={14} /> {job.location}
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                                        <Clock size={14} /> {job.type}
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                                        <DollarSign size={14} /> {job.salary || job.salaryRange}
                                                    </div>
                                                    {job.isRural && (
                                                        <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 text-green-700">
                                                            Rural Job
                                                        </div>
                                                    )}
                                                </div>

                                                {job.tags && job.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {job.tags.slice(0, 3).map((tag, idx) => (
                                                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!loading && recommendedJobs.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        {t('rec_no_jobs')}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Recommendations;
