import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApplication } from '../context/ApplicationContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';

/**
 * PaymentSuccess — shown after the Razorpay modal closes and backend verification succeeds.
 *
 * With the modal flow, verification is done inline in ReviewSubmit.jsx before navigating here.
 * This page acts as a lightweight confirmation screen that also handles the edge case where
 * the user lands here via a direct URL (e.g., back-button, bookmark).
 */
const PaymentSuccess = () => {
  const { id: applicationId } = useParams();
  const navigate = useNavigate();
  const { loadApplication } = useApplication();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('Confirming your payment status...');

  useEffect(() => {
    const confirm = async () => {
      try {
        // Check current payment + application status from the backend
        const res = await api.get(`/payments/status/${applicationId}`);
        const { paymentStatus, applicationStatus } = res.data.data ?? {};

        if (paymentStatus === 'paid' || paymentStatus === 'exempted') {
          setStatus('success');
          setMessage(
            applicationStatus === 'submitted'
              ? 'Your application has been successfully submitted!'
              : 'Payment confirmed! Your application is being finalised.'
          );
          toast.success('Application submitted successfully!');
        } else {
          // Payment not yet confirmed — could be a webhook delay or user navigated here directly
          setStatus('error');
          setMessage(
            'Payment status could not be confirmed. If the amount was deducted, please allow a few minutes and check your profile.'
          );
        }

        // Refresh application context so the profile page shows the latest state
        await loadApplication(applicationId);
      } catch (err) {
        console.error('PaymentSuccess confirmation error:', err);
        setStatus('error');
        setMessage(err.response?.data?.message || 'An error occurred while checking your payment status.');
      }
    };

    if (applicationId) {
      confirm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const getIcon = () => {
    if (status === 'success') {
      return (
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
        </div>
      );
    }
    if (status === 'error') {
      return (
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-red-600 text-4xl">error</span>
        </div>
      );
    }
    // verifying
    return (
      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-xl text-center">
          {getIcon()}

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {status === 'success' ? 'Application Submitted!' : status === 'error' ? 'Something Went Wrong' : 'Verifying...'}
          </h2>

          <p className="text-gray-500 mb-8">{message}</p>

          {status === 'success' && (
            <button
              onClick={() => navigate('/profile', { state: { refresh: true } })}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors"
            >
              View My Applications
            </button>
          )}

          {status === 'error' && (
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Go to Profile
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors"
              >
                Retry Check
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PaymentSuccess;
