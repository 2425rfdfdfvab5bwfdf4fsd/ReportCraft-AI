import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { queryClient } from './lib/queryClient';
import './index.css';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

function ClerkTokenSync({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  React.useEffect(() => {
    const sync = async () => {
      const token = await getToken();
      (window as any).__clerkToken = token;
    };
    sync();
    const interval = setInterval(sync, 55 * 1000);
    return () => clearInterval(interval);
  }, [getToken]);

  return <>{children}</>;
}

function Root() {
  if (!CLERK_KEY) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" toastOptions={{ style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' } }} />
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ClerkTokenSync>
            <App />
          </ClerkTokenSync>
          <Toaster position="top-right" toastOptions={{ style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' } }} />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
