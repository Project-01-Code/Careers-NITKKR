import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SEO from '../components/SEO';

const faqData = [
    {
        question: 'How do I apply for a faculty position?',
        answer: 'Browse available positions on the Jobs page, click on a position to view details, and click "Apply Now". You\'ll need to create an account by verifying your email via OTP. once registered, the application form has multiple sections including personal details, education, experience, publications, and document uploads.',
    },
    {
        question: 'What documents do I need to upload?',
        answer: 'You\'ll need a recent passport-size photograph (JPG/PNG, max 2MB), scanned signature, government ID proof (Aadhar/PAN/Passport), PhD degree certificate, UG & PG degree certificates (merged PDF), and optionally — category certificate, experience certificates, and NOC if currently employed in Govt./Semi-Govt. bodies. All PDFs should be under 5MB.',
    },
    {
        question: 'What is the application fee?',
        answer: 'The application fee depends on the job, payable via Razorpay secure checkout (Credit/Debit cards, UPI, Net Banking). The fee is non-refundable. Certain categories may be eligible for fee exemption as per government norms.',
    },
    {
        question: 'Can I save my application as a draft?',
        answer: 'Yes! Your application is automatically saved as a draft whenever you navigate between steps. You can resume your draft at any time from your Profile → My Applications section.',
    },
    {
        question: 'How do I check my application status?',
        answer: 'Login to your account and go to Profile → My Applications. You\'ll see the current status of all your applications (Draft, Submitted, Under Review, Shortlisted, Selected, or Rejected).',
    },
    {
        question: 'Can I withdraw my application after submission?',
        answer: 'Yes, submitted applications can be withdrawn from the My Applications section on your Profile page. However, the application fee is non-refundable.',
    },
    {
        question: 'I forgot my password. How can I reset it?',
        answer: 'Click the "Forgot Password?" link on the Login page, enter your registered email address, and you\'ll receive a 6-digit OTP. Enter the OTP along with your new password to reset it.',
    },
    {
        question: 'How do I verify my email?',
        answer: 'Email verification is now integrated into the registration process. When you sign up, an OTP is sent to your email. You must enter this OTP to complete your registration and set your password.',
    },
    {
        question: 'Who can I contact for technical support?',
        answer: 'For any technical issues or queries regarding the recruitment portal, please contact the Establishment Section at the email and phone number provided at the bottom of this page.',
    },
];

const Help = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <MainLayout>
            <SEO 
                title="Help Center" 
                description="Frequently asked questions and technical support for the NIT Kurukshetra recruitment portal."
                keywords="NIT KKR Help, Recruitment Support, FAQ NIT Kurukshetra"
            />
            {/* Hero */}
            <div className="bg-secondary text-white py-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <span className="material-symbols-outlined text-5xl text-primary mb-4 block">help</span>
                    <h1 className="text-3xl font-bold mb-2">Help Center</h1>
                    <p className="text-gray-400 text-sm max-w-lg mx-auto">
                        Find answers to frequently asked questions about the NIT Kurukshetra recruitment portal.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-3xl">

                {/* FAQ Accordion */}
                <div className="space-y-3">
                    {faqData.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-primary/30 transition-colors"
                        >
                            <button
                                onClick={() => toggleFaq(index)}
                                className="w-full flex items-center justify-between p-5 text-left"
                            >
                                <span className="font-semibold text-gray-800 pr-4">{faq.question}</span>
                                <span
                                    className={`material-symbols-outlined text-gray-400 transition-transform duration-200 shrink-0 ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                >
                                    expand_more
                                </span>
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96 pb-5' : 'max-h-0'
                                    }`}
                            >
                                <p className="px-5 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact Section */}
                <div className="mt-12 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 text-center border border-primary/10">
                    <span className="material-symbols-outlined text-primary text-4xl mb-3 block">support_agent</span>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Still Need Help?</h2>
                    <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                        Reach out to the Establishment Section, NIT Kurukshetra for any recruitment-related queries.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="mailto:recruitment@nitkkr.ac.in"
                            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium text-sm hover:border-primary/30 hover:text-primary transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">email</span>
                            recruitment@nitkkr.ac.in
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="mt-8 flex flex-wrap gap-3 justify-center">
                    <Link to="/jobs" className="text-sm text-primary hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">work</span> Browse Jobs
                    </Link>
                    <span className="text-gray-300">•</span>
                    <Link to="/notices" className="text-sm text-primary hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">campaign</span> Notices
                    </Link>
                    <span className="text-gray-300">•</span>
                    <Link to="/login" className="text-sm text-primary hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">login</span> Login
                    </Link>
                </div>
            </div>
        </MainLayout>
    );
};

export default Help;
