import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import CareerPath from './pages/CareerPath';
import Recommendations from './pages/Recommendations';
import ChatbotPage from './pages/ChatbotPage';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

// Protected Route Component that checks if user has data
const ProtectedRoute = ({ children, checkData = false }) => {
  const { isSignedIn, user, isLoaded } = useUser();
  const [hasData, setHasData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserData = async () => {
      if (!isLoaded || !isSignedIn) {
        setLoading(false);
        return;
      }

      if (checkData && user?.primaryEmailAddress?.emailAddress) {
        // Check if user wants to retake survey (bypass data check)
        const urlParams = new URLSearchParams(window.location.search);
        const retakeSurvey = urlParams.get('retake') === 'true';
        
        if (retakeSurvey) {
          // User explicitly wants to retake survey, allow access
          console.log('ProtectedRoute: Retake survey requested, allowing access to onboarding');
          setHasData(false); // Treat as no data to allow onboarding
          setLoading(false);
          return;
        }

        try {
          const response = await axios.get(`http://localhost:5000/api/users/${user.primaryEmailAddress.emailAddress}`);
          // Check if user has completed onboarding - check for any meaningful data
          const userData = response.data;
          const hasCompletedOnboarding = 
            (userData?.academicDetails && (userData.academicDetails.board10 || userData.academicDetails.stream12)) ||
            (userData?.interests && (
              userData.interests.selectedInterests?.length > 0 ||
              userData.interests.strengths?.length > 0 ||
              (userData.interests.subjectLikes && Object.keys(userData.interests.subjectLikes).length > 0)
            )) ||
            (userData?.chatbotData && userData.chatbotData.careerPath) ||
            (userData?.location && (userData.location.state || userData.location.district)) ||
            (userData?.graduationDetails && userData.graduationDetails.field);
          console.log('ProtectedRoute user data check:', { 
            userData, 
            hasCompletedOnboarding,
            hasInterests: userData?.interests?.selectedInterests?.length > 0,
            hasStrengths: userData?.interests?.strengths?.length > 0,
            hasSubjectLikes: userData?.interests?.subjectLikes && Object.keys(userData.interests.subjectLikes).length > 0
          });
          setHasData(hasCompletedOnboarding);
        } catch (error) {
          console.error('Error checking user data in ProtectedRoute:', error);
          // User doesn't exist or error - treat as no data
          setHasData(false);
        }
      } else {
        setHasData(true); // Don't check data, just allow access
      }
      setLoading(false);
    };

    checkUserData();
  }, [isLoaded, isSignedIn, user, checkData]);

  // If checking onboarding and user has data (and not retaking), redirect to dashboard
  if (checkData && hasData === true && !loading) {
    const urlParams = new URLSearchParams(window.location.search);
    const retakeSurvey = urlParams.get('retake') === 'true';
    
    if (!retakeSurvey) {
      console.log('ProtectedRoute: User has data, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (!isLoaded || loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Root redirect component
const RootRedirect = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const [hasData, setHasData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserData = async () => {
      if (!isLoaded) {
        setLoading(false);
        return;
      }

      if (!isSignedIn) {
        setLoading(false);
        return;
      }

      if (user?.primaryEmailAddress?.emailAddress) {
        try {
          const response = await axios.get(`http://localhost:5000/api/users/${user.primaryEmailAddress.emailAddress}`);
          const userData = response.data;
          // Check if user has completed onboarding - check for any meaningful data
          const hasCompletedOnboarding = 
            (userData?.academicDetails && (userData.academicDetails.board10 || userData.academicDetails.stream12)) ||
            (userData?.interests && (
              userData.interests.selectedInterests?.length > 0 ||
              userData.interests.strengths?.length > 0 ||
              (userData.interests.subjectLikes && Object.keys(userData.interests.subjectLikes).length > 0)
            )) ||
            (userData?.chatbotData && userData.chatbotData.careerPath) ||
            (userData?.location && (userData.location.state || userData.location.district)) ||
            (userData?.graduationDetails && userData.graduationDetails.field);
          console.log('User data check:', { 
            userData, 
            hasCompletedOnboarding,
            hasInterests: userData?.interests?.selectedInterests?.length > 0,
            hasStrengths: userData?.interests?.strengths?.length > 0,
            hasSubjectLikes: userData?.interests?.subjectLikes && Object.keys(userData.interests.subjectLikes).length > 0
          });
          setHasData(hasCompletedOnboarding);
        } catch (error) {
          console.error('Error checking user data:', error);
          // If 404, user doesn't exist - no data
          // If other error, assume no data
          setHasData(false);
        }
      }
      setLoading(false);
    };

    checkUserData();
  }, [isLoaded, isSignedIn, user]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" />;
  }

  // If user has data, go to dashboard; otherwise go to onboarding
  return <Navigate to={hasData ? "/dashboard" : "/onboarding"} />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/onboarding" element={<ProtectedRoute checkData={true}><Onboarding /></ProtectedRoute>} />
      <Route path="/roadmap" element={<ProtectedRoute><CareerPath /></ProtectedRoute>} />
      <Route path="/roadmap/:jobId" element={<ProtectedRoute><CareerPath /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
      <Route path="/chatbot" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
