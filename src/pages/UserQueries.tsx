// src/pages/UserQueries.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, XCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

type RequestStatus = 'pending' | 'contacted' | 'enrolled' | 'rejected';

type DBRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  district: string;
  qualification: string;
  status: RequestStatus | null;
  submitted_at: string | null;
};

type EnrollmentRequest = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  district: string;
  qualification: string;
  submittedAt: string;
  status: RequestStatus;
};

const UserQueries: React.FC = () => {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Simple admin guard (same as other admin pages)
  useEffect(() => {
    const isAdminAuth = localStorage.getItem('adminAuth');
    if (!isAdminAuth || isAdminAuth !== 'true') {
      navigate('/admin/login');
      return;
    }
    void loadEnrollmentRequests();
  }, [navigate]);

  const mapRow = (r: DBRow): EnrollmentRequest => ({
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    district: r.district,
    qualification: r.qualification,
    status: (r.status ?? 'pending') as RequestStatus,
    submittedAt: r.submitted_at ?? new Date().toISOString(),
  });

  const loadEnrollmentRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('userqueries')
        .select('id, full_name, email, phone, district, qualification, status, submitted_at')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setRequests((data ?? []).map(mapRow));
    } catch (err: any) {
      toast({ title: 'Load Failed', description: err?.message ?? 'Could not load user queries', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: RequestStatus) => {
    const prev = requests;
    const next = prev.map(r => (r.id === requestId ? { ...r, status: newStatus } : r));
    setRequests(next);

    try {
      const { error } = await supabase
        .from('userqueries')
        .update({ status: newStatus })
        .eq('id', requestId);
      if (error) throw error;

      toast({ title: 'Status Updated', description: `Request status changed to ${newStatus}`, variant: 'default' });
    } catch (err: any) {
      setRequests(prev); // revert optimistic update
      toast({ title: 'Update Failed', description: err?.message ?? 'Could not update status', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'enrolled': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pending = useMemo(() => requests.filter(r => r.status === 'pending').length, [requests]);
  const contacted = useMemo(() => requests.filter(r => r.status === 'contacted').length, [requests]);
  const enrolled = useMemo(() => requests.filter(r => r.status === 'enrolled').length, [requests]);
  const rejected = useMemo(() => requests.filter(r => r.status === 'rejected').length, [requests]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className='hidden sm:flex'>Back to Dashboard</span>
              </Button>
              <Mail className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">User Queries</h1>
                <p className="text-sm text-gray-600">Manage enrollment <span className='hidden sm:flex'>requests and user inquiries</span></p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadEnrollmentRequests()} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-yellow-600">{pending}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Contacted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-blue-600">{contacted}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Enrolled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-green-600">{enrolled}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-red-600">{rejected}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrollment Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Requests</CardTitle>
            <CardDescription>Total: {requests.length} requests</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
                <p className="text-gray-600">Enrollment requests will appear here when users submit the form</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.id.slice(0, 8)}</TableCell>
                      <TableCell>{r.fullName}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>{r.phone}</TableCell>
                      <TableCell>{r.district}</TableCell>
                      <TableCell><Badge variant="outline">{r.qualification}</Badge></TableCell>
                      <TableCell>{new Date(r.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell><Badge className={getStatusColor(r.status)}>{r.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateRequestStatus(r.id, 'contacted')}
                            disabled={r.status === 'contacted'}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateRequestStatus(r.id, 'enrolled')}
                            disabled={r.status === 'enrolled'}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateRequestStatus(r.id, 'rejected')}
                            disabled={r.status === 'rejected'}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserQueries;
