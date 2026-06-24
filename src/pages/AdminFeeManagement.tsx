import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BadgeDollarSign, ClipboardList, CreditCard,
  Download, History, IndianRupee, Loader2, Plus, Printer,
  Search, User, X, CheckCircle, Clock, AlertCircle,
  Receipt, Eye,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// ─── Institution Config ───────────────────────────────────────────────────────
const INSTITUTE = {
  name: 'RSP Education',
  tagline: 'Empowering Futures Through Quality Education',
  address: 'RSP Education Center, Main Road, Your City - 000000',
  phone: '+91 00000 00000',
  email: 'info@rspeducation.in',
  website: 'www.rspeducation.in',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Batch = { id: string; name: string };
type AdminRow = { admin_id: string; display_name: string; email: string };
type FeeRecord = {
  id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  batch_id: string;
  batch_name: string;
  total_fee: number;
  paid_amount: number;
  pending_amount: number;
  status: 'paid' | 'partial' | 'unpaid';
};
type PaymentLog = {
  id: string;
  fee_record_id: string;
  invoice_no: string;
  transfer_id: string;
  installment_no: number;
  amount: number;
  bank_name: string | null;
  received_by: string;
  received_by_admin_id: string;
  added_by_admin_id: string;
  added_by_admin_name: string;
  payment_date: string;
  notes: string | null;
  created_at: string;
};
type InvoiceData = {
  invoice_no: string;
  transfer_id: string;
  installment_no: number;
  student: FeeRecord;
  amount: number;
  bank_name: string;
  received_by_admin_name: string;
  received_by_admin_id: string;
  recorded_by_admin_name: string;
  payment_date: string;
  notes: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genTransferId() {
  const ts = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RSP-${ts}-${r}`;
}
function genInvoiceNo() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `INV-${date}-${rand}`;
}
function fmtRs(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function statusBadge(s: FeeRecord['status']) {
  if (s === 'paid') return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle className="h-3 w-3" /> Paid</span>;
  if (s === 'partial') return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700"><Clock className="h-3 w-3" /> Partial</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700"><AlertCircle className="h-3 w-3" /> Unpaid</span>;
}

// ─── Invoice HTML ─────────────────────────────────────────────────────────────
function buildInvoiceHTML(inv: InvoiceData): string {
  const newPaid = inv.student.paid_amount + inv.amount;
  const newPending = Math.max(0, inv.student.total_fee - newPaid);
  const isPaid = newPending <= 0;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Invoice ${inv.invoice_no}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:24px;}
  .page{background:#fff;max-width:720px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12);}
  .header{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;padding:28px 32px;}
  .header h1{font-size:22px;font-weight:800;} .header p{font-size:12px;opacity:.75;margin-top:3px;}
  .header-right{float:right;text-align:right;}
  .header-right .badge{display:inline-block;background:rgba(255,255,255,.2);border-radius:20px;padding:4px 14px;font-size:11px;margin-bottom:6px;}
  .txn-bar{background:#eff6ff;border:1px solid #bfdbfe;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;}
  .txn-bar .label{font-size:11px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
  .txn-bar .value{font-family:monospace;font-size:16px;font-weight:800;color:#1d4ed8;}
  .body{padding:24px 32px;}
  .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #e2e8f0;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;}
  .field label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;}
  .field p{font-size:14px;font-weight:600;color:#0f172a;margin-top:2px;}
  .amount-box{background:linear-gradient(135deg,#059669,#10b981);color:#fff;border-radius:12px;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;margin:16px 0;}
  .amount-box .left p{font-size:28px;font-weight:900;letter-spacing:-1px;}
  .balance-row{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:16px;}
  .balance-row .b-item label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;}
  .balance-row .b-item p{font-size:15px;font-weight:700;margin-top:2px;}
  .footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 32px;text-align:center;}
  .footer p{font-size:10px;color:#94a3b8;} .footer .thanks{font-size:12px;color:#2563eb;font-weight:600;margin-top:4px;}
  .paid-stamp{position:absolute;right:40px;top:50%;transform:translateY(-50%) rotate(-15deg);font-size:52px;font-weight:900;color:rgba(5,150,105,.12);letter-spacing:4px;pointer-events:none;}
  .relative{position:relative;}
  @media print{body{background:#fff;padding:0;}.page{box-shadow:none;}}
</style></head><body>
<div class="page">
  <div class="header">
    <div class="header-right">
      <div class="badge">FEE RECEIPT</div>
      <div style="font-size:18px;font-weight:800;">INVOICE</div>
      <div style="font-size:11px;opacity:.7;margin-top:4px;">${fmtDate(new Date().toISOString())}</div>
    </div>
    <h1>${INSTITUTE.name}</h1>
    <p>${INSTITUTE.tagline}</p>
    <p style="margin-top:6px;">${INSTITUTE.address}</p>
    <p>${INSTITUTE.phone} &nbsp;|&nbsp; ${INSTITUTE.email}</p>
    <div style="clear:both;"></div>
  </div>
  <div class="txn-bar">
    <div><div class="label">Invoice Number</div><div class="value">${inv.invoice_no}</div></div>
    <div style="text-align:center;"><div class="label">Transfer ID</div><div class="value" style="font-size:13px;">${inv.transfer_id}</div></div>
    <div style="text-align:right;"><div class="label">Installment</div><div style="font-size:20px;font-weight:800;color:#1d4ed8;">#${inv.installment_no}</div></div>
  </div>
  <div class="body">
    <div class="section-title">Student Details</div>
    <div class="two-col">
      <div class="field"><label>Student Name</label><p>${inv.student.student_name}</p></div>
      <div class="field"><label>Student ID</label><p style="font-family:monospace;">${inv.student.student_code}</p></div>
      <div class="field"><label>Batch</label><p>${inv.student.batch_name}</p></div>
      <div class="field"><label>Payment Date</label><p>${fmtDate(inv.payment_date)}</p></div>
    </div>
    <div class="section-title" style="margin-top:4px;">Payment Details</div>
    <div class="relative">
      <div class="amount-box">
        <div class="left"><label style="font-size:11px;opacity:.8;">Amount Received</label><p>${fmtRs(inv.amount)}</p></div>
        <div style="text-align:right;"><div style="font-size:11px;opacity:.8;">Installment</div><div style="font-size:20px;font-weight:800;">#${inv.installment_no}</div><div style="font-size:10px;opacity:.7;margin-top:2px;">Mode: Cash / Offline</div></div>
      </div>
      ${isPaid ? '<div class="paid-stamp">PAID</div>' : ''}
    </div>
    <div class="two-col" style="margin-top:16px;">
      <div class="field"><label>Received By (Admin)</label><p>${inv.received_by_admin_name}</p><p style="font-family:monospace;font-size:11px;color:#64748b;">${inv.received_by_admin_id}</p></div>
      <div class="field"><label>Recorded By</label><p>${inv.recorded_by_admin_name}</p></div>
      <div class="field"><label>Bank / Mode</label><p>${inv.bank_name || 'Cash (Offline)'}</p></div>
      <div class="field"><label>Notes</label><p style="color:#64748b;font-weight:400;">${inv.notes || '—'}</p></div>
    </div>
    <div class="section-title" style="margin-top:8px;">Fee Summary</div>
    <div class="balance-row">
      <div class="b-item"><label>Total Course Fee</label><p style="color:#0f172a;">${fmtRs(inv.student.total_fee)}</p></div>
      <div class="b-item"><label>Total Paid (After This)</label><p style="color:#059669;">${fmtRs(newPaid)}</p></div>
      <div class="b-item"><label>Remaining Balance</label><p style="color:${newPending > 0 ? '#dc2626' : '#059669'};">${fmtRs(newPending)}</p></div>
    </div>
  </div>
  <div class="footer">
    <p>This is a computer-generated receipt. No physical signature required.</p>
    <p>${INSTITUTE.name} &mdash; ${INSTITUTE.address} &mdash; ${INSTITUTE.website}</p>
    <div class="thanks">Thank you for your payment! 🎓</div>
  </div>
</div></body></html>`;
}

function downloadInvoice(inv: InvoiceData) {
  const blob = new Blob([buildInvoiceHTML(inv)], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${inv.invoice_no}_${inv.student.student_code}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function printInvoice(inv: InvoiceData) {
  const w = window.open('', '_blank', 'width=820,height=700');
  if (!w) return;
  w.document.write(buildInvoiceHTML(inv));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 600);
}

// ─── Invoice Preview Modal ────────────────────────────────────────────────────
const InvoicePreviewModal: React.FC<{ inv: InvoiceData; onClose: () => void }> = ({ inv, onClose }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-600" />
          <span className="font-bold text-gray-900">Invoice Preview</span>
          <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{inv.invoice_no}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => printInvoice(inv)}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button size="sm" className="gap-1 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => downloadInvoice(inv)}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-200 ml-1"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <iframe srcDoc={buildInvoiceHTML(inv)} title="Invoice Preview" className="w-full h-[72vh] border-0" />
      </div>
    </div>
  </div>
);

// ─── Payment Logs Panel ───────────────────────────────────────────────────────
const PaymentLogsPanel: React.FC<{
  feeRecordId: string; studentName: string; studentCode: string; onClose: () => void;
}> = ({ feeRecordId, studentName, studentCode, onClose }) => {
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('fee_payments').select('*').eq('fee_record_id', feeRecordId)
      .order('installment_no', { ascending: true })
      .then(({ data, error }) => {
        if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
        else setLogs((data as PaymentLog[]) ?? []);
        setLoading(false);
      });
  }, [feeRecordId, toast]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Payment History — {studentName}
              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{studentCode}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">All installments &amp; invoice records</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No payments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>#</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Transfer ID</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell>
                        <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{log.installment_no}</span>
                      </TableCell>
                      <TableCell><span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded">{log.invoice_no || '—'}</span></TableCell>
                      <TableCell><span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{log.transfer_id}</span></TableCell>
                      <TableCell className="text-right font-semibold text-emerald-700">{fmtRs(log.amount)}</TableCell>
                      <TableCell className="text-sm">{log.bank_name || '—'}</TableCell>
                      <TableCell className="text-sm">{log.received_by}</TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{log.added_by_admin_name}</span>
                        <span className="block text-xs text-gray-400 font-mono">{log.added_by_admin_id}</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{fmtDate(log.payment_date || log.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminFeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [adminInfo, setAdminInfo] = useState<{ admin_id: string; name: string } | null>(null);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  // Invoice dialog
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invBatch, setInvBatch] = useState<Batch | null>(null);
  const [invStudents, setInvStudents] = useState<FeeRecord[]>([]);
  const [invStudent, setInvStudent] = useState<FeeRecord | null>(null);
  const [invLoadingStudents, setInvLoadingStudents] = useState(false);
  const [invNextInstallment, setInvNextInstallment] = useState(1);
  const [invInvoiceNo, setInvInvoiceNo] = useState('');
  const [invTransferId, setInvTransferId] = useState('');
  const [invReceivedByAdminId, setInvReceivedByAdminId] = useState('');
  const [invForm, setInvForm] = useState({ amount: '', bank_name: '', payment_date: new Date().toISOString().slice(0, 10), notes: '' });
  const [invSaving, setInvSaving] = useState(false);

  // Invoice preview
  const [previewInv, setPreviewInv] = useState<InvoiceData | null>(null);

  // Logs
  const [logsFor, setLogsFor] = useState<FeeRecord | null>(null);

  // Edit fee dialog
  const [updateFeeDialog, setUpdateFeeDialog] = useState<FeeRecord | null>(null);
  const [newTotalFee, setNewTotalFee] = useState('');
  const [updatingFee, setUpdatingFee] = useState(false);

  // Quick record payment
  const [payDialog, setPayDialog] = useState<FeeRecord | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', bank_name: '', received_by: '', payment_date: new Date().toISOString().slice(0, 10), notes: '' });
  const [payTransferId, setPayTransferId] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem('adminAuth') !== 'true') { navigate('/admin/login'); return; }
    try {
      const p = JSON.parse(localStorage.getItem('adminUser') || '{}');
      setAdminInfo({ admin_id: p.admin_id || 'UNKNOWN', name: p.name || p.display_name || 'Admin' });
    } catch { setAdminInfo({ admin_id: 'UNKNOWN', name: 'Admin' }); }
    loadBatches();
    loadAdmins();
  }, [navigate]);

  // ── Quick pay dialog reset ──
  useEffect(() => {
    if (payDialog) {
      setPayTransferId(genTransferId());
      setPayForm({ amount: '', bank_name: '', received_by: '', payment_date: new Date().toISOString().slice(0, 10), notes: '' });
    }
  }, [payDialog]);

  // ── Invoice dialog open: set batch & regenerate IDs ──
  useEffect(() => {
    if (invoiceOpen) {
      setInvInvoiceNo(genInvoiceNo());
      setInvTransferId(genTransferId());
      setInvReceivedByAdminId('');
      setInvForm({ amount: '', bank_name: '', payment_date: new Date().toISOString().slice(0, 10), notes: '' });
      setInvStudent(null);
      // Pre-select current batch if viewing one
      const target = selectedBatch || null;
      setInvBatch(target);
    }
  }, [invoiceOpen, selectedBatch]);

  // ── Load students when invBatch changes ──
  useEffect(() => {
    if (!invBatch) { setInvStudents([]); setInvStudent(null); return; }
    setInvLoadingStudents(true);
    setInvStudent(null);
    supabase.from('fee_records')
      .select('id, student_id, batch_id, total_fee, paid_amount, students(student_code, users(name)), batches(name)')
      .eq('batch_id', invBatch.id)
      .then(({ data, error }) => {
        if (!error) {
          setInvStudents(((data as any[]) ?? []).map((r) => {
            const paid = r.paid_amount ?? 0, total = r.total_fee ?? 0, pending = Math.max(0, total - paid);
            const status: FeeRecord['status'] = paid >= total && total > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
            return { id: r.id, student_id: r.student_id, student_name: r.students?.users?.name ?? 'Unknown', student_code: r.students?.student_code ?? '—', batch_id: r.batch_id, batch_name: r.batches?.name ?? '—', total_fee: total, paid_amount: paid, pending_amount: pending, status };
          }));
        }
        setInvLoadingStudents(false);
      });
  }, [invBatch]);

  // ── Load next installment number when student changes ──
  useEffect(() => {
    if (!invStudent) { setInvNextInstallment(1); return; }
    supabase.from('fee_payments').select('id', { count: 'exact', head: true }).eq('fee_record_id', invStudent.id)
      .then(({ count }) => setInvNextInstallment((count ?? 0) + 1));
  }, [invStudent]);

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadAdmins = async () => {
    const { data } = await supabase.from('admins').select('admin_id, display_name, email').eq('enabled', true);
    if (data) setAdmins(data as AdminRow[]);
  };
  const loadBatches = async () => {
    const { data } = await supabase.from('batches').select('id, name').order('created_at', { ascending: false });
    if (data) setBatches(data as Batch[]);
  };
  const loadFeeRecords = useCallback(async (batchId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('fee_records')
        .select('id, student_id, batch_id, total_fee, paid_amount, students(student_code, users(name)), batches(name)')
        .eq('batch_id', batchId);
      if (error) throw error;
      setFeeRecords(((data as any[]) ?? []).map((r) => {
        const paid = r.paid_amount ?? 0, total = r.total_fee ?? 0, pending = Math.max(0, total - paid);
        const status: FeeRecord['status'] = paid >= total && total > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
        return { id: r.id, student_id: r.student_id, student_name: r.students?.users?.name ?? 'Unknown', student_code: r.students?.student_code ?? '—', batch_id: r.batch_id, batch_name: r.batches?.name ?? '—', total_fee: total, paid_amount: paid, pending_amount: pending, status };
      }));
    } catch (err: any) {
      toast({ title: 'Error loading records', description: err?.message, variant: 'destructive' });
    } finally { setLoading(false); }
  }, [toast]);

  const handleBatchSelect = (batch: Batch) => {
    setSelectedBatch(batch); setSearchTerm(''); setStatusFilter('all'); loadFeeRecords(batch.id);
  };

  const filtered = useMemo(() => {
    let list = feeRecords;
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((r) => r.student_name.toLowerCase().includes(q) || r.student_code.toLowerCase().includes(q));
    }
    return list;
  }, [feeRecords, statusFilter, searchTerm]);

  const stats = useMemo(() => ({
    total: feeRecords.reduce((a, r) => a + r.total_fee, 0),
    collected: feeRecords.reduce((a, r) => a + r.paid_amount, 0),
    pending: feeRecords.reduce((a, r) => a + r.pending_amount, 0),
    paidCount: feeRecords.filter((r) => r.status === 'paid').length,
    partialCount: feeRecords.filter((r) => r.status === 'partial').length,
    unpaidCount: feeRecords.filter((r) => r.status === 'unpaid').length,
  }), [feeRecords]);

  // ── Save Invoice ──────────────────────────────────────────────────────────
  const handleSaveInvoice = async (withPreview: boolean) => {
    if (!invStudent || !adminInfo) return;
    const amount = parseFloat(invForm.amount);
    if (!amount || amount <= 0) { toast({ title: 'Enter a valid amount', variant: 'destructive' }); return; }
    if (!invReceivedByAdminId) { toast({ title: 'Select the admin who received cash', variant: 'destructive' }); return; }
    const receivedAdmin = admins.find((a) => a.admin_id === invReceivedByAdminId);
    try {
      setInvSaving(true);
      const { error: payErr } = await supabase.from('fee_payments').insert([{
        fee_record_id: invStudent.id, invoice_no: invInvoiceNo, transfer_id: invTransferId,
        installment_no: invNextInstallment, amount,
        bank_name: invForm.bank_name.trim() || null,
        received_by: receivedAdmin?.display_name ?? invReceivedByAdminId,
        received_by_admin_id: invReceivedByAdminId,
        payment_date: invForm.payment_date,
        notes: invForm.notes.trim() || null,
        added_by_admin_id: adminInfo.admin_id, added_by_admin_name: adminInfo.name,
      }]);
      if (payErr) throw payErr;
      await supabase.from('fee_records').update({ paid_amount: invStudent.paid_amount + amount }).eq('id', invStudent.id);
      toast({ title: '✅ Invoice Saved', description: `${invInvoiceNo} | Installment #${invNextInstallment}` });
      if (withPreview) {
        setPreviewInv({
          invoice_no: invInvoiceNo, transfer_id: invTransferId, installment_no: invNextInstallment,
          student: invStudent, amount, bank_name: invForm.bank_name || 'Cash (Offline)',
          received_by_admin_name: receivedAdmin?.display_name ?? invReceivedByAdminId,
          received_by_admin_id: invReceivedByAdminId,
          recorded_by_admin_name: adminInfo.name,
          payment_date: invForm.payment_date, notes: invForm.notes,
        });
      }
      setInvoiceOpen(false);
      if (selectedBatch) loadFeeRecords(selectedBatch.id);
      setInvBatch(null); setInvStudent(null);
      setInvForm({ amount: '', bank_name: '', payment_date: new Date().toISOString().slice(0, 10), notes: '' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message, variant: 'destructive' });
    } finally { setInvSaving(false); }
  };

  // ── Quick Record Payment ──────────────────────────────────────────────────
  const handleSavePayment = async () => {
    if (!payDialog || !adminInfo) return;
    const amount = parseFloat(payForm.amount);
    if (!amount || amount <= 0) { toast({ title: 'Invalid amount', variant: 'destructive' }); return; }
    if (!payForm.received_by.trim()) { toast({ title: 'Enter who received', variant: 'destructive' }); return; }
    try {
      setSaving(true);
      const { count } = await supabase.from('fee_payments').select('id', { count: 'exact', head: true }).eq('fee_record_id', payDialog.id);
      const installment_no = (count ?? 0) + 1;
      await supabase.from('fee_payments').insert([{
        fee_record_id: payDialog.id, invoice_no: genInvoiceNo(), transfer_id: payTransferId, installment_no,
        amount, bank_name: payForm.bank_name.trim() || null, received_by: payForm.received_by.trim(),
        payment_date: payForm.payment_date, notes: payForm.notes.trim() || null,
        added_by_admin_id: adminInfo.admin_id, added_by_admin_name: adminInfo.name,
      }]);
      await supabase.from('fee_records').update({ paid_amount: payDialog.paid_amount + amount }).eq('id', payDialog.id);
      toast({ title: '✅ Payment Recorded', description: `Transfer: ${payTransferId} | Inst #${installment_no}` });
      setPayDialog(null);
      loadFeeRecords(selectedBatch!.id);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  // ── Edit fee ──────────────────────────────────────────────────────────────
  const handleUpdateTotalFee = async () => {
    if (!updateFeeDialog) return;
    const fee = parseFloat(newTotalFee);
    if (!fee || fee <= 0) { toast({ title: 'Invalid amount', variant: 'destructive' }); return; }
    try {
      setUpdatingFee(true);
      const { error } = await supabase.from('fee_records').update({ total_fee: fee }).eq('id', updateFeeDialog.id);
      if (error) throw error;
      toast({ title: 'Fee updated' });
      setUpdateFeeDialog(null);
      loadFeeRecords(selectedBatch!.id);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message, variant: 'destructive' });
    } finally { setUpdatingFee(false); }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost"
                onClick={() => selectedBatch ? (setSelectedBatch(null), setFeeRecords([])) : navigate('/admin/dashboard')}
                className="flex items-center gap-2 text-gray-600"
              >
                <ArrowLeft className="h-4 w-4" />
                {selectedBatch ? 'All Batches' : 'Dashboard'}
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <BadgeDollarSign className="h-7 w-7 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Fee Management</h1>
                <p className="text-xs text-gray-500">{selectedBatch ? `Batch: ${selectedBatch.name}` : 'Select a batch'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setInvoiceOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Receipt className="h-4 w-4" /> Generate Invoice
              </Button>
              {adminInfo && (
                <div className="hidden sm:flex items-center gap-2 text-sm bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{adminInfo.name}</span>
                  <span className="text-xs text-blue-400 font-mono">({adminInfo.admin_id})</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedBatch ? (
          /* ── Batch picker ── */
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Select Batch</h2>
              <p className="text-gray-500 mt-1">Choose a batch to view and manage student fees</p>
            </div>
            {batches.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <BadgeDollarSign className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>No batches found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {batches.map((batch) => (
                  <button key={batch.id} onClick={() => handleBatchSelect(batch)}
                    className="group text-left bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm group-hover:scale-105 transition">
                        {batch.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{batch.name}</p>
                        <p className="text-xs text-gray-400">Click to manage fees</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-medium">
                      <IndianRupee className="h-4 w-4" /> View Fee Records →
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {[
                { label: 'Total Fee', value: fmtRs(stats.total), color: 'text-gray-900', bg: 'bg-white' },
                { label: 'Collected', value: fmtRs(stats.collected), color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'Pending', value: fmtRs(stats.pending), color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Fully Paid', value: stats.paidCount, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'Partial', value: stats.partialCount, color: 'text-amber-700', bg: 'bg-amber-50' },
                { label: 'Unpaid', value: stats.unpaidCount, color: 'text-red-600', bg: 'bg-red-50' },
              ].map((s) => (
                <Card key={s.label} className={`${s.bg} border shadow-none`}>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by name or student ID…" className="pl-9 bg-white"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2">
                {(['all', 'paid', 'partial', 'unpaid'] as const).map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
                  >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
              </div>
            </div>

            {/* ── Table ── */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Student Fee Records — {selectedBatch.name}</CardTitle>
                <CardDescription>{filtered.length} student{filtered.length !== 1 ? 's' : ''} shown</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <User className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No records found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead>Student</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead className="text-right">Total Fee</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Pending</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((rec) => (
                          <TableRow key={rec.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{rec.student_name}</TableCell>
                            <TableCell><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{rec.student_code}</span></TableCell>
                            <TableCell className="text-right">{fmtRs(rec.total_fee)}</TableCell>
                            <TableCell className="text-right text-emerald-700 font-semibold">{fmtRs(rec.paid_amount)}</TableCell>
                            <TableCell className="text-right text-red-600 font-semibold">{fmtRs(rec.pending_amount)}</TableCell>
                            <TableCell>{statusBadge(rec.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => setLogsFor(rec)} className="text-xs gap-1">
                                  <History className="h-3.5 w-3.5" /> Logs
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setUpdateFeeDialog(rec); setNewTotalFee(rec.total_fee.toString()); }} className="text-xs">
                                  Edit Fee
                                </Button>
                                {rec.status !== 'paid' && (
                                  <Button size="sm" onClick={() => setPayDialog(rec)} className="text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                                    <CreditCard className="h-3.5 w-3.5" /> Record Payment
                                  </Button>
                                )}
                              </div>
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

      {/* ═══════════════════════════════════════════════════════
           GENERATE INVOICE — TWO-PANEL MODAL
      ═══════════════════════════════════════════════════════ */}
      {invoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Receipt className="h-6 w-6" />
                <div>
                  <h2 className="text-lg font-bold leading-tight">Generate Fee Invoice</h2>
                  <p className="text-blue-200 text-xs">{INSTITUTE.name} · {invBatch?.name ?? 'Select a batch'}</p>
                </div>
              </div>
              <button onClick={() => setInvoiceOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">

              {/* ── LEFT: Student List ── */}
              <div className="w-80 border-r bg-gray-50 flex flex-col shrink-0">
                {/* Batch selector (only if no batch pre-selected from main view) */}
                {!selectedBatch && (
                  <div className="p-3 border-b bg-white">
                    <p className="text-xs font-semibold text-gray-500 mb-2">SELECT BATCH</p>
                    <div className="flex flex-col gap-1.5">
                      {batches.map((b) => (
                        <button key={b.id} type="button" onClick={() => setInvBatch(b)}
                          className={`text-left px-3 py-2 rounded-lg border text-sm font-medium transition ${invBatch?.id === b.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 hover:border-blue-400 text-gray-700'}`}
                        >{b.name}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Students */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-3 pb-1 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {invBatch ? `Students — ${invBatch.name}` : 'Students'}
                    </p>
                    {invStudents.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{invStudents.length}</span>
                    )}
                  </div>

                  {invLoadingStudents ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-400" /></div>
                  ) : !invBatch ? (
                    <div className="text-center py-8 text-gray-400">
                      <IndianRupee className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Select a batch above</p>
                    </div>
                  ) : invStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 px-4">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No fee records in this batch yet</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {invStudents.map((s) => {
                        const sel = invStudent?.id === s.id;
                        return (
                          <button key={s.id} type="button" onClick={() => setInvStudent(s)}
                            className={`w-full text-left px-3 py-3 rounded-xl border transition-all ${sel ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className={`font-semibold text-sm truncate ${sel ? 'text-white' : 'text-gray-900'}`}>{s.student_name}</p>
                                <p className={`font-mono text-xs mt-0.5 ${sel ? 'text-blue-200' : 'text-gray-400'}`}>{s.student_code}</p>
                              </div>
                              <span className={`text-xs font-bold shrink-0 ${s.status === 'paid' ? (sel ? 'text-green-200' : 'text-emerald-600') : s.status === 'partial' ? (sel ? 'text-yellow-200' : 'text-amber-600') : (sel ? 'text-red-200' : 'text-red-500')}`}>
                                {s.status === 'paid' ? '✓ Paid' : s.status === 'partial' ? '⬤ Partial' : '○ Unpaid'}
                              </span>
                            </div>
                            <div className={`flex justify-between text-xs mt-2 ${sel ? 'text-blue-100' : 'text-gray-500'}`}>
                              <span>Paid: {fmtRs(s.paid_amount)}</span>
                              <span className={sel ? 'text-yellow-200 font-semibold' : 'text-red-500 font-semibold'}>Due: {fmtRs(s.pending_amount)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT: Payment Form ── */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {!invStudent ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="font-medium text-gray-500">Select a student to generate invoice</p>
                      <p className="text-sm mt-1">← Choose from the list</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">

                    {/* Auto IDs */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-xs text-blue-500 font-semibold mb-1">Invoice No</p>
                        <p className="font-mono font-bold text-blue-800 text-sm leading-tight">{invInvoiceNo}</p>
                        <p className="text-xs text-blue-400 mt-1">Unique · Auto</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <p className="text-xs text-slate-500 font-semibold mb-1">Transfer ID</p>
                        <p className="font-mono font-bold text-slate-700 text-xs break-all">{invTransferId}</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-xs text-amber-600 font-semibold mb-1">Installment #</p>
                        <p className="font-bold text-amber-800 text-2xl leading-none">{invNextInstallment}</p>
                        <p className="text-xs text-amber-400 mt-1">Auto-counted</p>
                      </div>
                    </div>

                    {/* Student summary */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                          {invStudent.student_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-base">{invStudent.student_name}</p>
                          <p className="text-blue-200 font-mono text-xs">{invStudent.student_code} · {invStudent.batch_name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white/10 rounded-lg py-2"><p className="text-xs text-blue-200">Total Fee</p><p className="font-bold">{fmtRs(invStudent.total_fee)}</p></div>
                        <div className="bg-white/10 rounded-lg py-2"><p className="text-xs text-blue-200">Paid</p><p className="font-bold text-green-300">{fmtRs(invStudent.paid_amount)}</p></div>
                        <div className="bg-white/10 rounded-lg py-2"><p className="text-xs text-blue-200">Pending</p><p className="font-bold text-yellow-300">{fmtRs(invStudent.pending_amount)}</p></div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <Label htmlFor="inv-amount" className="text-sm font-semibold">
                        Amount Being Paid (₹) <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                        <Input id="inv-amount" type="number" min="1" className="pl-8 text-xl font-bold h-12"
                          placeholder={`e.g. 10000  (pending: ${invStudent.pending_amount.toLocaleString('en-IN')})`}
                          value={invForm.amount}
                          onChange={(e) => setInvForm((f) => ({ ...f, amount: e.target.value }))}
                        />
                      </div>
                      {invForm.amount && !isNaN(parseFloat(invForm.amount)) && (
                        <p className="text-xs text-gray-500 mt-1">
                          After this: Paid = <strong>{fmtRs(invStudent.paid_amount + parseFloat(invForm.amount))}</strong> ·
                          Remaining = <strong className="text-red-500">{fmtRs(Math.max(0, invStudent.pending_amount - parseFloat(invForm.amount)))}</strong>
                        </p>
                      )}
                    </div>

                    {/* Admin who received */}
                    <div>
                      <Label className="text-sm font-semibold">
                        Admin Who Received Cash <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-xs text-gray-400 mt-0.5 mb-2">Select from your admin team (ID auto-logged)</p>
                      {admins.length === 0 ? (
                        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                          No admins loaded — check the <code>admins</code> table.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {admins.map((a) => (
                            <button key={a.admin_id} type="button" onClick={() => setInvReceivedByAdminId(a.admin_id)}
                              className={`text-left px-3 py-2.5 rounded-xl border transition ${invReceivedByAdminId === a.admin_id ? 'bg-emerald-600 text-white border-emerald-600 shadow' : 'bg-white border-gray-200 hover:border-emerald-400'}`}
                            >
                              <p className={`font-semibold text-sm ${invReceivedByAdminId === a.admin_id ? 'text-white' : 'text-gray-800'}`}>{a.display_name}</p>
                              <p className={`font-mono text-xs ${invReceivedByAdminId === a.admin_id ? 'text-emerald-100' : 'text-gray-400'}`}>{a.admin_id}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recorded by (auto) */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                      <User className="h-4 w-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-xs text-amber-600 font-medium">Invoice Recorded By (Auto)</p>
                        <p className="text-sm font-semibold text-amber-800">{adminInfo?.name} <span className="font-mono text-xs">({adminInfo?.admin_id})</span></p>
                      </div>
                    </div>

                    {/* Bank, Date, Notes */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="inv-bank">Bank / Payment Mode</Label>
                        <Input id="inv-bank" className="mt-1" placeholder="SBI, HDFC, Cash…"
                          value={invForm.bank_name} onChange={(e) => setInvForm((f) => ({ ...f, bank_name: e.target.value }))} />
                      </div>
                      <div>
                        <Label htmlFor="inv-date">Payment Date</Label>
                        <Input id="inv-date" type="date" className="mt-1"
                          value={invForm.payment_date} onChange={(e) => setInvForm((f) => ({ ...f, payment_date: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="inv-notes">Notes (Optional)</Label>
                      <Input id="inv-notes" className="mt-1" placeholder="Any additional notes…"
                        value={invForm.notes} onChange={(e) => setInvForm((f) => ({ ...f, notes: e.target.value }))} />
                    </div>
                  </div>
                )}

                {/* Footer */}
                {invStudent && (
                  <div className="px-5 py-4 border-t bg-gray-50 flex items-center justify-between gap-3 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setInvoiceOpen(false)} disabled={invSaving}>Cancel</Button>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveInvoice(false)} disabled={invSaving}
                        variant="outline" size="sm" className="gap-1 border-blue-400 text-blue-700 hover:bg-blue-50"
                      >
                        {invSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Save Only
                      </Button>
                      <Button onClick={() => handleSaveInvoice(true)} disabled={invSaving}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                      >
                        {invSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        Save &amp; View Invoice
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice Preview ── */}
      {previewInv && <InvoicePreviewModal inv={previewInv} onClose={() => setPreviewInv(null)} />}

      {/* ── Quick Record Payment ── */}
      {payDialog && (
        <Dialog open onOpenChange={() => setPayDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" /> Record Offline Payment
              </DialogTitle>
              <DialogDescription>
                Payment for <strong>{payDialog.student_name}</strong> ({payDialog.student_code})
              </DialogDescription>
            </DialogHeader>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 my-1">
              <p className="text-xs text-blue-500 mb-1 font-medium">Auto Transfer ID</p>
              <p className="font-mono font-bold text-blue-700 text-base">{payTransferId}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <User className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600 font-medium">Recording Admin (Auto)</p>
                <p className="text-sm font-semibold text-amber-800">{adminInfo?.name} <span className="font-mono text-xs">({adminInfo?.admin_id})</span></p>
              </div>
            </div>
            <div className="space-y-3 mt-2">
              <div><Label>Pending: <span className="text-red-600 font-bold">{fmtRs(payDialog.pending_amount)}</span></Label></div>
              <div>
                <Label htmlFor="pay-amt">Amount <span className="text-red-500">*</span></Label>
                <Input id="pay-amt" type="number" min="1" className="mt-1" placeholder="₹"
                  value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pay-bank">Bank / Mode</Label>
                  <Input id="pay-bank" className="mt-1" placeholder="SBI, Cash…"
                    value={payForm.bank_name} onChange={(e) => setPayForm((f) => ({ ...f, bank_name: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="pay-recv">Received By <span className="text-red-500">*</span></Label>
                  <Input id="pay-recv" className="mt-1" placeholder="Person name"
                    value={payForm.received_by} onChange={(e) => setPayForm((f) => ({ ...f, received_by: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="pay-date">Date</Label>
                <Input id="pay-date" type="date" className="mt-1"
                  value={payForm.payment_date} onChange={(e) => setPayForm((f) => ({ ...f, payment_date: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="pay-notes">Notes</Label>
                <Input id="pay-notes" className="mt-1" placeholder="Optional…"
                  value={payForm.notes} onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" onClick={() => setPayDialog(null)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSavePayment} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                {saving ? 'Saving…' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Edit Fee ── */}
      {updateFeeDialog && (
        <Dialog open onOpenChange={() => setUpdateFeeDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Update Total Fee</DialogTitle>
              <DialogDescription>Set course fee for <strong>{updateFeeDialog.student_name}</strong></DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Label htmlFor="total-fee">Total Fee (₹)</Label>
              <Input id="total-fee" type="number" min="0" className="mt-2"
                value={newTotalFee} onChange={(e) => setNewTotalFee(e.target.value)} placeholder="e.g. 50000" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateFeeDialog(null)} disabled={updatingFee}>Cancel</Button>
              <Button onClick={handleUpdateTotalFee} disabled={updatingFee} className="bg-blue-600 hover:bg-blue-700">
                {updatingFee ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Logs ── */}
      {logsFor && (
        <PaymentLogsPanel feeRecordId={logsFor.id} studentName={logsFor.student_name}
          studentCode={logsFor.student_code} onClose={() => setLogsFor(null)} />
      )}
    </div>
  );
};

export default AdminFeeManagement;
