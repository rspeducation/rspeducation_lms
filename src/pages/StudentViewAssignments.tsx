import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ClipboardList, Clock, CheckCircle, XCircle,
  AlertTriangle, Trophy, BarChart2, Search, ChevronRight,
  RefreshCw, Lock, PlayCircle, Star, BookOpen, Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Subject = { id: string; name: string };

type Question = {
  id: string;
  text: string;
  options: { id: string; text: string; isCorrect: boolean }[];
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: 'active' | 'closed' | 'reopened';
  subject_id: string | null;
  subject_name?: string;
  questions: Question[];
  batch_id: string;
};

type Submission = {
  id: string;
  assignment_id: string;
  score: number;
  total: number;
  submitted_at: string;
  answers: { question_id: string; selected_option_id: string }[];
};

type StudentProfile = {
  id: string;
  name: string;
  email: string;
  batch_id: string | null;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const pct = (score: number, total: number) =>
  total === 0 ? 0 : Math.round((score / total) * 100);

const deadlineColor = (dl: string | null) => {
  if (!dl) return 'text-gray-400';
  const diff = new Date(dl).getTime() - Date.now();
  if (diff < 0) return 'text-red-500';
  if (diff < 24 * 60 * 60 * 1000) return 'text-orange-500';
  return 'text-gray-500';
};

const formatDeadline = (dl: string | null) => {
  if (!dl) return 'No deadline';
  return new Date(dl).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─────────────────────────────────────────────
// Rules Modal
// ─────────────────────────────────────────────
const RulesModal: React.FC<{
  assignment: Assignment;
  onStart: () => void;
  onClose: () => void;
}> = ({ assignment, onStart, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-xl">
          <ClipboardList className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-lg">{assignment.title}</h2>
          <p className="text-gray-500 text-sm">{assignment.questions.length} questions</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        <p className="font-semibold text-amber-800 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Assignment Rules
        </p>
        <ul className="text-sm text-amber-700 space-y-1.5 list-none">
          <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">🔒</span> You have <strong>only 1 attempt</strong>. Once submitted it cannot be retaken.</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">👁️</span> <strong>Do NOT switch tabs or minimize</strong> the browser during the assignment.</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">⚠️</span> You will receive <strong>3 warnings</strong> if you switch tabs.</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">🚨</span> On the <strong>4th tab switch, the assignment will auto-submit</strong> with your current answers.</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">✅</span> Select the best answer for each question before clicking Next.</li>
          {assignment.deadline && (
            <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0">📅</span> Deadline: <strong>{formatDeadline(assignment.deadline)}</strong></li>
          )}
        </ul>
      </div>

      {assignment.description && (
        <p className="text-gray-600 text-sm border-l-4 border-blue-300 pl-3">{assignment.description}</p>
      )}

      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={onStart} className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
          <PlayCircle className="h-4 w-4" /> Start Assignment
        </Button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Tab Warning Banner
// ─────────────────────────────────────────────
const TabWarningBanner: React.FC<{ count: number }> = ({ count }) => (
  <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 py-3 px-4 text-white text-sm font-bold shadow-lg animate-bounce
    ${count >= 3 ? 'bg-red-600' : 'bg-orange-500'}`}>
    <AlertTriangle className="h-5 w-5" />
    {count >= 3
      ? '🚨 FINAL WARNING: Next tab switch will AUTO-SUBMIT your assignment!'
      : `⚠️ Warning ${count}/3: Do not leave this tab! Your assignment will auto-submit.`}
  </div>
);

// ─────────────────────────────────────────────
// Quiz Screen
// ─────────────────────────────────────────────
const QuizScreen: React.FC<{
  assignment: Assignment;
  onSubmit: (answers: { question_id: string; selected_option_id: string }[]) => void;
}> = ({ assignment, onSubmit }) => {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ question_id: string; selected_option_id: string }[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [tabWarnings, setTabWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const autoSubmitRef = useRef(false);

  const q = assignment.questions[current];
  const progress = Math.round(((current + (selected ? 1 : 0)) / assignment.questions.length) * 100);

  // Tab-switch detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !autoSubmitRef.current) {
        setTabWarnings((prev) => {
          const next = prev + 1;
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 4000);
          if (next >= 4) {
            autoSubmitRef.current = true;
            // Auto-submit with current answers
            const finalAnswers = [...answers];
            if (selected) {
              finalAnswers.push({ question_id: q.id, selected_option_id: selected });
            }
            onSubmit(finalAnswers);
          }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [answers, selected, q, onSubmit]);

  const handleNext = () => {
    const updatedAnswers = [...answers];
    if (selected) {
      updatedAnswers.push({ question_id: q.id, selected_option_id: selected });
    }
    if (current + 1 < assignment.questions.length) {
      setAnswers(updatedAnswers);
      setCurrent(current + 1);
      setSelected('');
    } else {
      onSubmit(updatedAnswers);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Warning banner */}
      {showWarning && tabWarnings < 4 && <TabWarningBanner count={tabWarnings} />}

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-sm sm:text-base truncate max-w-xs">{assignment.title}</h2>
            <p className="text-xs text-gray-500">Question {current + 1} of {assignment.questions.length}</p>
          </div>
          {tabWarnings > 0 && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tabWarnings >= 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
              ⚠️ {tabWarnings}/3 warnings
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Question */}
            <div className="flex items-start gap-3">
              <span className="bg-blue-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                {current + 1}
              </span>
              <p className="text-gray-900 font-semibold text-base leading-relaxed">{q.text}</p>
            </div>

            {/* Options */}
            <div className="space-y-3 pl-11">
              {q.options.map((opt, oi) => (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all
                    ${selected === opt.id
                      ? 'bg-blue-50 border-blue-500 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                >
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                    ${selected === opt.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {['A', 'B', 'C', 'D'][oi]}
                  </span>
                  <span className={`text-sm ${selected === opt.id ? 'text-blue-800 font-medium' : 'text-gray-700'}`}>
                    {opt.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-2">
              <p className="text-xs text-gray-400">
                {!selected ? 'Select an answer to continue' : 'Answer selected ✓'}
              </p>
              <Button
                onClick={handleNext}
                disabled={!selected}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6"
              >
                {current + 1 === assignment.questions.length ? 'Submit' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Results Screen
// ─────────────────────────────────────────────
const ResultsScreen: React.FC<{
  assignment: Assignment;
  submission: Submission;
  onBack: () => void;
  onReopenRequest: () => void;
}> = ({ assignment, submission, onBack, onReopenRequest }) => {
  const percent = pct(submission.score, submission.total);
  const grade = percent >= 80 ? 'Excellent! 🏆' : percent >= 60 ? 'Good Job! 👍' : percent >= 40 ? 'Keep Practicing 💪' : 'Needs Improvement 📚';
  const gradeColor = percent >= 80 ? 'text-green-600' : percent >= 60 ? 'text-blue-600' : percent >= 40 ? 'text-orange-600' : 'text-red-600';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h2 className="font-bold text-gray-900">Results – {assignment.title}</h2>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Score card */}
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <Trophy className="h-12 w-12 mx-auto text-yellow-500" />
            <div>
              <p className={`text-4xl font-extrabold ${gradeColor}`}>{percent}%</p>
              <p className={`text-lg font-semibold mt-1 ${gradeColor}`}>{grade}</p>
            </div>
            <div className="flex justify-center gap-8 text-sm text-gray-600">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{submission.score}</p>
                <p>Correct</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{submission.total - submission.score}</p>
                <p>Wrong</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">{submission.total}</p>
                <p>Total</p>
              </div>
            </div>
            {/* Progress ring */}
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${percent >= 60 ? 'bg-green-500' : 'bg-red-400'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Question review */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 text-base">Question Review</h3>
          {assignment.questions.map((q, qi) => {
            const userAnswer = submission.answers.find((a) => a.question_id === q.id);
            const correctOpt = q.options.find((o) => o.isCorrect);
            const selectedOpt = q.options.find((o) => o.id === userAnswer?.selected_option_id);
            const isCorrect = selectedOpt?.isCorrect === true;

            return (
              <Card key={q.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-400'}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    {isCorrect
                      ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      : <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />}
                    <p className="text-gray-800 text-sm font-medium">
                      <span className="text-blue-600 font-bold mr-2">{qi + 1}.</span>{q.text}
                    </p>
                  </div>
                  <div className="pl-7 space-y-1">
                    {selectedOpt && (
                      <p className={`text-xs font-medium ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                        Your answer: {selectedOpt.text}
                      </p>
                    )}
                    {!isCorrect && correctOpt && (
                      <p className="text-xs font-medium text-green-600">
                        Correct answer: {correctOpt.text}
                      </p>
                    )}
                    {!userAnswer && (
                      <p className="text-xs text-gray-400 italic">Not answered (auto-submitted)</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Reopen request */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-800 text-sm">Want to retake?</p>
              <p className="text-amber-700 text-xs mt-0.5">If you had a genuine offline reason, request admin to reopen</p>
            </div>
            <Button size="sm" variant="outline" onClick={onReopenRequest} className="border-amber-400 text-amber-700 hover:bg-amber-100 shrink-0">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Request Reopen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Reopen Request Modal
// ─────────────────────────────────────────────
const ReopenModal: React.FC<{
  assignment: Assignment;
  studentName: string;
  studentEmail: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}> = ({ assignment, studentName, studentEmail, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSending(true);
    await onSubmit(reason);
    setSending(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="font-bold text-gray-900">Request Assignment Reopen</h3>
        <p className="text-sm text-gray-500">
          Assignment: <span className="font-medium text-gray-800">{assignment.title}</span>
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Offline Reason (explain why you couldn't complete it)
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Power outage, internet issue, family emergency…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!reason.trim() || sending} className="flex-1 bg-blue-600 hover:bg-blue-700">
            {sending ? 'Sending…' : 'Submit Request'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const StudentViewAssignments: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('all');
  const [searchText, setSearchText] = useState('');

  // UI states
  const [rulesFor, setRulesFor] = useState<Assignment | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [resultFor, setResultFor] = useState<{ assignment: Assignment; submission: Submission } | null>(null);
  const [reopenFor, setReopenFor] = useState<Assignment | null>(null);

  // Auth guard
  useEffect(() => {
    if (localStorage.getItem('studentAuth') !== 'true') navigate('/login');
  }, [navigate]);

  // Load profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('students')
        .select('id, name, email, batch_id')
        .eq('user_id', user.id)
        .single();
      if (data) setProfile(data as StudentProfile);
    })();
  }, [user]);

  // Load data when profile ready
  const loadData = useCallback(async () => {
    if (!profile?.batch_id) return;
    setLoading(true);

    const [aRes, sRes, subRes] = await Promise.all([
      supabase.from('assignments').select('*').eq('batch_id', profile.batch_id).neq('status', 'closed'),
      supabase.from('assignment_submissions').select('*').eq('student_id', profile.id),
      supabase.from('subjects').select('id, name').eq('batch_id', profile.batch_id),
    ]);

    const subs = (subRes.data as Subject[] ?? []);
    setSubjects(subs);

    const asgns = ((aRes.data as any[]) ?? []).map((a) => ({
      ...a,
      questions: typeof a.questions === 'string' ? JSON.parse(a.questions) : (a.questions ?? []),
      subject_name: subs.find((s) => s.id === a.subject_id)?.name ?? null,
    })) as Assignment[];
    setAssignments(asgns);

    const mySubmissions = (sRes.data as Submission[] ?? []).map((s) => ({
      ...s,
      answers: typeof s.answers === 'string' ? JSON.parse(s.answers) : (s.answers ?? []),
    }));
    setSubmissions(mySubmissions);
    setLoading(false);
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  // Submit answers
  const handleSubmitAnswers = async (
    assignment: Assignment,
    answers: { question_id: string; selected_option_id: string }[]
  ) => {
    let score = 0;
    for (const q of assignment.questions) {
      const ans = answers.find((a) => a.question_id === q.id);
      const correct = q.options.find((o) => o.isCorrect);
      if (ans && correct && ans.selected_option_id === correct.id) score++;
    }

    const { data, error } = await supabase.from('assignment_submissions').insert([{
      assignment_id: assignment.id,
      student_id: profile!.id,
      student_name: profile!.name,
      student_email: profile!.email,
      batch_id: profile!.batch_id,
      subject_id: assignment.subject_id,
      score,
      total: assignment.questions.length,
      answers,
    }]).select('*').single();

    if (error) {
      toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
      return;
    }

    const newSub: Submission = { ...(data as any), answers };
    setSubmissions((prev) => [...prev, newSub]);
    setActiveAssignment(null);
    setResultFor({ assignment, submission: newSub });
    toast({ title: `✅ Submitted! Score: ${score}/${assignment.questions.length}` });
  };

  // Reopen request submit
  const handleReopenSubmit = async (reason: string) => {
    if (!reopenFor || !profile) return;
    const { error } = await supabase.from('assignment_reopen_requests').insert([{
      assignment_id: reopenFor.id,
      assignment_title: reopenFor.title,
      student_name: profile.name,
      student_email: profile.email,
      reason,
      status: 'pending',
    }]);
    if (error) {
      toast({ title: 'Request failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Request sent to admin!' });
    }
    setReopenFor(null);
  };

  const getSubmission = (aId: string) => submissions.find((s) => s.assignment_id === aId) ?? null;

  const avgScore = submissions.length === 0 ? null :
    Math.round(submissions.reduce((sum, s) => sum + pct(s.score, s.total), 0) / submissions.length);

  const filtered = assignments.filter((a) => {
    const matchSubject = filterSubject === 'all' || a.subject_id === filterSubject;
    const matchSearch = !searchText || a.title.toLowerCase().includes(searchText.toLowerCase());
    return matchSubject && matchSearch;
  });

  // ── Render quiz screen ─────────────────────
  if (activeAssignment) {
    return (
      <QuizScreen
        assignment={activeAssignment}
        onSubmit={(answers) => handleSubmitAnswers(activeAssignment, answers)}
      />
    );
  }

  // ── Render results screen ──────────────────
  if (resultFor) {
    return (
      <ResultsScreen
        assignment={resultFor.assignment}
        submission={resultFor.submission}
        onBack={() => setResultFor(null)}
        onReopenRequest={() => { setReopenFor(resultFor.assignment); setResultFor(null); }}
      />
    );
  }

  // ── Main list ──────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      {rulesFor && (
        <RulesModal
          assignment={rulesFor}
          onStart={() => { setActiveAssignment(rulesFor); setRulesFor(null); }}
          onClose={() => setRulesFor(null)}
        />
      )}
      {reopenFor && profile && (
        <ReopenModal
          assignment={reopenFor}
          studentName={profile.name}
          studentEmail={profile.email}
          onClose={() => setReopenFor(null)}
          onSubmit={handleReopenSubmit}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => navigate('/student/dashboard')} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <ClipboardList className="h-7 w-7 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Assignments</h1>
                <p className="text-xs text-gray-500">Batch-wise assignment portal</p>
              </div>
            </div>
            {avgScore !== null && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                <BarChart2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Avg: {avgScore}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Stats row */}
        {submissions.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{assignments.length}</p>
                <p className="text-xs text-gray-500 mt-1">Total Assignments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{submissions.length}</p>
                <p className="text-xs text-gray-500 mt-1">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{avgScore ?? 0}%</p>
                <p className="text-xs text-gray-500 mt-1">Average Score</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assignments…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Subject filter */}
          {subjects.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-gray-400" />
              <button
                onClick={() => setFilterSubject('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filterSubject === 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400'}`}
              >
                All Subjects
              </button>
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setFilterSubject(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filterSubject === s.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assignment list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading assignments…</div>
        ) : !profile?.batch_id ? (
          <Card><CardContent className="py-12 text-center text-gray-400 text-sm">You are not assigned to any batch yet.</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ClipboardList className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">No assignments found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((a) => {
            const sub = getSubmission(a.id);
            const isPast = a.deadline ? new Date(a.deadline) < new Date() : false;
            const canAttempt = !sub && (a.status === 'active' || a.status === 'reopened') && !isPast;

            return (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {a.subject_name && (
                          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-purple-200">
                            <BookOpen className="inline h-3 w-3 mr-1" />{a.subject_name}
                          </span>
                        )}
                        {sub && (
                          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Score: {sub.score}/{sub.total} ({pct(sub.score, sub.total)}%)
                          </span>
                        )}
                        {!sub && isPast && (
                          <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-200">Expired</span>
                        )}
                        {a.status === 'reopened' && (
                          <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-yellow-200">
                            <RefreshCw className="inline h-3 w-3 mr-1" />Reopened
                          </span>
                        )}
                      </div>
                      <h3 className="text-gray-900 font-semibold text-base">{a.title}</h3>
                      {a.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{a.description}</p>}
                      <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${deadlineColor(a.deadline)}`}>
                        <Clock className="h-3 w-3" />
                        {formatDeadline(a.deadline)}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{a.questions.length} questions</p>
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      {sub ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setResultFor({ assignment: a, submission: sub })}
                          className="flex items-center gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4" /> View Result
                        </Button>
                      ) : canAttempt ? (
                        <Button
                          size="sm"
                          onClick={() => setRulesFor(a)}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
                        >
                          <PlayCircle className="h-4 w-4" /> Start
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled className="flex items-center gap-1.5 text-gray-400">
                          <Lock className="h-4 w-4" />
                          {isPast && !sub ? 'Missed' : 'Locked'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentViewAssignments;
