// src/pages/student/StudentDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Award, LogOut, User, Video, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AppSkeleton from '@/components/AppSkeleton';

// Type for student profile
type StudentProfile = {
  id: string;
  name: string;
  email: string;
  course: string | null;
  batchName?: string | null;
  batch?: string | null;
  auth_user_id?: string;
};

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);



  // LOCALSTORAGE AUTH CHECK
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('studentAuth') === 'true';
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch student profile with batch name
  useEffect(() => {
    if (!user) return;
    let ignore = false;

    (async () => {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, batch_id, batches(name)')
        .eq('user_id', user.id)
        .single();

      if (!ignore) {
        if (!error && data) {
          setStudentProfile({
            id: data.id,
            name: data.name,
            email: data.email,
            course: data.batches?.name ?? null,
            batchName: data.batches?.name ?? null,
            batch: data.batches?.name ?? null,
            auth_user_id: user.id,
          });
          setBatchId(data.batch_id ?? null);
        } else {
          console.error('Failed to load student profile:', error);
        }
        setLoadingProfile(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [user]);

  // Logout handler
  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('studentAuth'); // REMOVE FLAG ON LOGOUT
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
      variant: 'default',
    });
    navigate('/login');
  };

  // Get resolved batch name
  const resolvedBatchName = useMemo(() => {
    return studentProfile?.batchName || studentProfile?.batch || null;
  }, [studentProfile]);

  // Use skeleton loader until user/profile are ready
  if (!user || loadingProfile) {
    return <AppSkeleton variant="dashboard" gridCount={4} />;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-azure" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
                <p className="text-sm text-gray-600">
                  Welcome, {studentProfile?.name || user.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Student Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-azure" />
              <span>My Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProfile ? (
              <div className="text-sm text-gray-600">Loading profile...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Student Name</p>
                  <p className="text-lg font-semibold">{studentProfile?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-lg">{studentProfile?.email || user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Batch</p>
                  <p className="text-lg">{resolvedBatchName || '—'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Course Materials */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>Course Materials</span>
              </CardTitle>
              <CardDescription>
                Access your course videos and articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  if (batchId) {
                    navigate(`/student/courses/${encodeURIComponent(batchId)}`);
                  } else {
                    navigate('/student/courses');
                  }
                }}
                disabled={loadingProfile}
              >
                View Materials
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span>Assignments</span>
              </CardTitle>
              <CardDescription>
                View subjects wise assignment portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate('/student/ViewAssigments')}
              >
                View Assignments
              </Button>
            </CardContent>
          </Card>


          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span>Fee Details</span>
              </CardTitle>
              <CardDescription>
                fee details for your course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate('/Student/FeeManagement')}
              >
                Fee Details
              </Button>
            </CardContent>
          </Card>


          {/* Resume Builder */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span>Resume Builder</span>
              </CardTitle>
              <CardDescription>
                Professional resume templates for your career
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate('/student/ResumeBuilder')}
              >
                View Templates
              </Button>
            </CardContent>
          </Card>

          {/* Mock Interview */}
          {/* <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Video className="h-5 w-5 text-orange-600" />
                <span>Mock Interview</span>
              </CardTitle>
              <CardDescription>
                Practice with AI-powered mock interviews
              </CardDescription>
            </CardHeader>
            <CardContent>

               <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate('/rspai')}
              > 
        
                Start Mock Interview
              </Button>
            </CardContent>
          </Card> */}

          {/* Interview Schedule */}
          {/* <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span>Interview Manage</span>
              </CardTitle>
              <CardDescription>
                Schedule and manage your job interviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate('/student/interviews')}
              >
                Schedule Interviews
              </Button>
            </CardContent>
          </Card> */}
        </div>

        {/* Notice Section */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">📚 Coming Soon</h3>
          <p className="text-sm text-blue-700">
            Course materials, discussion forums, and placement updates will be available once the admin adds content to the system.
          </p>
        </div>
      </div>
    </div>
  );
};


export default StudentDashboard;

{/* <Button
                className="w-full"
                variant="outline"
                onClick={() => window.open('https://azureraju.com/rspai', '_blank')}
              >
                Start Mock Interview
              </Button> */}
