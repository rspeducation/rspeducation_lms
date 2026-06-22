import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdmin = localStorage.getItem('adminAuth') === 'true';
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

export default ProtectedAdminRoute;
