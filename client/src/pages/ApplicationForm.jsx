import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Stepper from '../components/Stepper';
import { useApplication } from '../context/ApplicationContext';

// Import All Steps
import PersonalDetails from '../components/application-steps/PersonalDetails';
import { motion } from 'framer-motion'; // eslint-disable-line
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

  const { 
    initApplication, 
    loading, 
    validateSection, 
    completedSections, 
    jobSnapshot, 
    SECTION_TYPE_MAP 
  } = useApplication();

  useEffect(() => {
    if (jobId) {
      initApplication(jobId);
    } else {
      navigate('/jobs');
    }
  }, [jobId, initApplication, navigate]);

  // Persist current step to localStorage whenever it changes
  useEffect(() => {
    if (jobId && currentStep) {
      localStorage.setItem(`app_step_${jobId}`, currentStep.toString());
    }
  }, [currentStep, jobId]);

  // Dynamic steps filtered by jobSnapshot
  const steps = React.useMemo(() => {
    const allSteps = [
      { title: "Personal Details", component: PersonalDetails, key: 'personalDetails' },
      { title: "Education", component: Education, key: 'education' },
      { title: "Experience", component: Experience, key: 'experience' },
      { title: "Referees", component: Referees, key: 'referees' },
      { title: "Journal Publications", component: Publications, key: 'publications' },
      { title: "Conference Publications", component: ConferencePublications, key: 'conferencePublications' },
      { title: "Books & Monographs", component: BooksPublications, key: 'booksPublications' },
      { title: "Patents", component: Patents, key: 'patents' },
      { title: "Sponsored Projects", component: Projects, key: 'projects' },
      { title: "Consultancy Projects", component: ConsultancyProjects, key: 'consultancyProjects' },
      { title: "PhD Supervision", component: PhdSupervision, key: 'phdSupervision' },
      { title: "Subjects Taught", component: SubjectsTaught, key: 'subjectsTaught' },
      { title: "Organized Programs", component: OrganizedPrograms, key: 'organizedPrograms' },
      { title: "Credit Points", component: CreditPoints, key: 'creditPoints' },
      { title: "Other Info", component: OtherInfo, key: 'otherInfo' },
      { title: "Documents", component: DocumentUpload, key: 'documents' },
      { title: "Declaration", component: Declaration, key: 'declaration' },
      { title: "Review & Submit", component: ReviewSubmit, key: 'reviewSubmit' }
    ];

    if (!jobSnapshot?.requiredSections) return [];

    const reqSecTypes = jobSnapshot.requiredSections.map(s => s.sectionType);
    
    const filtered = allSteps.filter(s => {
      // Review & Submit + Declaration are always included
      if (s.key === 'reviewSubmit' || s.key === 'declaration') return true;
      
      // Documents step is visible if photo, signature, or final_documents is required
      if (s.key === 'documents') {
        return (
          reqSecTypes.includes('photo') || 
          reqSecTypes.includes('signature') || 
          reqSecTypes.includes('final_documents')
        );
      }

      // Check if this frontend step key maps to a required server section type
      const serverType = SECTION_TYPE_MAP[s.key];
      return reqSecTypes.includes(serverType);
    });

    return filtered.map((s, idx) => ({ ...s, id: idx + 1 }));
  }, [jobSnapshot, SECTION_TYPE_MAP]);

  // Map completedSections to step indices
  const completedSteps = new Set(
    steps
      .filter(s => completedSections.has(s.key))
      .map(s => s.id)
  );

  const hasAutoAdvanced = React.useRef(false);

  // Auto-advance to the first incomplete step after initialization
  useEffect(() => {
    if (!loading && jobId && steps.length > 0 && !hasAutoAdvanced.current) {
      hasAutoAdvanced.current = true;
      setTimeout(() => {
        const firstIncomplete = steps.find(s => !completedSections.has(s.key));
        if (firstIncomplete) {
          setCurrentStep(firstIncomplete.id);
        } else if (completedSections.size >= steps.length - 1) {
          setCurrentStep(steps.length);
        }
      }, 0);
    }
  }, [loading, jobId, steps, completedSections]);

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

  const handleGoToStep = (stepId) => {
    setCurrentStep(stepId);
    window.scrollTo(0, 0);
  };

  const handleGoToSection = (sectionKey) => {
    const step = steps.find((s) => s.key === sectionKey);
    if (step) {
      handleGoToStep(step.id);
    }
  };

  const renderStep = () => {
    if (steps.length === 0) return null;
    const StepComponent = steps[currentStep - 1]?.component;
    if (!StepComponent) return null;

    return (
      <StepComponent
        onNext={handleNext}
        onBack={currentStep > 1 ? handleBack : null}
        onGoToStep={handleGoToStep}
        onGoToSection={handleGoToSection}
      />
    );
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
