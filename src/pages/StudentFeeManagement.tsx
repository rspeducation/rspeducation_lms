import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Receipt,
  Building2,
  Phone,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
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
  invoice_no: string;
  transfer_id: string;
  installment_no: number;
  amount: number;
  bank_name: string | null;
  received_by: string;
  payment_date: string;
  notes: string | null;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtRs(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtMonth(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function fmtDateShort(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Circular Progress ────────────────────────────────────────────────────────
const CircularProgress: React.FC<{ paid: number; total: number }> = ({ paid, total }) => {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 110, height: 110 }}>
      <svg width="110" height="110" className="-rotate-90">
        {/* Background ring */}
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="9" />
        {/* Progress ring */}
        <circle
          cx="55" cy="55" r={r}
          fill="none"
          stroke="rgba(0,0,0,0.75)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-black text-gray-900 leading-tight">{fmtRs(paid)}</span>
        <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">paid</span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentFeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [course, setCourse] = useState('');
  const [feeRecord, setFeeRecord] = useState<FeeRecord | null>(null);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loadingFee, setLoadingFee] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ── Auth & load ──────────────────────────────────────────────────────────
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
    } catch { /* ignore */ }

    if (!userId) {
      supabase.auth.getSession().then(({ data }) => {
        const uid = data?.session?.user?.id;
        if (!uid) { navigate('/login'); return; }
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
      const { data: stuData, error: stuErr } = await supabase
        .from('students')
        .select('id, student_code, batch_id, course, users(name)')
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
      setCourse(sData.course || '');

      const { data: feeData, error: feeErr } = await supabase
        .from('fee_records')
        .select('id, total_fee, paid_amount, batches(name)')
        .eq('student_id', sData.id)
        .single();

      if (feeErr || !feeData) {
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

      setFeeRecord({
        id: fd.id,
        total_fee: total,
        paid_amount: paid,
        pending_amount: pending,
        status,
        batch_name: fd.batches?.name ?? '—',
      });

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
      .select('id, invoice_no, transfer_id, installment_no, amount, bank_name, received_by, payment_date, notes, created_at')
      .eq('fee_record_id', feeRecordId)
      .order('installment_no', { ascending: true });
    if (!error) setPayments((data as PaymentLog[]) ?? []);
    setLoadingLogs(false);
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const nextDueDate = feeRecord && feeRecord.status !== 'paid'
    ? payments.length > 0
      ? fmtMonth(payments[payments.length - 1]?.payment_date || '')
      : 'Contact Admin'
    : null;

  const lastInstNo = payments.length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f7f7f8]">

      {/* ── Top Nav ── */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/student/dashboard')}
                className="flex items-center gap-2 text-gray-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <div className="h-5 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-rose-500" />
                <span className="font-bold text-gray-900 text-sm">Fee Details</span>
              </div>
            </div>
            {studentCode && (
              <span className="text-xs font-mono bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600">
                {studentCode}
              </span>
            )}
          </div>
        </div>
      </div>

      {loadingFee ? (
        <div className="flex justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-rose-400" />
        </div>
      ) : !feeRecord ? (
        <div className="text-center py-32 text-gray-400 max-w-md mx-auto px-4">
          <BadgeDollarSign className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-bold text-gray-600 mb-2">No Fee Record Found</h2>
          <p className="text-sm text-gray-400">
            Your fee has not been set up yet. Please contact your administrator.
          </p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">

          {/* ════ HERO BANNER ════ */}
          <div
            className="rounded-none sm:rounded-b-3xl overflow-hidden shadow-md mb-8"
            style={{
              background: 'linear-gradient(120deg, #fde8e8 0%, #fde8e8 35%, #fde8c8 60%, #fddca8 100%)',
            }}
          >
            <div className="px-6 pt-6 pb-4">
              {/* Student info row */}
              <div className="flex items-center gap-2 mb-5">
                <div className="h-9 w-9 rounded-full bg-white/60 flex items-center justify-center font-black text-rose-500 text-base shadow-sm">
                  {studentName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm leading-tight">{studentName}</p>
                  {course && (
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <GraduationCap className="h-3 w-3" /> {course} · {feeRecord.batch_name}
                    </p>
                  )}
                </div>
                <div className="ml-auto">
                  {feeRecord.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-white shadow">
                      <CheckCircle className="h-3 w-3" /> Fully Paid
                    </span>
                  ) : feeRecord.status === 'partial' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-500 text-white shadow">
                      <Clock className="h-3 w-3" /> Partially Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-red-500 text-white shadow">
                      <AlertCircle className="h-3 w-3" /> Unpaid
                    </span>
                  )}
                </div>
              </div>

              {/* Main stats row */}
              <div className="flex items-center gap-4 sm:gap-8 flex-wrap">

                {/* Circular paid ring */}
                <CircularProgress paid={feeRecord.paid_amount} total={feeRecord.total_fee} />

                {/* Divider */}
                <div className="hidden sm:block h-20 w-px bg-black/10" />

                {/* Fee Plan */}
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Fee Plan</p>
                  <p className="text-base font-black text-gray-900">
                    {lastInstNo > 1 ? 'Installment Payment' : 'Direct Payment'}
                  </p>
                </div>

                {/* Divider */}
                <div className="hidden sm:block h-20 w-px bg-black/10" />

                {/* Total Fee */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Fee</p>
                  <p className="text-base font-black text-gray-900">{fmtRs(feeRecord.total_fee)}</p>
                </div>

                {/* Divider */}
                <div className="hidden sm:block h-20 w-px bg-black/10" />

                {/* Due Amount */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Due Amount</p>
                  <p className={`text-base font-black ${feeRecord.pending_amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {fmtRs(feeRecord.pending_amount)}
                  </p>
                </div>

                {/* Divider — only show next due date if there's a due */}
                {nextDueDate && feeRecord.status !== 'paid' && (
                  <>
                    <div className="hidden sm:block h-20 w-px bg-black/10" />
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Due Date</p>
                      <p className="text-base font-black text-gray-900">{nextDueDate}</p>
                    </div>
                  </>
                )}

                {/* Pay Now CTA — informational only (offline) */}
                <div className="ml-auto">
                  <div className="bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 cursor-default select-none">
                    <Building2 className="h-4 w-4" />
                    Pay at Office
                  </div>
                  <p className="text-[9px] text-gray-500 text-center mt-1">Visit admin office</p>
                </div>
              </div>

              {/* Progress bar */}
              {feeRecord.total_fee > 0 && (
                <div className="mt-5">
                  <div className="w-full bg-black/10 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.round((feeRecord.paid_amount / feeRecord.total_fee) * 100))}%`,
                        background: feeRecord.status === 'paid'
                          ? '#10b981'
                          : feeRecord.status === 'partial'
                            ? '#f59e0b'
                            : '#ef4444',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-medium">
                    <span>₹0 paid</span>
                    <span>{Math.min(100, Math.round((feeRecord.paid_amount / feeRecord.total_fee) * 100))}% of {fmtRs(feeRecord.total_fee)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Contact strip */}
            {feeRecord.status !== 'paid' && (
              <div className="bg-white/40 border-t border-black/5 px-6 py-2 flex items-center gap-2 text-xs text-gray-600">
                <Phone className="h-3 w-3 shrink-0" />
                <span>
                  To pay your balance of <strong>{fmtRs(feeRecord.pending_amount)}</strong>, visit the RSP Education admin office. Payments are recorded by our team.
                </span>
              </div>
            )}
          </div>

          {/* ════ INSTALLMENT DETAILS TABLE ════ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">Installment Details</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                All recorded fee payments for your account
              </p>
            </div>

            {loadingLogs ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-rose-400" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No payments recorded yet</p>
                <p className="text-xs mt-1 text-gray-400">Your installments will appear here once recorded by the admin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3.5 font-bold text-gray-700 text-xs uppercase tracking-wide">Payment Head</th>
                      <th className="text-center px-4 py-3.5 font-bold text-gray-700 text-xs uppercase tracking-wide">Date</th>
                      <th className="text-center px-4 py-3.5 font-bold text-gray-700 text-xs uppercase tracking-wide">Inst. Amount</th>
                      <th className="text-center px-4 py-3.5 font-bold text-gray-700 text-xs uppercase tracking-wide">Paid Amount</th>
                      <th className="text-center px-4 py-3.5 font-bold text-gray-700 text-xs uppercase tracking-wide">Mode</th>
                      <th className="text-center px-4 py-3.5 font-bold text-gray-700 text-xs uppercase tracking-wide">Invoice No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`border-b border-gray-50 transition-colors hover:bg-rose-50/40 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                      >
                        {/* Payment Head */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                              {p.installment_no}
                            </div>
                            <span className="font-semibold text-blue-700">
                              Installment {p.installment_no}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4 text-center text-gray-600 font-medium">
                          {fmtDateShort(p.payment_date || p.created_at)}
                        </td>

                        {/* Installment Amount */}
                        <td className="px-4 py-4 text-center font-bold text-gray-800">
                          {fmtRs(p.amount)}
                        </td>

                        {/* Paid Amount */}
                        <td className="px-4 py-4 text-center font-bold text-emerald-600">
                          {fmtRs(p.amount)}
                        </td>

                        {/* Mode */}
                        <td className="px-4 py-4 text-center">
                          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full border border-blue-100">
                            {p.bank_name || 'Cash'}
                          </span>
                        </td>

                        {/* Invoice No */}
                        <td className="px-4 py-4 text-center">
                          {p.invoice_no ? (
                            <span className="font-mono text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">
                              {p.invoice_no}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Totals footer */}
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="px-6 py-4 font-black text-gray-800 text-sm">
                        Total ({payments.length} installment{payments.length !== 1 ? 's' : ''})
                      </td>
                      <td />
                      <td className="px-4 py-4 text-center font-black text-gray-800">
                        {fmtRs(feeRecord.total_fee)}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-emerald-600">
                        {fmtRs(feeRecord.paid_amount)}
                      </td>
                      <td />
                      <td />
                    </tr>

                    {/* Pending row — only if not fully paid */}
                    {feeRecord.status !== 'paid' && (
                      <tr className="bg-red-50 border-t border-red-100">
                        <td className="px-6 py-3 font-bold text-red-700 text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> Remaining Balance
                        </td>
                        <td />
                        <td />
                        <td className="px-4 py-3 text-center font-black text-red-600">
                          {fmtRs(feeRecord.pending_amount)}
                        </td>
                        <td />
                        <td />
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            )}

            {/* Footer note */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong>Note:</strong> Payment dates are recorded at the time of receipt by our admin team.
                All fee payments must be made directly at the RSP Education office.
                Please keep your receipts for reference. For queries, contact your batch coordinator.
              </p>
            </div>
          </div>

          {/* ── Summary Cards row ── */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Fee</p>
              <p className="text-2xl font-black text-gray-900">{fmtRs(feeRecord.total_fee)}</p>
              <p className="text-xs text-gray-400 mt-1">{feeRecord.batch_name}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-5">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Paid</p>
              <p className="text-2xl font-black text-emerald-700">{fmtRs(feeRecord.paid_amount)}</p>
              <p className="text-xs text-emerald-500 mt-1">{payments.length} installment{payments.length !== 1 ? 's' : ''}</p>
            </div>
            <div className={`rounded-2xl border shadow-sm p-5 ${feeRecord.status === 'paid' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${feeRecord.status === 'paid' ? 'text-emerald-500' : 'text-red-400'}`}>
                {feeRecord.status === 'paid' ? 'All Clear!' : 'Due'}
              </p>
              <p className={`text-2xl font-black ${feeRecord.status === 'paid' ? 'text-emerald-700' : 'text-red-600'}`}>
                {fmtRs(feeRecord.pending_amount)}
              </p>
              {feeRecord.status === 'paid' ? (
                <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Fully cleared
                </p>
              ) : (
                <p className="text-xs text-red-400 mt-1">Visit office to pay</p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default StudentFeeManagement;
