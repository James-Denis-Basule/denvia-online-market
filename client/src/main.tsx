import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import './index.css';
import './styles/global.css';

import App from './App';

import { AuthProvider } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BusinessProvider>
        <App />
      </BusinessProvider>
    </AuthProvider>
  </StrictMode>,
);