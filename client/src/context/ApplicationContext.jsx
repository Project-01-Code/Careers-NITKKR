import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ApplicationContext = createContext();

export const useApplication = () => useContext(ApplicationContext);

// Map frontend section keys to server sectionType values
const SECTION_TYPE_MAP = {
  personalDetails: 'personal',
  education: 'education',
  experience: 'experience',
  referees: 'referees',
  publications: 'publications_journal',
  conferencePublications: 'publications_conference',
  booksPublications: 'publications_books',
  patents: 'patents',
  projects: 'sponsored_projects',
  consultancyProjects: 'consultancy_projects',
  phdSupervision: 'phd_supervision',
  subjectsTaught: 'subjects_taught',
  organizedPrograms: 'organized_programs',
  creditPoints: 'credit_points',
  otherInfo: 'other_info',
  documents: 'final_documents',
  declaration: 'declaration',
};

const INITIAL_FORM_DATA = {
  personalDetails: {},
  education: [],
  experience: [],
  referees: [],
  publications: [],
  conferencePublications: [],
  booksPublications: [],
  patents: [],
  projects: [],
  consultancyProjects: [],
  phdSupervision: [],
  subjectsTaught: [],
  organizedPrograms: [],
  creditPoints: {},
  otherInfo: {},
  documents: {},
  declaration: {},
};

