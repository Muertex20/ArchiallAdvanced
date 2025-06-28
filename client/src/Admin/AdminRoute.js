import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCookie } from '../Cookies';

const AdminRoute = ({ children }) => {
  const rol = getCookie('rol');
  if (rol !== 'admin') {
    return <Navigate to="/menu" replace />;
  }
  return children;
};

export default AdminRoute;