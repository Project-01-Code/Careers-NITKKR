import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <Navbar />
      <main className="flex-1">
        {/* This Outlet is where your specific pages (Home, Jobs, etc.) will appear */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;