import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout wrapper
import MainLayout from './components/layout/MainLayout';

// Pages - Updated paths to match folder structure
import Home from './pages/Home/Home';
import JobListings from './pages/Jobs/JobListings';
import JobDetails from './pages/JobDetails/JobDetails';
import ApplicationForm from './pages/Application/ApplicationForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The MainLayout wraps all these routes with the Navbar and Footer */}
        <Route path="/" element={<MainLayout />}>
          
          {/* Landing Page */}
          <Route index element={<Home />} />
          
          {/* Job Portal Routes */}
          <Route path="jobs" element={<JobListings />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          
          {/* Multi-step Application Form */}
          <Route path="apply" element={<ApplicationForm />} />
          
          {/* Optional: 404 Not Found Page */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <h2 className="text-4xl font-bold text-gray-800">404</h2>
              <p className="text-gray-500">The page you are looking for does not exist.</p>
            </div>
          } />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;