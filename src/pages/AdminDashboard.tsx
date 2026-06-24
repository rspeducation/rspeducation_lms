import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, BookOpen, Award, LogOut, Settings, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { studentService, batchService } from '../lib/supabaseService'; // Your custom service (optional)
import { supabase } from '@/lib/supabase'; // For real placement count
import AppSkeleton from '@/components/AppSkeleton'; // Skeleton loader

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ totalStudents: 0, activeCourses: 0, placements: 0, successRate: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
      return;
    }

    const loadDashboardStats = async () => {
      try {
        setLoading(true);
        // Get students and batches (optionally via your own services)
        const { data: students, error: studentsError } = await studentService.getAllStudents();
        if (studentsError) throw studentsError;
        const { data: batches, error: batchesError } = await batchService.getAllBatches();
        if (batchesError) throw batchesError;
        const totalStudents = students?.length || 0;
        const activeBatches = batches?.length || 0;

        // Real placement count from Supabase
        const { count: placementsCount, error: placementsError } = await supabase
          .from("placements")
          .select("*", { count: "exact", head: true });
        if (placementsError) throw placementsError;

        setStats({
          totalStudents,
          activeCourses: activeBatches,
          placements: placementsCount ?? 0,
          successRate: totalStudents > 0 ? Math.round(((placementsCount ?? 0) / totalStudents) * 100) : 0
        });
      } catch (error: any) {
        console.error('Error loading dashboard stats:', error?.message || error);
        toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
    const interval = setInterval(loadDashboardStats, 30000);
    return () => clearInterval(interval);
  }, [user, navigate, toast]);

  const handleLogout = () => {
    logout();
    toast({ title: 'Logged Out', description: 'You have been successfully logged out', variant: 'default' });
    navigate('/admin/login');
  };

  if (!user || loading) return <AppSkeleton variant="dashboard" gridCount={8} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">RSP Educations Admin</h1>
                <p className="text-sm text-gray-600">Welcome, {user.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold">{stats.totalStudents}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Batches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-green-600" />
                <span className="text-2xl font-bold">{stats.activeCourses}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Placements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-purple-600" />
                <span className="text-2xl font-bold">{stats.placements}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Settings className="h-8 w-8 text-orange-600" />
                <span className="text-2xl font-bold">{stats.successRate}%</span>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* DASHBOARD SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Manage Students</span>
              </CardTitle>
              <CardDescription>
                Add students to batches and manage accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/admin/students')}>
                Batch-wise Students
              </Button>
            </CardContent>
          </Card>


          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                <span>Course Content</span>
              </CardTitle>
              <CardDescription>Batch-wise course materials management</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/admin/content')}>
                Batch Content
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span>Add Assignments </span>
              </CardTitle>
              <CardDescription>Batch-wise assignments & deadline control</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/admin/Assignment')}>
                Manage Assignemnt
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span>Fee Managaement </span>
              </CardTitle>
              <CardDescription>Batch-wise Fee Records</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/admin/FeeManagement')}>
                Manage Fee Records
              </Button>
            </CardContent>
          </Card>

          {/* Admin Management Section */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <span>Admin Manage</span>
              </CardTitle>
              <CardDescription>Add Admins and manage admin accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/admin/manage')}>
                Manage Admins
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-teal-600" />
                <span>User Queries</span>
              </CardTitle>
              <CardDescription>View and manage enrollment requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/admin/queries')}>
                View Queries
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span>Add Placements </span>
              </CardTitle>
              <CardDescription>View and manage Placement deatils</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/admin/placed')}>
                Manage Placements
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span>Interviews</span>
              </CardTitle>
              <CardDescription>View and manage student interviews</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/admin/interviews')}>
                Manage Interviews
              </Button>
            </CardContent>
          </Card>



          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-teal-600" />
                <span>Resume Builder</span>
              </CardTitle>
              <CardDescription>Professional resume templates for your career</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/Admin/ResumeBuilder')}>
                View Templates
              </Button>
            </CardContent>
          </Card>



          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span>Students Joins </span>
              </CardTitle>
              <CardDescription>Students Joins form deatils Download in Excel</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/Admin/Student_joins')}>
                View Joins
              </Button>

            </CardContent>
          </Card>


          {/* <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => window.open('https://interview-rsp-ai.netlify.app/', '_blank')}
                      >
                        Start Mock Interview
                  </Button> */}


        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
