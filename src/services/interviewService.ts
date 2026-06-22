import { supabase } from '../lib/supabase';

// Interview Management Service
export const interviewService = {
  // Create new interview
  async createInterview(interviewData: {
    student_id: string;
    interviewer_name: string;
    interview_date: string;
    status?: 'scheduled' | 'completed' | 'cancelled';
    feedback?: string;
    score?: number;
  }) {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .insert([interviewData])
        .select(`
          *,
          students (
            users (
              name,
              email
            )
          )
        `)
        .single();

      if (error) {
        console.error('Error creating interview:', error);
        throw new Error(`Failed to create interview: ${error.message}`);
      }

      return {
        success: true,
        interview: data
      };
    } catch (error) {
      console.error('Error creating interview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Get interviews by student
  async getInterviewsByStudent(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          students (
            users (
              name,
              email
            )
          )
        `)
        .eq('student_id', studentId)
        .order('interview_date', { ascending: false });

      if (error) {
        console.error('Error fetching student interviews:', error);
        throw new Error(`Failed to fetch interviews: ${error.message}`);
      }

      return {
        success: true,
        interviews: data || []
      };
    } catch (error) {
      console.error('Error fetching student interviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Get all interviews (for admin)
  async getAllInterviews() {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          students (
            users (
              name,
              email
            )
          )
        `)
        .order('interview_date', { ascending: false });

      if (error) {
        console.error('Error fetching all interviews:', error);
        throw new Error(`Failed to fetch interviews: ${error.message}`);
      }

      return {
        success: true,
        interviews: data || []
      };
    } catch (error) {
      console.error('Error fetching all interviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Update interview
  async updateInterview(interviewId: string, updates: {
    interviewer_name?: string;
    interview_date?: string;
    status?: 'scheduled' | 'completed' | 'cancelled';
    feedback?: string;
    score?: number;
  }) {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .update(updates)
        .eq('id', interviewId)
        .select(`
          *,
          students (
            users (
              name,
              email
            )
          )
        `)
        .single();

      if (error) {
        console.error('Error updating interview:', error);
        throw new Error(`Failed to update interview: ${error.message}`);
      }

      return {
        success: true,
        interview: data
      };
    } catch (error) {
      console.error('Error updating interview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Delete interview
  async deleteInterview(interviewId: string) {
    try {
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', interviewId);

      if (error) {
        console.error('Error deleting interview:', error);
        throw new Error(`Failed to delete interview: ${error.message}`);
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting interview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Get interview statistics
  async getInterviewStats() {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('status, score');

      if (error) {
        console.error('Error fetching interview stats:', error);
        throw new Error(`Failed to fetch interview stats: ${error.message}`);
      }

      const stats = {
        total: data?.length || 0,
        scheduled: data?.filter(i => i.status === 'scheduled').length || 0,
        completed: data?.filter(i => i.status === 'completed').length || 0,
        cancelled: data?.filter(i => i.status === 'cancelled').length || 0,
        averageScore: 0
      };

      const completedInterviews = data?.filter(i => i.status === 'completed' && i.score !== null) || [];
      if (completedInterviews.length > 0) {
        const totalScore = completedInterviews.reduce((sum, i) => sum + (i.score || 0), 0);
        stats.averageScore = Math.round(totalScore / completedInterviews.length);
      }

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Error fetching interview stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};
