import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { GoogleAuthProvider } from './context/GoogleAuthContext.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { MoodProvider } from './context/MoodContext.jsx';   // ← new

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <MoodProvider>                          {/* ← new wrapper */}
            <ToastProvider>
              <GoogleAuthProvider>
                <App />
              </GoogleAuthProvider>
            </ToastProvider>
          </MoodProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);