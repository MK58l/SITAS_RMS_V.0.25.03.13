import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored toast message
    const message = localStorage.getItem("toastMessage");
    if (message) {
      toast.success(message); // Show the toast
      localStorage.removeItem("toastMessage"); // Remove it after showing
    }

    // Ensure user is loaded before redirecting
    if (user) {
      setTimeout(() => {
        if (user.user_metadata.role === 'admin') {
          setRedirectTo('/admin');
        } else if (user.user_metadata.role === 'staff') {
          setRedirectTo('/staff');
        } else {
          setRedirectTo('/');
        }
      }, 1000); // 1 second delay to allow toast to be seen
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect after toast is shown
  if (redirectTo) {
    return <Navigate to={redirectTo} />;
  }

  return <div className="p-6 text-center">Loading...</div>;
};

export default Dashboard;