import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const AdminLogin: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', admin_id: '', showPassword: false });

  // Kick already-authenticated admin to dashboard
  useEffect(() => {
    const alreadyAdmin = localStorage.getItem('adminAuth') === 'true';
    if (alreadyAdmin) navigate('/admin/dashboard', { replace: true });
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase
      .from('admins')
      .select('admin_id, email, display_name, enabled')
      .eq('enabled', true)
      .eq('admin_id', formData.admin_id.trim().toUpperCase())
      .ilike('email', formData.email.trim())
      .single();

    setIsLoading(false);

    if (error || !data) {
      toast({
        title: 'Login Failed',
        description: 'Invalid admin email or admin ID.',
        variant: 'destructive',
      });
      return;
    }

    await login(
      {
        id: data.admin_id,
        name: data.display_name,
        email: data.email,
        loginTime: new Date().toISOString(),
      },
      'admin'
    );

    localStorage.setItem('adminAuth', 'true');
    localStorage.setItem(
      'adminUser',
      JSON.stringify({
        admin_id: data.admin_id,
        email: data.email,
        name: data.display_name,
        loginTime: new Date().toISOString(),
      })
    );

    toast({
      title: 'Login Successful',
      description: `Welcome, ${data.display_name}!`,
      variant: 'default',
    });

    navigate('/admin/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* <div className="flex items-center justify-center space-x-2 mb-4">
          <Shield className="h-8 w-8 text-indigo-600" />
          <h2 className="text-2xl font-bold">AzureRaj Admin Login</h2>
        </div> */}

        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Login using your registered Email and Admin ID (8-letter code).
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="pl-10"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              {/* Admin ID as password with Eye/EyeOff toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin ID (Password)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="admin_id"
                    name="admin_id"
                    type={formData.showPassword ? 'text' : 'password'}
                    required
                    maxLength={8}
                    className="pl-10 pr-10 uppercase tracking-widest"
                    value={formData.admin_id}
                    onChange={handleInputChange}
                    placeholder="ABCDEFGH"
                  />

                  {/* Icon button replaces the old text button */}
                  <button
                    type="button"
                    aria-label={formData.showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-2 p-2 outline-none focus:outline-none focus:ring-0 hover:bg-transparent active:bg-transparent border-0"
                    onClick={() => setFormData(f => ({ ...f, showPassword: !f.showPassword }))}
                    tabIndex={-1}
                  >
                    {formData.showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                </div>
                <span className="text-xs text-gray-500">
                  Enter the 8-letter admin ID given during registration.
                </span>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 text-white" disabled={isLoading}>
                {isLoading ? 'Authenticating...' : 'Login'}
              </Button>
            </form>

            {/* Optional: student login link for convenience */}
            <div className="mt-6 text-center">
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Student Login →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
