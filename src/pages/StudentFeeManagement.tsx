import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  History,
  IndianRupee,
  Loader2,
  Receipt,
  User,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────
type FeeRecord = {
  id: string;
  total_fee: number;
  paid_amount: number;
  pending_amount: number;
  status: 'paid' | 'partial' | 'unpaid';
  batch_name: string;
};
type PaymentLog = {
  id: string;
  transfer_id: string;
  amount: number;
  bank_name: string | null;
  received_by: string;
  payment_date: string;
  notes: string | null;
  created_at: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtRs(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function progressPct(paid: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
}

const StudentFeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [feeRecord, setFeeRecord] = useState<FeeRecord | null>(null);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loadingFee, setLoadingFee] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ── Auth & load ───────────────────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem('studentUser') || localStorage.getItem('user');
    let userId: string | null = null;
    try {
      if (raw) {
        const parsed = JSON.parse(raw);
        userId = parsed.id || parsed.user_id || null;
        setStudentName(parsed.name || '');
        setStudentCode(parsed.student_code || '');
      }
    } catch {
      /* ignore */
    }

    if (!userId) {
      // Try Supabase session
      supabase.auth.getSession().then(({ data }) => {
        const uid = data?.session?.user?.id;
        if (!uid) {
          navigate('/login');
          return;
        }
        loadStudentFee(uid);
      });
    } else {
      loadStudentFee(userId);
    }
    // eslint-disable-next-line
  }, []);

  const loadStudentFee = async (userId: string) => {
    setLoadingFee(true);
    try {
      // Get student row
      const { data: stuData, error: stuErr } = await supabase
        .from('students')
        .select('id, student_code, batch_id, users(name)')
        .eq('user_id', userId)
        .single();

      if (stuErr || !stuData) {
        toast({ title: 'Could not load student profile', variant: 'destructive' });
        setLoadingFee(false);
        return;
      }

      const sData = stuData as any;
      setStudentName(sData.users?.name || studentName);
      setStudentCode(sData.student_code || '');

      // Get fee record
      const { data: feeData, error: feeErr } = await supabase
        .from('fee_records')
        .select('id, total_fee, paid_amount, batches(name)')
        .eq('student_id', sData.id)
        .single();

      if (feeErr || !feeData) {
        // No fee record yet
        setFeeRecord(null);
        setLoadingFee(false);
        return;
      }

      const fd = feeData as any;
      const paid = fd.paid_amount ?? 0;
      const total = fd.total_fee ?? 0;
      const pending = Math.max(0, total - paid);
      let status: FeeRecord['status'] = 'unpaid';
      if (paid >= total && total > 0) status = 'paid';
      else if (paid > 0) status = 'partial';

      const rec: FeeRecord = {
        id: fd.id,
        total_fee: total,
        paid_amount: paid,
        pending_amount: pending,
        status,
        batch_name: fd.batches?.name ?? '—',
      };
      setFeeRecord(rec);
      loadPaymentLogs(fd.id);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message, variant: 'destructive' });
    } finally {
      setLoadingFee(false);
    }
  };

  const loadPaymentLogs = async (feeRecordId: string) => {
    setLoadingLogs(true);
    const { data, error } = await supabase
      .from('fee_payments')
      .select('id, transfer_id, amount, bank_name, received_by, payment_date, notes, created_at')
      .eq('fee_record_id', feeRecordId)
      .order('created_at', { ascending: false });
    if (!error) setPayments((data as PaymentLog[]) ?? []);
    setLoadingLogs(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const pct = feeRecord ? progressPct(feeRecord.paid_amount, feeRecord.total_fee) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/student/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <BadgeDollarSign className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">My Fee Details</h1>
                {studentName && <p className="text-xs text-gray-400">{studentName}</p>}
              </div>
            </div>
            {studentCode && (
              <span className="text-xs font-mono bg-gray-100 px-3 py-1.5 rounded-lg text-gray-600 border">
                {studentCode}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loadingFee ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          </div>
        ) : !feeRecord ? (
          /* ── No fee record ── */
          <div className="text-center py-24 text-gray-400">
            <BadgeDollarSign className="h-14 w-14 mx-auto mb-4 opacity-30" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Fee Record Found</h2>
            <p className="text-sm text-gray-400">
              Your fee has not been set up yet. Please contact your administrator.
            </p>
          </div>
        ) : (
          <>
            {/* ── Batch tag ── */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full">
              <IndianRupee className="h-3.5 w-3.5" />
              Batch: {feeRecord.batch_name}
            </div>

            {/* ── Fee cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total */}
              <Card className="border shadow-sm bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <IndianRupee className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Course Fee</p>
                      <p className="text-2xl font-bold text-gray-900">{fmtRs(feeRecord.total_fee)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Paid */}
              <Card className="border shadow-sm bg-emerald-50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-200 text-emerald-700 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600">Amount Paid</p>
                      <p className="text-2xl font-bold text-emerald-700">{fmtRs(feeRecord.paid_amount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending */}
              <Card
                className={`border shadow-sm ${
                  feeRecord.status === 'paid' ? 'bg-emerald-50' : 'bg-red-50'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        feeRecord.status === 'paid'
                          ? 'bg-emerald-200 text-emerald-700'
                          : 'bg-red-200 text-red-700'
                      }`}
                    >
                      {feeRecord.status === 'paid' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xs ${
                          feeRecord.status === 'paid' ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {feeRecord.status === 'paid' ? 'All Cleared!' : 'Pending Amount'}
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          feeRecord.status === 'paid' ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {fmtRs(feeRecord.pending_amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Progress bar ── */}
            <Card className="border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {feeRecord.status === 'paid' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : feeRecord.status === 'partial' ? (
                      <Clock className="h-4 w-4 text-amber-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-semibold text-gray-800 text-sm">
                      Payment Progress
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        feeRecord.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : feeRecord.status === 'partial'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {feeRecord.status === 'paid'
                        ? 'Fully Paid'
                        : feeRecord.status === 'partial'
                        ? 'Partially Paid'
                        : 'Unpaid'}
                    </span>
                    <span className="text-sm font-bold text-gray-700">{pct}%</span>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      feeRecord.status === 'paid'
                        ? 'bg-emerald-500'
                        : feeRecord.status === 'partial'
                        ? 'bg-amber-500'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>₹0</span>
                  <span>{fmtRs(feeRecord.total_fee)}</span>
                </div>

                {feeRecord.status !== 'paid' && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 shrink-0" />
                    <p>
                      Your remaining balance is <strong>{fmtRs(feeRecord.pending_amount)}</strong>.
                      Please pay at the admin office. Payments are recorded by our team.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Payment History ── */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-500" />
                  Payment History
                </CardTitle>
                <CardDescription>All recorded payments for your account</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingLogs ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No payment records yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead>Transfer ID</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Bank</TableHead>
                          <TableHead>Received By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p) => (
                          <TableRow key={p.id} className="hover:bg-gray-50">
                            <TableCell>
                              <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                {p.transfer_id}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-emerald-700">
                              {fmtRs(p.amount)}
                            </TableCell>
                            <TableCell className="text-sm">{p.bank_name || '—'}</TableCell>
                            <TableCell className="text-sm">{p.received_by}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {new Date(p.payment_date || p.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                              {p.notes || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentFeeManagement;
