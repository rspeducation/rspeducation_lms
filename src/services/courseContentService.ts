import { supabase } from '../lib/supabase';

// Course Content Management Service
export const courseContentService = {
  // Create new course content
  async createContent(contentData: {
    batch_id: string;
    title: string;
    description: string;
    content_type: 'video' | 'document' | 'assignment';
    file_url?: string;
    video_url?: string;
    questions?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('course_content')
        .insert([contentData])
        .select(`
          *,
          batches (
            name,
            courses (
              name
            )
          )
        `)
        .single();

      if (error) {
        console.error('Error creating content:', error);
        throw new Error(`Failed to create content: ${error.message}`);
      }

      return {
        success: true,
        content: data
      };
    } catch (error) {
      console.error('Error creating content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Get content by batch
  async getContentByBatch(batchId: string) {
    try {
      const { data, error } = await supabase
        .from('course_content')
        .select(`
          *,
          batches (
            name,
            courses (
              name
            )
          )
        `)
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching content:', error);
        throw new Error(`Failed to fetch content: ${error.message}`);
      }

      return {
        success: true,
        content: data || []
      };
    } catch (error) {
      console.error('Error fetching content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Get all content (for admin)
  async getAllContent() {
    try {
      const { data, error } = await supabase
        .from('course_content')
        .select(`
          *,
          batches (
            name,
            courses (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all content:', error);
        throw new Error(`Failed to fetch content: ${error.message}`);
      }

      return {
        success: true,
        content: data || []
      };
    } catch (error) {
      console.error('Error fetching all content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Update content
  async updateContent(contentId: string, updates: {
    title?: string;
    description?: string;
    content_type?: 'video' | 'document' | 'assignment';
    file_url?: string;
    video_url?: string;
    questions?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('course_content')
        .update(updates)
        .eq('id', contentId)
        .select(`
          *,
          batches (
            name,
            courses (
              name
            )
          )
        `)
        .single();

      if (error) {
        console.error('Error updating content:', error);
        throw new Error(`Failed to update content: ${error.message}`);
      }

      return {
        success: true,
        content: data
      };
    } catch (error) {
      console.error('Error updating content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  // Delete content
  async deleteContent(contentId: string) {
    try {
      const { error } = await supabase
        .from('course_content')
        .delete()
        .eq('id', contentId);

      if (error) {
        console.error('Error deleting content:', error);
        throw new Error(`Failed to delete content: ${error.message}`);
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};
