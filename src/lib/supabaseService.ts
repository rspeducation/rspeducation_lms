// src/services/supabaseService.ts
import { supabase } from '@/lib/supabase';

type Result<T> = { data: T | null; error: any | null };

export const studentService = {
  async getAllStudents(): Promise<Result<Array<{ id: string; status: 'active' | 'inactive' }>>> {
    const { data, error } = await supabase
      .from('students')
      .select('id,status'); // matches the setup schema
    return { data: data as any, error };
  },
};

export const batchService = {
  async getAllBatches(): Promise<Result<Array<{ id: string; name?: string; start_date?: string | null }>>> {
    const { data, error } = await supabase
      .from('batches')
      .select('id,name,start_date'); // status is not part of the base schema
    return { data: data as any, error };
  },
};
