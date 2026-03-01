import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Stepper from '../components/Stepper';
import { useApplication } from '../context/ApplicationContext';

// Import All Steps
import PersonalDetails from '../components/application-steps/PersonalDetails';
import Education from '../components/application-steps/Education';
import Experience from '../components/application-steps/Experience';
import ReviewSubmit from '../components/application-steps/ReviewSubmit';
import Referees from '../components/application-steps/Referees';
import Publications from '../components/application-steps/Publications';
import Patents from '../components/application-steps/Patents';
import Projects from '../components/application-steps/Projects';
import PhdSupervision from '../components/application-steps/PhdSupervision';
import SubjectsTaught from '../components/application-steps/SubjectsTaught';
import OrganizedPrograms from '../components/application-steps/OrganizedPrograms';
import CreditPoints from '../components/application-steps/CreditPoints';
import OtherInfo from '../components/application-steps/OtherInfo';
import DocumentUpload from '../components/application-steps/DocumentUpload';
import Declaration from '../components/application-steps/Declaration';

const ApplicationForm = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const { initApplication, loading } = useApplication();
  
  useEffect(() => {
    if (jobId) {
      initApplication(jobId);
    } else {
      navigate('/jobs');
    }
  }, [jobId]);

  const steps = [
    { id: 1, title: "Personal Details", component: PersonalDetails },
    { id: 2, title: "Education", component: Education },
    { id: 3, title: "Experience", component: Experience },
    { id: 4, title: "Referees", component: Referees },
    { id: 5, title: "Publications", component: Publications },
    { id: 6, title: "Patents", component: Patents },
    { id: 7, title: "Projects", component: Projects },
    { id: 8, title: "PhD Supervision", component: PhdSupervision },
    { id: 9, title: "Subjects Taught", component: SubjectsTaught },
    { id: 10, title: "Organized Programs", component: OrganizedPrograms },
    { id: 11, title: "Credit Points", component: CreditPoints },
    { id: 12, title: "Other Info", component: OtherInfo },
    { id: 13, title: "Documents", component: DocumentUpload },
    { id: 14, title: "Declaration", component: Declaration },
    { id: 15, title: "Review & Submit", component: ReviewSubmit }
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
    const StepComponent = steps[currentStep - 1].component;
    return <StepComponent onNext={handleNext} onBack={currentStep > 1 ? handleBack : null} />;
  };

  if (loading && currentStep === 1) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-secondary text-white py-8">
        <div className="container mx-auto px-6">
          <h1 className="text-2xl font-bold mb-2">Faculty Application Form</h1>
          <p className="text-gray-400 text-sm">Application for position ID: {jobId}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
          {/* Sidebar - Stepper */}
          <div className="w-full lg:w-1/4 xl:w-1/5 shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
               <h3 className="font-bold text-gray-900 mb-6 sticky top-0 bg-white z-10 py-2 border-b border-gray-50">Progress</h3>
               <Stepper steps={steps.map(s => s.title)} currentStep={currentStep} />
            </div>
          </div>

          {/* Main Form Area */}
          <div className="w-full lg:w-3/4 xl:w-4/5">
            <div className="bg-white rounded-2xl p-6 md:p-8 lg:p-10 shadow-sm border border-gray-100 min-h-[500px]">
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ApplicationForm;
