import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, Building, User,
  Search, Filter, CheckCircle, XCircle, AlertCircle, Mail, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AppSkeleton from '@/components/AppSkeleton';
import { supabase } from '@/lib/supabase';

// Add these for download support in app
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import write_blob from "capacitor-blob-writer";
import { FileOpener } from "@capacitor-community/file-opener";

type UiInterview = {
  id: string;
  studentName: string;
  date: string;
  time: string;
  company: string;
  round: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  result?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

function normalizeRow(r: any): UiInterview {
  const date = r.interview_date ?? r.date ?? '';
  const time = r.time_from ?? r.time ?? '';
  return {
    id: r.id,
    studentName: r.student_name ?? r.studentName ?? '—',
    date: typeof date === 'string' ? date : (date ? new Date(date).toISOString().split('T')[0] : ''),
    time: typeof time === 'string' ? time : (time?.toString?.() ?? ''),
    company: r.company ?? '—',
    round: r.round ?? '',
    status: (r.status ?? 'scheduled') as UiInterview['status'],
    result: r.result ?? '',
    notes: r.notes ?? '',
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'scheduled': return <Calendar className="h-4 w-4" />;
    case 'completed': return <CheckCircle className="h-4 w-4" />;
    case 'rescheduled': return <AlertCircle className="h-4 w-4" />;
    case 'cancelled': return <XCircle className="h-4 w-4" />;
    default: return <Calendar className="h-4 w-4" />;
  }
};

const AdminInterviews: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [interviews, setInterviews] = useState<UiInterview[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UiInterview['status']>('all');
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    rescheduled: 0,
    cancelled: 0,
    today: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isAdminAuth = localStorage.getItem('adminAuth') === 'true';
    if (!isAdminAuth) {
      navigate('/admin/login', { replace: true });
      return;
    }
    loadInterviews();
  }, [navigate]);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .order('interview_date', { ascending: true })
        .order('time_from', { ascending: true });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load interviews',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const normalized = (data ?? []).map(normalizeRow);
      setInterviews(normalized);

      const todayStr = new Date().toDateString();
      setStats({
        total: normalized.length,
        scheduled: normalized.filter(i => i.status === 'scheduled').length,
        completed: normalized.filter(i => i.status === 'completed').length,
        rescheduled: normalized.filter(i => i.status === 'rescheduled').length,
        cancelled: normalized.filter(i => i.status === 'cancelled').length,
        today: normalized.filter(i => new Date(i.date).toDateString() === todayStr).length,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load interviews',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateInterviewStatus = async (interviewId: string, newStatus: UiInterview['status']) => {
    setInterviews(prev => prev.map(i => (i.id === interviewId ? { ...i, status: newStatus } : i)));

    const { error } = await supabase
      .from('interviews')
      .update({ status: newStatus })
      .eq('id', interviewId);

    if (error) {
      toast({ title: 'Update Failed', description: 'Could not update interview status', variant: 'destructive' });
      loadInterviews();
      return;
    }
    toast({ title: 'Status Updated', description: `Interview status updated to ${newStatus}` });
  };

  const sendGroupNotification = (i: UiInterview) => {
    const message = `*Having Interview*
Name: ${i.studentName}
Date: ${i.date}
Time: ${i.time}
Company: ${i.company}
Round: ${i.round}`;
    toast({
      title: 'Group Notification',
      description: `Interview notification prepared for ${i.studentName}`,
    });
  };

  // Cross-platform download function
  const downloadCsv = async (period: 'today' | 'tomorrow' | 'month' | 'year') => {
    const now = new Date();
    let rows = interviews;

    if (period === 'today') {
      rows = interviews.filter(i => new Date(i.date).toDateString() === now.toDateString());
    } else if (period === 'tomorrow') {
      const tmr = new Date(now);
      tmr.setDate(tmr.getDate() + 1);
      rows = interviews.filter(i => new Date(i.date).toDateString() === tmr.toDateString());
    } else if (period === 'month') {
      const m = now.getMonth();
      const y = now.getFullYear();
      rows = interviews.filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === m && d.getFullYear() === y;
      });
    } else if (period === 'year') {
      const y = now.getFullYear();
      rows = interviews.filter(i => new Date(i.date).getFullYear() === y);
    }

    const header = 'Student Name,Company,Date,Time,Round,Status,Result\n';
    const body = rows
      .map(i => [i.studentName, i.company, i.date, i.time, i.round, i.status, i.result ?? 'pending'].join(','))
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const fileName = `interviews_${period}_${new Date().toISOString().split('T')[0]}.csv`;

    if (Capacitor.getPlatform() === "web") {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        await write_blob({
          path: fileName,
          directory: Directory.Documents,
          blob,
        });
        const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Documents });
        await FileOpener.open({ filePath: uri, contentType: 'text/csv' });
        toast({
          title: 'File saved',
          description: `Saved and opened CSV for ${period} interviews`,
        });
      } catch (err) {
        toast({
          title: 'Error',
          description: `Could not save/open file: ${err.message}`,
          variant: 'destructive',
        });
      }
    }
  };

  // Derived/grouped data (date-ranges)
  const grouped = useMemo(() => {
    const byDate: Record<string, UiInterview[]> = {};
    const filtered = interviews.filter(i => {
      const matchesSearch =
        !searchTerm ||
        i.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      const ad = new Date(a.date).getTime();
      const bd = new Date(b.date).getTime();
      if (ad !== bd) return ad - bd;
      return (a.time ?? '').localeCompare(b.time ?? '');
    });

    for (const i of sorted) {
      const k = new Date(i.date).toDateString();
      if (!byDate[k]) byDate[k] = [];
      byDate[k].push(i);
    }
    return byDate;
  }, [interviews, searchTerm, statusFilter]);

  const sortedDateKeys = useMemo(() => {
    const keys = Object.keys(grouped);
    const todayStr = new Date().toDateString();
    const today = keys.filter(k => k === todayStr);
    const upcoming = keys.filter(k => new Date(k) > new Date(todayStr));
    const past = keys.filter(k => new Date(k) < new Date(todayStr));
    return [...today, ...upcoming, ...past];
  }, [grouped]);

  const formatDateHeader = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date().toDateString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const ddmmyyyy = d.toLocaleDateString('en-GB');

    if (dateString === today) return `Today ${dayName}`;
    if (dateString === tomorrow) return `Tomorrow ${dayName}`;
    if (dateString === yesterday) return `Yesterday ${dayName}`;
    return `${ddmmyyyy} ${dayName}`;
  };

  if (loading) return <AppSkeleton variant="admin-interviews" />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER and STATS (unchanged) */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 justify-between">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}
                className="flex items-center space-x-2 mr-4">
                <ArrowLeft className="h-4 w-4" />
                <span className='hidden sm:flex'>Back <span>to Dashboard</span></span>
              </Button>
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Interview Manage</h1>
                  <p className="text-sm text-gray-600">Date-wise interview scheduling</p>
                </div>
              </div>
            </div>
            <Button className='hidden sm:flex' variant="outline" size="sm" onClick={() => void loadInterviews()} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {/* ... stats cards unchanged ... */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Today's Interviews</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.today}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4"><div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div></CardContent></Card>
          <Card>
            <CardContent className="p-4"><div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div></CardContent></Card>
          <Card>
            <CardContent className="p-4"><div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div></CardContent></Card>
          <Card>
            <CardContent className="p-4"><div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600">Rescheduled</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.rescheduled}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div></CardContent></Card>
          <Card>
            <CardContent className="p-4"><div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div></CardContent></Card>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by student name or company..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rescheduled">Rescheduled</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => downloadCsv('today')} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Today</span>
            </Button>
            <Button variant="outline" onClick={() => downloadCsv('tomorrow')} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Tomorrow</span>
            </Button>
            <Button variant="outline" onClick={() => downloadCsv('month')} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Month</span>
            </Button>
            <Button variant="outline" onClick={() => downloadCsv('year')} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Year</span>
            </Button>
          </div>
        </div>

        {/* Date-wise Interview Lists */}
        {sortedDateKeys.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
              <p className="text-gray-600">
                {interviews.length === 0
                  ? 'No interviews have been scheduled yet'
                  : 'No interviews match your search criteria'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedDateKeys.map((dateKey) => (
              <div key={dateKey}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatDateHeader(dateKey)}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {grouped[dateKey].length} interview{grouped[dateKey].length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[dateKey]
                    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
                    .map((interview) => (
                      <Card key={interview.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge className={getStatusColor(interview.status)}>
                              {getStatusIcon(interview.status)}
                              <span className="ml-1 capitalize">{interview.status}</span>
                            </Badge>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => sendGroupNotification(interview)}
                                title="Send WhatsApp notification"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Select onValueChange={(value) => updateInterviewStatus(interview.id, value as UiInterview['status'])}>
                                <SelectTrigger className="w-28 h-8">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="scheduled">Scheduled</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <CardTitle className="flex items-center space-x-2">
                            <Building className="h-5 w-5 text-purple-600" />
                            <span>{interview.company}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <User className="h-4 w-4 mr-2" />
                              {interview.studentName}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              {interview.time || '—'}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              {interview.round || '—'}
                            </div>
                            {interview.result && (
                              <div className="mt-2">
                                <Badge variant={interview.result === 'selected' ? 'default' : 'destructive'}>
                                  {interview.result}
                                </Badge>
                              </div>
                            )}
                            {interview.notes && (
                              <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                                <strong>Notes:</strong> {interview.notes}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInterviews;
