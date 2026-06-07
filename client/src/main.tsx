import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { queryClient } from './lib/queryClient';
import { initPostHog } from './lib/posthog';
import { setAuthToken } from './lib/api';
import './index.css';

initPostHog();

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

const TOAST_STYLE = {
  style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' },
} as const;

/**
 * Keeps the module-level auth token in `api.ts` in sync with Clerk.
 * Refreshes every 55 seconds (tokens expire after 60 s by default).
 */
function ClerkTokenSync({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  React.useEffect(() => {
    const sync = async () => {
      const token = await getToken();
      setAuthToken(token);
    };

    sync();
    const interval = setInterval(sync, 55_000);
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
          <Toaster position="top-right" toastOptions={TOAST_STYLE} />
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
          <Toaster position="top-right" toastOptions={TOAST_STYLE} />
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
