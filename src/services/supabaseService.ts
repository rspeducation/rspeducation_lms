import { supabase, TABLES } from '../lib/supabase';

// User Management
export const userService = {
  // Create a new user
  async createUser(userData: {
    email: string;
    name: string;
    role: 'student' | 'admin';
  }) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert([userData])
      .select()
      .single();
    
    return { data, error };
  },

  // Get user by ID
  async getUserById(id: string) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  // Update user
  async updateUser(id: string, updates: any) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
};

// Student Management
export const studentService = {
  // Create a new student
  async createStudent(studentData: {
    user_id: string;
    course: string;
    batch: string;
    status?: 'active' | 'inactive';
  }) {
    const { data, error } = await supabase
      .from(TABLES.STUDENTS)
      .insert([studentData])
      .select()
      .single();
    
    return { data, error };
  },

  // Get all students
  async getAllStudents() {
    const { data, error } = await supabase
      .from(TABLES.STUDENTS)
      .select(`
        *,
        users (
          id,
          name,
          email
        )
      `);
    
    return { data, error };
  },

  // Get students by batch
  async getStudentsByBatch(batchName: string) {
    const { data, error } = await supabase
      .from(TABLES.STUDENTS)
      .select(`
        *,
        users (
          id,
          name,
          email
        )
      `)
      .eq('batch', batchName);
    
    return { data, error };
  },

  // Update student
  async updateStudent(id: string, updates: any) {
    const { data, error } = await supabase
      .from(TABLES.STUDENTS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  // Delete student
  async deleteStudent(id: string) {
    const { error } = await supabase
      .from(TABLES.STUDENTS)
      .delete()
      .eq('id', id);
    
    return { error };
  }
};

// Admin Management
export const adminService = {
  // Create a new admin
  async createAdmin(adminData: {
    user_id: string;
    permissions?: string[];
  }) {
    const { data, error } = await supabase
      .from(TABLES.ADMINS)
      .insert([adminData])
      .select()
      .single();
    
    return { data, error };
  },

  // Get admin by user ID
  async getAdminByUserId(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.ADMINS)
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return { data, error };
  }
};

// Course Management
export const courseService = {
  // Create a new course
  async createCourse(courseData: {
    name: string;
    description: string;
    duration: string;
    price: number;
    status?: 'active' | 'inactive';
  }) {
    const { data, error } = await supabase
      .from(TABLES.COURSES)
      .insert([courseData])
      .select()
      .single();
    
    return { data, error };
  },

  // Get all courses
  async getAllCourses() {
    const { data, error } = await supabase
      .from(TABLES.COURSES)
      .select('*')
      .eq('status', 'active');
    
    return { data, error };
  },

  // Get course by ID
  async getCourseById(id: string) {
    const { data, error } = await supabase
      .from(TABLES.COURSES)
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  }
};

// Batch Management
export const batchService = {
  // Create a new batch
  async createBatch(batchData: {
    name: string;
    course_id: string;
    start_date: string;
    end_date: string;
    max_students: number;
    current_students?: number;
    status?: 'active' | 'inactive';
  }) {
    const { data, error } = await supabase
      .from(TABLES.BATCHES)
      .insert([batchData])
      .select()
      .single();
    
    return { data, error };
  },

  // Get all batches
  async getAllBatches() {
    const { data, error } = await supabase
      .from(TABLES.BATCHES)
      .select(`
        *,
        courses (
          name,
          description
        )
      `);
    
    return { data, error };
  },

  // Get batch by ID
  async getBatchById(id: string) {
    const { data, error } = await supabase
      .from(TABLES.BATCHES)
      .select(`
        *,
        courses (
          name,
          description
        )
      `)
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  // Update batch
  async updateBatch(id: string, updates: any) {
    const { data, error } = await supabase
      .from(TABLES.BATCHES)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
};

// Course Content Management
export const courseContentService = {
  // Create new content
  async createContent(contentData: {
    batch_id: string;
    title: string;
    description: string;
    content_type: 'video' | 'document' | 'assignment';
    file_url?: string;
    video_url?: string;
    questions?: string;
  }) {
    const { data, error } = await supabase
      .from(TABLES.COURSE_CONTENT)
      .insert([contentData])
      .select()
      .single();
    
    return { data, error };
  },

  // Get content by batch
  async getContentByBatch(batchId: string) {
    const { data, error } = await supabase
      .from(TABLES.COURSE_CONTENT)
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Update content
  async updateContent(id: string, updates: any) {
    const { data, error } = await supabase
      .from(TABLES.COURSE_CONTENT)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  // Delete content
  async deleteContent(id: string) {
    const { error } = await supabase
      .from(TABLES.COURSE_CONTENT)
      .delete()
      .eq('id', id);
    
    return { error };
  }
};

// Interview Management
export const interviewService = {
  // Create new interview
  async createInterview(interviewData: {
    student_id: string;
    interviewer_id: string;
    interview_date: string;
    status?: 'scheduled' | 'completed' | 'cancelled';
    feedback?: string;
    score?: number;
  }) {
    const { data, error } = await supabase
      .from(TABLES.INTERVIEWS)
      .insert([interviewData])
      .select()
      .single();
    
    return { data, error };
  },

  // Get interviews by student
  async getInterviewsByStudent(studentId: string) {
    const { data, error } = await supabase
      .from(TABLES.INTERVIEWS)
      .select(`
        *,
        students (
          users (
            name,
            email
          )
        ),
        users!interviews_interviewer_id_fkey (
          name,
          email
        )
      `)
      .eq('student_id', studentId)
      .order('interview_date', { ascending: false });
    
    return { data, error };
  },

  // Get all interviews (for admin)
  async getAllInterviews() {
    const { data, error } = await supabase
      .from(TABLES.INTERVIEWS)
      .select(`
        *,
        students (
          users (
            name,
            email
          )
        ),
        users!interviews_interviewer_id_fkey (
          name,
          email
        )
      `)
      .order('interview_date', { ascending: false });
    
    return { data, error };
  }
};

// User Queries Management
export const userQueryService = {
  // Create new query
  async createQuery(queryData: {
    user_id: string;
    subject: string;
    message: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  }) {
    const { data, error } = await supabase
      .from(TABLES.USER_QUERIES)
      .insert([queryData])
      .select()
      .single();
    
    return { data, error };
  },

  // Get queries by user
  async getQueriesByUser(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.USER_QUERIES)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Get all queries (for admin)
  async getAllQueries() {
    const { data, error } = await supabase
      .from(TABLES.USER_QUERIES)
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Update query status
  async updateQueryStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from(TABLES.USER_QUERIES)
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
};

// Resume Templates
export const resumeTemplateService = {
  // Get all active templates
  async getActiveTemplates() {
    const { data, error } = await supabase
      .from(TABLES.RESUME_TEMPLATES)
      .select('*')
      .eq('is_active', true);
    
    return { data, error };
  },

  // Get templates by category
  async getTemplatesByCategory(category: string) {
    const { data, error } = await supabase
      .from(TABLES.RESUME_TEMPLATES)
      .select('*')
      .eq('category', category)
      .eq('is_active', true);
    
    return { data, error };
  }
};
