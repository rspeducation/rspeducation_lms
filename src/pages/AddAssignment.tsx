import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ClipboardList,
  Calendar,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Edit2,
  AlertCircle,
  Save,
  Eye,
  ChevronRight,
  Search,
  BarChart2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Batch = { id: string; name: string };
type Subject = { id: string; name: string; batch_id: string };

type QuestionOption = { id: string; text: string; isCorrect: boolean };

type Question = {
  id: string;
  text: string;
  options: QuestionOption[];
};

type Assignment = {
  id: string;
  batch_id: string;
  batch_name: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: 'active' | 'closed' | 'reopened';
  questions: Question[];
  created_at: string;
};

type ReopenRequest = {
  id: string;
  assignment_id: string;
  assignment_title: string;
  student_name: string;
  student_email: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 10);

const emptyOptions = (): QuestionOption[] => [
  { id: genId(), text: '', isCorrect: false },
  { id: genId(), text: '', isCorrect: false },
  { id: genId(), text: '', isCorrect: false },
  { id: genId(), text: '', isCorrect: false },
];

const emptyQuestion = (): Question => ({
  id: genId(),
  text: '',
  options: emptyOptions(),
});

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────
const StatusBadge: React.FC<{ status: Assignment['status'] }> = ({ status }) => {
  if (status === 'active')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
        <CheckCircle className="h-3 w-3" /> Active
      </span>
    );
  if (status === 'closed')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <XCircle className="h-3 w-3" /> Closed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
      <RefreshCw className="h-3 w-3" /> Reopened
    </span>
  );
};

