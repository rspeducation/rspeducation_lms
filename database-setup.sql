-- AzureRaj Hub Database Setup for Supabase
-- This stores all data except admin authentication (which is hardcoded)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (for students only)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('student')) NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course VARCHAR(255) NOT NULL,
    batch VARCHAR(255) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    enrollment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration VARCHAR(100),
    price DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_students INTEGER DEFAULT 30,
    current_students INTEGER DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_content table
CREATE TABLE IF NOT EXISTS course_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) CHECK (content_type IN ('video', 'document', 'assignment')) NOT NULL,
    file_url TEXT,
    video_url TEXT,
    questions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    interviewer_name VARCHAR(255) NOT NULL,
    interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    feedback TEXT,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create placements table
CREATE TABLE IF NOT EXISTS placements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    salary DECIMAL(12,2),
    placement_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('placed', 'pending', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_queries table
CREATE TABLE IF NOT EXISTS user_queries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resume_templates table
CREATE TABLE IF NOT EXISTS resume_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_url TEXT NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Students can view own data" ON students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public access to courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public access to resume templates" ON resume_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Students can view batch content" ON course_content FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM students s 
        JOIN batches b ON s.batch = b.name 
        WHERE s.user_id = auth.uid() AND b.id = course_content.batch_id
    )
);

-- Insert sample data
INSERT INTO courses (name, description, duration, price) VALUES
('Azure Fundamentals', 'Learn the basics of Microsoft Azure cloud platform', '3 months', 299.99),
('Azure Developer Associate', 'Advanced Azure development and deployment', '6 months', 599.99),
('Azure Solutions Architect', 'Design and implement Azure solutions', '8 months', 799.99)
ON CONFLICT DO NOTHING;

INSERT INTO batches (name, course_id, start_date, end_date, max_students) VALUES
('Batch 2024-01', (SELECT id FROM courses WHERE name = 'Azure Fundamentals' LIMIT 1), '2024-01-01', '2024-04-01', 30),
('Batch 2024-02', (SELECT id FROM courses WHERE name = 'Azure Developer Associate' LIMIT 1), '2024-02-01', '2024-08-01', 25),
('Batch 2024-03', (SELECT id FROM courses WHERE name = 'Azure Solutions Architect' LIMIT 1), '2024-03-01', '2024-11-01', 20)
ON CONFLICT DO NOTHING;

INSERT INTO resume_templates (name, description, template_url, category) VALUES
('Professional Template', 'Clean and professional resume template', 'https://example.com/templates/professional.pdf', 'Professional'),
('Creative Template', 'Modern and creative resume design', 'https://example.com/templates/creative.pdf', 'Creative'),
('Simple Template', 'Minimalist and simple resume layout', 'https://example.com/templates/simple.pdf', 'Simple')
ON CONFLICT DO NOTHING; 
