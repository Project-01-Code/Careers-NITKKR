import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Stepper from '../components/Stepper';
import PersonalDetails from '../components/application-steps/PersonalDetails';
import Education from '../components/application-steps/Education';
import Experience from '../components/application-steps/Experience';
import ReviewSubmit from '../components/application-steps/ReviewSubmit';

const ApplicationForm = () => {
  const { jobId } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  
  const steps = [
    "Personal Details",
    "Education",
    "Experience",
    "Review & Submit"
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(curr => curr + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(curr => curr - 1);
      window.scrollTo(0, 0);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <PersonalDetails onNext={handleNext} />;
      case 2: return <Education onNext={handleNext} onBack={handleBack} />;
      case 3: return <Experience onNext={handleNext} onBack={handleBack} />;
      case 4: return <ReviewSubmit onBack={handleBack} />;
      default: return <PersonalDetails onNext={handleNext} />;
    }
  };

  return (
    <MainLayout>
      <div className="bg-secondary text-white py-8">
        <div className="container mx-auto px-6">
          <h1 className="text-2xl font-bold mb-2">Faculty Application Form</h1>
          <p className="text-gray-400 text-sm">Application for position ID: {jobId ? jobId : 'N/A'}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar - Stepper */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
               <h3 className="font-bold text-gray-900 mb-6">Application Progress</h3>
               <Stepper steps={steps} currentStep={currentStep} />
            </div>
          </div>

          {/* Main Form Area */}
          <div className="w-full lg:w-3/4">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 min-h-[500px]">
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ApplicationForm;
