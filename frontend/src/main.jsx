import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { GoogleAuthProvider } from './context/GoogleAuthContext.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx'; // ← import

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>  {/* ← add here */}
          <ToastProvider>
            <GoogleAuthProvider>
              <App />
            </GoogleAuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);