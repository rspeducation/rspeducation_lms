import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Calendar, BookOpen,
  Pencil, Check, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type BatchRow = { id: string; name: string; start_date: string | null; created_at: string | null };
type Batch = { id: string; name: string; startDate: string; createdAt: string };
type Subject = { id: string; batch_id: string; name: string };

// ─────────────────────────────────────────────
// Subject Manager (shown on each batch card)
// ─────────────────────────────────────────────
const SubjectManager: React.FC<{ batch: Batch }> = ({ batch }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select('id, batch_id, name')
      .eq('batch_id', batch.id)
      .order('name');
    if (!error) setSubjects((data as Subject[]) ?? []);
    setLoading(false);
  }, [batch.id]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleAdd = async () => {
    const name = newSubject.trim();
    if (!name) return;
    setAddingSubject(true);
    const { data, error } = await supabase
      .from('subjects')
      .insert([{ batch_id: batch.id, name }])
      .select('id, batch_id, name')
      .single();
    if (error) {
      toast({ title: 'Failed to add subject', description: error.message, variant: 'destructive' });
    } else {
      setSubjects((prev) => [...prev, data as Subject]);
      setNewSubject('');
      toast({ title: `Subject "${name}" added` });
    }
    setAddingSubject(false);
  };

  const handleEdit = async (id: string) => {
    const name = editValue.trim();
    if (!name) return;
    const { error } = await supabase.from('subjects').update({ name }).eq('id', id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
      toast({ title: 'Subject updated' });
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete subject "${name}"? This may affect assignments.`)) return;
    setDeletingId(id);
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      toast({ title: `Subject "${name}" deleted` });
    }
    setDeletingId(null);
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
      >
        <BookOpen className="h-4 w-4" />
        Subjects ({subjects.length || '…'})
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {loading ? (
            <p className="text-xs text-gray-400">Loading subjects…</p>
          ) : subjects.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No subjects yet — add one below</p>
          ) : (
            subjects.map((s) => (
              <div key={s.id} className="flex items-center gap-2 group">
                {editingId === s.id ? (
                  <>
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(s.id); if (e.key === 'Escape') setEditingId(null); }}
                      className="flex-1 border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button onClick={() => handleEdit(s.id)} className="text-green-600 hover:text-green-800">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      {s.name}
                    </span>
                    <button
                      onClick={() => { setEditingId(s.id); setEditValue(s.name); }}
                      className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 transition"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      disabled={deletingId === s.id}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}

          {/* Add new subject inline */}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="New subject name…"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={addingSubject || !newSubject.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const BatchManagement: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{ name: string; startDate: string }>({ name: '', startDate: '' });
  // Subjects entered while creating the batch
  const [initialSubjects, setInitialSubjects] = useState<string[]>(['']);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Admin guard
  useEffect(() => {
    if (localStorage.getItem('adminAuth') !== 'true') navigate('/admin/login');
  }, [navigate]);

  // Load batches
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('batches')
        .select('id, name, start_date, created_at')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error) {
        toast({ title: 'Error loading batches', description: error.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      const mapped: Batch[] = ((data as BatchRow[]) ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        startDate: r.start_date ?? '',
        createdAt: r.created_at ?? '',
      }));
      setBatches(mapped);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [toast]);

  const canSubmit = useMemo(
    () => formData.name.trim().length > 0 && formData.startDate.trim().length > 0 && !saving,
    [formData, saving]
  );

  // Subject row helpers for the "Add Batch" form
  const addSubjectRow = () => setInitialSubjects((prev) => [...prev, '']);
  const updateSubjectRow = (i: number, val: string) =>
    setInitialSubjects((prev) => prev.map((s, idx) => (idx === i ? val : s)));
  const removeSubjectRow = (i: number) =>
    setInitialSubjects((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : ['']));

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('batches')
        .insert([{ name: formData.name.trim(), start_date: formData.startDate }])
        .select('id, name, start_date, created_at')
        .single();
      if (error) throw error;

      const row = data as BatchRow;
      const newBatch: Batch = {
        id: row.id,
        name: row.name,
        startDate: row.start_date ?? '',
        createdAt: row.created_at ?? '',
      };
      setBatches((prev) => [newBatch, ...prev]);

      // Save initial subjects
      const validSubjects = initialSubjects.map((s) => s.trim()).filter(Boolean);
      if (validSubjects.length > 0) {
        const { error: subErr } = await supabase.from('subjects').insert(
          validSubjects.map((name) => ({ batch_id: row.id, name }))
        );
        if (subErr) {
          toast({ title: 'Batch created but subjects failed', description: subErr.message, variant: 'destructive' });
        }
      }

      toast({ title: 'Batch Added', description: `${newBatch.name} created with ${validSubjects.length} subject(s)` });
      setFormData({ name: '', startDate: '' });
      setInitialSubjects(['']);
      setIsAddDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Insert failed', description: err?.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Delete this batch? All subjects and content linked to it will also be deleted.')) return;
    try {
      setDeletingId(batchId);
      const { error } = await supabase.from('batches').delete().eq('id', batchId);
      if (error) throw error;
      setBatches((prev) => prev.filter((b) => b.id !== batchId));
      toast({ title: 'Batch Deleted' });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Batch Management</h1>
                <p className="text-sm text-gray-600">Manage student batches and subjects</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Batches</h2>

          {/* Add Batch Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={(o) => { setIsAddDialogOpen(o); if (!o) { setFormData({ name: '', startDate: '' }); setInitialSubjects(['']); } }}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add New Batch</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Batch</DialogTitle>
                <DialogDescription>Create a batch and optionally add its subjects right away</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddBatch} className="space-y-5 mt-2">
                {/* Batch Name */}
                <div>
                  <Label htmlFor="batch-name">Batch Name *</Label>
                  <Input
                    id="batch-name"
                    placeholder="e.g., September 2025"
                    value={formData.name}
                    onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
                    required
                    className="mt-1"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <Label htmlFor="batch-start">Start Date *</Label>
                  <Input
                    id="batch-start"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((s) => ({ ...s, startDate: e.target.value }))}
                    required
                    className="mt-1"
                  />
                </div>

                {/* Subjects section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      Subjects (optional)
                    </Label>
                    <button
                      type="button"
                      onClick={addSubjectRow}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Subject
                    </button>
                  </div>
                  <div className="space-y-2">
                    {initialSubjects.map((sub, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Subject ${i + 1} name…`}
                          value={sub}
                          onChange={(e) => updateSubjectRow(i, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {initialSubjects.length > 1 && (
                          <button type="button" onClick={() => removeSubjectRow(i)} className="text-red-400 hover:text-red-600">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Subjects can also be added/edited later from the batch card.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!canSubmit}>
                    {saving ? 'Saving…' : 'Create Batch'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Batch cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <Card>
              <CardHeader>
                <CardTitle>Loading batches…</CardTitle>
                <CardDescription>Please wait</CardDescription>
              </CardHeader>
            </Card>
          ) : batches.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-16 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">No batches yet</h3>
                <p className="text-gray-500 text-sm">Click "Add New Batch" to create the first one.</p>
              </CardContent>
            </Card>
          ) : (
            batches.map((batch) => (
              <Card key={batch.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-base font-semibold">{batch.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBatch(batch.id)}
                      disabled={deletingId === batch.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {batch.startDate
                      ? `Starts ${new Date(batch.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : '—'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Subject manager expands inline */}
                  <SubjectManager batch={batch} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchManagement;
