import React from "react";

const TermsAndConditions: React.FC = () => (
  <div className="max-w-3xl mx-auto py-8 px-4 bg-white border border-gray-200 rounded-xl shadow">
    <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
    <p>
      By accessing or using RSP Educations services (web or app), you agree to these terms & conditions. Please read them carefully before continuing to use our platform.
    </p>
    <h2 className="mt-6 font-semibold">Account & Eligibility</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>Users must provide accurate and truthful information during registration.</li>
      <li>Do not share or transfer your account credentials to others.</li>
      <li>Users under the age of 13 should not use the platform unless with parent/guardian consent.</li>
    </ul>
    <h2 className="mt-6 font-semibold">Use of Content</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>All course materials, documents, videos, quizzes, and other content are for Educationsal use only.</li>
      <li>No part of the platform may be copied, reproduced, resold, or distributed without written permission from RSP Educations.</li>
      <li>User-generated content posted on the platform (questions, answers, forum posts, submitted assignments, resumes) must comply with applicable laws and not infringe copyright.</li>
    </ul>
    <h2 className="mt-6 font-semibold">Prohibited Behavior</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>Abuse, harassment, or impersonation of other users is strictly prohibited.</li>
      <li>Do not attempt to access unauthorized data or interfere with technical operations.</li>
      <li>Do not use the platform for unlawful, fraudulent, or malicious activities.</li>
    </ul>
    <h2 className="mt-6 font-semibold">Intellectual Property</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>All trademarks, logos, and content belong to RSP Educations or third-party licensors.</li>
      <li>Users retain copyright to their original submissions but grant RSP Educations a non-exclusive license to use, display, and modify for Educationsal purposes.</li>
    </ul>
    <h2 className="mt-6 font-semibold">Termination & Suspension</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>RSP Educations reserves the right to suspend, modify, or terminate user access at any time for violation of these terms, security concerns, or improper behavior.</li>
      <li>You may delete your account at any time in accordance with our privacy policy.</li>
    </ul>
    <h2 className="mt-6 font-semibold">Disclaimer & Limitation of Liability</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>RSP Educations is provided “as is” and we make no warranties regarding accuracy, reliability, or continuous availability.</li>
      <li>We shall not be liable for any direct or indirect damages arising from use of the site or app.</li>
    </ul>
    <h2 className="mt-6 font-semibold">Changes to Terms</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>We may update these terms from time to time; continued use after changes means acceptance of new terms.</li>
      <li>The latest version will always be published on our website/app.</li>
    </ul>
    <h2 className="mt-6 font-semibold">Governing Law</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>This agreement is governed by the laws of your home jurisdiction unless otherwise specified.</li>
    </ul>
    <h2 className="mt-6 font-semibold">Contact</h2>
    <p>
      For detailed terms or questions, contact <a href="mailto:support@rspEducations.com">support@rspEducations.com</a>
    </p>
  </div>
);

export default TermsAndConditions;
