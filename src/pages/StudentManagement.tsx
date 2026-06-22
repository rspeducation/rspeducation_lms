import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Users, ArrowLeft, UserPlus, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
// import AppSkeleton from '@/components/AppSkeleton';
import { supabase, supabaseNoSession } from '@/lib/supabase';

type BatchRow = { id: string; name: string; start_date: string | null };
type Batch = {
  id: string;
  name: string;
  startDate: string;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
};
type StudentRow = {
  id: string;
  student_code: string;
  user_id: string;
  course: string;
  batch: string;
  batch_id?: string | null;
  enrollment_date: string | null;
  status: 'active' | 'inactive';
  users: { id: string; name: string | null; email: string | null } | null;
  phone?: string | null;
};
type Student = {
  id: string;
  student_code: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  course: string;
  batch: string;
  batch_id?: string | null;
  enrollment_date: string;
  status: 'active' | 'inactive';
};

const EmptyCTA: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
    <Users className="h-12 w-12 text-gray-400 mb-4" />
    <h2 className="text-2xl font-bold mb-2">No batches yet</h2>
    <p className="text-gray-600 mb-6">Create the first batch to add students.</p>
    <Button onClick={onCreate}>Create New Batch</Button>
  </div>
);

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    course: '',
  });
  const navigate = useNavigate();
  const { batchName } = useParams();
  const { toast } = useToast();

  // Always show skeleton if loading!
  // if (loading) return <AppSkeleton variant="dashboard" gridCount={3} />;

  useEffect(() => {
    const isAdminAuth = localStorage.getItem('adminAuth');
    if (!isAdminAuth || isAdminAuth !== 'true') {
      navigate('/admin/login');
      return;
    }
    init();
    // eslint-disable-next-line
  }, [navigate]);

  useEffect(() => {
    if (batchName) setSelectedBatch(batchName);
  }, [batchName]);

  const filteredStudents = useMemo(() => {
    if (!selectedBatch) return [];
    const batchStudents = students.filter(s => s.batch === selectedBatch);
    if (!searchTerm) return batchStudents;
    const q = searchTerm.toLowerCase();
    return batchStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.student_code.toLowerCase().includes(q)
    );
  }, [students, selectedBatch, searchTerm]);

  // --- EXPORT TO EXCEL ---
  const handleDownloadBatchExcel = () => {
    if (!filteredStudents || filteredStudents.length === 0) {
      toast({ title: 'No students', description: 'No students to download.', variant: 'destructive' });
      return;
    }

    const dataToExport = filteredStudents.map(s => ({
      StudentID: s.student_code,
      Name: s.name,
      Email: s.email,
      Phone: s.phone ?? '',
      Course: s.course,
      EnrollmentDate: s.enrollment_date || '',
      Status: s.status,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedBatch || 'Batch');
    const fileName = `students_${(selectedBatch || 'all').replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    try {
      setDeletingId(studentId);
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Student removed', variant: 'default' });
      await loadStudents();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Delete failed', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  // --- DATA LOADER LOGIC ---
  const init = async () => {
    setLoading(true);
    try {
      await Promise.all([loadBatches(), loadStudents()]);
    } catch (err) {
      // Optionally log error. Toasts already shown in children
      console.error('Init failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    const { data, error } = await supabase
      .from('batches')
      .select('id,name,start_date')
      .order('start_date', { ascending: true });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    const mapped: Batch[] = (data || []).map((r: BatchRow) => ({
      id: r.id,
      name: r.name,
      startDate: r.start_date ?? '',
      totalStudents: 0,
      activeStudents: 0,
      inactiveStudents: 0,
    }));
    setBatches(mapped);
  };

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id,student_code,user_id,course,batch,batch_id,enrollment_date,status,phone,users(id,name,email)')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    const mapped: Student[] = (data || []).map((r: StudentRow) => ({
      id: r.id,
      student_code: r.student_code,
      user_id: r.user_id,
      name: r.users?.name ?? '',
      email: r.users?.email ?? '',
      phone: r.phone ?? null,
      course: r.course,
      batch: r.batch,
      batch_id: r.batch_id ?? null,
      enrollment_date: r.enrollment_date ?? '',
      status: r.status,
    }));

    setStudents(mapped);
    setBatches(prev => prev.map(b => {
      const bs = mapped.filter(s => s.batch === b.name);
      return {
        ...b,
        totalStudents: bs.length,
        activeStudents: bs.filter(s => s.status === 'active').length,
        inactiveStudents: bs.filter(s => s.status === 'inactive').length,
      };
    }));
  };

  // Add Student (Auth password = 8-char Student ID)
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) {
      toast({ title: 'Error', description: 'Please select a batch first', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);

      // 1) Generate 8-char Student ID from DB
      const { data: codeRes, error: codeErr } = await supabase.rpc('gen_student_code');
      if (codeErr || !codeRes) throw new Error(codeErr?.message || 'Failed to generate Student ID');
      const studentCode: string = codeRes;

      // 2) Create Auth user with password = Student ID
      const { data: signUp, error: signUpErr } = await supabaseNoSession.auth.signUp({
        email: formData.email.trim(),
        password: studentCode,
      });
      if (signUpErr || !signUp?.user) throw new Error(signUpErr?.message || 'Auth sign up failed');
      const uid = signUp.user.id;

      // 3) Insert users profile
      const { error: userErr } = await supabase.from('users').insert([
        { id: uid, name: formData.name.trim(), email: formData.email.trim() }
      ]);
      if (userErr) throw userErr;

      // 4) Resolve batch_id from batches by name (selectedBatch)
      const { data: batchRow, error: batchErr } = await supabase
        .from('batches')
        .select('id')
        .eq('name', selectedBatch)
        .limit(1)
        .single();
      if (batchErr || !batchRow?.id) throw new Error('Batch not found: ' + selectedBatch);
      const batchId: string = batchRow.id;

      // 5) Insert student row with both batch name (legacy) and batch_id (FK)
      const today = new Date().toISOString().slice(0, 10);
      const { error: stuErr } = await supabase.from('students').insert([{
        user_id: uid,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone || null,
        course: formData.course.trim(),
        batch: selectedBatch,     // keep for existing UI filters
        batch_id: batchId,        // relational link
        enrollment_date: today,
        status: 'active',
        student_code: studentCode,
      }]);
      if (stuErr) throw stuErr;

      toast({
        title: 'Student Added',
        description: `Credentials: ${formData.email} / ${studentCode}`,
        variant: 'default',
      });

      setFormData({ name: '', email: '', phone: '', course: '' });
      setIsAddDialogOpen(false);
      await loadStudents();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to add student', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Open edit dialog
  const handleEditStudent = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      name: s.name,
      email: s.email,
      phone: s.phone ?? '',
      course: s.course,
    });
    setIsEditDialogOpen(true);
  };

  // Save edit
  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      setSaving(true);

      // Update users table if name/email changed
      const updates: any = {};
      if (formData.name.trim() !== editingStudent.name) updates.name = formData.name.trim();
      if (formData.email.trim() !== editingStudent.email) updates.email = formData.email.trim();
      if (Object.keys(updates).length) {
        const { error } = await supabase.from('users').update(updates).eq('id', editingStudent.user_id);
        if (error) throw error;
      }

      // Update student table fields
      const { data, error: stuErr } = await supabase.from('students')
        .update({ phone: formData.phone || null, course: formData.course.trim() })
        .eq('id', editingStudent.id)
        .select('id');
      if (stuErr) throw stuErr;
      if (!data || data.length === 0) throw new Error('No rows updated. Check RLS and student id.');

      toast({ title: 'Student Updated', description: 'Information saved', variant: 'default' });
      setIsEditDialogOpen(false);
      setEditingStudent(null);
      setFormData({ name: '', email: '', phone: '', course: '' });
      await loadStudents();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Update failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle active/inactive
  const toggleStudentStatus = async (studentId: string, current: 'active' | 'inactive') => {
    const next = current === 'active' ? 'inactive' : 'active';
    try {
      const { data, error } = await supabase
        .from('students')
        .update({ status: next })
        .eq('id', studentId)
        .select('id'); // ensure we know rows changed

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No rows updated. Check RLS or student id.');

      toast({ title: 'Status Updated', description: `Marked ${next}`, variant: 'default' });
      await loadStudents();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Status update failed', variant: 'destructive' });
    }
  };

  const handleBatchSelect = (batchName: string) => {
    setSelectedBatch(batchName);
    navigate(`/admin/students/${encodeURIComponent(batchName)}`);
  };

  const getSelectedBatchStats = () => {
    const bs = students.filter(s => s.batch === selectedBatch);
    return {
      total: bs.length,
      active: bs.filter(s => s.status === 'active').length,
      inactive: bs.filter(s => s.status === 'inactive').length,
    };
  };

  const openAddBatchDialog = () => {
    navigate('/admin/batches', { state: { openCreateBatch: true } });
  };

  const handleCreateBatchCTA = () => navigate('/admin/batches');

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
                <span>Dashboard</span>
              </Button>
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Manage</h1>
                <p className="text-sm text-gray-600">Manage students by batch</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {!selectedBatch ? (
          batches.length === 0 ? (
            <EmptyCTA onCreate={handleCreateBatchCTA} />
          ) : (
            <div>
              <div className="mb-6 flex items-center">
                <h2 className="text-2xl font-bold text-gray-900">Select a Batch</h2>
                <Button onClick={openAddBatchDialog} className="ml-auto flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Batch
                </Button>
              </div>
              <p className="text-gray-600 mb-6">Choose a batch to manage students</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batches.map((batch) => (
                  <Card key={batch.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{batch.name}</span>
                        <Button variant="outline" size="sm" onClick={() => handleBatchSelect(batch.name)}>
                          Manage Students
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Starts on {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : '—'}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>Total Students:</span>
                          <span className="font-semibold">{batch.totalStudents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active:</span>
                          <span className="font-semibold text-green-600">{batch.activeStudents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Inactive:</span>
                          <span className="font-semibold text-red-600">{batch.inactiveStudents}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedBatch('');
                    navigate('/admin/students');
                  }}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Batches</span>
                </Button>
                <h2 className="text-2xl font-bold text-gray-900">{selectedBatch} Students</h2>
              </div>

              {/* Add Student Dialog */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Add Student</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Student to {selectedBatch}</DialogTitle>
                    <DialogDescription>Add a new student to the {selectedBatch} batch</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData(s => ({ ...s, name: e.target.value }))}
                        placeholder="Enter student's full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(s => ({ ...s, email: e.target.value }))}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(s => ({ ...s, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="course">Course</Label>
                      <Input
                        id="course"
                        name="course"
                        value={formData.course}
                        onChange={(e) => setFormData(s => ({ ...s, course: e.target.value }))}
                        placeholder="Enter course name"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={saving}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Student'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Students</p><p className="text-2xl font-bold">{getSelectedBatchStats().total}</p></div><Users className="h-8 w-8 text-blue-600" /></div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Active Students</p><p className="text-2xl font-bold text-green-600">{getSelectedBatchStats().active}</p></div><Users className="h-8 w-8 text-green-600" /></div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Inactive Students</p><p className="text-2xl font-bold text-red-600">{getSelectedBatchStats().inactive}</p></div><Users className="h-8 w-8 text-red-600" /></div></CardContent></Card>
            </div>

          <div className="flex mb-6 items-center">
  {/* Search bar takes full width, except button */}
  <div className="relative flex-1">
    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
    <Input
      placeholder="Search by name, email, or student code..."
      className="pl-10 w-full"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
  {/* Button floats right, margin-left */}
  <Button
    onClick={handleDownloadBatchExcel}
    variant="outline"
    className="ml-4"
  >
    Download Excel
  </Button>
</div>

           

            <Card>
              <CardHeader>
                <CardTitle>Students in {selectedBatch}</CardTitle>
                <CardDescription>Manage students in the {selectedBatch} batch</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-600">
                      {students.filter(s => s.batch === selectedBatch).length === 0
                        ? 'No students in this batch yet'
                        : 'No students match your search'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Enrollment Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.student_code}</TableCell>
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{s.email}</TableCell>
                          <TableCell>{s.phone ?? '—'}</TableCell>
                          <TableCell>{s.course}</TableCell>
                          <TableCell>{s.enrollment_date}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStudentStatus(s.id, s.status)}
                              className={s.status === 'active' ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}
                            >
                              {s.status}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditStudent(s)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStudent(s.id)}
                                disabled={deletingId === s.id}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
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

            {/* Edit Student Dialog (mounted in this view) */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Student</DialogTitle>
                  <DialogDescription>Update student details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateStudent} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(s => ({ ...s, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(s => ({ ...s, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(s => ({ ...s, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      value={formData.course}
                      onChange={(e) => setFormData(s => ({ ...s, course: e.target.value }))}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
