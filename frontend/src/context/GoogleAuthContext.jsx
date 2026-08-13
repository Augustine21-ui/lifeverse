import { GoogleOAuthProvider } from '@react-oauth/google';

export function GoogleAuthProvider({ children }) {
  // Try environment variable, fallback to hardcoded for testing
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '656156213065-54g2dvhdd14o8jpjpcifqtpu8m5psgo3.apps.googleusercontent.com';
  
  console.log('🔍 Client ID being used:', clientId);
  
  if (!clientId) {
    console.warn('Google Client ID not found. Google Sign-In disabled.');
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}