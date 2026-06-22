// src/pages/AdminPlacements.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Plus, Edit, Trash2, Search, Save, X, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

type Placement = {
  id: string;
  name: string;
  education: string;
  company: string;
  package: string;
  role: string;
  location: string;
  created_at: string;
  updated_at: string | null;
};

const AdminPlacements: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Admin guard
  useEffect(() => {
    const isAdminAuth = localStorage.getItem('adminAuth');
    if (!isAdminAuth || isAdminAuth !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  const [items, setItems] = useState<Placement[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Search
  const [q, setQ] = useState('');

  // Drawer/editor
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Placement | null>(null);

  const [form, setForm] = useState({
    name: '',
    education: '',
    company: '',
    package: '',
    role: '',
    location: '',
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', education: '', company: '', package: '', role: '', location: '' });
  };

  const startAdd = () => {
    resetForm();
    setOpen(true);
  };

  const startEdit = (row: Placement) => {
    setEditing(row);
    setForm({
      name: row.name,
      education: row.education,
      company: row.company,
      package: row.package,
      role: row.role,
      location: row.location,
    });
    setOpen(true);
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(r =>
      [r.name, r.education, r.company, r.package, r.role, r.location]
        .some(v => v.toLowerCase().includes(s))
    );
  }, [items, q]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [{ data, error }, { count: c, error: ce }] = await Promise.all([
        supabase
          .from('placements')
          .select('id,name,education,company,package,role,location,created_at,updated_at')
          .order('created_at', { ascending: false }),
        supabase.from('placements').select('*', { count: 'exact', head: true }),
      ]);
      if (error) throw error;
      if (ce) throw ce;
      setItems((data ?? []) as Placement[]);
      setCount(c ?? 0);
    } catch (err: any) {
      toast({ title: 'Load failed', description: err?.message ?? 'Unable to load placements', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const save = async () => {
    if (!form.name.trim() || !form.company.trim()) {
      toast({ title: 'Missing fields', description: 'Name and company are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from('placements')
          .update({
            name: form.name.trim(),
            education: form.education.trim(),
            company: form.company.trim(),
            package: form.package.trim(),
            role: form.role.trim(),
            location: form.location.trim(),
          })
          .eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Placement updated successfully' });
      } else {
        const { error } = await supabase
          .from('placements')
          .insert([{
            name: form.name.trim(),
            education: form.education.trim(),
            company: form.company.trim(),
            package: form.package.trim(),
            role: form.role.trim(),
            location: form.location.trim(),
          }]);
        if (error) throw error;
        toast({ title: 'Added', description: 'Placement added successfully' });
      }
      setOpen(false);
      resetForm();
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Save failed', description: err?.message ?? 'Unable to save placement', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this placement?')) return;
    try {
      const { error } = await supabase.from('placements').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Placement removed' });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message ?? 'Unable to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="col sm:col flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span className='hidden sm:flex'>Back to Dashboard</span>
              </Button>
              <Award className=" hidden ms:flex h-8 w-8 text-purple-600" />
              <div className="">
                <h1 className="hidden sm:flex text-xl font-bold text-gray-900">Admin Placements</h1>
                <p className=" hidden sm:flex text-sm text-gray-600">Add and manage placed student details</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="text-size-11 sm:flex pl-10 w-64" placeholder="Search name/company/role..." value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <Button onClick={startAdd}><Plus className="h-4 w-4 mr-1" /><span className="hidden sm:flex">Add</span></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Total Placements</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{count}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Visible</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{filtered.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Last Refresh</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{new Date().toLocaleTimeString()}</div></CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Placement List</CardTitle>
            <CardDescription>Only the requested fields are stored per record</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Education</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.education}</TableCell>
                      <TableCell>{r.company}</TableCell>
                      <TableCell>{r.package}</TableCell>
                      <TableCell>{r.role}</TableCell>
                      <TableCell>{r.location}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(r)}><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">No results</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side drawer editor */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="w-full max-w-lg h-full bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">{editing ? 'Edit Placement' : 'Add Placement'}</h3>
              </div>
              <Button variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Education</Label><Input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} /></div>
              <div><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Package</Label><Input value={form.package} onChange={(e) => setForm({ ...form, package: e.target.value })} placeholder="₹10 LPA" /></div>
                <div><Label>Role</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
              </div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>

              <div className="flex gap-2 pt-2">
                <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : 'Save'}</Button>
                <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }} disabled={saving}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlacements;
