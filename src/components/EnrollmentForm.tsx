// src/components/EnrollmentForm.tsx
import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface EnrollmentFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    district: '',
    qualification: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const validate = () => {
    if (!formData.fullName.trim()) return 'Full name is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return 'Valid email is required';
    if (!/^[0-9+\-()\s]{7,20}$/.test(formData.phone)) return 'Valid phone is required';
    if (!formData.district.trim()) return 'District is required';
    if (!formData.qualification.trim()) return 'Qualification is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast({ title: 'Validation error', description: err, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert into Supabase: public.userqueries
      const payload = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        district: formData.district.trim(),
        qualification: formData.qualification.trim(),
        status: 'pending',
        submitted_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('userqueries')
        .insert([payload])
        .select('id')
        .single();

      if (error) throw error;

      toast({
        title: 'Enrollment Request Submitted!',
        description: 'Thank you for your interest. Our team will contact you soon.',
        variant: 'default',
      });

      setFormData({ fullName: '', email: '', phone: '', district: '', qualification: '' });
      onClose();
    } catch (err: any) {
      toast({
        title: 'Submission Failed',
        description: err?.message ?? 'Please try again or contact us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-azure">Join RSP Educations</CardTitle>
              <CardDescription>Start your Azure cloud journey with us</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="pl-10"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="pl-10"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="pl-10"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="district"
                  name="district"
                  type="text"
                  required
                  className="pl-10"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="Enter your district"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
              <Select onValueChange={(value) => handleSelectChange('qualification', value)} value={formData.qualification}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <GraduationCap className="h-4 w-4 text-gray-400 mr-2" />
                    <SelectValue placeholder="Select your qualification" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10th">10th Grade</SelectItem>
                  <SelectItem value="12th">12th Grade</SelectItem>
                  <SelectItem value="diploma">Diploma</SelectItem>
                  <SelectItem value="btech">B.Tech</SelectItem>
                  <SelectItem value="mtech">M.Tech</SelectItem>
                  <SelectItem value="bca">BCA</SelectItem>
                  <SelectItem value="mca">MCA</SelectItem>
                  <SelectItem value="bsc">B.Sc</SelectItem>
                  <SelectItem value="msc">M.Sc</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 text-white"
                style={{ backgroundColor: '#F97923' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E06A1F'}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F97923'}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnrollmentForm;
