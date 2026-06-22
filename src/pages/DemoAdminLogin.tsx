import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const AdminLogin: React.FC = () => {
  // Local only, uses hardcoded credentials
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',      // e.g. admin email or user id
    password: '',      // the admin password (or admin_id)
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Static allowed admin credentials (replace with values as needed)
  const ADMIN_CREDENTIALS = [
    { username: 'rapswamy0@gamil.com', password: 'AzureRaj2024!' },
    // Example with admin_id style
    { username: 'admin@example.com', password: 'ABCDEFGH' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Check hardcoded admin credentials
    const user = ADMIN_CREDENTIALS.find(
      cred =>
        cred.username.toLowerCase() === formData.username.trim().toLowerCase() &&
        cred.password === formData.password.trim()
    );

    if (user) {
      // Store local admin flag and session info
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('adminUser', JSON.stringify({
        id: user.username,
        email: user.username,
        name: 'Administrator',
        loginTime: new Date().toISOString(),
      }));

      toast({
        title: 'Login Successful',
        description: 'Welcome to Admin Panel',
        variant: 'default',
      });

      navigate('/admin/dashboard');
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-10 w-10 text-red-600" />
            <div>
              <span className="text-2xl font-bold text-azure">AzureRaj</span>
              <p className="text-sm text-gray-600">Admin Portal</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
          <p className="mt-2 text-gray-600">
            Local (hardcoded) credential check, demo/dev only.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Administrator Access</CardTitle>
            <CardDescription>
              Enter your admin credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username / Email / Admin ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="pl-10"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter admin username/email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password (Admin Code)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password or admin code"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Sign in as Admin'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700">
              This login stores adminAuth and adminUser in localStorage on success, with no DB or API call.
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="text-center space-y-2">
          <Link to="/login" className="block text-azure hover:text-azure-dark font-medium">
            Student Login →
          </Link>
          <Link to="/" className="block text-gray-600 hover:text-azure">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
