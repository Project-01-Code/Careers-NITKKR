import React, { useState, useCallback, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ApplicationContext } from './ApplicationContextObj';
import { SECTION_TYPE_MAP, INITIAL_FORM_DATA } from '../constants/applicationConstants';

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
  const [completedSections, setCompletedSections] = useState(new Set());

  // Ref to track in-flight initialization to prevent double-creation race conditions
  const initRef = useRef(false);

  /**
   * Populate formData from server sections Map
   */
  const populateSectionsFromServer = useCallback((sections) => {
    if (!sections) return;

    const newFormData = { ...INITIAL_FORM_DATA };
    const newCompletedSections = new Set();

    // sections is a Map-like object: { sectionType: { data, pdfUrl, ... } }
    for (const [serverType, sectionData] of Object.entries(sections)) {
      // Find the frontend key for this server section type
      const frontendKey = Object.keys(SECTION_TYPE_MAP).find(
        (key) => SECTION_TYPE_MAP[key] === serverType
      );

      if (frontendKey) {
        // Track completed sections
        if (sectionData?.isComplete) {
          newCompletedSections.add(frontendKey);
        }

        // unwraps array sections: server stores {items: [...]} but frontend uses flat arrays
        const rawData = sectionData?.data;
        let mappedData = rawData || {};

        if (rawData && typeof rawData === 'object' && !Array.isArray(rawData) && Array.isArray(rawData.items)) {
          mappedData = rawData.items;
        }

        // Attach imageUrl and pdfUrl to the data we expose so file components can read them
        if (sectionData.imageUrl) mappedData.imageUrl = sectionData.imageUrl;
        if (sectionData.pdfUrl) mappedData.pdfUrl = sectionData.pdfUrl;

        newFormData[frontendKey] = mappedData;
      }
    }

    setFormData(newFormData);
    setCompletedSections(newCompletedSections);
  }, []);

  /**
   * Initialize application for a job.
   * Tries to fetch an existing draft first, creates a new one if none found.
   */
  const initApplication = useCallback(async (currentJobId) => {
    // Prevent double initialization if already in progress or already loaded for this job
    if (initRef.current || (applicationId && jobId === currentJobId)) return null;

    initRef.current = true;
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
      setCompletedSections(new Set());

      return newApp;
    } catch (err) {
      if (err.response?.status === 409) {
        // Handle "already exists" conflict — fetch the record created by parallel call
        try {
          const res = await api.get('/applications', {
            params: { jobId: currentJobId, limit: 1 },
          });
          const existing = res.data.data?.applications?.[0];
          if (existing) {
            setApplicationId(existing._id);
            setApplicationNumber(existing.applicationNumber);
            setApplicationStatus(existing.status);
            setPaymentStatus(existing.paymentStatus);
            setJobSnapshot(existing.jobSnapshot);
            if (existing.sections) populateSectionsFromServer(existing.sections);
            return existing;
          }
        } catch (retryErr) {
          console.error('Retry after conflict failed:', retryErr);
        }
      }

      const msg = err.response?.data?.message || 'Failed to initialize application';
      console.error('initApplication error:', msg);
      toast.error(msg);
      return null;
    } finally {
      initRef.current = false;
      setLoading(false);
    }
  }, [populateSectionsFromServer, applicationId, jobId]);

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

    // If section is not required for this job, return true immediately
    if (jobSnapshot?.requiredSections) {
      const isRequired = jobSnapshot.requiredSections.some(
        (s) => s.sectionType === serverSectionType
      );

      // Special case: 'documents' frontend key covers photo, signature, AND final_documents
      // If photo or signature is required but final_documents isn't, we still want to allow proceeding
      // frontend validator in DocumentUpload.jsx handles the photo/signature presence.
      if (!isRequired && sectionName !== 'documents') {
        setCompletedSections((prev) => {
          const next = new Set(prev);
          next.add(sectionName);
          return next;
        });
        return true;
      }

      // If it's the documents section and final_documents specifically isn't required,
      // we still need to check if photo/signature are required.
      // But since we are here, we are validating the 'documents' step.
      if (sectionName === 'documents' && !isRequired) {
        setCompletedSections((prev) => {
          const next = new Set(prev);
          next.add(sectionName);
          return next;
        });
        return true;
      }
    }

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

      // Mark as completed if valid
      setCompletedSections((prev) => {
        const next = new Set(prev);
        next.add(sectionName);
        return next;
      });

      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Section validation failed');
      return false;
    }
  }, [applicationId, jobSnapshot?.requiredSections]);

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

      // Special case: 'custom' section is allowed if job has custom fields defined
      const isCustomAllowed = sectionName === 'custom' && jobSnapshot?.customFields?.length > 0;

      if (!isRequired && !isCustomAllowed) {
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
      if (valid) {
        setCompletedSections((prev) => {
          const next = new Set(prev);
          next.add(sectionName);
          return next;
        });
      }
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
  }, [applicationId, jobSnapshot?.requiredSections, jobSnapshot?.customFields?.length, validateSection]);

  /**
   * For backward compatibility — updateSection is used by step components
   * This now saves to the server automatically
   */
  const updateSection = useCallback(async (sectionName, data) => {
    return saveSection(sectionName, data);
  }, [saveSection]);

  /**
   * Manually update the completion status of a section (for individual uploads)
   */
  const setSectionStatus = useCallback((sectionName, isComplete) => {
    setCompletedSections((prev) => {
      const next = new Set(prev);
      if (isComplete) next.add(sectionName);
      else next.delete(sectionName);
      return next;
    });
  }, []);

  /**
   * Updates only the local application context state without firing a server API call.
   * Very useful for manual file uploads that update immediately via distinct endpoints.
   */
  const updateLocalSection = useCallback((sectionName, data) => {
    setFormData((prev) => ({ ...prev, [sectionName]: { ...prev[sectionName], ...data } }));
  }, []);

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
   * Create payment order (Razorpay Checkout)
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
    initRef.current = false;
    setApplicationId(null);
    setApplicationNumber(null);
    setJobId(null);
    setJobSnapshot(null);
    setFormData({ ...INITIAL_FORM_DATA });
    setPaymentStatus('pending');
    setApplicationStatus('draft');
    setCompletedSections(new Set());
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
        completedSections,

        // Actions
        initApplication,
        loadApplication,
        updateSection,
        updateLocalSection,
        setSectionStatus,
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
