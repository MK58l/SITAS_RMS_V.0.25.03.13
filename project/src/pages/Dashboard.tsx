import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect based on user role
  if (user.user_metadata.role === 'admin') {
    return <Navigate to="/admin" />;
  } else if (user.user_metadata.role === 'staff') {
    return <Navigate to="/staff" />;
  }

  // For regular customers
  return <Navigate to="/" />;
};

export default Dashboard;