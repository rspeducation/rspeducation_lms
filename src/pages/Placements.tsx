// src/pages/Placements.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Building, TrendingUp, Award, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

type Placement = {
  id: string;
  name: string;
  education: string;
  company: string;
  package: string;     // e.g., "₹10 LPA"
  role: string;
  location: string;
  created_at: string;
};

const parseLpa = (pkg: string): number | null => {
  if (!pkg) return null;
  const m = pkg.replace(/,/g, '').match(/([\d.]+)\s*LPA/i);
  return m ? parseFloat(m[1]) : null;
};

const Placements: React.FC = () => {
  const [items, setItems] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // Determine visibility: student session (Supabase Auth) or admin flag
  useEffect(() => {
    let ignore = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const hasStudentSession = !!data.session;
      const hasAdminFlag = localStorage.getItem('adminAuth') === 'true';
      if (!ignore) setIsAuthed(hasStudentSession || hasAdminFlag);
    })();
    return () => { ignore = true; };
  }, []);

  // Load placements
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('placements')
        .select('id,name,education,company,package,role,location,created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!ignore) {
        if (error) {
          console.error('Failed to load placements:', error.message);
          setItems([]);
        } else {
          setItems((data ?? []) as Placement[]);
        }
        setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // Derive stats
  const { total, avgLpa, maxLpa } = useMemo(() => {
    const lpas = items
      .map(r => parseLpa(r.package))
      .filter((n): n is number => typeof n === 'number' && !isNaN(n));
    const total = items.length;
    const avg = lpas.length ? (lpas.reduce((a, b) => a + b, 0) / lpas.length) : 0;
    const max = lpas.length ? Math.max(...lpas) : 0;
    return { total, avgLpa: avg, maxLpa: max };
  }, [items]);

  const placementStats = useMemo(() => ([
    { label: 'Total Placements', value: `${total}`, icon: <Award className="h-6 w-6" /> },
    { label: 'Average Package', value: avgLpa ? `₹${avgLpa.toFixed(1)} LPA` : '—', icon: <TrendingUp className="h-6 w-6" /> },
    { label: 'Highest Package', value: maxLpa ? `₹${maxLpa.toFixed(1)} LPA` : '—', icon: <Building className="h-6 w-6" /> },
    { label: 'Locations Covered', value: `${new Set(items.map(i => i.location)).size}+`, icon: <MapPin className="h-6 w-6" /> }
  ]), [total, avgLpa, maxLpa, items]);

  const recentPlacements = useMemo(() => items.slice(0, 12), [items]);

  const topCompanies = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of items) counts.set(r.company, (counts.get(r.company) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name]) => name);
  }, [items]);

  return (
    <div className="min-h-screen ">
      {/* Hero */}
      <section className="relative text-white py-16" style={{ backgroundImage: 'url(/bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-blue-600/80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Student Placements</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Celebrating the success of our students who have transformed their careers with Azure expertise
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {placementStats.map((stat, i) => (
              <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit text-azure">
                    {stat.icon}
                  </div>
                  <CardTitle className="text-3xl font-bold text-azure">{stat.value}</CardTitle>
                  <CardDescription className="text-gray-600">{stat.label}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Companies */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Top Recruiting Companies</h2>
            <p className="text-lg text-gray-600">Our students are placed in leading technology companies</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {topCompanies.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">{loading ? 'Loading…' : 'No companies yet'}</div>
            ) : (
              topCompanies.map((c, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
                  <div className="text-lg font-semibold text-gray-900">{c}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Recent Placements (visible only to logged-in admin or student) */}
      {isAuthed && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Recent Success Stories</h2>
              <p className="text-lg text-gray-600">Meet our recently placed students and their achievements</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPlacements.length === 0 ? (
                <div className="col-span-full text-center text-gray-500">{loading ? 'Loading…' : 'No placements yet'}</div>
              ) : recentPlacements.map((placement) => (
                <Card key={placement.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-azure rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {placement.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{placement.name}</CardTitle>
                        <CardDescription>{placement.education}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Company:</span>
                        <Badge variant="outline" className="font-semibold">{placement.company}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Package:</span>
                        <span className="font-bold text-green-600">{placement.package}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Role:</span>
                        <span className="text-sm font-medium">{placement.role}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Location:</span>
                        <span className="text-sm">{placement.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Optional prompt for public users */}
      {!isAuthed && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
            Sign in to view recent success stories.
          </div>
        </section>
      )}

      {/* Placement Process */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Placement Process</h2>
            <p className="text-lg text-gray-600">Comprehensive support throughout your job search journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Skill Assessment', description: 'Evaluate your technical skills and identify areas for improvement' },
              { step: '2', title: 'Resume Building', description: 'Create professional resume highlighting your Azure expertise' },
              { step: '3', title: 'Interview Preparation', description: 'Mock interviews and technical round preparation' },
              { step: '4', title: 'Job Placement', description: 'Connect with our hiring partners and secure your dream job' }
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-azure rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                  {process.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{process.title}</h3>
                <p className="text-gray-600 text-sm">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Placements;
