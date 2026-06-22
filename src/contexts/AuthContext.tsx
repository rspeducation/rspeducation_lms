import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  course?: string;
  batch?: string;
  loginTime: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  userType: 'student' | 'admin' | null;
  loading: boolean;
  login: (userData: User, type: 'student' | 'admin') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'student' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true); // ✅ Added loading state

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check localStorage (fallback)
        const studentAuth = localStorage.getItem('studentAuth');
        const adminAuth = localStorage.getItem('adminAuth');
        const studentUser = localStorage.getItem('studentUser');
        const adminUser = localStorage.getItem('adminUser');

        if (studentAuth === 'true' && studentUser) {
          try {
            const userData = JSON.parse(studentUser);
            setUser(userData);
            setUserType('student');
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing student user data:', error);
            localStorage.removeItem('studentAuth');
            localStorage.removeItem('studentUser');
          }
        } else if (adminAuth === 'true' && adminUser) {
          try {
            const userData = JSON.parse(adminUser);
            setUser(userData);
            setUserType('admin');
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing admin user data:', error);
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('adminUser');
          }
        }

        // Check Supabase Auth session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('Found existing Supabase session:', session.user);

          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !profileError) {
            const { data: studentData } = await supabase
              .from('students')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            if (studentData) {
              const userData = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                course: studentData.course,
                batch: studentData.batch,
                loginTime: new Date().toISOString(),
              };
              setUser(userData);
              setUserType('student');
            }
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false); // ✅ Always stop loading
      }
    };

    checkAuth();
  }, []);

  const login = async (userData: User, type: 'student' | 'admin') => {
    try {
      console.log('AuthContext login called with:', { userData, type });
      setUser(userData);
      setUserType(type);

      if (type === 'student') {
        localStorage.setItem('studentAuth', 'true');
        localStorage.setItem('studentUser', JSON.stringify(userData));
      } else {
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminUser', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserType(null);
      localStorage.removeItem('studentAuth');
      localStorage.removeItem('studentUser');
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('adminUser');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    userType,
    loading, // ✅ Added loading to context
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
