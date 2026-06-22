import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RootRedirector() {
  const navigate = useNavigate();
  const { userType, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // 👈 Wait until auth finishes

    if (!isAuthenticated) {
      navigate("/home", { replace: true });
    } else if (userType === "student") {
      navigate("/student/dashboard", { replace: true });
    } else if (userType === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else {
      navigate("/home", { replace: true });
    }
  }, [loading, isAuthenticated, userType, navigate]);

  return null; // You can add a spinner or loader UI here
}
