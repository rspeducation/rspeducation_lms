
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
    question: "What is RSP Educations?",
    answer:
      "RSP Educations is a training institute that provides career-oriented courses in Computer Basics, Advanced Excel, Tally Prime & GST, Web Development, Python Full Stack, Microsoft Azure, App Development, Data Science, Spoken English, Communication Skills, and AI Prompt Engineering.",
  },
  {
    question: "Where is RSP Educations located?",
    answer:
      "RSP Educations is located at KL Road, Mukkidipeta, Hindupuram, Andhra Pradesh - 515201.",
  },
  {
    question: "What courses are available at RSP Educations?",
    answer:
      "We offer Computer Basics, Advanced Excel, Tally Prime & GST, Web Development, Python Full Stack Development, Microsoft Azure, App Development, Data Science, Spoken English, Communication Skills, and AI Prompt Engineering.",
  },
  {
    question: "Are any courses offered free of cost?",
    answer:
      "Yes. Selected courses such as Spoken English, Communication Skills, and AI Prompt Engineering may be offered free during special admission campaigns.",
  },
  {
    question: "Do you provide certificates after course completion?",
    answer:
      "Yes, course completion certificates are provided to eligible students after successfully completing their training.",
  },
  {
    question: "Is there any age limit to join the courses?",
    answer:
      "No. Students, job seekers, working professionals, and entrepreneurs can join our courses regardless of age.",
  },
  {
    question: "Do you provide practical training?",
    answer:
      "Yes. We focus on practical learning, hands-on exercises, assignments, and real-world projects.",
  },
  {
    question: "Are live projects included in the training?",
    answer:
      "Yes. Students work on live projects to gain industry experience and improve their practical skills.",
  },
  {
    question: "Do you provide internship support?",
    answer:
      "Yes. Internship guidance and support are provided for eligible students.",
  },
  {
    question: "Is placement support available?",
    answer:
      "Yes. We provide placement assistance, interview preparation, resume guidance, and career support.",
  },
  {
    question: "Can beginners join technical courses?",
    answer:
      "Absolutely. Our courses are designed for both beginners and experienced learners.",
  },
  {
    question: "Do I need a computer to learn these courses?",
    answer:
      "Having a laptop or desktop is recommended, but we also provide guidance for students who are just starting.",
  },
  {
    question: "How long are the courses?",
    answer:
      "Course duration varies depending on the program. Contact our team for the latest batch schedules and durations.",
  },
  {
    question: "Are online classes available?",
    answer:
      "Yes. Online learning options may be available for selected courses.",
  },
  {
    question: "What is AI Prompt Engineering?",
    answer:
      "AI Prompt Engineering teaches students how to effectively communicate with AI tools like ChatGPT and create prompts for productivity, learning, and business applications.",
  },
  {
    question: "Who can join Spoken English and Communication Skills courses?",
    answer:
      "Students, job seekers, graduates, professionals, and anyone looking to improve communication skills can join.",
  },
  {
    question: "What career opportunities are available after completing the courses?",
    answer:
      "Students can pursue careers such as Data Entry Operator, Accountant, Web Developer, Python Developer, Cloud Engineer, App Developer, Data Analyst, and IT Support Executive.",
  },
  {
    question: "How can I register for a course?",
    answer:
      "You can contact us through phone, email, or visit our institute to complete the admission process.",
  },
  {
    question: "How can I contact RSP Educations?",
    answer:
      "Phone: +91 7569790229, +91 9059384664, +91 7386372008 | Email: info@rspeducations.com | Website: rspeducations.com",
  },
  {
    question: "Why should I choose RSP Educations?",
    answer:
      "RSP Educations provides Practical Training, Live Projects, Internship Support, Industry-Relevant Courses, Certificates, Career Guidance, Placement Assistance, and Affordable Learning Opportunities.",
  },
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
              Call Us: +91 7569790229
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
