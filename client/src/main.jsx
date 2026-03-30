import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster, toast } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ApplicationProvider } from './context/ApplicationContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <ApplicationProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: '#212331',
            color: '#fff',
            fontSize: '14px',
            padding: '12px 16px',
            maxWidth: '400px',
          },
        }}
      >
        {(t) => (
          <div
            className={`${t.visible ? 'animate-enter' : 'animate-leave'
              } flex items-center justify-between gap-4`}
            style={{
              background: t.type === 'error' ? '#ef4444' : (t.type === 'success' ? '#10b981' : '#212331'),
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              minWidth: '250px'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">
                {t.type === 'error' ? 'error' : (t.type === 'success' ? 'check_circle' : 'info')}
              </span>
              <p className="font-medium">{String(t.message)}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-black/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
      </Toaster>
    </ApplicationProvider>
  </AuthProvider>
)
