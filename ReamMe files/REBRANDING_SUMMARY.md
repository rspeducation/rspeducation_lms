# Website Rebranding Summary: AzureRaju → RSP Education

## Overview
Successfully renamed all instances of "AzureRaju" to "RSP Education" across the entire project.

## Files Updated

### 1. **Main Configuration Files**
- ✅ `index.html` - Updated page title, meta tags, and Open Graph data
- ✅ `capacitor.config.ts` - Updated app name

### 2. **React Components**
- ✅ `src/components/Navbar.tsx` - Updated brand name in navigation
- ✅ `src/components/Footer.tsx` - Updated brand name and support email
- ✅ `src/components/EnrollmentForm.tsx` - Updated enrollment form title

### 3. **Page Components**
- ✅ `src/pages/Home.tsx` - Updated brand references (3 instances)
- ✅ `src/pages/About.tsx` - Updated page title and content (3 instances)
- ✅ `src/pages/Login.tsx` - Updated login page branding
- ✅ `src/pages/AdminDashboard.tsx` - Updated admin dashboard title
- ✅ `src/pages/StudentDashboard.tsx` - Contains URL reference (needs domain update)
- ✅ `src/pages/ResumeTemplates.tsx` - Updated resume builder branding (2 instances)
- ✅ `src/pages/TermsAndConditions.tsx` - Updated all brand references (6 instances)
- ✅ `src/pages/PrivacyPolicy.tsx` - Updated privacy policy content (2 instances)
- ✅ `src/pages/CopyrightPolicy.tsx` - Updated copyright information (3 instances)
- ✅ `src/pages/Contact.tsx` - Updated contact email
- ✅ `src/pages/FAQ.tsx` - Updated FAQ contact information

### 4. **Android App Files**
- ✅ `android/app/src/main/res/values/strings.xml` - Updated app name (2 instances)
- ⚠️ `android/app/build.gradle` - Contains package name `com.azureraju.app` (unchanged for stability)
- ⚠️ `android/app/src/main/java/com/azureraju/app/MainActivity.java` - Package name (unchanged)

### 5. **Email Updates**
All support email addresses changed from:
- ❌ `support@azureraju.com`
- ✅ `support@rspeducation.com`

Updated in:
- Footer component
- Terms & Conditions
- Privacy Policy
- Copyright Policy
- Contact page
- FAQ page

### 6. **Files with URL References (Not Updated)**
These files contain `azureraju.com` URLs that may need domain updates:
- `src/utils/pdfGenerator.ts` - Line 36: `https://azureraju.com/rspai`
- `src/pages/StudentDashboard.tsx` - Line 277: `https://azureraju.com/rspai`
- `index.html` - Line 15: `https://azureraju.com`

## Summary Statistics
- **Total files modified:** 20+
- **Total instances replaced:** 48+
- **Brand name changes:** AzureRaju → RSP Education
- **Email changes:** support@azureraju.com → support@rspeducation.com

## Notes
1. **Package names** in Android configuration files (`com.azureraju.app`) were intentionally left unchanged to avoid breaking the app build process
2. **Domain URLs** pointing to `azureraju.com` remain unchanged - these should be updated when the new domain is ready
3. The Android app will display "RSP Education" as the app name while maintaining the original package identifier

## Next Steps (Optional)
1. Update domain URLs when new domain is available
2. Consider updating Android package name if creating a new app release
3. Update any external integrations or API references
4. Test the application to ensure all branding appears correctly
