# Supabase Setup Instructions for AzureRaj Hub

## 🎯 **System Overview**

- **Admin Login:** Hardcoded (no database) - `rapswamy0@gmail.com` / `AzureRaj2024!`
- **Student Login:** Supabase Auth + Database (auto-generated passwords)
- **All Data Storage:** Supabase database for students, courses, interviews, etc.

## 1. Database Setup

### Step 1: Go to Supabase Dashboard
1. Visit [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your project: `kaewhoozzlvtxeafxzcj`

### Step 2: Run SQL Script
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `database-setup.sql` file
3. Click **Run** to execute the script

### Step 3: Verify Tables
After running the script, you should see these tables created:
- `users` - Student accounts only
- `students` - Student information and enrollment
- `courses` - Course catalog
- `batches` - Course batches
- `course_content` - Course materials
- `interviews` - Interview records
- `placements` - Placement records
- `user_queries` - User support queries
- `resume_templates` - Resume templates

## 2. Authentication Setup

### Step 1: Enable Email Auth
1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Set **Site URL** to `http://localhost:8081` (or your dev server URL)

### Step 2: Configure Email Templates
1. Go to **Authentication** → **Email Templates**
2. Customize confirmation and reset password emails
3. Enable **Auto-confirm users** for easier testing

### Step 3: Row Level Security (RLS)
The SQL script automatically enables RLS and creates policies for:
- Students can only see their own data
- Public access to courses and resume templates
- Admin access is handled by hardcoded authentication

## 3. Sample Data

The script includes sample data for:
- 3 Azure courses (Fundamentals, Developer Associate, Solutions Architect)
- 3 sample batches
- 3 resume templates

## 4. Testing the Setup

### Step 1: Test Admin Login
1. Go to `http://localhost:8081/admin/login`
2. Use hardcoded credentials: `rapswamy0@gmail.com` / `AzureRaj2024!`
3. Should redirect to admin dashboard

### Step 2: Test Student Creation
1. Login as admin
2. Add a new student through the admin panel
3. System will auto-generate password and create Supabase Auth user
4. Student can login with auto-generated credentials

### Step 3: Test Student Login
1. Go to `http://localhost:8081/login`
2. Use student credentials (created by admin)
3. Should redirect to student dashboard

## 5. Environment Variables

Make sure your `.env` file contains:
```env
VITE_SUPABASE_URL=https://kaewhoozzlvtxeafxzcj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZXdob296emx2dHhlYWZ4emNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzM1OTgsImV4cCI6MjA3MTE0OTU5OH0.Wj94m10ou2pIu97KvGTfuA6NhbfYOxK22KBtgjVRXF0
```

## 6. Troubleshooting

### Common Issues:
1. **RLS Policy Errors**: Make sure all tables have RLS enabled and proper policies
2. **Authentication Errors**: Verify Supabase Auth is properly configured
3. **Permission Errors**: Check that the anon key has proper permissions

### Support:
If you encounter issues, check the Supabase logs in the dashboard under **Logs** section.

## 7. Next Steps

After setup:
1. Test the authentication flow
2. Verify data can be read/written from your React app
3. Customize the database schema as needed
4. Add more sample data for testing
