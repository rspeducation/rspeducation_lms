import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const qualificationOptions = [
  { value: '10th', label: '10th Grade' },
  { value: '12th', label: '12th Grade' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'btech', label: 'B.Tech' },
  { value: 'mtech', label: 'M.Tech' },
  { value: 'bca', label: 'BCA' },
  { value: 'mca', label: 'MCA' },
  { value: 'bsc', label: 'B.Sc' },
  { value: 'msc', label: 'M.Sc' },
  { value: 'other', label: 'Other' },
];

const StudentJoinFormPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    batch: '',
    qualification: '',
  });
  const [batchOptions, setBatchOptions] = useState<{ value: string, label: string }[]>([]);
  const [thankYou, setThankYou] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBatch, setSubmittedBatch] = useState('');
  const [submittedQualification, setSubmittedQualification] = useState('');

  // Load batch list from DB
  useEffect(() => {
    async function fetchBatches() {
      const { data, error } = await supabase.from('batches').select('name').order('start_date', { ascending: true });
      if (!error && data) {
        const mapped = data.map((row: { name: string }) => ({
          value: row.name,
          label: row.name,
        }));
        setBatchOptions(mapped);
      }
    }
    fetchBatches();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.batch ||
      !formData.qualification
    ) {
      alert('Please fill all required fields.');
      setIsSubmitting(false);
      return;
    }

    // Check email in DB before insert
    const { data: existing } = await supabase
      .from('student_joins')
      .select('id')
      .eq('email', formData.email.trim().toLowerCase())
      .single();

    if (existing) {
      alert('This email has already joined. Please use a different email.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      full_name: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      batch: formData.batch,
      qualification: formData.qualification,
      joined_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('student_joins').insert([payload]);
    if (error) {
      alert('Submission failed. Please try again.');
    } else {
      setSubmittedBatch(formData.batch);
      setSubmittedQualification(formData.qualification);
      setThankYou(true);
    }
    setIsSubmitting(false);
  };

  if (thankYou) {
    const fullName = formData.fullName.trim();
    const batchLbl = batchOptions.find(opt => opt.value === submittedBatch)?.label;
    const qualLbl = qualificationOptions.find(opt => opt.value === submittedQualification)?.label;
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "50vh"
      }}>
        <div style={{
          maxWidth: 400,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 16px rgba(60,65,100,0.10)",
          padding: "2rem",
          margin: "auto",
          textAlign: "center"
        }}>
          <h2 style={{ color: "#1769aa", marginBottom: 12 }}>
            Thank you for joining! {fullName || ""}<br />
          </h2>
          <p>We received your details successfully.</p>
          <p>
            <b>Batch:</b> {batchLbl || ""}<br />
            <b>Qualification:</b> {qualLbl || ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "flex-start",
      minHeight: "60vh", background: "#f6fafc"
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 480,
          width: "100%",
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 2px 16px rgba(60,65,100,0.15)",
          padding: "2.5rem",
          margin: "3rem auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.7rem",
          border: "1px solid #e3e3e3"
        }}
      >
        <h2 style={{ fontWeight: 700, fontSize: "1.5rem", marginBottom: 8, color: "#1769aa" }}>
          Student Join Form
        </h2>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" style={{ fontWeight: 500, fontSize: "1rem" }}>
            Full Name<span style={{ color: "#ea4335" }}> *</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
            style={{
              width: "100%", marginTop: 7, padding: "12px 14px", borderRadius: 8,
              border: "1px solid #d4d4d4", fontSize: "1rem"
            }}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" style={{ fontWeight: 500, fontSize: "1rem" }}>
            Email<span style={{ color: "#ea4335" }}> *</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="student@email.com"
            style={{
              width: "100%", marginTop: 7, padding: "12px 14px", borderRadius: 8,
              border: "1px solid #d4d4d4", fontSize: "1rem"
            }}
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" style={{ fontWeight: 500, fontSize: "1rem" }}>
            Phone Number<span style={{ color: "#ea4335" }}> *</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="Enter your phone number"
            style={{
              width: "100%", marginTop: 7, padding: "12px 14px", borderRadius: 8,
              border: "1px solid #d4d4d4", fontSize: "1rem"
            }}
          />
        </div>

        {/* Batch - dynamic dropdown */}
        <div>
          <label htmlFor="batch" style={{ fontWeight: 500, fontSize: "1rem" }}>
            Batch<span style={{ color: "#ea4335" }}> *</span>
          </label>
          <select
            id="batch"
            name="batch"
            value={formData.batch}
            onChange={handleChange}
            required
            style={{
              width: "100%", marginTop: 7, padding: "12px 14px", borderRadius: 8,
              border: "1px solid #d4d4d4", fontSize: "1rem", background: "#f6fafc"
            }}
          >
            <option value="">-- Select Batch --</option>
            {batchOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Qualification */}
        <div>
          <label htmlFor="qualification" style={{ fontWeight: 500, fontSize: "1rem" }}>
            Qualification<span style={{ color: "#ea4335" }}> *</span>
          </label>
          <select
            id="qualification"
            name="qualification"
            value={formData.qualification}
            onChange={handleChange}
            required
            style={{
              width: "100%", marginTop: 7, padding: "12px 14px", borderRadius: 8,
              border: "1px solid #d4d4d4", fontSize: "1rem", background: "#f6fafc"
            }}
          >
            <option value="">-- Select Qualification --</option>
            {qualificationOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%", background: "#1769aa", color: "#fff", fontWeight: 700,
            border: "none", borderRadius: 8, fontSize: "1.13rem", padding: "14px",
            cursor: "pointer", transition: "background .2s"
          }}
        >
          {isSubmitting ? "Submitting..." : "Join"}
        </button>
      </form>
    </div>
  );
};

export default StudentJoinFormPage;
