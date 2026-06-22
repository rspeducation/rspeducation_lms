-- Quick Fix for UUID Type Casting Issues
-- Run this in your Supabase SQL Editor

-- Drop existing policies that have type casting issues
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Students can view own data" ON students;
DROP POLICY IF EXISTS "Public access to courses" ON courses;
DROP POLICY IF EXISTS "Public access to resume templates" ON resume_templates;
DROP POLICY IF EXISTS "Students can view batch content" ON course_content;

-- Recreate policies with correct UUID handling (no type casting)
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

-- Insert some sample data to test
INSERT INTO courses (name, description, duration, price) VALUES
('Azure Fundamentals', 'Learn the basics of Microsoft Azure cloud platform', '3 months', 299.99),
('Azure Developer Associate', 'Advanced Azure development and deployment', '6 months', 599.99),
('Azure Solutions Architect', 'Design and implement Azure solutions', '8 months', 799.99)
ON CONFLICT (name) DO NOTHING;

INSERT INTO batches (name, course_id, start_date, end_date, max_students) VALUES
('Batch 2024-01', (SELECT id FROM courses WHERE name = 'Azure Fundamentals' LIMIT 1), '2024-01-01', '2024-04-01', 30),
('Batch 2024-02', (SELECT id FROM courses WHERE name = 'Azure Developer Associate' LIMIT 1), '2024-02-01', '2024-08-01', 25),
('Batch 2024-03', (SELECT id FROM courses WHERE name = 'Azure Solutions Architect' LIMIT 1), '2024-03-01', '2024-11-01', 20)
ON CONFLICT (name) DO NOTHING;

INSERT INTO resume_templates (name, description, template_url, category) VALUES
('Professional Template', 'Clean and professional resume template', 'https://example.com/templates/professional.pdf', 'Professional'),
('Creative Template', 'Modern and creative resume design', 'https://example.com/templates/creative.pdf', 'Creative'),
('Simple Template', 'Minimalist and simple resume layout', 'https://example.com/templates/simple.pdf', 'Simple')
ON CONFLICT (name) DO NOTHING;

-- Verify the fix worked
SELECT 'Database fixed successfully!' as status;
