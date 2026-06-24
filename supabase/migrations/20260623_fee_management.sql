-- ═══════════════════════════════════════════════════════════
-- RSP Education — Fee Management Tables
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── 1. fee_records: one row per student (links student → batch → total fee) ──
create table if not exists public.fee_records (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  batch_id    uuid not null references public.batches(id) on delete cascade,
  total_fee   numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(student_id)          -- one fee record per student
);

-- ── 2. fee_payments: each cash installment paid offline ──
create table if not exists public.fee_payments (
  id                   uuid primary key default gen_random_uuid(),
  fee_record_id        uuid not null references public.fee_records(id) on delete cascade,
  invoice_no           text not null,          -- unique: INV-YYYYMMDD-XXXXX
  transfer_id          text not null,          -- auto-generated RSP-XXXX-XXXX
  installment_no       int  not null default 1, -- 1, 2, 3 … per student
  amount               numeric(12,2) not null,
  bank_name            text,                   -- manually entered, e.g. SBI / Cash
  received_by          text not null,          -- display name of admin who received
  received_by_admin_id text,                   -- admin_id of admin who received
  added_by_admin_id    text not null,          -- admin_id who recorded (auto from session)
  added_by_admin_name  text not null,          -- admin display_name who recorded
  payment_date         date not null default current_date,
  notes                text,
  created_at           timestamptz not null default now()
);

-- ── 3. Indexes for fast lookup ──
create index if not exists idx_fee_records_student  on public.fee_records(student_id);
create index if not exists idx_fee_records_batch    on public.fee_records(batch_id);
create index if not exists idx_fee_payments_record  on public.fee_payments(fee_record_id);
create index if not exists idx_fee_payments_date    on public.fee_payments(payment_date desc);

-- ── 4. Disable RLS for admin-only tables (or add your own policies) ──
alter table public.fee_records  disable row level security;
alter table public.fee_payments disable row level security;

-- ── 5. (Optional) Auto-create fee_record when a student is added ──
--    This trigger creates a ₹0 fee record automatically so admins
--    can immediately set the total_fee without manual insert.
create or replace function public.auto_create_fee_record()
returns trigger language plpgsql as $$
begin
  insert into public.fee_records (student_id, batch_id, total_fee, paid_amount)
  values (NEW.id, NEW.batch_id, 0, 0)
  on conflict (student_id) do nothing;
  return NEW;
end;
$$;

drop trigger if exists trg_auto_fee_record on public.students;
create trigger trg_auto_fee_record
  after insert on public.students
  for each row
  when (NEW.batch_id is not null)
  execute function public.auto_create_fee_record();

-- ── 6. Verify tables created ──
select 'fee_records created'  as status where exists (select from pg_tables where tablename='fee_records');
select 'fee_payments created' as status where exists (select from pg_tables where tablename='fee_payments');
