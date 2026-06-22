
import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Instagram, Linkedin, Youtube } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    course: '',
    message: ''
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData);
    toast({
      title: "Message Sent!",
      description: "Thank you for your inquiry. We'll get back to you soon.",
    });
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      course: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen ">
      {/* Hero Section */}
      <section className="relative text-white py-16" style={{ backgroundImage: 'url(/bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-blue-600/80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Get in touch with us for course inquiries, career guidance, or any questions
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Get In Touch</h2>
                <p className="text-lg text-gray-600 mb-8">
                  Ready to start your journey with RSP.? Contact us today for personalized guidance
                  and course recommendations.
                </p>
              </div>

              <div className="space-y-6">
                <Card className="border-l-4 border-l-azure">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <MapPin className="h-6 w-6 text-azure mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                        <p className="text-gray-600">
                         RSP Educations KL Road,<br />
                          Mukkidipeta Hindupuram <br />
                          Sri Sathya Sai Dist. AP 5152013
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-azure">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Phone className="h-6 w-6 text-azure mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                        <a href="tel:+9185000 86257" className="text-azure hover:underline">
                          +91 7569790229
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-azure">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Mail className="h-6 w-6 text-azure mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                        <a href="mailto:support@rspeducation.com" className="text-azure hover:underline">
                          support@rspeducations.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-azure">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Clock className="h-6 w-6 text-azure mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Office Hours</h3>
                        <div className="text-gray-600 space-y-1">
                          <p>Monday - Friday: 09:00 AM - 7:00 PM</p>
                          <p>Saturday - Sunday: Week Off</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow Us</h3>
                <div className="flex space-x-4">
                  <a href="#" className="p-3 bg-blue-100 rounded-full text-azure hover:bg-azure hover:text-white transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a href="#" className="p-3 bg-blue-100 rounded-full text-azure hover:bg-azure hover:text-white transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href="#" className="p-3 bg-blue-100 rounded-full text-azure hover:bg-azure hover:text-white transition-colors">
                    <Youtube className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                        Interested Course
                      </label>
                      <select
                        id="course"
                        name="course"
                        value={formData.course}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-azure focus:border-transparent"
                      >
                        <option value="">Select a course</option>
                        <option value="Computer-Basics"> Computer Basics with E-Office</option>
                        <option value="Tally-GST">E-Office with Tally + GST</option>
                        <option value="Web-Development">Web Development</option>
                        <option value="App-Developmet">App Development</option>
                        <option value="Python-FullStack">Python Full Stack</option>
                        <option value="azure-data">Microsoft Azure CLoud</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us about your career goals or any specific questions..."
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full text-white" style={{ backgroundColor: '#F97923' }} onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E06A1F'} onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F97923'}>\n                    Send Message <Send className="ml-2 h-4 w-4" />\n                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Us</h2>
            <p className="text-lg text-gray-600">Visit our training center in Madakasira</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="aspect-video bg-gray-200 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-azure mx-auto mb-2" />
                <p className="text-gray-600">Google Map Integration</p>
                <p className="text-sm text-gray-500">RSP Educations KL Road,<br />
                  Mukkidipeta Hindupuram <br />
                   Sri Sathya Sai Dist. AP 515201</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
