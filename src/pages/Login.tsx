import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Cloud } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });
      if (authError || !auth?.user) {
        toast({ title: 'Login Failed', description: authError?.message || 'Invalid email or Student ID.', variant: 'destructive' });
        return;
      }

      const uid = auth.user.id;
      const { data: profile, error: pErr } = await supabase.from('users').select('id,name,email').eq('id', uid).single();
      if (pErr || !profile) {
        toast({ title: 'Login Failed', description: 'User profile not found.', variant: 'destructive' });
        return;
      }

      const { data: student, error: sErr } = await supabase
        .from('students')
        .select('course,batch,status,student_code')
        .eq('user_id', uid)
        .single();

      if (sErr || !student) {
        toast({ title: 'Access Denied', description: 'Student profile not found.', variant: 'destructive' });
        return;
      }

      if (student.status === 'inactive') {
        toast({ title: 'Access Restricted', description: 'This student account is inactive.', variant: 'destructive' });
        return;
      }

      // ✅ Store auth flag for ProtectedStudentRoute
      localStorage.setItem('studentAuth', 'true');

      // ✅ Optional: store student info for easy use later
      localStorage.setItem('studentProfile', JSON.stringify({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        course: student.course,
        batch: student.batch,
        studentCode: student.student_code,
      }));

      // Continue your normal login
      await login(
        { id: profile.id, name: profile.name, email: profile.email, course: student.course, batch: student.batch, studentCode: student.student_code, loginTime: new Date().toISOString() },
        'student'
      );

      toast({ title: 'Login Successful', description: `Welcome back, ${profile.name || 'Student'}!`, variant: 'default' });
      navigate('/student/dashboard');
    } catch (err: any) {
      toast({ title: 'Login Failed', description: err?.message ?? 'Unexpected error.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Cloud className="h-10 w-10 text-azure" />
            <div>
              <span className="text-4x2 font-bold text-azure">RSP Education</span>
              <p className="text-sm text-gray-600">Student Portal</p>
            </div>
          </div>
        </div> */}

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Enter credentials provided by admin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input id="email" name="email" type="email" required className="pl-10" value={formData.email} onChange={onChange} placeholder="Enter your email" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password (Student ID)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required className="pl-10 pr-10" value={formData.password} onChange={onChange} placeholder="Enter your Student ID" />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
                <p className="mt-1 text-gray-600 text-sm">Use your email and your 8-character Student ID as the password</p>
              </div>

              <Button type="submit" size="lg" className="w-full text-white" style={{ backgroundColor: '#F97923' }} onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E06A1F'} onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F97923'} disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/admin/login" className="text-azure hover:text-azure-dark font-medium">Admin Login →</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
