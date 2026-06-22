import { supabase } from '../lib/supabase';

// Generate a random password for students
const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Student Management Service
export const studentService = {
  // Create a new student with auto-generated password
  async createStudent(studentData: {
    name: string;
    email: string;
    course: string;
    batch: string;
  }) {
    try {
      // Generate a secure password
      const password = generatePassword();
      
      // Step 1: Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: studentData.email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: studentData.name,
          role: 'student'
        }
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user data returned from auth creation');
      }

      // Step 2: Create user record in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: studentData.email,
          name: studentData.name,
          role: 'student'
        }])
        .select()
        .single();

      if (userError) {
        console.error('User creation error:', userError);
        // Clean up auth user if database insert fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      // Step 3: Create student record
      const { data: studentRecord, error: studentError } = await supabase
        .from('students')
        .insert([{
          user_id: authData.user.id,
          course: studentData.course,
          batch: studentData.batch,
          status: 'active'
        }])
        .select()
        .single();

      if (studentError) {
        console.error('Student creation error:', studentError);
        // Clean up both auth user and user record
        await supabase.auth.admin.deleteUser(authData.user.id);
        await supabase.from('users').delete().eq('id', authData.user.id);
        throw new Error(`Failed to create student record: ${studentError.message}`);
      }

      return {
        success: true,
        student: {
          id: authData.user.id,
          name: studentData.name,
          email: studentData.email,
          course: studentData.course,
          batch: studentData.batch,
          password: password // Return password to admin
        }
      };

    } catch (error) {
      console.error('Student creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Get all students
  async getAllStudents() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          users (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        throw new Error(`Failed to fetch students: ${error.message}`);
      }

      return {
        success: true,
        students: data || []
      };
    } catch (error) {
      console.error('Error fetching students:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Get students by batch
  async getStudentsByBatch(batchName: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          users (
            id,
            name,
            email
          )
        `)
        .eq('batch', batchName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students by batch:', error);
        throw new Error(`Failed to fetch students: ${error.message}`);
      }

      return {
        success: true,
        students: data || []
      };
    } catch (error) {
      console.error('Error fetching students by batch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Update student
  async updateStudent(studentId: string, updates: {
    course?: string;
    batch?: string;
    status?: 'active' | 'inactive';
  }) {
    try {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating student:', error);
        throw new Error(`Failed to update student: ${error.message}`);
      }

      return {
        success: true,
        student: data
      };
    } catch (error) {
      console.error('Error updating student:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Delete student
  async deleteStudent(studentId: string) {
    try {
      // First get the user_id
      const { data: studentData, error: fetchError } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', studentId)
        .single();

      if (fetchError) {
        console.error('Error fetching student:', fetchError);
        throw new Error(`Failed to fetch student: ${fetchError.message}`);
      }

      // Delete from students table (cascade will handle users table)
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (deleteError) {
        console.error('Error deleting student:', deleteError);
        throw new Error(`Failed to delete student: ${deleteError.message}`);
      }

      // Delete from Supabase Auth
      if (studentData?.user_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(studentData.user_id);
        if (authError) {
          console.error('Error deleting auth user:', authError);
          // Don't throw error here as the main deletion succeeded
        }
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting student:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Reset student password
  async resetStudentPassword(studentId: string) {
    try {
      // Get the user_id
      const { data: studentData, error: fetchError } = await supabase
        .from('students')
        .select('user_id, users(email)')
        .eq('id', studentId)
        .single();

      if (fetchError) {
        console.error('Error fetching student:', fetchError);
        throw new Error(`Failed to fetch student: ${fetchError.message}`);
      }

      // Generate new password
      const newPassword = generatePassword();

      // Update password in Supabase Auth
      const { error: authError } = await supabase.auth.admin.updateUserById(
        studentData.user_id,
        { password: newPassword }
      );

      if (authError) {
        console.error('Error updating password:', authError);
        throw new Error(`Failed to update password: ${authError.message}`);
      }

      return {
        success: true,
        newPassword: newPassword
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};
