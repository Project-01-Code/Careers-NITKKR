import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';

const VerifyEmail = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState('send'); // 'send' or 'verify'
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already verified
    useEffect(() => {
        if (user?.isEmailVerified) {
            toast.success('Email is already verified!');
            navigate('/profile');
        }
    }, [user?.isEmailVerified, navigate]);

    const handleSendOtp = async () => {
        setLoading(true);
        try {
            await api.post('/auth/verify-email/send', { email: user.email });
            toast.success('Verification code sent to your email!');
            setStep('verify');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error('Please enter the 6-digit code');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/verify-email/confirm', { email: user.email, otp });
            toast.success('Email verified successfully!');
            // Refresh user data so isEmailVerified updates everywhere
            await refreshUser();
            navigate('/profile');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    // Don't render if already verified (will redirect)
    if (user?.isEmailVerified) return null;

    return (
        <MainLayout>
            <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-gray-100">

                    {/* Icon */}
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-primary text-3xl">mark_email_read</span>
                    </div>

                    <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Verify Your Email</h1>
                    <p className="text-gray-500 text-center text-sm mb-8">
                        {step === 'send'
                            ? `We'll send a 6-digit code to ${user?.email || 'your email'}`
                            : `Enter the code sent to ${user?.email || 'your email'}`
                        }
                    </p>

                    {step === 'send' ? (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                                <strong>Why verify?</strong> Email verification is required before you can apply for any job position.
                            </div>
                            <button
                                onClick={handleSendOtp}
                                disabled={loading}
                                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">send</span>
                                        Send Verification Code
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Verification Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="Enter 6-digit code"
                                    className="w-full text-center text-2xl tracking-[0.5em] px-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50 focus:bg-white font-mono"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'Verify Email'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={loading}
                                className="w-full text-sm text-primary hover:underline disabled:opacity-50"
                            >
                                Didn't receive the code? Resend
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/profile" className="text-sm text-gray-500 hover:text-gray-700">
                            ← Back to Profile
                        </Link>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default VerifyEmail;
