import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calendar } from 'lucide-react';


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

// Adjust this import if your Supabase client lives elsewhere
import { supabase } from '@/lib/supabase';

type BatchRow = {
  id: string;
  name: string;
  start_date: string | null;
  created_at: string | null;
};

type Batch = {
  id: string;
  name: string;
  startDate: string;
  createdAt: string;
  totalStudents: number;   // reserved for future student stats
  activeStudents: number;  // reserved for future student stats
  inactiveStudents: number;// reserved for future student stats
};

const EmptyState: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="text-center py-12">
    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    {subtitle ? <p className="text-gray-600">{subtitle}</p> : null}
  </div>
);

const BatchManagement: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{ name: string; startDate: string }>({
    name: '',
    startDate: '',
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  // Admin guard (kept as-is from your app)
  useEffect(() => {
    const isAdminAuth = localStorage.getItem('adminAuth');
    if (!isAdminAuth || isAdminAuth !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Load batches on mount
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

      const mapped: Batch[] = (data as BatchRow[] | null)?.map((r) => ({
        id: r.id,
        name: r.name,
        startDate: r.start_date ?? '',
        createdAt: r.created_at ?? '',
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
      })) ?? [];

      setBatches(mapped);
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [toast]);

  const canSubmit = useMemo(() => {
    return formData.name.trim().length > 0 && formData.startDate.trim().length > 0 && !saving;
  }, [formData, saving]);

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSaving(true);
      const payload = { name: formData.name.trim(), start_date: formData.startDate };

      // Insert and return the row
      const { data, error } = await supabase
        .from('batches')
        .insert([payload])
        .select('id, name, start_date, created_at')
        .single();

      if (error) {
        throw error;
      }

      const row = data as BatchRow;
      const newBatch: Batch = {
        id: row.id,
        name: row.name,
        startDate: row.start_date ?? '',
        createdAt: row.created_at ?? '',
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
      };

      // Prepend for immediate feedback
      setBatches((prev) => [newBatch, ...prev]);

      toast({ title: 'Batch Added', description: `${newBatch.name} created`, variant: 'default' });
      setFormData({ name: '', startDate: '' });
      setIsAddDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Insert failed', description: err?.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    try {
      setDeletingId(batchId);
      const { error } = await supabase.from('batches').delete().eq('id', batchId);
      if (error) throw error;

      setBatches((prev) => prev.filter((b) => b.id !== batchId));
      toast({ title: 'Batch Deleted', description: 'Batch removed', variant: 'default' });
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
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span> Back</span>
              </Button>
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                
                <h1 className="text-xl font-bold text-gray-900">Batch Management</h1>
                <p className="text-sm text-gray-600">Manage student batches wise</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Batches</h2>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add New Batch</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Batch</DialogTitle>
                <DialogDescription>Only batch name and start date are required</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddBatch} className="space-y-4">
                <div>
                  <Label htmlFor="name">Batch Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., September 2025"
                    value={formData.name}
                    onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((s) => ({ ...s, startDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!canSubmit}>
                    {saving ? 'Saving...' : 'Add Batch'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <Card>
              <CardHeader>
                <CardTitle>Loading batches…</CardTitle>
                <CardDescription>Please wait</CardDescription>
              </CardHeader>
            </Card>
          ) : batches.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState title="No batches yet" subtitle="Create the first batch to get started" />
              </CardContent>
            </Card>
          ) : (
            batches.map((batch) => (
              <Card key={batch.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{batch.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBatch(batch.id)}
                      disabled={deletingId === batch.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Starts on {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : '—'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchManagement;