export const ApplicationProvider = ({ children }) => {
  const [applicationId, setApplicationId] = useState(null);
  const [applicationNumber, setApplicationNumber] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobSnapshot, setJobSnapshot] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [applicationStatus, setApplicationStatus] = useState('draft');

  /**
   * Populate formData from server sections Map
   */
  const populateSectionsFromServer = useCallback((sections) => {
    if (!sections) return;

    const newFormData = { ...INITIAL_FORM_DATA };

    // sections is a Map-like object: { sectionType: { data, pdfUrl, ... } }
    for (const [serverType, sectionData] of Object.entries(sections)) {
      // Find the frontend key for this server section type
      const frontendKey = Object.keys(SECTION_TYPE_MAP).find(
        (key) => SECTION_TYPE_MAP[key] === serverType
      );

      if (frontendKey && sectionData?.data !== undefined) {
        // Unwrap array sections: server stores {items: [...]} but frontend uses flat arrays
        const rawData = sectionData.data;
        if (rawData && typeof rawData === 'object' && !Array.isArray(rawData) && Array.isArray(rawData.items)) {
          newFormData[frontendKey] = rawData.items;
        } else {
          newFormData[frontendKey] = rawData;
        }
      }
    }

    setFormData(newFormData);
  }, []);

  /**
   * Initialize application for a job.
   * Tries to fetch an existing draft first, creates a new one if none found.
   */
  const initApplication = useCallback(async (currentJobId) => {
    setJobId(currentJobId);
    setLoading(true);
    try {
      // Try to find existing application for this job
      const res = await api.get('/applications', {
        params: { jobId: currentJobId, limit: 1 },
      });

      const existing = res.data.data?.applications?.[0];

      if (existing) {
        // Found existing draft/application
        setApplicationId(existing._id);
        setApplicationNumber(existing.applicationNumber);
        setApplicationStatus(existing.status);
        setPaymentStatus(existing.paymentStatus);
        setJobSnapshot(existing.jobSnapshot);

        // Populate form data from saved sections
        if (existing.sections) {
          populateSectionsFromServer(existing.sections);
        }
        return existing;
      }

      // No existing application — create a new one
      const createRes = await api.post('/applications', { jobId: currentJobId });
      const newApp = createRes.data.data;

      setApplicationId(newApp._id);
      setApplicationNumber(newApp.applicationNumber);
      setApplicationStatus(newApp.status || 'draft');
      setPaymentStatus(newApp.paymentStatus || 'pending');
      setJobSnapshot(newApp.jobSnapshot);
      setFormData({ ...INITIAL_FORM_DATA });

      return newApp;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to initialize application';
      console.error('initApplication error:', msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [populateSectionsFromServer]);

  /**
   * Load a specific application by ID (for resuming from profile)
   */
  const loadApplication = useCallback(async (appId) => {
    setLoading(true);
    try {
      const res = await api.get(`/applications/${appId}`);
      const app = res.data.data;

      setApplicationId(app._id);
      setApplicationNumber(app.applicationNumber);
      setJobId(app.jobId?._id || app.jobId);
      setApplicationStatus(app.status);
      setPaymentStatus(app.paymentStatus);
      setJobSnapshot(app.jobSnapshot);

      if (app.sections) {
        populateSectionsFromServer(app.sections);
      }

      return app;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load application');
      return null;
    } finally {
      setLoading(false);
    }
  }, [populateSectionsFromServer]);

  /**
   * Validate a section after save.
   * This is used on step transitions to catch server-side validation errors early.
   */
  const validateSection = useCallback(async (sectionName) => {
    if (!applicationId) return true;

    const serverSectionType = SECTION_TYPE_MAP[sectionName];
    if (!serverSectionType) return true;

    try {
      const res = await api.post(
        `/applications/${applicationId}/sections/${serverSectionType}/validate`
      );
      const payload = res.data?.data || {};
      const errors = Array.isArray(payload.errors) ? payload.errors : [];
      const nonPdfErrors = errors.filter((e) => e?.field !== 'pdf');

      if (nonPdfErrors.length > 0) {
        toast.error(nonPdfErrors[0]?.message || 'Section validation failed');
        return false;
      }
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Section validation failed');
      return false;
    }
  }, [applicationId]);

  /**
   * Save a section's data to the server
   * Called when user clicks "Next" on a step
   */
  const saveSection = useCallback(async (sectionName, data) => {
    // Update local state immediately
    setFormData((prev) => ({ ...prev, [sectionName]: data }));

    if (!applicationId) {
      console.warn('No applicationId — cannot save to server');
      return false;
    }

    const serverSectionType = SECTION_TYPE_MAP[sectionName];
    if (!serverSectionType) {
      console.warn(`Unknown section: ${sectionName}`);
      return false;
    }

    // Skip server save if section is not required for this job
    if (jobSnapshot?.requiredSections) {
      const isRequired = jobSnapshot.requiredSections.some(
        (s) => s.sectionType === serverSectionType
      );
      if (!isRequired) {
        console.log(`Section '${serverSectionType}' not required for this job — saved locally only`);
        return true;
      }
    }

    // Server expects data as an object (z.record). Wrap arrays in {items: [...]}
    const payload = Array.isArray(data) ? { items: data } : data;

    setSaving(true);
    try {
      await api.patch(
        `/applications/${applicationId}/sections/${serverSectionType}`,
        { data: payload }
      );

      const valid = await validateSection(sectionName);
      return valid;
    } catch (err) {
      console.error(`Failed to save section ${sectionName}:`, err);
      toast.error(
        err.response?.data?.message || `Failed to save ${sectionName}`
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, [applicationId, jobSnapshot, validateSection]);

  /**
   * For backward compatibility — updateSection is used by step components
   * This now saves to the server automatically
   */
  const updateSection = useCallback(async (sectionName, data) => {
    return saveSection(sectionName, data);
  }, [saveSection]);

  /**
   * Validate all sections before submission
   */
  const validateAll = useCallback(async () => {
    if (!applicationId) return { canSubmit: false, errors: ['No application found'] };

    try {
      const res = await api.post(`/applications/${applicationId}/validate-all`);
      return res.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Validation failed');
      return { canSubmit: false, errors: err.response?.data?.errors || [] };
    }
  }, [applicationId]);

  /**
   * Create payment order (Stripe Checkout)
   */
  const createPaymentOrder = useCallback(async () => {
    if (!applicationId) {
      toast.error('No application found');
      return null;
    }

    try {
      const res = await api.post('/payments/create-order', { applicationId });
      return res.data.data; // { sessionId, url, amount, currency }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create payment');
      return null;
    }
  }, [applicationId]);

  /**
   * Submit the application (after payment)
   */
  const submitApplication = useCallback(async () => {
    if (!applicationId) {
      toast.error('No valid application found.');
      return { success: false };
    }

    try {
      setLoading(true);
      const res = await api.post(`/applications/${applicationId}/submit`);
      setApplicationStatus('submitted');
      toast.success('Application submitted successfully!');
      return {
        success: true,
        applicationNumber: res.data.data?.applicationNumber,
        ...res.data.data,
      };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit application.';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  /**
   * Reset context state (e.g., when navigating away)
   */
  const resetApplication = useCallback(() => {
    setApplicationId(null);
    setApplicationNumber(null);
    setJobId(null);
    setJobSnapshot(null);
    setFormData({ ...INITIAL_FORM_DATA });
    setPaymentStatus('pending');
    setApplicationStatus('draft');
  }, []);

  return (
    <ApplicationContext.Provider
      value={{
        // State
        applicationId,
        applicationNumber,
        jobId,
        jobSnapshot,
        formData,
        loading,
        saving,
        paymentStatus,
        applicationStatus,

        // Actions
        initApplication,
        loadApplication,
        updateSection,
        saveSection,
        validateAll,
        validateSection,
        createPaymentOrder,
        submitApplication,
        resetApplication,

        // Helpers
        SECTION_TYPE_MAP,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};
