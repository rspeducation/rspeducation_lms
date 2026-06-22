import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Courses from "./pages/Courses";
import Placements from "./pages/Placements";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import DemoAdminLogin from "./pages/DemoAdminLogin"
import AdminDashboard from "./pages/AdminDashboard";
import StudentManagement from "./pages/StudentManagement";
import CourseContentManagement from "./pages/CourseContentManagement";
import AdminInterviews from "./pages/AdminInterviews";
import BatchManagement from "./pages/BatchManagement";
import UserQueries from "./pages/UserQueries";
import StudentDashboard from "./pages/StudentDashboard";
import CourseViewer from "./pages/CourseViewer";
import ResumeTemplates from "./pages/ResumeTemplates";
import StudentInterviews from "./pages/StudentInterviews";
import AdminManagement from './pages/AdminManagement';
import AdminPlaced from './pages/AdminPlacements';
import StudentEnrollmentPage from "./pages/StudentEnrollmentPage";
import NotFound from "./pages/NotFound";

// Import your new ProtectedAdminRoute
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedStudentRoute from "./components/ProtectedStudentRoute";
import BackButtonHandler from "./components/BackButtonHandler";
import RootRedirector from "./components/RootRedirector";
import StudentJoinAdminPage from "./pages/StudentJoinAdminPage";
import CopyrightPolicy from "./pages/CopyrightPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";

import Landing from "./pages/Interview/Landing";
import Index from "./pages/Interview/Index";
import NotFounds from "./pages/Interview/NotFound";
import AzureNetworking from "./pages/Interview/AzureNetworking";
import AzureIaaS from "./pages/Interview/AzureIaaS";
import AzurePaaS from "./pages/Interview/AzurePaaS";
import AzureSaaS from "./pages/Interview/AzureSaaS";
import AzureDevOps from "./pages/Interview/AzureDevOps";
import CompleteInterview from "./pages/Interview/CompleteInterview";


const queryClient = new QueryClient();

// 👇 Wrapper to control footer & navbar visibility
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const path = location.pathname;

  // Existing conditions
  const isAdminRoute = path.startsWith("/admin");
  const isStudentRoute = path.startsWith("/student");
  const isJoinPage = path === "/join";
  const isLoginPage = path === "/Enrollment_form";
  const isAdminLoginPage = path === "/admin/login";
  const isInterviewpage = path === "/interview";

  // 👇 NEW: Pages that should also hide Navbar/Footer
  const isProtectedLearningPage =
    [
      "/rspai",
      "/azure-networking",
      "/azure-iaas",
      "/azure-paas",
      "/azure-saas",
      "/azure-devops",
      "/complete-interview",
    ].includes(path);

  // 👇 Hide footer and navbar for these pages
  const hideFooter =
    isAdminRoute ||
    isStudentRoute ||
    isJoinPage ||
    isLoginPage ||
    isAdminLoginPage ||
    isProtectedLearningPage || isInterviewpage ;

  const hideNavbar =
    isLoginPage || isInterviewpage;

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNavbar && <Navbar />}
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
              <BackButtonHandler />
            <Routes>
              {/* Public routes */}
              {/* <Route path="/" element={<Home />} /> */}
            <Route path="/" element={<RootRedirector />} />
            <Route path="/home" element={<Home />} />

              <Route path="/about" element={<About />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/placements" element={<Placements />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/login" element={<Login />} />
              <Route path="/DemoAdminLogin" element={<DemoAdminLogin/>} />
              <Route path="/Enrollment_form" element={<StudentEnrollmentPage />} />
              {/* <Route path="/Admin/student_joins" element={<StudentJoinAdminPage />} /> */}
              <Route path="/copyright-policy" element={<CopyrightPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />  
              <Route path="/terms-of-service" element={<TermsAndConditions />} />


                    <Route
                      path="/rspai"
                      element={
                        <ProtectedStudentRoute>
                          <Landing />
                        </ProtectedStudentRoute>
                      }
                    />

                    <Route
                      path="/interview"
                      element={
                        <ProtectedStudentRoute>
                          <Index />
                        </ProtectedStudentRoute>
                      }
                    />

                    <Route
                      path="/azure-networking"
                      element={
                        <ProtectedStudentRoute>
                          <AzureNetworking />
                        </ProtectedStudentRoute>
                      }
                    />

                    <Route
                      path="/azure-iaas"
                      element={
                        <ProtectedStudentRoute>
                          <AzureIaaS />
                        </ProtectedStudentRoute>
                      }
                    />

                    <Route
                      path="/azure-paas"
                      element={
                        <ProtectedStudentRoute>
                          <AzurePaaS />
                        </ProtectedStudentRoute>
                      }
                    />

                    <Route
                      path="/azure-saas"
                      element={
                        <ProtectedStudentRoute>
                          <AzureSaaS />
                        </ProtectedStudentRoute>
                      }
                    />

                    <Route
                      path="/azure-devops"
                      element={
                        <ProtectedStudentRoute>
                          <AzureDevOps />
                        </ProtectedStudentRoute>
                      }
                    />

                    <Route
                      path="/complete-interview"
                      element={
                        <ProtectedStudentRoute>
                          <CompleteInterview />
                        </ProtectedStudentRoute>
                      }
                    />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route
                      path=""
                      element={
                        <ProtectedStudentRoute>
                          <NotFounds />
                        </ProtectedStudentRoute>
                      }
                    />



              {/* Admin routes (protected) */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/students" element={
                <ProtectedAdminRoute>
                  <StudentManagement />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/students/:batchName" element={
                <ProtectedAdminRoute>
                  <StudentManagement />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/manage" element={
                <ProtectedAdminRoute>
                  <AdminManagement />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/content" element={
                <ProtectedAdminRoute>
                  <CourseContentManagement />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/content/:batchName" element={
                <ProtectedAdminRoute>
                  <CourseContentManagement />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/interviews" element={
                <ProtectedAdminRoute>
                  <AdminInterviews />
                </ProtectedAdminRoute>
              } />\

              <Route path="/admin/placed" element={
                <ProtectedAdminRoute>
                  <AdminPlaced />
                </ProtectedAdminRoute>
              } />



              <Route path="/admin/batches" element={
                <ProtectedAdminRoute>
                  <BatchManagement />
                </ProtectedAdminRoute>
              } />
              
              <Route path="/admin/queries" element={
                <ProtectedAdminRoute>
                  <UserQueries />
                </ProtectedAdminRoute>
              } />

        {/* Student routes (protected) */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedStudentRoute>
                    <StudentDashboard />
                  </ProtectedStudentRoute>
                }
              />

              <Route
                path="/student/courses"
                element={
                  <ProtectedStudentRoute>
                    <CourseViewer />
                  </ProtectedStudentRoute>
                }
              />

              <Route
                path="/student/courses/:batchName"
                element={
                  <ProtectedStudentRoute>
                    <CourseViewer />
                  </ProtectedStudentRoute>
                }
              />

              <Route
                path="/student/ResumeBuilder"
                element={
                  <ProtectedStudentRoute>
                    <ResumeTemplates />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="/Admin/ResumeBuilder"
                element={
                  <ProtectedAdminRoute>
                    <ResumeTemplates />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/student_joins"
                element={
                  <ProtectedAdminRoute>
                    <StudentJoinAdminPage />
                  </ProtectedAdminRoute>
                }
              />

              <Route
                path="/student/interviews"
                element={
                  <ProtectedStudentRoute>
                    <StudentInterviews />
                  </ProtectedStudentRoute>
                }
              />
              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
