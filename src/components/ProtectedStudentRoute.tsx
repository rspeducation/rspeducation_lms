import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedStudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isStudent = localStorage.getItem('studentAuth') === 'true';
  return isStudent ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedStudentRoute;
