import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ApplicationContext = createContext();

export const useApplication = () => useContext(ApplicationContext);

export const ApplicationProvider = ({ children }) => {
  const [applicationId, setApplicationId] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [formData, setFormData] = useState({
    personalDetails: {},
    education: [],
    experience: [],
    referees: [],
    publications: [],
    patents: [],
    projects: [],
    phdSupervision: [],
    subjectsTaught: [],
    organizedPrograms: [],
    creditPoints: {},
    otherInfo: {},
    documents: {},
    declaration: false,
  });
  const [loading, setLoading] = useState(false);

  // Initialize or fetch draft
  const initApplication = async (currentJobId) => {
    setJobId(currentJobId);
    setLoading(true);
    try {
      // Try to fetch existing draft for this job
      // In a real scenario, the backend might return the latest draft for this user + job
      const res = await api.get(`/applications/draft/${currentJobId}`);
      if (res.data.data) {
        setApplicationId(res.data.data._id);
        const savedData = res.data.data.formData;
        if (savedData) {
          setFormData((prev) => ({ ...prev, ...savedData }));
        }
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching draft:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSection = async (sectionName, data) => {
    setFormData((prev) => {
      const newData = { ...prev, [sectionName]: data };
      // Optional: Auto-save to backend whenever local state updates
      saveDraft(newData);
      return newData;
    });
  };

  const saveDraft = async (dataToSave = formData) => {
    if (!jobId) return;
    try {
      setLoading(true);
      const payload = {
        jobId,
        formData: dataToSave,
      };
      
      let res;
      if (applicationId) {
        // Update existing draft
        res = await api.put(`/applications/${applicationId}/draft`, payload);
      } else {
        // Create new draft
        res = await api.post('/applications/draft', payload);
        if (res.data.data?._id) {
          setApplicationId(res.data.data._id);
        }
      }
    } catch (err) {
      console.error('Failed to save draft:', err);
      // Suppress toast on auto-save, but could log it
    } finally {
      setLoading(false);
    }
  };

  const submitApplication = async () => {
    if (!applicationId) {
      toast.error('No valid application draft found.');
      return false;
    }
    
    try {
      setLoading(true);
      await api.post(`/applications/${applicationId}/submit`);
      toast.success('Application submitted successfully!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ApplicationContext.Provider
      value={{
        applicationId,
        jobId,
        formData,
        loading,
        initApplication,
        updateSection,
        saveDraft,
        submitApplication,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};
