import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://kaewhoozzlvtxeafxzcj.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZXdob296emx2dHhlYWZ4emNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzM1OTgsImV4cCI6MjA3MTE0OTU5OH0.Wj94m10ou2pIu97KvGTfuA6NhbfYOxK22KBtgjVRXF0';

const supabase = createClient(FALLBACK_URL, FALLBACK_ANON_KEY);

async function check() {
  console.log('--- Checking Batches ---');
  const { data: batchData, error: batchErr } = await supabase.from('batches').select('*').limit(1);
  if (batchErr) {
    console.error('Batch error:', batchErr.message);
  } else {
    console.log('Batch columns:', batchData.length > 0 ? Object.keys(batchData[0]) : 'No rows, but query succeeded');
  }

  console.log('--- Checking Students ---');
  const { data: studentData, error: studentErr } = await supabase.from('students').select('*').limit(1);
  if (studentErr) {
    console.error('Student error:', studentErr.message);
  } else {
    console.log('Student columns:', studentData.length > 0 ? Object.keys(studentData[0]) : 'No rows, but query succeeded');
  }

  console.log('--- Checking Fee Payments ---');
  const { data: feeData, error: feeErr } = await supabase.from('fee_payments').select('*').limit(1);
  if (feeErr) {
    console.error('Fee payments error (this is expected if table does not exist):', feeErr.message);
  } else {
    console.log('Fee payments columns:', feeData.length > 0 ? Object.keys(feeData[0]) : 'No rows, but table exists!');
  }
}

check();