// ─────────────────────────────────────────────
// Batch Dropdown  (reusable — select & filter)
// variant='select' → no "All" option (for create form)
// variant='filter' → adds "All Batches" at top    (for list filter)
// ─────────────────────────────────────────────
const BatchDropdown: React.FC<{
  batches: Batch[];
  selectedId: string;            // '' means nothing selected / 'all' means All
  onSelect: (id: string, name: string) => void;
  loading: boolean;
  variant?: 'select' | 'filter';
  placeholder?: string;
}> = ({ batches, selectedId, onSelect, loading, variant = 'select', placeholder }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const isFilter = variant === 'filter';
  const selectedBatch = batches.find((b) => b.id === selectedId);
  const label = isFilter
    ? (selectedId === 'all' ? 'All Batches' : (selectedBatch?.name ?? 'All Batches'))
    : (selectedBatch?.name ?? (placeholder ?? 'Select a Batch'));
  const isDefault = isFilter ? selectedId === 'all' : !selectedBatch;

  const filtered = batches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all
          ${isFilter ? 'min-w-[180px]' : 'w-full'}
          ${!isDefault
            ? 'border-blue-500 bg-blue-50 text-blue-800'
            : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:bg-blue-50/40'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm`}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
          <span>{loading ? 'Loading…' : label}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          style={{ minWidth: '220px', right: isFilter ? 0 : undefined }}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search batch…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {/* "All Batches" option for filter variant */}
            {isFilter && (
              <button
                type="button"
                onClick={() => { onSelect('all', 'All Batches'); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between border-b border-gray-50 transition-colors
                  ${selectedId === 'all' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${selectedId === 'all' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  All Batches
                </div>
                {selectedId === 'all' && <CheckCircle className="h-4 w-4 text-blue-500" />}
              </button>
            )}

            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">No batches found</p>
            ) : (
              filtered.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { onSelect(b.id, b.name); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors
                    ${b.id === selectedId ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${b.id === selectedId ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    {b.name}
                  </div>
                  {b.id === selectedId && <CheckCircle className="h-4 w-4 text-blue-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const AddAssignment: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── State ──────────────────────────────────
  const [batches, setBatches] = useState<Batch[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reopenRequests, setReopenRequests] = useState<ReopenRequest[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'requests' | 'results'>('create');

  // Create-form
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedBatchName, setSelectedBatchName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSubjectName, setSelectedSubjectName] = useState('');
  const [batchSubjects, setBatchSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);

  // List UI
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [newDeadlineValue, setNewDeadlineValue] = useState('');
  const [filterBatchId, setFilterBatchId] = useState('all');
  const [filterSubjectId, setFilterSubjectId] = useState('all');

  // Results tab
  const [results, setResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultBatchFilter, setResultBatchFilter] = useState('all');
  const [resultSubjectFilter, setResultSubjectFilter] = useState('all');
  const [resultSearch, setResultSearch] = useState('');

  // ── Auth guard ─────────────────────────────
  useEffect(() => {
    if (localStorage.getItem('adminAuth') !== 'true') navigate('/admin/login');
  }, [navigate]);

  // ── Load batches ───────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingBatches(true);
      const { data, error } = await supabase
        .from('batches')
        .select('id, name')
        .order('created_at', { ascending: false });
      if (error) toast({ title: 'Error loading batches', description: error.message, variant: 'destructive' });
      else setBatches((data as Batch[]) ?? []);
      setLoadingBatches(false);
    })();
  }, [toast]);

  // ── Load assignments ───────────────────────
  const loadAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading assignments', description: error.message, variant: 'destructive' });
    } else {
      const enriched = ((data as any[]) ?? []).map((a) => ({
        ...a,
        batch_name: batches.find((b) => b.id === a.batch_id)?.name ?? a.batch_id,
        questions: typeof a.questions === 'string' ? JSON.parse(a.questions) : (a.questions ?? []),
      })) as Assignment[];
      setAssignments(enriched);
    }
    setLoadingAssignments(false);
  }, [batches, toast]);

  // ── Load reopen requests ───────────────────
  const loadReopenRequests = useCallback(async () => {
    setLoadingRequests(true);
    const { data, error } = await supabase
      .from('assignment_reopen_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setReopenRequests((data as ReopenRequest[]) ?? []);
    setLoadingRequests(false);
  }, []);

  // ── Load subjects when batch changes ────────
  useEffect(() => {
    if (!selectedBatchId) { setBatchSubjects([]); setSelectedSubjectId(''); setSelectedSubjectName(''); return; }
    (async () => {
      setLoadingSubjects(true);
      const { data } = await supabase.from('subjects').select('id, name, batch_id').eq('batch_id', selectedBatchId);
      setBatchSubjects((data as Subject[]) ?? []);
      setLoadingSubjects(false);
    })();
  }, [selectedBatchId]);

  // ── Load student results ──────────────────────
  const loadResults = useCallback(async () => {
    setLoadingResults(true);
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*, assignments(title, batch_id, subject_id)')
      .order('submitted_at', { ascending: false });
    if (!error) setResults((data as any[]) ?? []);
    setLoadingResults(false);
  }, []);

  useEffect(() => {
    if (!loadingBatches) {
      loadAssignments();
      loadReopenRequests();
      loadResults();
    }
  }, [loadingBatches, loadAssignments, loadReopenRequests, loadResults]);

  // ── Question helpers ───────────────────────
  const addQuestion = () => setQuestions((q) => [...q, emptyQuestion()]);
  const removeQuestion = (qId: string) =>
    setQuestions((q) => (q.length > 1 ? q.filter((x) => x.id !== qId) : q));
  const updateQuestionText = (qId: string, text: string) =>
    setQuestions((qs) => qs.map((q) => (q.id === qId ? { ...q, text } : q)));
  const updateOptionText = (qId: string, oId: string, text: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qId ? { ...q, options: q.options.map((o) => (o.id === oId ? { ...o, text } : o)) } : q
      )
    );
  const setCorrectOption = (qId: string, oId: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o) => ({ ...o, isCorrect: o.id === oId })) }
          : q
      )
    );

  // ── Save assignment ────────────────────────
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) { toast({ title: 'Please select a batch', variant: 'destructive' }); return; }
    if (!assignmentTitle.trim()) { toast({ title: 'Assignment title is required', variant: 'destructive' }); return; }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) { toast({ title: `Question ${i + 1} text is empty`, variant: 'destructive' }); return; }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          toast({ title: `Q${i + 1}: Option ${OPTION_LABELS[j]} is empty`, variant: 'destructive' }); return;
        }
      }
      if (!q.options.some((o) => o.isCorrect)) {
        toast({ title: `Q${i + 1}: Mark at least one correct answer`, variant: 'destructive' }); return;
      }
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('assignments')
      .insert([{
        batch_id: selectedBatchId,
        subject_id: selectedSubjectId || null,
        title: assignmentTitle.trim(),
        description: assignmentDesc.trim() || null,
        deadline: deadline || null,
        status: 'active',
        questions,
      }])
      .select('*')
      .single();

    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    } else {
      setAssignments((prev) => [{
        ...(data as any),
        batch_name: selectedBatchName,
        questions,
      } as Assignment, ...prev]);
      toast({ title: '✅ Assignment Created!', description: `"${assignmentTitle}" saved.` });
      setAssignmentTitle(''); setAssignmentDesc(''); setDeadline('');
      setSelectedBatchId(''); setSelectedBatchName('');
      setSelectedSubjectId(''); setSelectedSubjectName('');
      setQuestions([emptyQuestion()]);
      setActiveTab('list');
    }
    setSaving(false);
  };

  // ── Deadline update ────────────────────────
  const handleUpdateDeadline = async (id: string) => {
    const { error } = await supabase.from('assignments').update({ deadline: newDeadlineValue || null }).eq('id', id);
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return; }
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, deadline: newDeadlineValue || null } : a)));
    toast({ title: 'Deadline updated!' });
    setEditingDeadlineId(null);
  };

  // ── Toggle status ──────────────────────────
  const handleToggleStatus = async (a: Assignment) => {
    const newStatus: Assignment['status'] = a.status === 'active' ? 'closed' : 'reopened';
    const { error } = await supabase.from('assignments').update({ status: newStatus }).eq('id', a.id);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    setAssignments((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: newStatus } : x)));
    toast({ title: newStatus === 'closed' ? 'Assignment Closed' : 'Assignment Reopened' });
  };

  // ── Delete ─────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment? This cannot be undone.')) return;
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) { toast({ title: 'Delete failed', description: error.message, variant: 'destructive' }); return; }
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    toast({ title: 'Assignment deleted' });
  };

  // ── Reopen request action ──────────────────
  const handleRequestAction = async (req: ReopenRequest, action: 'approved' | 'rejected') => {
    const { error } = await supabase.from('assignment_reopen_requests').update({ status: action }).eq('id', req.id);
    if (error) { toast({ title: 'Action failed', description: error.message, variant: 'destructive' }); return; }
    if (action === 'approved') {
      await supabase.from('assignments').update({ status: 'reopened' }).eq('id', req.assignment_id);
      setAssignments((prev) => prev.map((a) => (a.id === req.assignment_id ? { ...a, status: 'reopened' } : a)));
    }
    setReopenRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: action } : r)));
    toast({ title: action === 'approved' ? '✅ Approved & Reopened' : '❌ Request Rejected' });
  };

  const filteredAssignments = assignments.filter((a) => {
    const bMatch = filterBatchId === 'all' || a.batch_id === filterBatchId;
    const sMatch = filterSubjectId === 'all' || (a as any).subject_id === filterSubjectId;
    return bMatch && sMatch;
  });

  const filteredResults = results.filter((r) => {
    const bMatch = resultBatchFilter === 'all' || r.batch_id === resultBatchFilter;
    const sMatch = resultSubjectFilter === 'all' || r.subject_id === resultSubjectFilter;
    const nameMatch = !resultSearch ||
      (r.student_name ?? '').toLowerCase().includes(resultSearch.toLowerCase()) ||
      (r.student_email ?? '').toLowerCase().includes(resultSearch.toLowerCase());
    return bMatch && sMatch && nameMatch;
  });

  // All subjects across all batches (for result filter)
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  useEffect(() => {
    supabase.from('subjects').select('id, name, batch_id').then(({ data }) => {
      if (data) setAllSubjects(data as Subject[]);
    });
  }, []);

  const pendingCount = reopenRequests.filter((r) => r.status === 'pending').length;

  // ── Render ─────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
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
                <span>Back</span>
              </Button>
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Assignment Manager</h1>
                <p className="text-sm text-gray-500">Batch-wise assignments &amp; deadline control</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-8 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          {(
            [
              { key: 'create', label: 'Create Assignment', icon: Plus },
              { key: 'list', label: 'All Assignments', icon: Eye },
              {
                key: 'requests',
                label: pendingCount > 0 ? `Reopen Requests (${pendingCount})` : 'Reopen Requests',
                icon: RefreshCw,
              },
              { key: 'results', label: 'Student Results', icon: BarChart2 },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════
            TAB: Create Assignment
        ══════════════════════════════════════ */}
        {activeTab === 'create' && (
          <form onSubmit={handleSaveAssignment} className="space-y-6">

            {/* Step 1 – Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">Step 1</span>
                  Assignment Details
                </CardTitle>
                <CardDescription>Select a batch and fill in the assignment info</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Batch + Subject side-by-side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Select Batch *</Label>
                    <BatchDropdown
                      batches={batches}
                      selectedId={selectedBatchId}
                      onSelect={(id, name) => { setSelectedBatchId(id); setSelectedBatchName(name); }}
                      loading={loadingBatches}
                    />
                    {selectedBatchName && (
                      <p className="mt-1.5 text-xs text-blue-600 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> {selectedBatchName}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-2 block">Select Subject (optional)</Label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => {
                        const sub = batchSubjects.find((s) => s.id === e.target.value);
                        setSelectedSubjectId(e.target.value);
                        setSelectedSubjectName(sub?.name ?? '');
                      }}
                      disabled={!selectedBatchId || loadingSubjects}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">{loadingSubjects ? 'Loading subjects…' : !selectedBatchId ? 'Select batch first' : batchSubjects.length === 0 ? 'No subjects (add in Batch Management)' : 'Select subject…'}</option>
                      {batchSubjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {selectedSubjectName && (
                      <p className="mt-1.5 text-xs text-purple-600 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> {selectedSubjectName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="asgn-title" className="mb-2 block">Assignment Title *</Label>
                  <Input
                    id="asgn-title"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="e.g., Week 3 – React Hooks Quiz"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="asgn-desc" className="mb-2 block">Description (optional)</Label>
                  <textarea
                    id="asgn-desc"
                    rows={3}
                    value={assignmentDesc}
                    onChange={(e) => setAssignmentDesc(e.target.value)}
                    placeholder="Instructions or context for students…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Deadline */}
                <div>
                  <Label htmlFor="asgn-deadline" className="mb-2 block">
                    <Calendar className="inline h-3.5 w-3.5 mr-1 mb-0.5 text-blue-500" />
                    Deadline (optional)
                  </Label>
                  <Input
                    id="asgn-deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full sm:w-72"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2 – Questions */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">Step 2</span>
                      Questions ({questions.length})
                    </CardTitle>
                    <CardDescription className="mt-1">Each question has 4 options — click an option to mark it correct</CardDescription>
                  </div>
                  <Button type="button" onClick={addQuestion} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {questions.map((q, qi) => (
                  <div key={q.id} className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
                    {/* Question text */}
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        {qi + 1}
                      </span>
                      <div className="flex-1">
                        <Label className="mb-1.5 block text-xs font-medium text-gray-600">Question Text *</Label>
                        <textarea
                          rows={2}
                          value={q.text}
                          onChange={(e) => updateQuestionText(q.id, e.target.value)}
                          placeholder={`Enter question ${qi + 1}…`}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                        />
                      </div>
                      {questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-400 hover:text-red-600 transition mt-1 shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Options grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                      {q.options.map((opt, oi) => (
                        <div
                          key={opt.id}
                          onClick={() => setCorrectOption(q.id, opt.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                            opt.isCorrect
                              ? 'bg-green-50 border-green-400 shadow-sm'
                              : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                          }`}
                        >
                          <span
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                              opt.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {OPTION_LABELS[oi]}
                          </span>
                          <input
                            type="text"
                            value={opt.text}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateOptionText(q.id, opt.id, e.target.value)}
                            placeholder={`Option ${OPTION_LABELS[oi]}`}
                            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                          />
                          {opt.isCorrect && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 pl-10">Click an option card to mark as the correct answer</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAssignmentTitle(''); setAssignmentDesc(''); setDeadline('');
                  setSelectedBatchId(''); setSelectedBatchName('');
                  setQuestions([emptyQuestion()]);
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-8">
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save Assignment'}
              </Button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════
            TAB: All Assignments
        ══════════════════════════════════════ */}
        {activeTab === 'list' && (
          <div className="space-y-5">
            {/* Filter bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Filter by Batch:</span>
                {filterBatchId !== 'all' && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                    {batches.find((b) => b.id === filterBatchId)?.name ?? filterBatchId}
                  </span>
                )}
                {filterBatchId !== 'all' && (
                  <button
                    onClick={() => setFilterBatchId('all')}
                    className="text-xs text-gray-400 hover:text-red-500 transition"
                    title="Clear filter"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
              <BatchDropdown
                variant="filter"
                batches={batches}
                selectedId={filterBatchId}
                onSelect={(id) => setFilterBatchId(id)}
                loading={loadingBatches}
                placeholder="All Batches"
              />
            </div>

            {/* List */}
            {loadingAssignments ? (
              <Card><CardContent className="py-12 text-center text-gray-400 text-sm">Loading assignments…</CardContent></Card>
            ) : filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-medium">No assignments found</p>
                  <p className="text-gray-400 text-xs mt-1">Create one from the "Create Assignment" tab</p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.map((a) => (
                <Card key={a.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between px-5 py-4 gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          {a.batch_name}
                        </span>
                        <StatusBadge status={a.status} />
                      </div>
                      <h3 className="text-gray-900 font-semibold text-sm truncate">{a.title}</h3>
                      {a.description && (
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{a.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {a.deadline
                          ? `Due: ${new Date(a.deadline).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                          : 'No deadline set'}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {/* Deadline edit */}
                      {editingDeadlineId === a.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="datetime-local"
                            value={newDeadlineValue}
                            onChange={(e) => setNewDeadlineValue(e.target.value)}
                            className="h-8 text-xs w-48"
                          />
                          <Button size="sm" onClick={() => handleUpdateDeadline(a.id)} className="h-8 text-xs bg-green-600 hover:bg-green-700">Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingDeadlineId(null)} className="h-8 text-xs">Cancel</Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1.5 text-xs h-8"
                          onClick={() => { setEditingDeadlineId(a.id); setNewDeadlineValue(a.deadline ? a.deadline.slice(0, 16) : ''); }}
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit Deadline
                        </Button>
                      )}

                      {/* Status toggle */}
                      <Button
                        size="sm"
                        variant="outline"
                        className={`flex items-center gap-1.5 text-xs h-8 ${
                          a.status === 'active' || a.status === 'reopened'
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                        onClick={() => handleToggleStatus(a)}
                      >
                        {a.status === 'active' || a.status === 'reopened' ? (
                          <><XCircle className="h-3.5 w-3.5" /> Close</>
                        ) : (
                          <><RefreshCw className="h-3.5 w-3.5" /> Reopen</>
                        )}
                      </Button>

                      {/* Delete */}
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-600 h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      {/* Expand */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId((prev) => (prev === a.id ? null : a.id))}
                        className="h-8 w-8 p-0 text-gray-400"
                      >
                        {expandedId === a.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded questions */}
                  {expandedId === a.id && (
                    <div className="border-t border-gray-100 px-5 py-5 bg-gray-50 space-y-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Questions ({a.questions?.length ?? 0})
                      </p>
                      {(a.questions ?? []).map((q, qi) => (
                        <div key={q.id} className="space-y-2">
                          <p className="text-gray-800 text-sm font-medium">
                            <span className="text-blue-600 font-bold mr-2">{qi + 1}.</span>
                            {q.text}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5">
                            {q.options.map((o, oi) => (
                              <div
                                key={o.id}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                                  o.isCorrect
                                    ? 'bg-green-50 text-green-700 border-green-200 font-medium'
                                    : 'bg-white text-gray-600 border-gray-100'
                                }`}
                              >
                                <span className="font-bold text-xs shrink-0">{OPTION_LABELS[oi]}.</span>
                                {o.text}
                                {o.isCorrect && <CheckCircle className="h-3.5 w-3.5 ml-auto shrink-0 text-green-500" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: Reopen Requests
        ══════════════════════════════════════ */}
        {activeTab === 'requests' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 font-semibold text-base">
                Student Reopen Requests
                {pendingCount > 0 && (
                  <span className="ml-2 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingCount} pending
                  </span>
                )}
              </h2>
            </div>

            {loadingRequests ? (
              <Card><CardContent className="py-12 text-center text-gray-400 text-sm">Loading requests…</CardContent></Card>
            ) : reopenRequests.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-medium">No reopen requests yet</p>
                  <p className="text-gray-400 text-xs mt-1">Requests submitted by students will appear here</p>
                </CardContent>
              </Card>
            ) : (
              reopenRequests.map((req) => (
                <Card key={req.id} className={`overflow-hidden ${req.status === 'pending' ? 'border-yellow-200' : ''}`}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{req.student_name}</span>
                          <span className="text-gray-400 text-xs">{req.student_email}</span>
                          {req.status === 'pending' && (
                            <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-100">Pending</Badge>
                          )}
                          {req.status === 'approved' && (
                            <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100">Approved</Badge>
                          )}
                          {req.status === 'rejected' && (
                            <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">Rejected</Badge>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs">
                          Assignment: <span className="text-blue-600 font-medium">{req.assignment_title}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Offline reason */}
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Offline Reason</p>
                      <p className="text-sm text-gray-700">{req.reason}</p>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex gap-3 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleRequestAction(req, 'approved')}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve &amp; Reopen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestAction(req, 'rejected')}
                          className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
        {/* ══════════════════════════════════════
            TAB: Student Results
        ══════════════════════════════════════ */}
        {activeTab === 'results' && (
          <div className="space-y-5">
            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
              <h3 className="font-semibold text-gray-800 text-sm">Filter Results</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search student name / email…"
                    value={resultSearch}
                    onChange={(e) => setResultSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Batch filter */}
                <select
                  value={resultBatchFilter}
                  onChange={(e) => setResultBatchFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Batches</option>
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {/* Subject filter */}
                <select
                  value={resultSubjectFilter}
                  onChange={(e) => setResultSubjectFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Subjects</option>
                  {allSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Results table */}
            {loadingResults ? (
              <Card><CardContent className="py-10 text-center text-gray-400 text-sm">Loading results…</CardContent></Card>
            ) : filteredResults.length === 0 ? (
              <Card>
                <CardContent className="py-14 text-center">
                  <BarChart2 className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">No results found</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Assignment</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Batch</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Score</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">%</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredResults.map((r, i) => {
                        const pctVal = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                        const batchName = batches.find((b) => b.id === r.batch_id)?.name ?? '—';
                        const subjectName = allSubjects.find((s) => s.id === r.subject_id)?.name ?? '—';
                        return (
                          <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{r.student_name ?? '—'}</p>
                              <p className="text-xs text-gray-400">{r.student_email ?? ''}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{r.assignments?.title ?? '—'}</td>
                            <td className="px-4 py-3">
                              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">{batchName}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">{subjectName}</span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold">{r.score}/{r.total}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-bold text-sm ${
                                pctVal >= 80 ? 'text-green-600' : pctVal >= 60 ? 'text-blue-600' : pctVal >= 40 ? 'text-orange-500' : 'text-red-500'
                              }`}>{pctVal}%</span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {new Date(r.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                  Showing {filteredResults.length} of {results.length} results
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAssignment;
