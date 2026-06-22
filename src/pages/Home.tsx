
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EnrollmentForm from '@/components/EnrollmentForm';
import {
  ArrowRight,
  Users,
  Award,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Star,
  Play,
  Calendar,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Home = () => {
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative text-white py-20" style={{ backgroundImage: 'url(/bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-blue-600/80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Master Technology Skills
              <span className="block text-blue-200">Learn Today. Lead Tommorrow.</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              We are offering coursess Computer Basics, Advace Excel, Tally With GST, Web Development, App Development, Python Full Stack, Microsoft & More
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="text-white text-lg px-8 py-3"
                style={{ backgroundColor: '#F97923' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E06A1F'}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F97923'}
                onClick={() => setShowEnrollmentForm(true)}
              >
                Join Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {/* <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-azure text-lg px-8 py-3">
                <Play className="mr-2 h-5 w-5" /> Watch Demo
              </Button> */}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="animate-slide-up">
              <div className="text-4xl font-bold text-azure mb-2">Quality</div>
              <p className="text-gray-600">Never compromise on training quality</p>
            </div>
            <div className="animate-slide-up">
              <div className="text-4xl font-bold text-azure mb-2">Innovation</div>
              <p className="text-gray-600">Stay updated with latest technologies</p>
            </div>

            <div className="animate-slide-up">
              <div className="text-4xl font-bold text-azure mb-2">Support</div>
              <p className="text-gray-600">24/7 student support and guidance</p>
            </div>
            <div className="animate-slide-up">
              <div className="text-4xl font-bold text-azure mb-2">Success</div>
              <p className="text-gray-600">Student success is our primary goal</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                About <span className="text-azure">RSP Education</span>
              </h2>
              <p className="text-lg text-gray-600">
                Founded by <strong>Rangaswamy</strong>, a seasoned technology expert with 7+ years of real-time experience,
                RSP Education is your gateway to mastering modern technologies including Full Stack Development, Cloud Computing, Python and more.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Real-time project experience</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Industry-recognized certifications</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">100% placement assistance</span>
                </div>
              </div>
              <Link to="/about">
                <Button className="text-white" style={{ backgroundColor: '#F97923' }} onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E06A1F'} onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F97923'}>
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="bg-azure-gradient-light p-8 rounded-lg">
                <div className="text-center">
                  <div className="w-32 h-32 bg-azure rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">RSP</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Rangaswamy RSP</h3>
                  <p className="text-azure font-semibold">Founder & CEO</p>
                  <p className="text-gray-600 mt-2">7+ Years Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular <span className="text-azure">Courses</span>
            </h2>
            <p className="text-lg text-gray-600">Master the most in-demand technology skills</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Full Stack Development',
                description: 'Master MERN, Python & Java Full Stack',
                icon: <BookOpen className="h-8 w-8" />
              },
              {
                title: 'Azure Cloud & DevOps',
                description: 'IAAS, PAAS, SAAS, Docker, Kubernetes & CI/CD',
                icon: <TrendingUp className="h-8 w-8" />
              },
              {
                title: 'Computer Basics & Office',
                description: 'MS Office, Excel, PowerPoint & G Suite',
                icon: <Award className="h-8 w-8" />
              }
            ].map((course, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-azure mb-2">{course.icon}</div>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full text-white" style={{ backgroundColor: '#F97923', borderColor: '#F97923' }} onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E06A1F'} onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F97923'}>
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/courses">
              <Button size="lg" className="text-white" style={{ backgroundColor: '#F97923' }} onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E06A1F'} onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F97923'}>
                View All Courses <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Student <span className="text-azure">Success Stories</span>
            </h2>
            <p className="text-lg text-gray-600">Hear from our successful graduates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Rayudu',
                // role: 'Cloud Engineer',
                // package: '₹8.5 LPA',
                review: 'Classes by Rangaswamy anna is enough to crack the interview, Just make sure to learn well and Follow Rangaswamy sir guidelines properly.'
              },
              {
                name: 'Sathavahana Reddy',
                // role: 'DevOps Engineer',
                // package: '₹12 LPA',
                review: 'I was no knowledge in computer befor join the RSP Education offter I joined I gain so much knowledge.'
              },
              {
                name: 'NIVAS',
                // role: 'Solutions Architect',
                // package: '₹15 LPA',
                review: 'I have so much fear for talk in publicl, ofter join Spoken English I have talk in public with full of confidence .'
              }
            ].map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>

                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.review}"</p>
                  <div>
                    {/* <p className="text-azure text-sm">{testimonial.role}</p> */}
                    {/* <p className="text-green-600 font-semibold text-sm">{testimonial.package}</p> */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 azure-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Technology Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of successful professionals who have advanced their careers with RSP Education
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-azure hover:bg-gray-100 text-lg px-8 py-3"
              onClick={() => setShowEnrollmentForm(true)}
            >
              <Calendar className="mr-2 h-5 w-5" /> Book Free Demo
            </Button>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="border-white text-blue hover:bg-white hover:text-azure text-lg px-8 py-3">
                Contact Us <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Enrollment Form Modal */}
      <EnrollmentForm
        isOpen={showEnrollmentForm}
        onClose={() => setShowEnrollmentForm(false)}
      />
    </div>
  );
};

export default Home;
