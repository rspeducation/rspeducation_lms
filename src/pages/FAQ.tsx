
import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "What are the prerequisites for Azure courses?",
      answer: "For Azure Fundamentals (AZ-900), no prior experience is required. For advanced courses like Administrator (AZ-104) or Architect (AZ-305), basic understanding of cloud concepts and networking is recommended. We provide foundation modules to help beginners get started."
    },
    {
      question: "How long does it take to complete a course?",
      answer: "Course duration varies: Azure Fundamentals takes 4 weeks, Administrator and DevOps courses take 6 weeks, and Architect courses take 8 weeks. We also offer accelerated weekend batches for working professionals."
    },
    {
      question: "Do you provide hands-on practice?",
      answer: "Yes! Every course includes extensive hands-on labs using real Azure environments. Students work on live projects, deploy resources, and gain practical experience that's essential for both certification and job readiness."
    },
    {
      question: "What is your placement assistance process?",
      answer: "We provide 100% placement assistance including resume building, interview preparation, mock interviews, and direct connections with our hiring partners. Our placement team works with you until you secure a suitable position."
    },
    {
      question: "Are the classes online or offline?",
      answer: "We offer both online and offline training options. Online classes are conducted  Zoom with recorded sessions for revision. Offline classes are held at our Madakasira center with limited batch sizes for personalized attention."
    },
    {
      question: "What is the success rate of your students?",
      answer: "Our students have a 95% certification success rate and 200+ placements with packages ranging from ₹7.5 LPA to ₹25 LPA. We maintain high standards through quality training and comprehensive support."
    },
    {
      question: "Do you provide study materials and resources?",
      answer: "Yes, we provide comprehensive study materials including course PDFs, practice tests, lab guides, recorded sessions, and access to Azure documentation. All materials are regularly updated in student dashboard."
    },
    {
      question: "What are the batch timings?",
      answer: "Regular batches run Monday-Friday 7:00-8:00 PM, with offline sessions 10:00 AM-12:00 PM. We also offer flexible timings for working professionals and students in different time zones."
    },
    {
      question: "Is there any financial assistance or EMI options?",
      answer: "We offer flexible payment options including installment plans and early bird discounts. Contact our counselors to discuss payment plans that suit your budget and needs."
    },
    {
      question: "How do I access course materials after enrollment?",
      answer: "Once enrolled, you'll receive login credentials for our student portal where you can access all course materials, recorded sessions, assignments, and track your progress. The portal remains accessible throughout your course duration."
    },
    {
      question: "What support is available during the course?",
      answer: "Students get 24/7 support through our dedicated WhatsApp groups, email support, one-on-one doubt clearing sessions, and regular mentoring calls. Our instructors are always available to help with technical questions."
    },
    {
      question: "Do you help with Azure certification exam registration?",
      answer: "Yes, we guide students through the entire certification process including exam registration, scheduling, and provide vouchers for practice tests. We also offer exam-specific preparation sessions before your certification date."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative text-white py-16" style={{ backgroundImage: 'url(/bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-blue-600/80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <HelpCircle className="h-16 w-16 mx-auto mb-4 text-blue-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Find answers to common questions about our Azure training programs and services
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-azure">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Still have questions section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our team is here to help you with any specific questions about our courses or career guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+918500086257"
              className="inline-flex items-center justify-center px-6 py-3 text-white font-medium rounded-lg transition-colors"
              style={{ backgroundColor: '#F97923' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E06A1F'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F97923'}
            >
              Call Us: +91 8500086257
            </a>
            <a
              href="mailto:support@rspeducation.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-azure text-azure font-medium rounded-lg hover:bg-azure hover:text-white transition-colors"
            >
              Email: support@rspeducation.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
