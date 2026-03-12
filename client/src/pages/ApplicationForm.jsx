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
import ConferencePublications from '../components/application-steps/ConferencePublications';
import BooksPublications from '../components/application-steps/BooksPublications';
import Patents from '../components/application-steps/Patents';
import Projects from '../components/application-steps/Projects';
import ConsultancyProjects from '../components/application-steps/ConsultancyProjects';
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
  const [currentStep, setCurrentStep] = useState(() => {
    // Try to recover step from localStorage on initial load
    const saved = localStorage.getItem(`app_step_${jobId}`);
    return saved ? parseInt(saved, 10) : 1;
  });

  const { initApplication, loading, validateSection, completedSections } = useApplication();

  useEffect(() => {
    if (jobId) {
      initApplication(jobId);
    } else {
      navigate('/jobs');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // Persist current step to localStorage whenever it changes
  useEffect(() => {
    if (jobId && currentStep) {
      localStorage.setItem(`app_step_${jobId}`, currentStep.toString());
    }
  }, [currentStep, jobId]);

  const steps = [
    { id: 1, title: "Personal Details", component: PersonalDetails, key: 'personalDetails' },
    { id: 2, title: "Education", component: Education, key: 'education' },
    { id: 3, title: "Experience", component: Experience, key: 'experience' },
    { id: 4, title: "Referees", component: Referees, key: 'referees' },
    { id: 5, title: "Journal Publications", component: Publications, key: 'publications' },
    { id: 6, title: "Conference Publications", component: ConferencePublications, key: 'conferencePublications' },
    { id: 7, title: "Books & Monographs", component: BooksPublications, key: 'booksPublications' },
    { id: 8, title: "Patents", component: Patents, key: 'patents' },
    { id: 9, title: "Sponsored Projects", component: Projects, key: 'projects' },
    { id: 10, title: "Consultancy Projects", component: ConsultancyProjects, key: 'consultancyProjects' },
    { id: 11, title: "PhD Supervision", component: PhdSupervision, key: 'phdSupervision' },
    { id: 12, title: "Subjects Taught", component: SubjectsTaught, key: 'subjectsTaught' },
    { id: 13, title: "Organized Programs", component: OrganizedPrograms, key: 'organizedPrograms' },
    { id: 14, title: "Credit Points", component: CreditPoints, key: 'creditPoints' },
    { id: 15, title: "Other Info", component: OtherInfo, key: 'otherInfo' },
    { id: 16, title: "Documents", component: DocumentUpload, key: 'documents' },
    { id: 17, title: "Declaration", component: Declaration, key: 'declaration' },
    { id: 18, title: "Review & Submit", component: ReviewSubmit, key: 'reviewSubmit' }
  ];

  // Map completedSections to step indices
  const completedSteps = new Set(
    steps
      .filter(s => completedSections.has(s.key))
      .map(s => s.id)
  );

  // Auto-advance to the first incomplete step after initialization
  useEffect(() => {
    if (!loading && jobId) {
      // Find the first step ID that is NOT in completedSteps
      const firstIncomplete = steps.find(s => !completedSteps.has(s.id));

      if (firstIncomplete) {
        // If currentStep is already completed, jump to the first incomplete one
        if (completedSteps.has(currentStep) || currentStep < firstIncomplete.id) {
          setCurrentStep(firstIncomplete.id);
        }
      } else if (completedSteps.size === steps.length - 1) {
        // All steps except maybe the last one (Review) are done
        setCurrentStep(steps.length);
      }
    }
    // Only run this when loading finished or completedSteps changes initially
    // We don't want to force jump while the user is actively navigating back
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, jobId, completedSections.size]);

  const handleNext = async () => {
    if (currentStep < steps.length) {
      // Validate current section before proceeding
      const sectionKey = steps[currentStep - 1].key;

      const isValid = await validateSection(sectionKey);
      if (!isValid) return;

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
      <MainLayout hideFooter={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout hideFooter={true}>
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
              <h3 className="font-bold text-gray-900 mb-6 sticky -top-6 bg-white z-20 pt-6 pb-2 -mx-6 px-6 border-b border-gray-50">Progress</h3>
              <Stepper
                steps={steps.map(s => s.title)}
                currentStep={currentStep}
                maxReachedStep={steps.length}
                completedSteps={completedSteps}
                onStepClick={(step) => {
                  setCurrentStep(step);
                  window.scrollTo(0, 0);
                }}
              />
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
