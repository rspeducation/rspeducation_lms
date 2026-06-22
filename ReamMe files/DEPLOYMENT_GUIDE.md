# AzureRaj Hub - Deployment Guide

## 🚀 **Deploy to Netlify (Drag & Drop Method)**

### **Step 1: Build Your Project for Production**

1. **Open Terminal/Command Prompt** in your project directory
2. **Run the build command:**
   ```bash
   npm run build
   ```
3. **Wait for build to complete** - you should see a `dist` folder created

### **Step 2: Deploy to Netlify**

1. **Go to [Netlify Drop](https://app.netlify.com/drop)**
2. **Drag and drop** your `dist` folder onto the Netlify drop zone
3. **Wait for deployment** to complete (usually 1-2 minutes)
4. **Copy the generated URL** (e.g., `https://amazing-name-123456.netlify.app`)

### **Step 3: Configure Environment Variables**

1. **Go to your Netlify dashboard**
2. **Click on your deployed site**
3. **Go to Site settings** → **Environment variables**
4. **Add these variables:**
   ```
   VITE_SUPABASE_URL=https://kaewhoozzlvtxeafxzcj.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZXdob296emx2dHhlYWZ4emNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzM1OTgsImV4cCI6MjA3MTE0OTU5OH0.Wj94m10ou2pIu97KvGTfuA6NhbfYOxK22KBtgjVRXF0
   ```
5. **Click "Save"**

### **Step 4: Update Supabase Settings**

1. **Go to your Supabase dashboard**
2. **Navigate to Authentication** → **URL Configuration**
3. **Add your Netlify URL** to:
   - **Site URL:** `https://your-site-name.netlify.app`
   - **Redirect URLs:** `https://your-site-name.netlify.app/**`
4. **Save changes**

---

## 🏠 **Local Development Setup**

### **Step 1: Fix Database Issues**

1. **Go to Supabase SQL Editor**
2. **Run this updated SQL script** (fixes UUID type casting):

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Students can view own data" ON students;
DROP POLICY IF EXISTS "Public access to courses" ON courses;
DROP POLICY IF EXISTS "Public access to resume templates" ON resume_templates;
DROP POLICY IF EXISTS "Students can view batch content" ON course_content;

-- Recreate policies with correct UUID handling
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
```

### **Step 2: Test Local Development**

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Test Admin Login:**
   - Go to `http://localhost:8081/admin/login`
   - Use: `rapswamy0@gmail.com` / `AzureRaj2024!`
   - Should redirect to admin dashboard

3. **Test Student Creation:**
   - Login as admin
   - Add a new student
   - System will auto-generate password

### **Step 3: Test Student Login**

1. **Go to `http://localhost:8081/login`**
2. **Use student credentials** (created by admin)
3. **Should redirect to student dashboard**

---

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"uuid = text" Error:**
   - ✅ **Fixed** by removing `::text` casts in RLS policies
   - Run the updated SQL script above

2. **Build Errors:**
   - Check for TypeScript errors: `npx tsc --noEmit`
   - Fix any import issues
   - Ensure all dependencies are installed

3. **Netlify Deployment Issues:**
   - Check build logs in Netlify dashboard
   - Ensure environment variables are set
   - Verify Supabase URL configuration

4. **Authentication Issues:**
   - Check Supabase Auth settings
   - Verify redirect URLs match your domain
   - Check browser console for errors

### **Debug Steps:**

1. **Check Browser Console** for error messages
2. **Verify Supabase Connection** in network tab
3. **Test API calls** in Supabase dashboard
4. **Check RLS policies** are working correctly

---

## 📋 **Pre-Deployment Checklist**

- [ ] ✅ Database tables created successfully
- [ ] ✅ RLS policies updated (no UUID casting errors)
- [ ] ✅ Local development working
- [ ] ✅ Admin login working
- [ ] ✅ Student creation working
- [ ] ✅ Build command successful (`npm run build`)
- [ ] ✅ Environment variables configured
- [ ] ✅ Supabase URL settings updated

---

## 🎉 **Success Indicators**

You'll know everything is working when:

- ✅ **Local development** runs without errors
- ✅ **Admin login** works with hardcoded credentials
- ✅ **Student creation** generates passwords automatically
- ✅ **Student login** works with generated credentials
- ✅ **Netlify deployment** is successful
- ✅ **Production site** works the same as local

---

## 🚀 **Next Steps After Deployment**

1. **Test all features** on the live site
2. **Add real student data** through admin panel
3. **Upload course content** and materials
4. **Schedule interviews** and track progress
5. **Monitor usage** and performance


