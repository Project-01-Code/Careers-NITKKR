import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const NotFound = () => {
    return (
        <MainLayout>
            <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
                <div className="text-center max-w-md">
                    {/* 404 Number */}
                    <div className="relative mb-8">
                        <span className="text-[160px] font-black text-gray-100 leading-none select-none block">404</span>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-6xl text-primary animate-bounce">search_off</span>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-800 mb-3">Page Not Found</h1>
                    <p className="text-gray-500 mb-8">
                        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/"
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">home</span>
                            Go Home
                        </Link>
                        <Link
                            to="/jobs"
                            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">work</span>
                            Browse Jobs
                        </Link>
                    </div>

                    <div className="mt-8">
                        <Link to="/help" className="text-sm text-primary hover:underline">
                            Need help? Visit our Help Center →
                        </Link>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default NotFound;
