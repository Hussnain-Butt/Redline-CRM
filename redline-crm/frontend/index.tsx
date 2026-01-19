import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

import AxiosInterceptor from './components/AxiosInterceptor';

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey || ''}>
      <BrowserRouter>
        <AxiosInterceptor>
          <App />
        </AxiosInterceptor>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);