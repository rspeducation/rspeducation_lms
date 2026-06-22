import React from "react";

const PrivacyPolicy: React.FC = () => (
  <div className="max-w-3xl mx-auto py-8 px-4 bg-white border border-gray-200 rounded-xl shadow">
    {/* ...rest of your content */}

    <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
    <p>
      Your privacy is important to us. This policy explains how we collect, use, and protect your information when you use the RSP Education website or app.
    </p>

    <h2 className="mt-6 font-semibold">Information We Collect</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>Personal details (name, email, phone number, address, etc.)</li>
      <li>Usage data (pages visited, features used, actions taken, log data)</li>
      <li>Device and technical data (device model, operating system, browser, IP address)</li>
      <li>Location data (if you grant permission)</li>
      <li>Media uploads (files, images, audio, resume uploads if feature is used)</li>
      <li>Cookies and tracking technologies</li>
    </ul>

    <h2 className="mt-6 font-semibold">How We Collect Information</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>When you register, fill out forms, or update account settings</li>
      <li>Automatically through app usage, analytics, and cookies</li>
      <li>Via device and app permissions (with your consent)</li>
      <li>From third-party services (authentication, payment, analytics)</li>
    </ul>

    <h2 className="mt-6 font-semibold">How We Use Information</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>To provide, operate and improve our services</li>
      <li>To process enrollments and personalize content</li>
      <li>To enable features such as course access, schedule management, resume creation</li>
      <li>To communicate with you about updates, news, offers or support</li>
      <li>For analytics, research, and to monitor usage and performance</li>
      <li>For legal compliance and security purposes</li>
    </ul>

    <h2 className="mt-6 font-semibold">Sharing and Data Retention</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>We do not sell personal information to third parties</li>
      <li>Information may be shared with service providers to operate features (e.g., hosting, analytics)</li>
      <li>Data is retained as long as needed for business, legal, or operational purposes</li>
    </ul>

    <h2 className="mt-6 font-semibold">User Rights and Choices</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>You may access, edit, download or delete your data at any time through your account settings</li>
      <li>You can revoke consent for certain app permissions</li>
      <li>Contact us to exercise your data rights or for assistance</li>
    </ul>

    <h2 className="mt-6 font-semibold">Data Security</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>We apply security technologies and procedures to protect your data</li>
      <li>User data is encrypted and access is restricted</li>
      <li>Regular security reviews and staff training</li>
    </ul>

    <h2 className="mt-6 font-semibold">Policy Changes and Updates</h2>
    <p>
      We may update our privacy policy as needed. Significant changes will be notified through the app and website.
    </p>

    <h2 className="mt-6 font-semibold">Contact</h2>
    <p>
      For questions or concerns about our policy, contact <a href="mailto:support@rspeducation.com">support@rspeducation.com</a>
    </p>
  </div>
);

export default PrivacyPolicy;
