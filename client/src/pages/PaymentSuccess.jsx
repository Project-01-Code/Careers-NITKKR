import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useApplication } from '../hooks/useApplication';
import api from '../services/api';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';

const PaymentSuccess = () => {
    const { id: applicationId } = useParams();
    const [searchParams] = useSearchParams();
    // eslint-disable-next-line no-unused-vars
    const sessionId = searchParams.get('session_id');
    const navigate = useNavigate();
    const { submitApplication, loadApplication } = useApplication();

    const [status, setStatus] = useState('verifying'); // verifying, submitting, success, error
    const [message, setMessage] = useState('Verifying payment...');

    useEffect(() => {
        const handlePaymentSuccess = async () => {
            try {
                // Load the application to check current payment status
                const app = await loadApplication(applicationId);

                if (!app) {
                    setStatus('error');
                    setMessage('Application not found.');
                    return;
                }

                // Wait a moment for webhook to process
                if (app.paymentStatus !== 'paid' && app.paymentStatus !== 'exempted') {
                    // Poll for payment status using the dedicated payment endpoint
                    // This endpoint actively checks Stripe if the webhook is delayed
                    setMessage('Confirming payment with Stripe...');
                    let attempts = 0;
                    const maxAttempts = 10;

                    while (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        // Check payment status endpoint, not just the application endpoint
                        const checkRes = await api.get(`/payments/status/${applicationId}`);
                        const paymentStatus = checkRes.data.data?.paymentStatus;

                        if (paymentStatus === 'paid' || paymentStatus === 'exempted') {
                            break;
                        }
                        attempts++;
                    }

                    // Check one final time
                    const finalRes = await api.get(`/payments/status/${applicationId}`);
                    const finalPaymentStatus = finalRes.data.data?.paymentStatus;
                    const finalAppStatus = finalRes.data.data?.applicationStatus;
                    
                    if (finalPaymentStatus !== 'paid' && finalPaymentStatus !== 'exempted') {
                        setStatus('error');
                        setMessage('Payment verification is taking longer than expected. Please check your profile page for the status.');
                        return;
                    }
                    
                    // If backend already marked it submitted, skip redundant submit call
                    if (finalAppStatus === 'submitted') {
                        setStatus('success');
                        setMessage('Payment confirmed and application submitted successfully!');
                        toast.success('Application submitted successfully!');
                        return;
                    }
                }

                // If payment confirmed but application not yet marked submitted
                setStatus('submitting');
                setMessage('Payment confirmed! Finalizing your application...');

                const result = await submitApplication();

                if (result.success) {
                    setStatus('success');
                    setMessage('Application submitted successfully!');
                    toast.success('Application submitted successfully!');
                } else {
                    setStatus('error');
                    setMessage(result.message || 'Failed to submit application after payment.');
                }
            } catch (err) {
                console.error('PaymentSuccess error:', err);
                setStatus('error');
                setMessage(err.response?.data?.message || 'An error occurred while processing your payment.');
            }
        };

        if (applicationId) {
            handlePaymentSuccess();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applicationId]);

    const getIcon = () => {
        switch (status) {
            case 'verifying':
            case 'submitting':
                return (
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                );
            case 'success':
                return (
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-red-600 text-4xl">error</span>
                    </div>
                );
        }
    };

    return (
        <MainLayout>
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-xl text-center">
                    {getIcon()}

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {status === 'success' ? 'Application Submitted!' : status === 'error' ? 'Something Went Wrong' : 'Processing...'}
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
                                Retry
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default PaymentSuccess;
