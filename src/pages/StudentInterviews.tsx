import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, Building, User, Plus, Edit2,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { supabase } from '@/lib/supabase';

// import AppSkeleton from '@/components/AppSkeleton';



type Status = 'scheduled' | 'completed' | 'rescheduled' | 'cancelled';
type Result = 'selected' | 'rejected' | 'pending';

interface InterviewRow {
  id: string;
  user_id: string;
  student_name: string;
  interview_date: string;   // yyyy-mm-dd
  time_from: string;        // HH:MM:SS
  time_to: string;          // HH:MM:SS
  company: string;
  round: string;
  status: Status;
  result: Result;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface InterviewUI {
  id: string;
  studentName: string;
  studentId: string;
  date: string;   // yyyy-mm-dd
  time: string;   // "HH:MM to HH:MM"
  company: string;
  round: string;
  status: Status;
  result: Result;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const StudentInterviews: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [interviews, setInterviews] = useState<InterviewUI[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<InterviewUI | null>(null);
  const [studentUser, setStudentUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const [formData, setFormData] = useState<{
    date: string;
    timeFrom: string;
    timeTo: string;
    company: string;
    round: string;
    status: Status;
    result: Result;
    notes: string;
  }>({
    date: '',
    timeFrom: '',
    timeTo: '',
    company: '',
    round: '',
    status: 'scheduled',
    result: 'pending',
    notes: ''
  });

  // Format WhatsApp message
  const formatWhatsAppMsg = ({
    name,
    date,
    timeFrom,
    timeTo,
    company,
    round,
    status,
    notes
  }) => {
    // Format date dd/mm/yy
    const dateObj = new Date(date);
    const d = dateObj.getDate().toString().padStart(2, '0');
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const y = dateObj.getFullYear().toString().slice(-2);

    // Format times
    const formatTime = (t) => {
      const [hour, min] = t.split(':');
      const date = new Date();
      date.setHours(Number(hour));
      date.setMinutes(Number(min));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).replace(' ', '').toLowerCase();
    };

    const formattedTime = `${formatTime(timeFrom)} to ${formatTime(timeTo)}`;

    if (status === 'completed') return ''; // Do not send WhatsApp
    if (status === 'cancelled') {
      return `Interview Cancelled\nName: ${name}\nDate: ${d}/${m}/${y}\nTime: ${formattedTime}`;
    }

    let statusLine =
      status === 'rescheduled'
        ? 'Rescheduled\n'
        : 'Having interview\n';

    let msg =
      `${statusLine}` +
      `Name: ${name}\n` +
      `Date: ${d}/${m}/${y}\n` +
      `Time: ${formattedTime}\n` +
      `Company: ${company}\n` +
      `Round: ${round}`;

    // Only for scheduled/rescheduled, add notes if present
    if ((status === 'scheduled' || status === 'rescheduled') && notes && notes.trim().length > 0) {
      msg += `\nNotes: ${notes.trim()}`;
    }

    return msg;
  };

  // Map DB row to UI object
  const rowToUI = (r: InterviewRow): InterviewUI => ({
    id: r.id,
    studentName: r.student_name,
    studentId: r.user_id,
    date: r.interview_date,
    time: `${r.time_from.slice(0, 5)} to ${r.time_to.slice(0, 5)}`,
    company: r.company,
    round: r.round,
    status: r.status,
    result: r.result,
    notes: r.notes || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });

  // Load interviews for current user
  const loadInterviews = useCallback(async (uid?: string) => {
    try {
      const userId = uid ?? studentUser?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', userId)
        .order('interview_date', { ascending: true })
        .order('time_from', { ascending: true });

      if (error) throw error;
      setInterviews((data || []).map(rowToUI));
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to load interviews', variant: 'destructive' });
    }
  }, [studentUser?.id, toast]);

  // Ensure valid session and profile, then load data
  useEffect(() => {
    const init = async () => {
      const isStudentAuth = localStorage.getItem('studentAuth');
      if (!isStudentAuth || isStudentAuth !== 'true') {
        navigate('/login');
        return;
      }

      const { data: sessionRes } = await supabase.auth.getSession();
      if (!sessionRes.session) {
        navigate('/login');
        return;
      }

      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (!uid) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('id,name,email')
        .eq('id', uid)
        .single();

      if (profile) {
        localStorage.setItem('studentUser', JSON.stringify(profile));
        setStudentUser({ id: profile.id, name: profile.name || '', email: profile.email || '' });
      } else {
        const cached = localStorage.getItem('studentUser');
        if (cached) {
          const p = JSON.parse(cached);
          setStudentUser({ id: p.id, name: p.name || '', email: p.email || '' });
        }
      }

      await loadInterviews(uid);

      // Realtime: subscribe to this student's interview changes
      const channel = supabase
        .channel(`interviews_student_${uid}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'interviews', filter: `user_id=eq.${uid}` },
          () => loadInterviews(uid)
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    init();
  }, [navigate, loadInterviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !studentUser ||
      !formData.date ||
      !formData.timeFrom ||
      !formData.timeTo ||
      !formData.company ||
      !formData.round
    ) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const waMsg = formatWhatsAppMsg({
      name: studentUser.name,
      date: formData.date,
      timeFrom: formData.timeFrom,
      timeTo: formData.timeTo,
      company: formData.company,
      round: formData.round,
      status: formData.status,
      notes: formData.notes,
    });

    // Send WhatsApp (if not completed)
    if (waMsg) {
      window.open(`https://wa.me/?text=${encodeURIComponent(waMsg)}`, '_blank');
    }

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id!;
      const payload = {
        user_id: uid,
        student_name: studentUser.name,
        interview_date: formData.date,
        time_from: `${formData.timeFrom}:00`,
        time_to: `${formData.timeTo}:00`,
        company: formData.company,
        round: formData.round,
        status: formData.status as Status,
        result: formData.result as Result,
        notes: formData.notes || null,
      };

      if (editingInterview) {
        const { error } = await supabase.from('interviews').update(payload).eq('id', editingInterview.id).eq('user_id', uid);
        if (error) throw error;
        toast({ title: 'Interview Updated', description: 'Interview schedule has been updated successfully' });

        // WhatsApp for edit: Only if not completed
        if (formData.status !== 'completed') {
          const waMsgEdit = formatWhatsAppMsg({
            name: studentUser.name,
            date: formData.date,
            timeFrom: formData.timeFrom,
            timeTo: formData.timeTo,
            company: formData.company,
            round: formData.round,
            status: formData.status,
            notes: formData.notes,
          });
          if (waMsgEdit) {
            window.open(`https://wa.me/?text=${encodeURIComponent(waMsgEdit)}`, '_blank');
          }
        }
      } else {
        const { error } = await supabase.from('interviews').insert([payload]);
        if (error) throw error;
        toast({ title: 'Interview Scheduled', description: 'New interview has been scheduled successfully' });
        // WhatsApp already sent above (for create)
      }

      await loadInterviews(uid);

      // Reset form and close dialog
      setFormData({
        date: '',
        timeFrom: '',
        timeTo: '',
        company: '',
        round: '',
        status: 'scheduled',
        result: 'pending',
        notes: ''
      });
      setEditingInterview(null);
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save interview', variant: 'destructive' });
    }
  };

  const handleEdit = (i: InterviewUI) => {
    const [from, to] = i.time.split(' to ');
    setEditingInterview(i);
    setFormData({
      date: i.date,
      timeFrom: from || '',
      timeTo: to || '',
      company: i.company,
      round: i.round,
      status: i.status,
      result: i.result || 'pending',
      notes: i.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (interviewId: string) => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id!;
      const { error } = await supabase.from('interviews').delete().eq('id', interviewId).eq('user_id', uid);
      if (error) throw error;
      toast({ title: 'Interview Deleted', description: 'Interview has been removed from your schedule' });
      await loadInterviews(uid);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to delete interview', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'rescheduled': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };


// ...

// if (!studentUser || interviews.length === 0) {
//   return <AppSkeleton variant="interviews" gridCount={6} />;
// }



  // if (!studentUser) {
  //   return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/student/dashboard')}
              className="flex items-center space-x-2 mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className='hidden'>Back to Dashboard</span>
            </Button>
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Interview Schedule</h1>
                <p className="text-sm text-gray-600">Manage your job interviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Interviews</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 flex items-center px-2 py-1 md:px-4 md:py-2 text-sm md:text-base">
                <Plus className="h-4 w-4 mr-2" />
                {/* <span className="flex sm:hidden">Schedule</span> */}
                <span className="hidden sm:flex">Schedule Interview</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl md:max-w-1xl max-h-[85vh] p-6">
              <DialogHeader>
                <DialogTitle>{editingInterview ? 'Edit Interview' : 'Schedule New Interview'}</DialogTitle>
                <DialogDescription>Fill in the interview details below</DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto pl-1 pr-1 ">
                <form onSubmit={handleSubmit} className="space-y-4 pb-2">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timeFrom">From</Label>
                      <Input
                        id="timeFrom"
                        type="time"
                        step="60"
                        value={formData.timeFrom}
                        onChange={(e) => setFormData({ ...formData, timeFrom: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="timeTo">To</Label>
                      <Input
                        id="timeTo"
                        type="time"
                        step="60"
                        value={formData.timeTo}
                        onChange={(e) => setFormData({ ...formData, timeTo: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="round">Round</Label>
                    <Select
                      value={formData.round}
                      onValueChange={(value) => setFormData({ ...formData, round: value })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select interview round" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Round">1st Round</SelectItem>
                        <SelectItem value="2nd Round">2nd Round</SelectItem>
                        <SelectItem value="3rd Round">3rd Round</SelectItem>
                        <SelectItem value="HR Round">HR Round</SelectItem>
                        <SelectItem value="Final Round">Final Round</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: Status) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rescheduled">Rescheduled</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="result">Result</Label>
                    <Select
                      value={formData.result}
                      onValueChange={(value: Result) => setFormData({ ...formData, result: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="selected">Selected</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add any additional notes..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 sticky bottom-0 bg-white pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">{editingInterview ? 'Update Interview' : 'Schedule Interview'}</Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {interviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h3>
              <p className="text-gray-600 mb-4">Schedule your first interview to get started</p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                Schedule Interview
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviews.map((interview) => (
              <Card key={interview.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(interview.status)}>
                      {getStatusIcon(interview.status)}
                      <span className="ml-1 capitalize">{interview.status}</span>
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(interview)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    <span>{interview.company}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(interview.date).toLocaleDateString('en-GB')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {(() => {
                        const [fromTime, toTime] = interview.time.split(' to ');
                        const formatTime = (t: string) => {
                          const [hour, minute] = t.split(':');
                          const dateObj = new Date();
                          dateObj.setHours(parseInt(hour), parseInt(minute));
                          return dateObj.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          }).replace(' ', '').toLowerCase();
                        };
                        return `${formatTime(fromTime)} to ${formatTime(toTime)}`;
                      })()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      {interview.studentName}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Round:</span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                        {interview.round}
                      </span>
                    </div>
                    {interview.result && interview.result !== 'pending' && (
                      <div className="flex items-center text-sm">
                        <span className="font-medium mr-2">Result:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            interview.result === 'selected'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {interview.result}
                        </span>
                      </div>
                    )}
                    {interview.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        <strong>Notes:</strong> {interview.notes}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(interview)} className="flex-1">
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(interview.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentInterviews;
