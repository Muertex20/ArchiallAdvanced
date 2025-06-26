import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCookie } from './Cookies';

const ProtectedRoute = ({ children }) => {
  const userId = getCookie('userId');
  if (!userId) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;